import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFileKind, sanitizeFilename } from "@/lib/utils";

// Supported file extensions
const ALLOWED_EXTS = new Set(["docx", "pdf", "xlsx", "pptx", "jpg", "jpeg", "png", "heic", "zip"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_USER = 20;

/**
 * GET /api/files: List files for currently authenticated session
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const now = new Date().toISOString();

    const { data: files, error } = await supabaseAdmin
      .from("files")
      .select("*")
      .eq("user_id", session.userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ files: files || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil daftar file" }, { status: 500 });
  }
}

/**
 * POST /api/files: Initialize upload & get signed upload path or upload directly
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan dalam request." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file melebihi batas 50 MB." }, { status: 400 });
    }

    // Check user file count
    const { count } = await supabaseAdmin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId);

    if ((count || 0) >= MAX_FILES_PER_USER) {
      return NextResponse.json({ error: "Batas maksimum 20 file per akun telah tercapai." }, { status: 400 });
    }

    const originalName = file.name || "dokumen";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Tipe file .${ext} tidak didukung. Tipe yang didukung: DOCX, PDF, PPTX, XLSX, JPG, PNG, HEIC, ZIP.` },
        { status: 400 }
      );
    }

    const displayName = sanitizeFilename(originalName);
    const kind = getFileKind(ext);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Storage path: {userId}/{fileId}.{ext}
    const fileId = crypto.randomUUID();
    const storageKey = `${session.userId}/${fileId}.${ext}`;

    // Upload to Supabase Storage bucket 'uploads'
    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(storageKey, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, log clearly
      return NextResponse.json({ error: `Storage upload error: ${uploadError.message}` }, { status: 500 });
    }

    // Determine auto-delete expires_at
    const expiresAt = session.autoDeleteEnabled
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null;

    // Check if conversion is required (DOCX, PPTX, XLSX)
    const needsConversion = ["docx", "pptx", "xlsx"].includes(ext);
    const initialStatus = needsConversion ? "processing" : "ready";

    // Insert file record
    const { data: newFile, error: insertError } = await supabaseAdmin
      .from("files")
      .insert({
        id: fileId,
        user_id: session.userId,
        display_name: displayName,
        ext,
        mime: file.type || "application/octet-stream",
        size_bytes: file.size,
        storage_key: storageKey,
        kind,
        status: initialStatus,
        expires_at: expiresAt,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger conversion job if needed
    if (needsConversion) {
      await supabaseAdmin.from("conversion_jobs").insert({
        file_id: fileId,
        type: `${ext}_to_pdf` as any,
        status: "queued",
      });

      // Trigger background conversion asynchronously (via internal route or background task)
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      fetch(`${protocol}://${host}/api/files/${fileId}/convert`, {
        method: "POST",
      }).catch((e) => console.error("Async conversion trigger error:", e));
    }

    return NextResponse.json({ success: true, file: newFile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengunggah file" }, { status: 500 });
  }
}
