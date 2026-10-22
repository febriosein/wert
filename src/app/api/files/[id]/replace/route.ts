import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFileKind, sanitizeFilename } from "@/lib/utils";
import { validateMagicBytes } from "@/lib/storage/validator";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const ALLOWED_EXTS = new Set(["docx", "pdf", "xlsx", "pptx", "jpg", "jpeg", "png", "heic", "zip"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * PUT /api/files/[id]/replace: Atomic file replacement (PRD 7.6)
 * Replaces existing file while preserving the same file ID & list order.
 * Resets 48h timer and recreates preview cleanly.
 */
export async function PUT(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing file
    const { data: existingFile, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.userId)
      .single();

    if (fetchError || !existingFile) {
      return NextResponse.json({ error: "File yang akan diganti tidak ditemukan." }, { status: 404 });
    }

    const formData = await req.formData();
    const replacementFile = formData.get("file") as File | null;

    if (!replacementFile) {
      return NextResponse.json({ error: "File pengganti tidak ditemukan." }, { status: 400 });
    }

    if (replacementFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file pengganti melebihi batas 50 MB." }, { status: 400 });
    }

    const originalName = replacementFile.name || "dokumen";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Tipe file .${ext} tidak didukung.` },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await replacementFile.arrayBuffer());

    // Validate magic bytes
    const validation = validateMagicBytes(new Uint8Array(fileBuffer.slice(0, 64)), ext);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason || "File tidak valid." }, { status: 400 });
    }

    const displayName = sanitizeFilename(originalName);
    const kind = getFileKind(ext);

    // New storage key (versioned or timestamped)
    const newStorageKey = `${session.userId}/${id}_v${(existingFile.version || 1) + 1}.${ext}`;

    // Upload new file to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(newStorageKey, fileBuffer, {
        contentType: replacementFile.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Gagal mengunggah file pengganti: ${uploadError.message}` }, { status: 500 });
    }

    // Clean up old derived preview files from storage
    const oldDerivedKeys: string[] = [];
    if (existingFile.pdf_key) oldDerivedKeys.push(existingFile.pdf_key);
    if (existingFile.docx_key) oldDerivedKeys.push(existingFile.docx_key);
    if (existingFile.preview_key) oldDerivedKeys.push(existingFile.preview_key);
    if (oldDerivedKeys.length > 0) {
      await supabaseAdmin.storage.from("derived").remove(oldDerivedKeys).catch(() => {});
    }

    // Reset 48h expiration timer
    const newExpiresAt = session.autoDeleteEnabled
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null;

    // Atomically update DB record
    const { data: updatedFile, error: updateError } = await supabaseAdmin
      .from("files")
      .update({
        display_name: displayName,
        ext,
        mime: replacementFile.type || "application/octet-stream",
        size_bytes: replacementFile.size,
        storage_key: newStorageKey,
        kind,
        status: "ready",
        pdf_key: null,
        docx_key: null,
        preview_key: null,
        expires_at: newExpiresAt,
        version: (existingFile.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengganti file" }, { status: 500 });
  }
}
