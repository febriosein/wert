import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, hashToken } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid atau telah kedaluwarsa." }, { status: 401 });
    }

    // Generate 128-bit (16 bytes = 32 hex chars) token
    const rawToken = randomBytes(16).toString("hex");
    const tokenHash = hashToken(rawToken);
    const ttlMinutes = 10;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Calculate remaining allowed files for this user
    const now = new Date().toISOString();
    const { count: activeCount } = await supabaseAdmin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    const remainingSlots = Math.max(0, 20 - (activeCount || 0));

    const { error: insertError } = await supabaseAdmin
      .from("upload_tokens")
      .insert({
        token_hash: tokenHash,
        user_id: session.userId,
        expires_at: expiresAt.toISOString(),
        max_files: Math.min(20, remainingSlots),
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "wert.web.id";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const qrTargetUrl = `${protocol}://${host}/u/${rawToken}`;

    // Generate QR Data URL
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      token: rawToken,
      url: qrTargetUrl,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat sesi upload QR" }, { status: 500 });
  }
}
