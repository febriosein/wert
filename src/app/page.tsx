"use client";

import { useState, useRef, FormEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { HowItWorksSection } from "@/components/HowItWorksSection";

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

  // Interactive 3D mouse parallax on printer
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handlePrinterMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 8, y: -y * 8 });
  };
  const handlePrinterMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

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
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] selection:bg-[#E3F8EC] selection:text-[#087443]">
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
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] font-semibold text-xs tracking-wide border border-[#D5EADF]">
                    ⚡ Langsung Buka Tanpa Daftar
                  </span>
                  {/* Hero Headline dengan Stabilo Kuning */}
                  <h1 className="font-display text-[40px] sm:text-[52px] lg:text-[56px] leading-[1.05] tracking-tight text-[#10241B] font-extrabold">
                    Kirim file, <br className="hidden sm:inline" />
                    <span className="relative inline-block">
                      <span className="relative z-10">langsung cetak.</span>
                      <span className="absolute left-0 bottom-1 sm:bottom-2 w-full h-[18px] sm:h-[22px] bg-[#FFE45C] -z-0 rounded-sm -rotate-1"></span>
                    </span>
                  </h1>
                </div>

                <p className="font-sans text-base sm:text-[17px] text-[#587063] max-w-[480px] mt-4 mb-8 leading-relaxed">
                  Buka halaman tugasmu, lalu tunjukkan ke tukang fotokopi. Tanpa chat WhatsApp.
                </p>

                {/* Form Bergaya Stiker Input */}
                <form onSubmit={handleCheckUsername} className="w-full max-w-[560px]">
                  <label htmlFor="room-input" className="block font-semibold text-sm text-[#10241B] mb-2">
                    Nama halamanmu
                  </label>

                  <div className="relative bg-white rounded-[24px] border-2 border-[#10241B] shadow-sticker min-h-[72px] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-[#19C37D]/25">
                    {/* Prefix & Input Segment */}
                    <div className="flex items-center flex-1 min-w-0 px-3 py-1">
                      <span className="font-display font-semibold text-lg sm:text-[22px] text-[#587063] select-none whitespace-nowrap">
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
                        className="w-full font-display font-semibold text-lg sm:text-[22px] text-[#10241B] placeholder-[#587063]/40 bg-transparent outline-none border-none p-0 ml-1 min-w-0"
                      />
                      {isValidUsername && (
                        <div className="flex-shrink-0 text-[#087443] ml-1 flex items-center animate-in zoom-in-75 duration-200">
                          <CheckCircle2 className="w-6 h-6 fill-[#19C37D] text-[#10241B]" />
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Buka Halaman */}
                    <button
                      type="submit"
                      disabled={loading || !cleanUsername}
                      className="h-[52px] rounded-[16px] bg-[#087443] hover:bg-[#065b34] text-white font-bold px-6 flex items-center justify-center gap-2 transition-all duration-150 btn-tactile flex-shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
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

                  {/* Teks Bantuan & Contoh Cepat */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 px-2">
                    <p className={`text-sm flex items-center gap-1.5 ${error ? "text-[#D92D3A]" : "text-[#587063]"}`}>
                      {error ? (
                        <>
                          <AlertCircle className="w-4 h-4 shrink-0 text-[#D92D3A]" />
                          <span>{error}</span>
                        </>
                      ) : (
                        <>
                          <Info className="w-4 h-4 text-[#087443] shrink-0" />
                          <span>3–20 karakter: huruf kecil, angka, - atau _</span>
                        </>
                      )}
                    </p>

                    {/* Quick Suggestions Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-[#587063] font-medium">Coba:</span>
                      {["skripsi-andi", "tugas-makalah", "laporan-lab"].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => {
                            setUsername(example);
                            router.prefetch(`/${example}`);
                          }}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-white hover:bg-[#E3F8EC] border border-[#D5EADF] text-[#087443] font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer shadow-2xs"
                        >
                          @{example}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* Kolom Kanan: Ilustrasi Murni CSS & Vektor "Living Printer Engine" */}
              <div className="lg:col-span-5 flex items-center justify-center relative py-6">
                <div
                  onMouseMove={handlePrinterMouseMove}
                  onMouseLeave={handlePrinterMouseLeave}
                  style={{
                    transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
                    transition: "transform 0.15s ease-out",
                  }}
                  className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center select-none"
                >
                  {/* Latar Ambien Lembut */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#19C37D]/10 via-[#FFE45C]/20 to-blue-400/10 rounded-full blur-2xl -z-10"></div>

                  {/* Lembaran Kertas yang Meluncur Keluar (Stacked Sheets) */}
                  <div className="absolute top-2 w-[270px] sm:w-[310px] flex justify-center z-10">
                    {/* Lembar 1: PDF (-4 deg) */}
                    <div className="absolute -left-2 sm:left-0 top-3 w-[150px] sm:w-[170px] h-[160px] bg-white rounded-xl border-2 border-[#10241B] shadow-[3px_3px_0_#10241B] -rotate-[4deg] p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:-rotate-[6deg] cursor-default">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FF5A4F] text-white">
                            PDF
                          </span>
                          <span className="text-[10px] text-[#587063] font-mono">1.4 MB</span>
                        </div>
                        <div className="h-2 w-3/4 bg-[#10241B]/15 rounded mb-1.5"></div>
                        <div className="h-1.5 w-full bg-[#10241B]/10 rounded mb-1"></div>
                        <div className="h-1.5 w-5/6 bg-[#10241B]/10 rounded mb-1"></div>
                        <div className="h-1.5 w-2/3 bg-[#10241B]/10 rounded"></div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#587063]">
                        <Check className="w-3 h-3 text-[#087443]" />
                        <span>Halaman 1-12</span>
                      </div>
                    </div>

                    {/* Lembar 2: DOCX (0 deg Tengah) - Reaktif Terhadap Ketikan Pengguna */}
                    <div
                      className={`relative top-0 w-[156px] sm:w-[176px] h-[170px] bg-white rounded-xl border-2 border-[#10241B] rotate-0 p-3 flex flex-col justify-between z-10 transition-all duration-300 ${cleanUsername
                        ? "-translate-y-3.5 shadow-sticker-lg border-[#087443]"
                        : "shadow-sticker hover:-translate-y-2"
                        } cursor-default`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white transition-colors ${isValidUsername ? "bg-[#19C37D] text-[#10241B]" : "bg-[#3B82F6]"
                              }`}
                          >
                            {isValidUsername ? "SIAP CETAK" : cleanUsername ? "MEMUAT" : "DOCX"}
                          </span>
                          <span className="text-[10px] text-[#587063] font-mono">
                            {cleanUsername ? "420 KB" : "420 KB"}
                          </span>
                        </div>
                        <div className="h-2 w-4/5 bg-[#10241B]/20 rounded mb-1.5"></div>
                        <div className="h-1.5 w-full bg-[#10241B]/10 rounded mb-1"></div>
                        <div className="h-1.5 w-full bg-[#10241B]/10 rounded mb-1"></div>
                        <div className="h-1.5 w-3/4 bg-[#10241B]/10 rounded"></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#587063] font-semibold">
                        <span className="truncate max-w-[100px]">
                          {cleanUsername ? `${cleanUsername}.docx` : "Tugas_Bio_Final"}
                        </span>
                        <FileText
                          className={`w-3.5 h-3.5 ${isValidUsername ? "text-[#087443]" : "text-[#3B82F6]"}`}
                        />
                      </div>
                    </div>

                    {/* Lembar 3: PNG (+5 deg) dengan Stabilo Kuning */}
                    <div className="absolute -right-2 sm:right-0 top-1 w-[150px] sm:w-[170px] h-[165px] bg-white rounded-xl border-2 border-[#10241B] shadow-[3px_3px_0_#10241B] rotate-[5deg] p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:rotate-[7deg] cursor-default">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#8B5CF6] text-white">
                            PNG
                          </span>
                          <span className="text-[10px] text-[#587063] font-mono">3.1 MB</span>
                        </div>
                        <div className="h-2 w-2/3 bg-[#10241B]/15 rounded mb-1.5"></div>
                        {/* Coretan stabilo kuning */}
                        <div className="relative py-0.5 my-1">
                          <div className="absolute inset-0 bg-[#FFE45C] rounded-sm transform -skew-x-6"></div>
                          <div className="relative text-[10px] font-bold text-[#10241B] px-1 truncate">
                            LAMPIRAN GRAFIK
                          </div>
                        </div>
                        <div className="h-1.5 w-4/5 bg-[#10241B]/10 rounded mt-2"></div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#8B5CF6]">
                        <ImageIcon className="w-3 h-3" />
                        <span>Siap Cetak Warna</span>
                      </div>
                    </div>
                  </div>

                  {/* Badan Printer Hijau #19C37D */}
                  <div className="absolute bottom-3 w-[290px] sm:w-[330px] bg-[#19C37D] rounded-[20px] border-2 border-[#10241B] shadow-sticker-lg p-4 flex flex-col items-center z-20 transition-all duration-200">
                    {/* Slot Kertas Keluar */}
                    <div className="w-full h-4 bg-[#10241B] rounded-full mb-3 flex items-center justify-center">
                      <div
                        className={`h-1 bg-[#19C37D]/50 rounded-full transition-all duration-300 ${cleanUsername ? "w-4/5 bg-[#FFE45C]" : "w-2/3"
                          }`}
                      ></div>
                    </div>
                    {/* Panel Depan Printer */}
                    <div className="w-full flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-white border border-[#10241B] flex items-center justify-center shadow-xs">
                          <div
                            className={`rounded-full transition-all duration-300 ${loading
                              ? "w-2 h-2 bg-[#FFE45C] animate-spin"
                              : isValidUsername
                                ? "w-2 h-2 bg-[#087443] shadow-[0_0_6px_#10241B] animate-ping"
                                : cleanUsername
                                  ? "w-2 h-2 bg-[#FFE45C] animate-pulse"
                                  : "w-1.5 h-1.5 bg-[#087443] animate-pulse"
                              }`}
                          ></div>
                        </div>
                        <div className="flex flex-col text-left leading-none">
                          <span className="font-display text-[11px] font-extrabold tracking-tight text-[#10241B]">
                            WERT PRINT ENGINE
                          </span>
                          <span className="text-[9px] font-semibold text-[#10241B]/80 font-mono mt-0.5">
                            {loading
                              ? "MENGHUBUNGKAN..."
                              : isValidUsername
                                ? "ROOM SIAP // ENTER ↵"
                                : cleanUsername
                                  ? `MENGETIK (${cleanUsername.length}/3)`
                                  : "STANDBY // READY"}
                          </span>
                        </div>
                      </div>
                      {/* Status Display Mini */}
                      <div
                        className={`text-white px-2.5 py-1 rounded-lg border border-[#10241B] flex items-center gap-1 transition-all ${isValidUsername
                          ? "bg-[#FFE45C] text-[#10241B] font-extrabold shadow-xs"
                          : "bg-[#087443]"
                          }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span className="font-display font-bold text-[11px]">
                          {isValidUsername ? "BUKA ➔" : "AUTO-PULL"}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 h-1.5 bg-[#10241B]/20 rounded-full mt-2.5"></div>
                  </div>

                  {/* Ilustrasi HP Kecil dengan QR Code di Sebelah Kiri */}
                  <div className="absolute left-0 sm:-left-6 bottom-8 z-30 bg-white rounded-2xl border-2 border-[#10241B] shadow-sticker p-2 w-[84px] sm:w-[94px] flex flex-col items-center">
                    <div className="w-6 h-1 bg-[#10241B]/20 rounded-full mb-1.5"></div>
                    {/* Tampilan QR Code Vektor Mini */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E3F8EC]/50 rounded-lg border border-[#10241B] p-1 flex items-center justify-center">
                      <svg className="w-full h-full text-[#10241B]" fill="currentColor" viewBox="0 0 40 40">
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
                    <span className="text-[9px] font-bold text-[#10241B] mt-1 tracking-tight">SCAN HP</span>
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
            <div className="w-full bg-white rounded-[20px] border border-[#D5EADF] shadow-sm p-4 sm:p-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D5EADF]">
                {/* Item 1: Printer Hijau */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2 first:pt-0 md:first:pt-2">
                  <div className="w-12 h-12 rounded-xl bg-[#E3F8EC] flex items-center justify-center flex-shrink-0 text-[#087443] shadow-sm">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-[17px] font-bold text-[#10241B]">Siap cetak ≤ 20 detik</h3>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#19C37D]"></span>
                    </div>
                    <p className="text-sm text-[#587063] mt-0.5">Tanpa login WhatsApp, tanpa tambah kontak.</p>
                  </div>
                </div>

                {/* Item 2: Ponsel / QR Biru */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2">
                  <div className="w-12 h-12 rounded-xl bg-[#E4EEFF] flex items-center justify-center flex-shrink-0 text-[#1D4ED8] shadow-sm">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-[17px] font-bold text-[#10241B]">Upload dari HP</h3>
                    <p className="text-sm text-[#587063] mt-0.5">Scan QR, pilih file tugas atau jepret langsung foto.</p>
                  </div>
                </div>

                {/* Item 3: Jam Stabilo Kuning */}
                <div className="flex items-start gap-4 p-3 md:px-5 md:py-2 last:pb-0 md:last:pb-2">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF4B8] flex items-center justify-center flex-shrink-0 text-[#10241B] shadow-sm">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-display text-[17px] font-bold text-[#10241B]">Hapus otomatis 24 jam</h3>
                    <p className="text-sm text-[#587063] mt-0.5">File tugasmu tidak menumpuk di PC fotokopi.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panduan 4 Langkah Praktis Cara Pakai wert.web.id */}
            <HowItWorksSection />

            {/* Footer Mini Penjelas */}
            <footer className="w-full border-t border-[#D5EADF] pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#587063]">
              <div className="flex items-center gap-1.5 text-center sm:text-left">
                <span>© 2026 wert.web.id</span>
                <span className="hidden sm:inline">•</span>
                <span>Solusi cetak file tugas cepat & privat untuk pelajar dan fotokopian.</span>
              </div>
              <div className="flex items-center gap-4 font-medium">
                <Link href="/privacy" className="hover:text-[#087443] transition">
                  Kebijakan Privasi
                </Link>
                <Link href="/terms" className="hover:text-[#087443] transition">
                  Syarat & Ketentuan
                </Link>
                <Link href="/bantuan" className="hover:text-[#087443] transition">
                  Bantuan
                </Link>
              </div>
            </footer>
          </div>
        )}

        {/* STEP 2: PIN PROMPT (MODERN DISCRETE 4-DIGIT BOXES) */}
        {step === "pin_prompt" && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            {/* Ambient Blobs */}
            <div className="absolute -top-12 -left-16 w-72 h-72 rounded-full bg-[#19C37D]/15 blur-3xl pointer-events-none"></div>
            <div className="absolute top-24 -right-16 w-80 h-80 rounded-full bg-[#FFE45C]/20 blur-3xl pointer-events-none"></div>

            <div className="relative w-full bg-white rounded-[28px] p-6 sm:p-8 shadow-soft border border-[#D5EADF] flex flex-col items-center text-center">
              {/* Top Lock Icon Tile */}
              <div className="w-14 h-14 rounded-2xl bg-[#E3F8EC] flex items-center justify-center text-[#087443] mb-4 shadow-sm border border-[#D5EADF]">
                <Lock className="w-7 h-7" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#10241B] tracking-tight mb-1">
                Masukkan PIN 4 Digit
              </h1>
              <p className="text-sm text-[#587063] mb-6">
                Halaman{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#E3F8EC] text-[#087443] font-bold">
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
                      className="w-[56px] sm:w-[64px] h-[64px] sm:h-[72px] rounded-2xl bg-[#F4FBF7] border-2 border-[#D5EADF] focus-within:border-[#087443] focus-within:ring-2 focus-within:ring-[#19C37D]/30 transition-all flex items-center justify-center shadow-inner"
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
                        className="w-full h-full text-center bg-transparent text-2xl sm:text-3xl font-display font-extrabold text-[#10241B] outline-none select-none caret-[#087443]"
                      />
                    </div>
                  ))}
                </div>

                {attemptsLeft !== null && (
                  <span className="text-xs text-amber-700 font-semibold bg-[#FFF4B8] px-3 py-1 rounded-full border border-[#FFE45C]">
                    Sisa percobaan: {attemptsLeft} kali
                  </span>
                )}

                {error && (
                  <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#FFEAEC] text-[#D92D3A] text-xs text-left border border-[#D92D3A]/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || pinDigits.some((d) => !d)}
                  className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-[#087443] hover:bg-[#065b34] text-white shadow transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Buka Halaman"}
                </button>

                <div className="w-full flex items-center justify-between text-xs text-[#587063] pt-3 border-t border-[#D5EADF]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("username");
                      setError(null);
                      setPinDigits(["", "", "", ""]);
                    }}
                    className="hover:text-[#10241B] hover:underline font-medium"
                  >
                    Ganti Username
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("recovery_prompt");
                      setError(null);
                    }}
                    className="text-[#087443] hover:underline font-semibold"
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
            <div className="w-full bg-white rounded-[28px] p-6 sm:p-8 shadow-soft border border-[#D5EADF] flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center mb-4 border border-[#D5EADF] shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#10241B]">
                Buat Halaman Baru
              </h2>
              <p className="text-sm text-[#587063] mt-1 mb-6">
                Alamat <b className="text-[#10241B]">wert.web.id/{cleanUsername}</b> belum terdaftar. Kamu bisa langsung membukanya.
              </p>

              <div className="w-full flex flex-col items-center gap-2 mb-6">
                <label className="text-xs font-semibold text-[#10241B]">
                  PIN 4 Angka (Opsional)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Boleh kosong"
                  className="w-48 text-center tracking-[0.5em] py-3 text-xl font-display font-bold rounded-2xl border-2 border-[#D5EADF] bg-[#F4FBF7] focus:border-[#087443] focus:ring-2 focus:ring-[#19C37D]/30 transition outline-none text-[#10241B]"
                />
                <span className="text-[11px] text-[#587063]">
                  Pasang PIN agar orang lain di fotokopian tidak bisa melihat file tugasmu.
                </span>
              </div>

              {error && (
                <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#FFEAEC] text-[#D92D3A] text-xs text-left mb-4">
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
                    className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-[#087443] hover:bg-[#065b34] text-white transition shadow cursor-pointer"
                  >
                    {loading ? "Memproses..." : "Buat dengan PIN"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRegister(false)}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-[#087443] hover:bg-[#065b34] text-white transition shadow cursor-pointer"
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
                  className="text-xs text-[#587063] hover:underline py-1"
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
            <div className="w-full bg-white rounded-[28px] p-6 sm:p-8 shadow-soft border border-[#D5EADF] flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF4B8] text-[#10241B] flex items-center justify-center mb-4 border border-[#FFE45C]">
                <ShieldCheck className="w-7 h-7 text-[#087443]" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#10241B]">Simpan Kode Pemulihan Anda</h3>
              <p className="text-xs text-[#587063] leading-relaxed mt-1 mb-4">
                Karena kami <b>tidak meminta email</b>, simpan kode ini jika sewaktu-waktu kamu lupa PIN:
              </p>

              <div className="w-full p-4 rounded-2xl bg-[#FFF4B8]/50 border border-[#FFE45C] flex items-center justify-between mb-5">
                <span className="font-mono font-bold text-lg text-[#10241B] tracking-widest">
                  {newRecoveryCode}
                </span>
                <button
                  type="button"
                  onClick={copyRecoveryCode}
                  className="p-2 rounded-xl bg-white border border-[#D5EADF] text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer"
                  title="Salin kode"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#087443]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/${cleanUsername}`)}
                className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-[#087443] hover:bg-[#065b34] text-white transition shadow cursor-pointer"
              >
                Saya Sudah Menyimpannya, Buka Halaman
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: RECOVERY PROMPT */}
        {step === "recovery_prompt" && (
          <div className="relative w-full max-w-[480px] mx-auto py-6">
            <div className="w-full bg-white rounded-[28px] p-6 sm:p-8 shadow-soft border border-[#D5EADF] flex flex-col text-left">
              <div className="text-center mb-4">
                <h3 className="font-display text-xl font-bold text-[#10241B]">Pemulihan PIN</h3>
                <p className="text-xs text-[#587063] mt-1">
                  Masukkan kode pemulihan 12 karakter yang diberikan saat PIN dipasang.
                </p>
              </div>

              <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#10241B]">Kode Pemulihan</label>
                  <input
                    type="text"
                    required
                    placeholder="WERT-XXXX-XXXX"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                    className="w-full py-3 px-3.5 rounded-xl border border-[#D5EADF] font-mono text-sm uppercase bg-[#F4FBF7] focus:border-[#087443] focus:bg-white outline-none text-[#10241B]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#10241B]">PIN Baru (4 Digit)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full py-3 px-3.5 rounded-xl border border-[#D5EADF] font-display text-lg tracking-widest text-center bg-[#F4FBF7] focus:border-[#087443] focus:bg-white outline-none text-[#10241B]"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFEAEC] text-[#D92D3A] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !recoveryInput || newPinInput.length !== 4}
                  className="w-full py-3.5 px-4 rounded-[16px] text-sm font-bold bg-[#087443] hover:bg-[#065b34] text-white shadow transition disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Ganti PIN & Masuk"}
                </button>

                <div className="flex items-center justify-between pt-3 border-t border-[#D5EADF] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("pin_prompt");
                      setError(null);
                    }}
                    className="text-[#587063] hover:underline cursor-pointer"
                  >
                    Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleHardReset}
                    className="text-[#D92D3A] hover:underline font-semibold cursor-pointer"
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
