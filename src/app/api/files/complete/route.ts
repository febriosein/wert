import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFileKind, sanitizeFilename } from "@/lib/utils";
import { validateMagicBytes } from "@/lib/storage/validator";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, storageKey, size, mime } = body;
    const fileName = sanitizeFilename(body.fileName || "dokumen");
    const ext = (body.ext || fileName.split(".").pop() || "").toLowerCase();

    if (!fileId || !storageKey) {
      return NextResponse.json({ error: "Data file tidak lengkap." }, { status: 400 });
    }

    // Server-side magic bytes validation: download small header slice (first 64 bytes)
    try {
      const { data: headerBlob } = await supabaseAdmin.storage
        .from("uploads")
        .download(storageKey);

      if (headerBlob) {
        const headerBuffer = new Uint8Array(await headerBlob.slice(0, 64).arrayBuffer());
        const validation = validateMagicBytes(headerBuffer, ext);
        if (!validation.valid) {
          // Remove invalid file from storage immediately
          await supabaseAdmin.storage.from("uploads").remove([storageKey]);
          return NextResponse.json({ error: validation.reason || "File tidak valid." }, { status: 400 });
        }
      }
    } catch {
      // Continue if slice is unsupported
    }

    const kind = getFileKind(ext);
    const expiresAt = session.autoDeleteEnabled
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null;

    // Insert file record
    const { data: newFile, error: insertError } = await supabaseAdmin
      .from("files")
      .insert({
        id: fileId,
        user_id: session.userId,
        display_name: fileName,
        ext,
        mime: mime || "application/octet-stream",
        size_bytes: size || 0,
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

    return NextResponse.json({ success: true, file: newFile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyelesaikan upload" }, { status: 500 });
  }
}
