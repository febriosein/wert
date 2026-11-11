import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth/session";
import { isValidWebUrl, normalizeUrl, getDefaultLinkTitle } from "@/lib/links";
import { purgeExpiredFiles } from "@/lib/storage/purge";

interface RouteProps {
  params: Promise<{ token: string }>;
}

const MAX_ITEMS_PER_USER = 20;

/**
 * POST /api/u/[token]/link: Add a link from smartphone during active QR session
 */
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
      return NextResponse.json(
        { error: "Sesi QR tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    if (uploadToken.files_uploaded >= uploadToken.max_files) {
      return NextResponse.json(
        { error: "Batas pengiriman untuk sesi QR ini telah tercapai." },
        { status: 400 }
      );
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

    const user = uploadToken.users as any;

    // Check user active files and capacity limit
    await purgeExpiredFiles({ userId: user.id }).catch(() => {});
    const { count } = await supabaseAdmin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
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
    const expiresAt = user.auto_delete_enabled
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    const record: Record<string, any> = {
      id: fileId,
      user_id: user.id,
      display_name: title,
      ext: "link",
      mime: "text/uri-list",
      size_bytes: 0,
      storage_key: storageKey,
      kind: "document",
      status: "ready",
      expires_at: expiresAt,
    };

    const { data: newFile, error: insertError } = await supabaseAdmin
      .from("files")
      .insert(record)
      .select("*")
      .single();

    if (insertError || !newFile) {
      return NextResponse.json(
        { error: insertError?.message || "Gagal menyimpan tautan ke komputer." },
        { status: 500 }
      );
    }

    // Increment uploaded count on token
    await supabaseAdmin
      .from("upload_tokens")
      .update({ files_uploaded: uploadToken.files_uploaded + 1 })
      .eq("id", uploadToken.id);

    return NextResponse.json({
      success: true,
      file: {
        ...newFile,
        url: normalizedUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal mengirim tautan ke komputer fotokopi." },
      { status: 500 }
    );
  }
}
