import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPin, hashRecoveryCode } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";
import { generateRecoveryCode } from "@/lib/utils";

const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "app", "auth", "login", "logout",
  "register", "settings", "u", "privacy", "terms", "static", "www",
  "wert", "files", "cron", "dashboard", "download", "upload", "public",
  "account", "help", "status", "about", "contact", "legal"
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const pin = body.pin ? String(body.pin).trim() : null;

    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(username)) {
      return NextResponse.json(
        { error: "Username harus 3-20 karakter alfanumerik tanpa simbol di awal/akhir." },
        { status: 400 }
      );
    }

    if (RESERVED_USERNAMES.has(username)) {
      return NextResponse.json(
        { error: `Username "${username}" tidak dapat digunakan karena merupakan kata sistem.` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username sudah terdaftar. Silakan masuk." },
        { status: 409 }
      );
    }

    let pinHash: string | null = null;
    let recoveryCode: string | null = null;
    let recoveryHash: string | null = null;

    if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN harus berupa 4 digit angka (0-9)." },
          { status: 400 }
        );
      }
      pinHash = await hashPin(pin);
      recoveryCode = generateRecoveryCode();
      recoveryHash = await hashRecoveryCode(recoveryCode);
    }

    // Insert user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        username,
        pin_hash: pinHash,
        recovery_hash: recoveryHash,
        auto_delete_enabled: true,
      })
      .select("id, username")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Create session
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    await createSession(newUser.id, ip);

    return NextResponse.json({
      success: true,
      username: newUser.username,
      hasPin: !!pinHash,
      recoveryCode, // Only returned once upon registration!
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat akun" }, { status: 500 });
  }
}
