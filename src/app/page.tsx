"use client";

import { useState, useRef, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  ArrowRight,
  ShieldCheck,
  Clock,
  Smartphone,
  Lock,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth flow states
  const [step, setStep] = useState<"username" | "pin_prompt" | "register_prompt" | "recovery_prompt">("username");
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", ""]);
  const [pin, setPin] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // PIN inputs refs
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Recovery code display after registration
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const cleanUsername = username.trim().toLowerCase();
  const isValidUsername = cleanUsername.length >= 3 && cleanUsername.length <= 20;

  const handleCheckUsername = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!cleanUsername) return;

    setLoading(true);
    setError(null);

    // Eagerly prefetch the user dashboard route
    router.prefetch(`/${cleanUsername}`);

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
          setPinDigits(["", "", "", ""]);
          setTimeout(() => pinInputRefs[0].current?.focus(), 100);
        } else {
          // No PIN -> already logged in in 1 single round-trip! Navigate immediately
          router.push(`/${cleanUsername}`);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPin = async (pinValue: string) => {
    if (!pinValue || pinValue.length !== 4) {
      setError("PIN harus berupa 4 angka numerik.");
      return;
    }

    setLoading(true);
    setError(null);
    router.prefetch(`/${cleanUsername}`);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, pin: pinValue }),
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
      setPinDigits(["", "", "", ""]);
      setPin("");
      setTimeout(() => pinInputRefs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...pinDigits];
    updated[index] = digit;
    setPinDigits(updated);

    const fullPin = updated.join("");
    setPin(fullPin);

    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }

    if (updated.every((d) => d.length === 1)) {
      submitPin(fullPin);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handleDigitPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newDigits = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    setPin(pasted);

    if (pasted.length === 4) {
      submitPin(pasted);
    } else {
      pinInputRefs[Math.min(pasted.length, 3)].current?.focus();
    }
  };

  const handleRegister = async (withPin: boolean) => {
    setLoading(true);
    setError(null);
    router.prefetch(`/${cleanUsername}`);

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
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-mint selection:text-brand-deep">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* STEP 1: BERANDA DUA KOLOM DENGAN ILUSTRASI PRINTER */}
        {step === "username" && (
          <div className="w-full max-w-[1120px] mx-auto flex flex-col gap-10 md:gap-14 py-4 md:py-8">
            {/* Tata Letak 2 Kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Kolom Kiri: Form & Typography */}
              <div className="lg:col-span-7 flex flex-col text-left">
                {/* Badge Penjelas */}
                <div className="relative">
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-mint text-brand-deep font-semibold text-xs tracking-wide border border-line">
                    ⚡ Langsung Buka Tanpa Daftar
                  </span>
                  {/* Hero Headline dengan Stabilo Kuning */}
                  <h1 className="font-display text-[40px] sm:text-[52px] lg:text-[56px] leading-[1.05] tracking-tight text-ink font-extrabold">
                    Kirim file, <br className="hidden sm:inline" />
                    <span className="relative inline-block">
                      <span className="relative z-10">langsung cetak.</span>
                      <span className="absolute left-0 bottom-1 sm:bottom-2 w-full h-[18px] sm:h-[22px] bg-hl -z-0 rounded-sm -rotate-1"></span>
                    </span>
                  </h1>
                </div>

                <p className="font-sans text-base sm:text-[17px] text-muted max-w-[480px] mt-4 mb-8 leading-relaxed">
                  Buka halaman tugasmu, lalu tunjukkan ke tukang fotokopi. Tanpa chat WhatsApp.
                </p>

                {/* Form Bergaya Stiker Input */}
                <form onSubmit={handleCheckUsername} className="w-full max-w-[560px]">
                  <label htmlFor="room-input" className="block font-semibold text-sm text-ink mb-2">
                    Nama halamanmu
                  </label>

                  <div className="relative bg-surface rounded-[24px] border-2 border-ink shadow-sticker min-h-[72px] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all">
                    {/* Prefix & Input Segment */}
                    <div className="flex items-center flex-1 min-w-0 px-3 py-1">
                      <span className="font-display font-semibold text-lg sm:text-[22px] text-muted select-none whitespace-nowrap">
                        wert.web.id/
                      </span>
                      <input
                        id="room-input"
                        type="text"
                        autoFocus
                        required
                        autoComplete="off"
                        maxLength={20}
                        value={username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                          setUsername(val);
                          if (val.length >= 3) {
                            router.prefetch(`/${val}`);
                          }
                        }}
                        placeholder="namamu"
                        className="w-full font-display font-semibold text-lg sm:text-[22px] text-ink placeholder-muted/40 bg-transparent outline-none border-none p-0 ml-1 min-w-0"
                      />
                      {isValidUsername && (
                        <div className="flex-shrink-0 text-brand-deep ml-1 flex items-center">
                          <CheckCircle2 className="w-6 h-6 fill-brand text-ink" />
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Buka Halaman */}
                    <button
                      type="submit"
                      disabled={loading || !cleanUsername}
                      className="h-[52px] rounded-[16px] bg-brand-deep hover:bg-[#065b34] text-white font-bold px-6 flex items-center justify-center gap-2 transition-all duration-150 active:translate-y-0.5 flex-shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className="font-display font-bold text-base">Buka halaman</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Teks Bantuan & Error */}
                  <div className="flex items-center justify-between mt-2.5 px-2">
                    <p className={`text-sm flex items-center gap-1.5 ${error ? "text-danger" : "text-muted"}`}>
                      {error ? (
                        <>
                          <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                          <span>{error}</span>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-brand-deep shrink-0" />
                          <span>3–20 karakter: huruf kecil, angka, - atau _</span>
                        </>
                      )}
                    </p>
                  </div>
                </form>
              </div>

              {/* Kolom Kanan: Ilustrasi Murni CSS & Vektor "Printer-Lembaran" */}
              <div className="lg:col-span-5 flex items-center justify-center relative py-6">
                <div className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center select-none">
                  {/* Latar Ambien Lembut */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-brand/10 via-hl/20 to-blue-400/10 rounded-full blur-2xl -z-10"></div>

                  {/* Lembaran Kertas yang Meluncur Keluar (Stacked Sheets) */}
                  <div className="absolute top-2 w-[270px] sm:w-[310px] flex justify-center z-10">
                    {/* Lembar 1: PDF (-4 deg) */}
                    <div className="absolute -left-2 sm:left-0 top-3 w-[150px] sm:w-[170px] h-[160px] bg-surface rounded-xl border-2 border-ink shadow-[3px_3px_0_#10241B] -rotate-[4deg] p-3 flex flex-col justify-between transition-transform hover:-translate-y-2 hover:-rotate-[6deg] cursor-default">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FF5A4F] text-white">
                            PDF
                          </span>
                          <span className="text-[10px] text-muted font-mono">1.4 MB</span>
                        </div>
                        <div className="h-2 w-3/4 bg-ink/15 rounded mb-1.5"></div>
                        <div className="h-1.5 w-full bg-ink/10 rounded mb-1"></div>
                        <div className="h-1.5 w-5/6 bg-ink/10 rounded mb-1"></div>
                        <div className="h-1.5 w-2/3 bg-ink/10 rounded"></div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted">
                        <Check className="w-3 h-3 text-brand-deep" />
                        <span>Halaman 1-12</span>
                      </div>
                    </div>

                    {/* Lembar 2: DOCX (0 deg Tengah) */}
                    <div className="relative top-0 w-[156px] sm:w-[176px] h-[170px] bg-surface rounded-xl border-2 border-ink shadow-sticker rotate-0 p-3 flex flex-col justify-between z-10 transition-transform hover:-translate-y-2 cursor-default">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#3B82F6] text-white">
                            DOCX
                          </span>
                          <span className="text-[10px] text-muted font-mono">420 KB</span>
                        </div>
                        <div className="h-2 w-4/5 bg-ink/20 rounded mb-1.5"></div>
                        <div className="h-1.5 w-full bg-ink/10 rounded mb-1"></div>
                        <div className="h-1.5 w-full bg-ink/10 rounded mb-1"></div>
                        <div className="h-1.5 w-3/4 bg-ink/10 rounded"></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                        <span className="truncate">Tugas_Bio_Final</span>
                        <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                      </div>
                    </div>

                    {/* Lembar 3: PNG (+5 deg) dengan Stabilo Kuning */}
                    <div className="absolute -right-2 sm:right-0 top-1 w-[150px] sm:w-[170px] h-[165px] bg-surface rounded-xl border-2 border-ink shadow-[3px_3px_0_#10241B] rotate-[5deg] p-3 flex flex-col justify-between transition-transform hover:-translate-y-2 hover:rotate-[7deg] cursor-default">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#8B5CF6] text-white">
                            PNG
                          </span>
                          <span className="text-[10px] text-muted font-mono">3.1 MB</span>
                        </div>
                        <div className="h-2 w-2/3 bg-ink/15 rounded mb-1.5"></div>
                        {/* Coretan stabilo kuning */}
                        <div className="relative py-0.5 my-1">
                          <div className="absolute inset-0 bg-hl rounded-sm transform -skew-x-6"></div>
                          <div className="relative text-[10px] font-bold text-ink px-1 truncate">
                            LAMPIRAN GRAFIK
                          </div>
                        </div>
                        <div className="h-1.5 w-4/5 bg-ink/10 rounded mt-2"></div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#8B5CF6]">
                        <ImageIcon className="w-3 h-3" />
                        <span>Siap Cetak Warna</span>
                      </div>
                    </div>
                  </div>

                  {/* Badan Printer Hijau #19C37D */}
                  <div className="absolute bottom-3 w-[290px] sm:w-[330px] bg-brand rounded-[20px] border-2 border-ink shadow-sticker-lg p-4 flex flex-col items-center z-20">
                    {/* Slot Kertas Keluar */}
                    <div className="w-full h-4 bg-ink rounded-full mb-3 flex items-center justify-center">
                      <div className="w-2/3 h-1 bg-brand/30 rounded-full"></div>
                    </div>
                    {/* Panel Depan Printer */}
                    <div className="w-full flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-white border border-ink flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-deep animate-pulse"></div>
                        </div>
                        <div className="flex flex-col text-left leading-none">
                          <span className="font-display text-[11px] font-extrabold tracking-tight text-ink">
                            WERT PRINT ENGINE
                          </span>
                          <span className="text-[9px] font-medium text-ink/80 font-mono mt-0.5">
                            READY // HIGH-SPEED
                          </span>
                        </div>
                      </div>
                      {/* Status Display Mini */}
                      <div className="bg-brand-deep text-white px-2.5 py-1 rounded-lg border border-ink flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="font-display font-bold text-[11px]">AUTO-PULL</span>
                      </div>
                    </div>
                    <div className="w-32 h-1.5 bg-ink/20 rounded-full mt-2.5"></div>
                  </div>

                  {/* Ilustrasi HP Kecil dengan QR Code di Sebelah Kiri */}
                  <div className="absolute left-0 sm:-left-6 bottom-8 z-30 bg-surface rounded-2xl border-2 border-ink shadow-sticker p-2 w-[84px] sm:w-[94px] flex flex-col items-center">
                    <div className="w-6 h-1 bg-ink/20 rounded-full mb-1.5"></div>
                    {/* Tampilan QR Code Vektor Mini */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-mint/50 rounded-lg border border-ink p-1 flex items-center justify-center">
                      <svg className="w-full h-full text-ink" fill="currentColor" viewBox="0 0 40 40">
                        <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="2" y="2"></rect>
                        <rect fill="currentColor" height="5" width="5" x="5.5" y="5.5"></rect>
                        <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="26" y="2"></rect>
                        <rect fill="currentColor" height="5" width="5" x="29.5" y="5.5"></rect>
                        <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" width="12" x="2" y="26"></rect>
                        <rect fill="currentColor" height="5" width="5" x="5.5" y="29.5"></rect>
                        <rect fill="currentColor" height="4" width="4" x="18" y="4"></rect>
                        <rect fill="currentColor" height="4" width="4" x="18" y="11"></rect>
                        <rect fill="currentColor" height="4" width="4" x="4" y="18"></rect>
                        <rect fill="currentColor" height="4" width="4" x="11" y="18"></rect>
                        <rect fill="#087443" height="4" width="4" x="18" y="18"></rect>
                        <rect fill="currentColor" height="4" width="5" x="25" y="18"></rect>
                        <rect fill="currentColor" height="6" width="4" x="18" y="26"></rect>
                        <rect fill="currentColor" height="5" width="5" x="26" y="26"></rect>
                        <rect fill="currentColor" height="5" width="5" x="33" y="33"></rect>
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-ink mt-1 tracking-tight">SCAN HP</span>
                  </div>

                  {/* Garis Putus-putus Penghubung HP ke Printer */}
                  <svg className="absolute left-16 sm:left-14 bottom-14 sm:bottom-16 w-28 h-14 pointer-events-none z-20" fill="none">
                    <path d="M 10 35 C 30 10, 65 15, 95 20" stroke="#10241B" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="2"></path>
                    <circle cx="95" cy="20" fill="#19C37D" r="3.5" stroke="#10241B" strokeWidth="1.5"></circle>
                  </svg>
                </div>
              </div>
            </div>

            {/* Bagian Bawah: Pita Fitur Horizontal (Pita 3 Item) */}
            <div className="w-full bg-surface rounded-[20px] border border-line shadow-sm p-4 sm:p-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line">
                {/* Item 1: Printer Hijau */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2 first:pt-0 md:first:pt-2">
                  <div className="w-12 h-12 rounded-xl bg-mint flex items-center justify-center flex-shrink-0 text-brand-deep shadow-sm">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-[17px] font-bold text-ink">Siap cetak ≤ 20 detik</h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    </div>
                    <p className="text-sm text-muted mt-0.5">Tanpa login WhatsApp, tanpa tambah kontak.</p>
                  </div>
                </div>

                {/* Item 2: Ponsel / QR Biru */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2">
                  <div className="w-12 h-12 rounded-xl bg-[#E4EEFF] flex items-center justify-center flex-shrink-0 text-[#1D4ED8] shadow-sm">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-[17px] font-bold text-ink">Upload dari HP</h3>
                    <p className="text-sm text-muted mt-0.5">Scan QR, pilih file tugas atau jepret langsung foto.</p>
                  </div>
                </div>

                {/* Item 3: Jam Stabilo Kuning */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2 last:pb-0 md:last:pb-2">
                  <div className="w-12 h-12 rounded-xl bg-hl-soft flex items-center justify-center flex-shrink-0 text-ink shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-[17px] font-bold text-ink">Hapus otomatis 48 jam</h3>
                    <p className="text-sm text-muted mt-0.5">File tugasmu tidak menumpuk di PC fotokopi.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Mini Penjelas */}
            <footer className="w-full border-t border-line pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
              <div className="flex items-center gap-1.5 text-center sm:text-left">
                <span>© 2026 wert.web.id</span>
                <span className="hidden sm:inline">•</span>
                <span>Solusi cetak file tugas cepat & privat untuk pelajar dan fotokopian.</span>
              </div>
              <div className="flex items-center gap-4 font-medium">
                <a href="#" className="hover:text-brand-deep transition">Kebijakan Privasi</a>
                <a href="#" className="hover:text-brand-deep transition">Syarat & Ketentuan</a>
                <a href="#" className="hover:text-brand-deep transition">Bantuan</a>
              </div>
            </footer>
          </div>
        )}

        {/* STEP 2: PIN PROMPT (MODERN DISCRETE 4-DIGIT BOXES) */}
        {step === "pin_prompt" && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            {/* Ambient Blobs */}
            <div className="absolute -top-12 -left-16 w-72 h-72 rounded-full bg-brand/15 blur-3xl pointer-events-none"></div>
            <div className="absolute top-24 -right-16 w-80 h-80 rounded-full bg-hl/20 blur-3xl pointer-events-none"></div>

            <div className="relative w-full bg-surface rounded-[28px] p-6 sm:p-8 shadow-soft border border-line flex flex-col items-center text-center">
              {/* Top Lock Icon Tile */}
              <div className="w-14 h-14 rounded-2xl bg-mint flex items-center justify-center text-brand-deep mb-4 shadow-sm border border-line">
                <Lock className="w-7 h-7" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-1">
                Masukkan PIN 4 Digit
              </h1>
              <p className="text-sm text-muted mb-6">
                Halaman{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-mint text-brand-deep font-bold">
                  @{cleanUsername}
                </span>{" "}
                dilindungi dengan PIN
              </p>

              {/* Form 4 Discrete Digit Boxes */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitPin(pinDigits.join(""));
                }}
                className="w-full flex flex-col items-center gap-5"
              >
                <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
                  {pinDigits.map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-[56px] sm:w-[64px] h-[64px] sm:h-[72px] rounded-2xl bg-bg border-2 border-line focus-within:border-brand-deep focus-within:ring-2 focus-within:ring-brand/30 transition-all flex items-center justify-center shadow-inner"
                    >
                      <input
                        ref={pinInputRefs[idx]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleDigitPaste}
                        className="w-full h-full text-center bg-transparent text-2xl sm:text-3xl font-display font-extrabold text-ink outline-none select-none caret-brand-deep"
                      />
                    </div>
                  ))}
                </div>

                {attemptsLeft !== null && (
                  <span className="text-xs text-amber-700 font-semibold bg-hl-soft px-3 py-1 rounded-full border border-hl">
                    Sisa percobaan: {attemptsLeft} kali
                  </span>
                )}

                {error && (
                  <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-danger-soft text-danger text-xs text-left border border-danger/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || pinDigits.some((d) => !d)}
                  className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-brand-deep hover:bg-[#065b34] text-white shadow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Buka Halaman"}
                </button>

                <div className="w-full flex items-center justify-between text-xs text-muted pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("username");
                      setError(null);
                      setPinDigits(["", "", "", ""]);
                    }}
                    className="hover:text-ink hover:underline font-medium"
                  >
                    Ganti Username
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("recovery_prompt");
                      setError(null);
                    }}
                    className="text-brand-deep hover:underline font-semibold"
                  >
                    Lupa PIN?
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: REGISTER PROMPT (NEW ACCOUNT) */}
        {step === "register_prompt" && !newRecoveryCode && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            <div className="w-full bg-surface rounded-[28px] p-6 sm:p-8 shadow-soft border border-line flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-mint text-brand-deep flex items-center justify-center mb-4 border border-line shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-ink">
                Buat Halaman Baru
              </h2>
              <p className="text-sm text-muted mt-1 mb-6">
                Alamat <b className="text-ink">wert.web.id/{cleanUsername}</b> belum terdaftar. Kamu bisa langsung membukanya.
              </p>

              <div className="w-full flex flex-col items-center gap-2 mb-6">
                <label className="text-xs font-semibold text-ink">
                  PIN 4 Angka (Opsional)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Boleh kosong"
                  className="w-48 text-center tracking-[0.5em] py-3 text-xl font-display font-bold rounded-2xl border-2 border-line bg-bg focus:border-brand-deep focus:ring-2 focus:ring-brand/30 transition outline-none"
                />
                <span className="text-[11px] text-muted">
                  Pasang PIN agar orang lain di fotokopian tidak bisa melihat file tugasmu.
                </span>
              </div>

              {error && (
                <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-danger-soft text-danger text-xs text-left mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="w-full flex flex-col gap-2.5">
                {pin.length === 4 ? (
                  <button
                    type="button"
                    onClick={() => handleRegister(true)}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-brand-deep hover:bg-[#065b34] text-white transition shadow cursor-pointer"
                  >
                    {loading ? "Memproses..." : "Buat dengan PIN"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRegister(false)}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-brand-deep hover:bg-[#065b34] text-white transition shadow cursor-pointer"
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
                  className="text-xs text-muted hover:underline py-1"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RECOVERY CODE DISPLAY */}
        {newRecoveryCode && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            <div className="w-full bg-surface rounded-[28px] p-6 sm:p-8 shadow-soft border border-line flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-hl-soft text-ink flex items-center justify-center mb-4 border border-hl">
                <ShieldCheck className="w-7 h-7 text-brand-deep" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Simpan Kode Pemulihan Anda</h3>
              <p className="text-xs text-muted leading-relaxed mt-1 mb-4">
                Karena kami <b>tidak meminta email</b>, simpan kode ini jika sewaktu-waktu kamu lupa PIN:
              </p>

              <div className="w-full p-4 rounded-2xl bg-hl-soft/50 border border-hl flex items-center justify-between mb-5">
                <span className="font-mono font-bold text-lg text-ink tracking-widest">
                  {newRecoveryCode}
                </span>
                <button
                  type="button"
                  onClick={copyRecoveryCode}
                  className="p-2 rounded-xl bg-surface border border-line text-ink hover:bg-mint transition"
                  title="Salin kode"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-brand-deep" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/${cleanUsername}`)}
                className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-brand-deep hover:bg-[#065b34] text-white transition shadow cursor-pointer"
              >
                Saya Sudah Menyimpannya, Buka Halaman
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: RECOVERY PROMPT */}
        {step === "recovery_prompt" && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            <div className="w-full bg-surface rounded-[28px] p-6 sm:p-8 shadow-soft border border-line flex flex-col text-left">
              <div className="text-center mb-4">
                <h3 className="font-display text-xl font-bold text-ink">Pemulihan PIN</h3>
                <p className="text-xs text-muted mt-1">
                  Masukkan kode pemulihan 12 karakter yang diberikan saat PIN dipasang.
                </p>
              </div>

              <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink">Kode Pemulihan</label>
                  <input
                    type="text"
                    required
                    placeholder="WERT-XXXX-XXXX"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                    className="w-full py-3 px-3.5 rounded-xl border border-line font-mono text-sm uppercase bg-bg focus:border-brand-deep focus:bg-surface outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink">PIN Baru (4 Digit)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full py-3 px-3.5 rounded-xl border border-line font-display text-lg tracking-widest text-center bg-bg focus:border-brand-deep focus:bg-surface outline-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-soft text-danger text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !recoveryInput || newPinInput.length !== 4}
                  className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-brand-deep hover:bg-[#065b34] text-white shadow transition disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Ganti PIN & Masuk"}
                </button>

                <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("pin_prompt");
                      setError(null);
                    }}
                    className="text-muted hover:underline"
                  >
                    Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleHardReset}
                    className="text-danger hover:underline font-semibold"
                  >
                    Reset Total Akun
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
