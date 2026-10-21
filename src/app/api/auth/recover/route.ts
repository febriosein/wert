import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPin, hashRecoveryCode, verifyRecoveryCode } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";
import { generateRecoveryCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const action = body.action || "recover"; // 'recover' or 'wipe'

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, username, recovery_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    if (action === "wipe") {
      // Hard reset: delete all files and reset PIN
      await supabaseAdmin.from("files").delete().eq("user_id", user.id);
      await supabaseAdmin
        .from("users")
        .update({
          pin_hash: null,
          recovery_hash: null,
          pin_failed_count: 0,
          pin_locked_until: null,
        })
        .eq("id", user.id);

      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
      await createSession(user.id, ip);

      return NextResponse.json({
        success: true,
        message: "Akun berhasil direset. Semua file dan PIN lama telah dihapus.",
      });
    }

    // Standard recovery with 12-character code
    const recoveryCode = (body.recoveryCode || "").trim().toUpperCase();
    const newPin = (body.newPin || "").trim();

    if (!recoveryCode) {
      return NextResponse.json({ error: "Kode pemulihan wajib diisi." }, { status: 400 });
    }

    if (!user.recovery_hash) {
      return NextResponse.json(
        { error: "Akun ini tidak memiliki kode pemulihan aktif. Anda dapat memilih opsi Reset Total Akun." },
        { status: 400 }
      );
    }

    const isCodeValid = await verifyRecoveryCode(recoveryCode, user.recovery_hash);
    if (!isCodeValid) {
      return NextResponse.json({ error: "Kode pemulihan salah atau tidak valid." }, { status: 400 });
    }

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN baru harus berupa 4 digit angka (0-9)." }, { status: 400 });
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

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    await createSession(user.id, ip);

    return NextResponse.json({
      success: true,
      message: "PIN berhasil diganti.",
      recoveryCode: newRecoveryCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memulihkan PIN" }, { status: 500 });
  }
}
