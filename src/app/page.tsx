"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowRight, ShieldCheck, Clock, Smartphone, Lock, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth flow states
  const [step, setStep] = useState<"username" | "pin_prompt" | "register_prompt" | "recovery_prompt">("username");
  const [pin, setPin] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // Recovery code display after registration
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const cleanUsername = username.trim().toLowerCase();

  const handleCheckUsername = async (e: FormEvent) => {
    e.preventDefault();
    if (!cleanUsername) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memeriksa username");
      }

      if (!data.exists) {
        // User does not exist -> prompt register
        setStep("register_prompt");
      } else {
        // User exists
        if (data.isLocked) {
          throw new Error(`Akun terkunci sementara. Coba lagi dalam ${Math.ceil(data.lockRemainingSeconds / 60)} menit.`);
        }

        if (data.hasPin) {
          // Requires PIN
          setStep("pin_prompt");
        } else {
          // No PIN -> login immediately
          await handleLoginDirect();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginDirect = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal masuk");
      router.push(`/${cleanUsername}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLoginWithPin = async (e: FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setError("PIN harus berupa 4 angka numerik.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        throw new Error(data.error || "PIN salah");
      }

      router.push(`/${cleanUsername}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (withPin: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          pin: withPin ? pin : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat akun");
      }

      if (data.recoveryCode) {
        setNewRecoveryCode(data.recoveryCode);
      } else {
        router.push(`/${cleanUsername}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          recoveryCode: recoveryInput,
          newPin: newPinInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pemulihan gagal");

      router.push(`/${cleanUsername}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHardReset = async () => {
    if (!confirm("Peringatan: Semua file Anda akan dihapus permanen untuk membuka kembali username ini. Lanjutkan?")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          action: "wipe",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset gagal");
      router.push(`/${cleanUsername}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCode = () => {
    if (newRecoveryCode) {
      navigator.clipboard.writeText(newRecoveryCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          {/* Main Card */}
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            {/* Step 1: Username input */}
            {step === "username" && (
              <form onSubmit={handleCheckUsername} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Buka Halaman Tugas
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Ketik nama halaman Anda untuk melihat dan mencetak file
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label htmlFor="username-input" className="text-xs font-semibold text-slate-700">
                    Alamat Halaman
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-slate-300 bg-slate-50/50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition overflow-hidden">
                    <span className="pl-3.5 pr-1 text-slate-400 font-medium text-xs sm:text-sm select-none">
                      wert.web.id/
                    </span>
                    <input
                      id="username-input"
                      type="text"
                      autoFocus
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      placeholder="namaanda"
                      className="w-full py-3 pr-4 text-sm font-semibold bg-transparent focus:outline-none text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Gunakan 3-20 karakter huruf kecil, angka, - atau _
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !cleanUsername}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Buka</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: PIN Prompt (Existing Account with PIN) */}
            {step === "pin_prompt" && (
              <form onSubmit={handleLoginWithPin} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Masukkan PIN 4 Digit
                  </h2>
                  <p className="text-xs text-slate-500">
                    Halaman <b>wert.web.id/{cleanUsername}</b> dilindungi dengan PIN
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-36 text-center tracking-[1em] py-3 text-2xl font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                  {attemptsLeft !== null && (
                    <span className="text-xs text-amber-600 font-medium">
                      Sisa percobaan: {attemptsLeft} kali
                    </span>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Buka Halaman"}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("username");
                      setError(null);
                      setPin("");
                    }}
                    className="hover:underline"
                  >
                    Ganti Username
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("recovery_prompt");
                      setError(null);
                    }}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Lupa PIN?
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Register Prompt (New Account) */}
            {step === "register_prompt" && !newRecoveryCode && (
              <div className="flex flex-col gap-4 text-center">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Buat Halaman Baru
                  </h2>
                  <p className="text-xs text-slate-500">
                    Alamat <b>wert.web.id/{cleanUsername}</b> tersedia. Ingin memasang PIN 4 angka?
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 my-2">
                  <label className="text-xs font-semibold text-slate-700">
                    PIN 4 Angka (Opsional)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Boleh kosong"
                    className="w-44 text-center tracking-widest py-2.5 text-lg font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                  <span className="text-[11px] text-slate-400">
                    Pasang PIN agar orang lain di fotokopian tidak dapat melihat file Anda.
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {pin.length === 4 ? (
                    <button
                      type="button"
                      onClick={() => handleRegister(true)}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
                    >
                      {loading ? "Memproses..." : "Buat dengan PIN"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegister(false)}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
                    >
                      {loading ? "Memproses..." : "Buat Tanpa PIN (Langsung Buka)"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStep("username");
                      setPin("");
                    }}
                    className="text-xs text-slate-500 hover:underline py-1"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Recovery Code Display after registration */}
            {newRecoveryCode && (
              <div className="flex flex-col gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Simpan Kode Pemulihan Anda</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Karena kami <b>tidak meminta email</b>, simpan kode pemulihan ini jika sewaktu-waktu Anda lupa PIN:
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-amber-900 tracking-wider">
                    {newRecoveryCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyRecoveryCode}
                    className="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/${cleanUsername}`)}
                  className="w-full py-3 px-4 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow"
                >
                  Saya Sudah Menyimpannya, Buka Halaman
                </button>
              </div>
            )}

            {/* Recovery Prompt */}
            {step === "recovery_prompt" && (
              <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4 text-left">
                <div className="text-center mb-1">
                  <h3 className="text-lg font-bold text-slate-900">Pemulihan PIN</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Masukkan kode pemulihan 12 karakter yang diberikan saat PIN dipasang.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Kode Pemulihan</label>
                  <input
                    type="text"
                    required
                    placeholder="WERT-XXXX-XXXX"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-mono text-sm uppercase"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">PIN Baru (4 Digit)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm tracking-widest font-bold text-center"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  {loading ? "Memproses..." : "Ganti PIN & Masuk"}
                </button>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-center">
                  <button
                    type="button"
                    onClick={handleHardReset}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Tidak punya kode? Reset Akun (Hapus File & PIN)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("pin_prompt");
                      setError(null);
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Kembali ke Masukkan PIN
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick value props / badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-8">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-800">Siap Cetak ≤ 20 Detik</span>
                <span className="text-[10px] text-slate-500">Cepat tanpa login WA</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm text-left">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-800">Scan QR dari HP</span>
                <span className="text-[10px] text-slate-500">Upload langsung dari kamera/file</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm text-left">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-800">Hapus Otomatis 48 Jam</span>
                <span className="text-[10px] text-slate-500">Privasi file tugas terjaga</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
        <p>© 2026 wert.web.id • Solusi cetak file tugas cepat & privat untuk pelajar dan fotokopian.</p>
      </footer>
    </div>
  );
}
