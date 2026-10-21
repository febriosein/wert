import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPin, hashRecoveryCode, verifyPin } from "@/lib/auth/pin";
import { generateRecoveryCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action; // 'set' | 'change' | 'remove'

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, pin_hash")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    if (action === "set") {
      if (user.pin_hash) {
        return NextResponse.json({ error: "PIN sudah dipasang sebelumnya. Gunakan menu ganti PIN." }, { status: 400 });
      }

      const pin = String(body.pin || "").trim();
      if (!/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "PIN harus terdiri dari 4 angka." }, { status: 400 });
      }

      const pinHash = await hashPin(pin);
      const recoveryCode = generateRecoveryCode();
      const recoveryHash = await hashRecoveryCode(recoveryCode);

      await supabaseAdmin
        .from("users")
        .update({
          pin_hash: pinHash,
          recovery_hash: recoveryHash,
          pin_failed_count: 0,
          pin_locked_until: null,
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: "PIN berhasil dipasang.",
        recoveryCode,
      });
    }

    if (action === "change") {
      if (!user.pin_hash) {
        return NextResponse.json({ error: "Akun belum memiliki PIN." }, { status: 400 });
      }

      const oldPin = String(body.oldPin || "").trim();
      const newPin = String(body.newPin || "").trim();

      const isOldValid = await verifyPin(oldPin, user.pin_hash);
      if (!isOldValid) {
        return NextResponse.json({ error: "PIN lama salah." }, { status: 401 });
      }

      if (!/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ error: "PIN baru harus terdiri dari 4 angka." }, { status: 400 });
      }

      const newPinHash = await hashPin(newPin);
      const newRecoveryCode = generateRecoveryCode();
      const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);

      await supabaseAdmin
        .from("users")
        .update({
          pin_hash: newPinHash,
          recovery_hash: newRecoveryHash,
          pin_failed_count: 0,
          pin_locked_until: null,
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: "PIN berhasil diubah.",
        recoveryCode: newRecoveryCode,
      });
    }

    if (action === "remove") {
      if (!user.pin_hash) {
        return NextResponse.json({ error: "Akun tidak memiliki PIN." }, { status: 400 });
      }

      const currentPin = String(body.currentPin || "").trim();
      const isCurrentValid = await verifyPin(currentPin, user.pin_hash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: "PIN saat ini salah." }, { status: 401 });
      }

      await supabaseAdmin
        .from("users")
        .update({
          pin_hash: null,
          recovery_hash: null,
          pin_failed_count: 0,
          pin_locked_until: null,
        })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        message: "PIN berhasil dihapus. Akun sekarang dapat dibuka tanpa PIN.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses PIN" }, { status: 500 });
  }
}
