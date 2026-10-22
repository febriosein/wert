import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth/session";
import { getFileKind, sanitizeFilename } from "@/lib/utils";

interface RouteProps {
  params: Promise<{ token: string }>;
}

const ALLOWED_EXTS = new Set(["docx", "pdf", "xlsx", "pptx", "jpg", "jpeg", "png", "heic", "zip"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    const tokenHash = hashToken(token);
    const now = new Date().toISOString();

    const { data: uploadToken, error: tokenError } = await supabaseAdmin
      .from("upload_tokens")
      .select(`
        id,
        user_id,
        expires_at,
        max_files,
        files_uploaded,
        users:user_id (
          id,
          username,
          auto_delete_enabled
        )
      `)
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .single();

    if (tokenError || !uploadToken || !uploadToken.users) {
      return NextResponse.json({ error: "Sesi QR tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    if (uploadToken.files_uploaded >= uploadToken.max_files) {
      return NextResponse.json({ error: "Batas upload untuk sesi QR ini telah tercapai." }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file melebihi batas 50 MB." }, { status: 400 });
    }

    const originalName = file.name || "dokumen_hp";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Tipe file .${ext} tidak didukung.` },
        { status: 400 }
      );
    }

    const user = uploadToken.users as any;
    const displayName = sanitizeFilename(originalName);
    const kind = getFileKind(ext);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileId = crypto.randomUUID();
    const storageKey = `${user.id}/${fileId}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(storageKey, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Gagal menyimpan ke storage: ${uploadError.message}` }, { status: 500 });
    }

    const expiresAt = user.auto_delete_enabled
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: newFile, error: insertError } = await supabaseAdmin
      .from("files")
      .insert({
        id: fileId,
        user_id: user.id,
        display_name: displayName,
        ext,
        mime: file.type || "application/octet-stream",
        size_bytes: file.size,
        storage_key: storageKey,
        kind,
        status: "ready",
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment files_uploaded
    await supabaseAdmin
      .from("upload_tokens")
      .update({ files_uploaded: uploadToken.files_uploaded + 1 })
      .eq("id", uploadToken.id);

    return NextResponse.json({
      success: true,
      file: newFile,
      remainingUploads: uploadToken.max_files - (uploadToken.files_uploaded + 1),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengunggah file dari HP" }, { status: 500 });
  }
}
