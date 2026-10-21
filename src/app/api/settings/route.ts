import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, destroySession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/auth/pin";

/**
 * GET /api/settings: Account overview & quota stats
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, username, pin_hash, auto_delete_enabled, created_at, last_active_at")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // Get files count and total size
    const { data: files } = await supabaseAdmin
      .from("files")
      .select("size_bytes")
      .eq("user_id", session.userId);

    const filesCount = files ? files.length : 0;
    const totalSizeBytes = files ? files.reduce((acc, f) => acc + (f.size_bytes || 0), 0) : 0;

    return NextResponse.json({
      username: user.username,
      hasPin: !!user.pin_hash,
      autoDeleteEnabled: user.auto_delete_enabled,
      createdAt: user.created_at,
      filesCount,
      totalSizeBytes,
      maxFiles: 20,
      maxSizeBytes: 200 * 1024 * 1024, // 200MB
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil pengaturan" }, { status: 500 });
  }
}

/**
 * PATCH /api/settings: Update preferences or perform account actions
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action;

    // 1. Toggle global auto-delete preference (PRD 7.9)
    if (typeof body.autoDeleteEnabled === "boolean") {
      await supabaseAdmin
        .from("users")
        .update({ auto_delete_enabled: body.autoDeleteEnabled })
        .eq("id", session.userId);

      // If re-enabling auto-delete, recalculate 48h timer for all existing files
      if (body.autoDeleteEnabled) {
        const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from("files")
          .update({ expires_at: newExpiresAt })
          .eq("user_id", session.userId);
      }

      return NextResponse.json({
        success: true,
        autoDeleteEnabled: body.autoDeleteEnabled,
      });
    }

    // 2. Delete all files (Wipe storage)
    if (action === "delete_all_files") {
      const { data: files } = await supabaseAdmin
        .from("files")
        .select("storage_key, pdf_key, docx_key, preview_key")
        .eq("user_id", session.userId);

      if (files && files.length > 0) {
        const uploadKeys = files.map((f) => f.storage_key).filter(Boolean);
        const derivedKeys = files.flatMap((f) => [f.pdf_key, f.docx_key, f.preview_key]).filter(Boolean) as string[];

        if (uploadKeys.length > 0) {
          await supabaseAdmin.storage.from("uploads").remove(uploadKeys).catch(() => {});
        }
        if (derivedKeys.length > 0) {
          await supabaseAdmin.storage.from("derived").remove(derivedKeys).catch(() => {});
        }

        await supabaseAdmin.from("files").delete().eq("user_id", session.userId);
      }

      return NextResponse.json({ success: true, message: "Semua file berhasil dihapus." });
    }

    // 3. Delete entire account
    if (action === "delete_account") {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("pin_hash")
        .eq("id", session.userId)
        .single();

      if (user?.pin_hash) {
        const pin = String(body.pin || "").trim();
        const isValid = await verifyPin(pin, user.pin_hash);
        if (!isValid) {
          return NextResponse.json({ error: "PIN salah. Akun tidak dapat dihapus." }, { status: 401 });
        }
      }

      // Delete storage files
      const { data: files } = await supabaseAdmin
        .from("files")
        .select("storage_key, pdf_key, docx_key, preview_key")
        .eq("user_id", session.userId);

      if (files && files.length > 0) {
        const uploadKeys = files.map((f) => f.storage_key).filter(Boolean);
        const derivedKeys = files.flatMap((f) => [f.pdf_key, f.docx_key, f.preview_key]).filter(Boolean) as string[];

        if (uploadKeys.length > 0) {
          await supabaseAdmin.storage.from("uploads").remove(uploadKeys).catch(() => {});
        }
        if (derivedKeys.length > 0) {
          await supabaseAdmin.storage.from("derived").remove(derivedKeys).catch(() => {});
        }
      }

      // Deleting user will cascade delete files, sessions, tokens
      await supabaseAdmin.from("users").delete().eq("id", session.userId);
      await destroySession();

      return NextResponse.json({ success: true, message: "Akun telah dihapus permanen." });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui pengaturan" }, { status: 500 });
  }
}
