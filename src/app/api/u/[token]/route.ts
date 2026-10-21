import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth/session";

interface RouteProps {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan." }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const now = new Date().toISOString();

    const { data: uploadToken, error } = await supabaseAdmin
      .from("upload_tokens")
      .select(`
        id,
        user_id,
        expires_at,
        max_files,
        files_uploaded,
        revoked_at,
        users:user_id (
          username,
          auto_delete_enabled
        )
      `)
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .single();

    if (error || !uploadToken || !uploadToken.users) {
      return NextResponse.json({ error: "QR code telah kedaluwarsa atau tidak valid. Silakan scan ulang dari komputer." }, { status: 404 });
    }

    const user = uploadToken.users as any;

    return NextResponse.json({
      valid: true,
      username: user.username,
      filesUploaded: uploadToken.files_uploaded,
      maxFiles: uploadToken.max_files,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memverifikasi token QR" }, { status: 500 });
  }
}
