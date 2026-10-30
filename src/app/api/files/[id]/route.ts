import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/files/[id]: Delete file & clean storage
 */
export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { id } = await params;

    const { data: file, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("id, storage_key, pdf_key, docx_key, preview_key")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
    }

    // Delete from Supabase Storage
    const storageKeysToDelete = [file.storage_key];
    if (file.pdf_key) storageKeysToDelete.push(file.pdf_key);
    if (file.docx_key) storageKeysToDelete.push(file.docx_key);
    if (file.preview_key) storageKeysToDelete.push(file.preview_key);

    await supabaseAdmin.storage.from("uploads").remove(storageKeysToDelete).catch(() => {});
    await supabaseAdmin.storage.from("derived").remove(storageKeysToDelete).catch(() => {});

    // Delete record from DB
    await supabaseAdmin.from("files").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus file" }, { status: 500 });
  }
}

/**
 * PATCH /api/files/[id]: Update expiration or settings for individual file
 */
export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const action = body.action; // 'extend' | 'toggle_auto_delete'

    const { data: file, error: fetchError } = await supabaseAdmin
      .from("files")
      .select("id, expires_at")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
    }

    let newExpiresAt: string | null = null;

    if (action === "extend") {
      // Extend 24 hours from now
      newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (action === "toggle_auto_delete") {
      if (file.expires_at) {
        newExpiresAt = null; // Disable auto-delete for this file
      } else {
        newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("files")
      .update({
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui file" }, { status: 500 });
  }
}
