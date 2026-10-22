import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";

const MAX_PIN_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const pin = body.pin ? String(body.pin).trim() : null;

    if (!username) {
      return NextResponse.json({ error: "Username wajib diisi." }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, pin_hash, pin_failed_count, pin_locked_until")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    // Check lockout
    const now = new Date();
    if (user.pin_locked_until) {
      const lockDate = new Date(user.pin_locked_until);
      if (lockDate > now) {
        const remainingSeconds = Math.ceil((lockDate.getTime() - now.getTime()) / 1000);
        return NextResponse.json(
          {
            error: `Akun terkunci sementara karena terlalu banyak percobaan salah. Coba lagi dalam ${Math.ceil(remainingSeconds / 60)} menit.`,
            isLocked: true,
            remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    // If account has no PIN -> login directly
    if (!user.pin_hash) {
      await createSession(user.id, ip);
      return NextResponse.json({ success: true, username: user.username });
    }

    // If account has PIN, pin is required
    if (!pin) {
      return NextResponse.json(
        { error: "PIN 4 digit diperlukan untuk membuka halaman ini.", requiresPin: true },
        { status: 401 }
      );
    }

    const isValid = await verifyPin(pin, user.pin_hash);

    if (!isValid) {
      const newFailedCount = (user.pin_failed_count || 0) + 1;
      let lockedUntil: string | null = null;

      if (newFailedCount >= MAX_PIN_FAILURES) {
        lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
      }

      await supabaseAdmin
        .from("users")
        .update({
          pin_failed_count: newFailedCount,
          pin_locked_until: lockedUntil,
        })
        .eq("id", user.id);

      const attemptsLeft = Math.max(0, MAX_PIN_FAILURES - newFailedCount);
      if (lockedUntil) {
        return NextResponse.json(
          {
            error: `PIN salah 5 kali. Akun terkunci selama ${LOCKOUT_MINUTES} menit untuk keamanan.`,
            isLocked: true,
            attemptsLeft: 0,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `PIN salah. Sisa kesempatan: ${attemptsLeft} kali.`,
          attemptsLeft,
        },
        { status: 401 }
      );
    }

    // Reset failed attempts on success only if count > 0 or locked_until was set
    if ((user.pin_failed_count || 0) > 0 || user.pin_locked_until) {
      await Promise.all([
        supabaseAdmin
          .from("users")
          .update({
            pin_failed_count: 0,
            pin_locked_until: null,
          })
          .eq("id", user.id),
        createSession(user.id, ip),
      ]);
    } else {
      await createSession(user.id, ip);
    }

    return NextResponse.json({ success: true, username: user.username });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal masuk" }, { status: 500 });
  }
}
