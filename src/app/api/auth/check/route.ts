import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();

    // Validate format
    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(username)) {
      return NextResponse.json(
        { error: "Username harus 3-20 karakter, huruf kecil, angka, tanda hubung (-) atau garis bawah (_)." },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, pin_hash, pin_failed_count, pin_locked_until")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ exists: false, username });
    }

    // Check lockout
    let isLocked = false;
    let lockRemainingSeconds = 0;
    if (user.pin_locked_until) {
      const lockDate = new Date(user.pin_locked_until);
      const now = new Date();
      if (lockDate > now) {
        isLocked = true;
        lockRemainingSeconds = Math.ceil((lockDate.getTime() - now.getTime()) / 1000);
      }
    }

    if (isLocked) {
      return NextResponse.json({
        exists: true,
        username: user.username,
        hasPin: !!user.pin_hash,
        isLocked: true,
        lockRemainingSeconds,
        loggedIn: false,
      });
    }

    // High-performance optimization: If account has NO PIN, log the user in immediately!
    // Creates session and sets HttpOnly cookie in this single round-trip.
    if (!user.pin_hash) {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
      await createSession(user.id, ip);

      return NextResponse.json({
        exists: true,
        username: user.username,
        hasPin: false,
        isLocked: false,
        lockRemainingSeconds: 0,
        loggedIn: true,
      });
    }

    return NextResponse.json({
      exists: true,
      username: user.username,
      hasPin: true,
      isLocked: false,
      lockRemainingSeconds: 0,
      loggedIn: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
