import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeFilename } from "@/lib/utils";
import { purgeExpiredFiles } from "@/lib/storage/purge";

const ALLOWED_EXTS = new Set(["docx", "pdf", "xlsx", "pptx", "jpg", "jpeg", "png", "heic", "zip"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_USER = 20;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * POST /api/files/init: Prepare direct upload to Supabase Storage
 * Generates signed upload URL so uploads up to 50MB bypass Vercel serverless limit.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json();
    const fileName = sanitizeFilename(body.fileName || "dokumen");
    const fileSize = Number(body.fileSize) || 0;
    const ext = (body.ext || fileName.split(".").pop() || "").toLowerCase();
    const mime = body.mime || "application/octet-stream";

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Tipe file .${ext} tidak didukung. Tipe yang didukung: DOCX, PDF, PPTX, XLSX, JPG, PNG, HEIC, ZIP.` },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran file melebihi batas 50 MB." }, { status: 400 });
    }

    // Lazy cleanup: purge any expired files for this user immediately
    await purgeExpiredFiles({ userId: session.userId }).catch(() => {});

    // Check active file count & total size
    const now = new Date().toISOString();
    const { data: existingFiles, error: queryError } = await supabaseAdmin
      .from("files")
      .select("id, size_bytes")
      .eq("user_id", session.userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    if ((existingFiles?.length || 0) >= MAX_FILES_PER_USER) {
      return NextResponse.json({ error: `Batas maksimum ${MAX_FILES_PER_USER} file per akun telah tercapai.` }, { status: 400 });
    }

    const currentTotalSize = existingFiles?.reduce((acc, f) => acc + (f.size_bytes || 0), 0) || 0;
    if (currentTotalSize + fileSize > MAX_TOTAL_SIZE) {
      return NextResponse.json({ error: "Batas total penyimpanan 100 MB per akun telah tercapai." }, { status: 400 });
    }

    // Generate random file ID & key
    const fileId = crypto.randomUUID();
    const storageKey = `${session.userId}/${fileId}.${ext}`;

    // Create signed upload URL in Supabase Storage bucket 'uploads'
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("uploads")
      .createSignedUploadUrl(storageKey);

    if (signError || !signedData) {
      return NextResponse.json({ error: `Gagal membuat signed URL: ${signError?.message}` }, { status: 500 });
    }

    return NextResponse.json({
      fileId,
      storageKey,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menginisialisasi upload" }, { status: 500 });
  }
}
