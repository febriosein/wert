import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = req.nextUrl.searchParams.get("secret");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date().toISOString();

    // 1. Fetch expired files batch (max 100)
    const { data: expiredFiles, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("id, storage_key, pdf_key, docx_key, preview_key")
      .not("expires_at", "is", null)
      .lte("expires_at", now)
      .limit(100);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let deletedFilesCount = 0;

    if (expiredFiles && expiredFiles.length > 0) {
      const uploadKeys: string[] = [];
      const derivedKeys: string[] = [];
      const fileIds: string[] = [];

      for (const f of expiredFiles) {
        fileIds.push(f.id);
        if (f.storage_key) uploadKeys.push(f.storage_key);
        if (f.pdf_key) derivedKeys.push(f.pdf_key);
        if (f.docx_key) derivedKeys.push(f.docx_key);
        if (f.preview_key) derivedKeys.push(f.preview_key);
      }

      // Remove from Supabase Storage
      if (uploadKeys.length > 0) {
        await supabaseAdmin.storage.from("uploads").remove(uploadKeys).catch(() => {});
      }
      if (derivedKeys.length > 0) {
        await supabaseAdmin.storage.from("derived").remove(derivedKeys).catch(() => {});
      }

      // Delete records from database
      const { error: deleteError } = await supabaseAdmin
        .from("files")
        .delete()
        .in("id", fileIds);

      if (!deleteError) {
        deletedFilesCount = fileIds.length;
      }
    }

    // 2. Clean up expired sessions
    try {
      await supabaseAdmin
        .from("sessions")
        .delete()
        .lte("expires_at", now);
    } catch {}

    // 3. Clean up expired upload tokens
    try {
      await supabaseAdmin
        .from("upload_tokens")
        .delete()
        .lte("expires_at", now);
    } catch {}

    // 4. Clean up inactive users (30 days without files and no activity)
    let cleanedInactiveUsers = 0;
    try {
      const { data: rpcCount } = await supabaseAdmin.rpc("cleanup_inactive_users");
      if (typeof rpcCount === "number") {
        cleanedInactiveUsers = rpcCount;
      }
    } catch {
      // Ignore if RPC is not loaded yet in local dev
    }

    return NextResponse.json({
      success: true,
      deletedFilesCount,
      cleanedInactiveUsers,
      timestamp: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menjalankan purge" }, { status: 500 });
  }
}
