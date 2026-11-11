import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidWebUrl, normalizeUrl, getDefaultLinkTitle } from "@/lib/links";
import { purgeExpiredFiles } from "@/lib/storage/purge";

const MAX_ITEMS_PER_USER = 20;

/**
 * POST /api/files/link: Add a web/cloud link to the user's task list (Desktop)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawUrl = body.url;
    const customTitle = body.title;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL tautan wajib diisi." }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(rawUrl);
    if (!isValidWebUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "URL tidak valid. Pastikan diawali dengan http:// atau https://" },
        { status: 400 }
      );
    }

    // Lazy cleanup: purge any expired files/links for this user
    await purgeExpiredFiles({ userId: session.userId }).catch(() => {});

    // Check quota (maximum 20 items per user)
    const now = new Date().toISOString();
    const { count } = await supabaseAdmin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if ((count || 0) >= MAX_ITEMS_PER_USER) {
      return NextResponse.json(
        { error: "Batas maksimum 20 berkas/tautan per akun telah tercapai." },
        { status: 400 }
      );
    }

    const title = customTitle && typeof customTitle === "string" && customTitle.trim()
      ? customTitle.trim().slice(0, 100)
      : getDefaultLinkTitle(normalizedUrl);

    const fileId = crypto.randomUUID();
    const storageKey = `link:${normalizedUrl}`;
    const expiresAt = session.autoDeleteEnabled
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Resilient insert: try native column & kind, fallback gracefully
    const baseRecord: Record<string, any> = {
      id: fileId,
      user_id: session.userId,
      display_name: title,
      ext: "link",
      mime: "text/uri-list",
      size_bytes: 0,
      storage_key: storageKey,
      status: "ready",
      expires_at: expiresAt,
    };

    // Attempt 1: Try with kind='link' and url=normalizedUrl
    let { data: newFile, error: insertError } = await supabaseAdmin
      .from("files")
      .insert({
        ...baseRecord,
        kind: "link",
        url: normalizedUrl,
      })
      .select("*")
      .single();

    // Attempt 2: If 'url' column not yet in DB schema cache or kind='link' fails constraint
    if (insertError) {
      const fallbackKind = insertError.message.includes("files_kind_check") ? "document" : "link";
      const res = await supabaseAdmin
        .from("files")
        .insert({
          ...baseRecord,
          kind: fallbackKind,
        })
        .select("*")
        .single();

      newFile = res.data;
      insertError = res.error;
    }

    if (insertError || !newFile) {
      return NextResponse.json(
        { error: insertError?.message || "Gagal menyimpan tautan ke antrean." },
        { status: 500 }
      );
    }

    // Ensure url property is present on returned object
    const finalItem = {
      ...newFile,
      url: newFile.url || normalizedUrl,
    };

    return NextResponse.json({ success: true, file: finalItem });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan saat menambahkan tautan." },
      { status: 500 }
    );
  }
}
