"use client";

import { use, useState, useEffect, FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import {
  Clock,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  Copy,
  ChevronLeft,
  RefreshCw,
  Cloud,
  FileText,
  HardDrive,
  X,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: Promise<{ username: string }>;
}

const settingsCache: Record<string, any> = {};

export default function SettingsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username.toLowerCase();
  const router = useRouter();

  const cached = settingsCache[username];
  const [data, setData] = useState<any>(() => cached || null);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PIN management
  const [pinMode, setPinMode] = useState<"idle" | "set" | "change" | "remove">("idle");
  const [pinInput, setPinInput] = useState("");
  const [oldPinInput, setOldPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Danger actions
  const [deleteAccountUsername, setDeleteAccountUsername] = useState("");
  const [deleteAccountPin, setDeleteAccountPin] = useState("");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const loadSettings = async (silent = false) => {
    if (!silent && !settingsCache[username]) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        settingsCache[username] = json;
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings(Boolean(settingsCache[username]));
  }, [username]);

  const handleToggleAutoDelete = async () => {
    if (!data) return;
    const newStatus = !data.autoDeleteEnabled;

    if (newStatus) {
      if (!confirm("Nyalakan kembali hapus otomatis? Timer 48 jam seluruh file Anda akan dihitung ulang dari saat ini.")) {
        return;
      }
    }

    // 0ms instant optimistic UI
    const previous = data;
    const updated = { ...data, autoDeleteEnabled: newStatus };
    setData(updated);
    settingsCache[username] = updated;

    setSuccessMsg(
      newStatus
        ? "Pengaturan disimpan: Hapus otomatis 48 jam aktif."
        : "Pengaturan disimpan: Hapus otomatis dimatikan."
    );
    setTimeout(() => setSuccessMsg(null), 3000);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDeleteEnabled: newStatus }),
      });
      if (!res.ok) {
        setData(previous);
        settingsCache[username] = previous;
      }
    } catch (err) {
      console.error(err);
      setData(previous);
      settingsCache[username] = previous;
    }
  };

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let body: any = { action: pinMode };
    if (pinMode === "set") {
      body.pin = pinInput;
    } else if (pinMode === "change") {
      body.oldPin = oldPinInput;
      body.newPin = newPinInput;
    } else if (pinMode === "remove") {
      body.currentPin = pinInput;
    }

    try {
      const res = await fetch("/api/settings/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses PIN");

      if (json.recoveryCode) {
        setNewRecoveryCode(json.recoveryCode);
      } else {
        setPinMode("idle");
        setSuccessMsg(json.message);
        setTimeout(() => setSuccessMsg(null), 3000);
      }

      loadSettings(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAllFiles = async () => {
    if (!confirm("Peringatan: Semua file Anda akan dihapus permanen dari penyimpanan. Lanjutkan?")) {
      return;
    }
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_all_files" }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg("Semua file berhasil dihapus.");
        loadSettings(true);
      } else {
        alert(json.error || "Gagal menghapus file");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_account",
          pin: deleteAccountPin,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menghapus akun");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const fileCountPercent = Math.min(100, Math.round(((data?.filesCount || 0) / (data?.maxFiles || 20)) * 100));
  const storagePercent = Math.min(100, Math.round(((data?.totalSizeBytes || 0) / (data?.maxSizeBytes || 200 * 1024 * 1024)) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] selection:bg-[#E3F8EC] selection:text-[#087443]">
      <Navbar username={username} showActions={false} />

      <main className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left">
        {/* Back Link */}
        <Link
          href={`/${username}`}
          prefetch={true}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#587063] hover:text-[#10241B] transition mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>File tugas</span>
        </Link>

        {/* Heading & Subtitle */}
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#10241B] tracking-tight mb-1">
          Pengaturan akun
        </h1>
        <p className="text-sm text-[#587063] mb-8">
          Atur PIN, penghapusan otomatis, dan ruang penyimpanan.
        </p>

        {/* Toast / Alert Message */}
        {successMsg && (
          <div className="p-3.5 mb-6 rounded-2xl bg-[#E3F8EC] border border-[#D5EADF] text-[#087443] text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col gap-5 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-[20px] bg-white border border-[#D5EADF] shadow-soft flex flex-col gap-4">
                <div className="h-6 w-48 bg-[#D5EADF] rounded-lg" />
                <div className="h-4 w-72 bg-[#D5EADF]/60 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 1. KEAMANAN PIN */}
            <section className="bg-white rounded-[20px] p-6 border border-[#D5EADF] shadow-soft flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center shrink-0 border border-[#D5EADF] shadow-sm">
                    {data?.hasPin ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-lg text-[#10241B]">PIN 4 digit</h2>
                      {data?.hasPin ? (
                        <span className="text-xs font-bold bg-[#E3F8EC] text-[#087443] px-2.5 py-0.5 rounded-full border border-[#D5EADF]">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-[#FFF4B8] text-[#10241B] px-2.5 py-0.5 rounded-full border border-[#FFE45C]">
                          Belum diatur
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#587063] mt-1 max-w-sm">
                      {data?.hasPin
                        ? "Hanya yang tahu PIN yang bisa membuka dan melihat file di halamanmu."
                        : "Halamanmu saat ini dapat dibuka langsung oleh siapa pun tanpa PIN."}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!data?.hasPin ? (
                    <button
                      type="button"
                      onClick={() => setPinMode("set")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#087443] hover:bg-[#065b34] text-white shadow-sm transition cursor-pointer"
                    >
                      Buat PIN
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPinMode("change")}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F4FBF7] hover:bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B] transition cursor-pointer"
                      >
                        Ubah PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinMode("remove")}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#D92D3A] hover:bg-[#FFEAEC] transition cursor-pointer"
                      >
                        Hapus PIN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PIN Forms */}
              {pinMode !== "idle" && !newRecoveryCode && (
                <form onSubmit={handlePinSubmit} className="mt-2 pt-4 border-t border-[#D5EADF] flex flex-col gap-3">
                  <h3 className="font-display text-xs font-bold text-[#10241B] uppercase tracking-wider">
                    {pinMode === "set" ? "Pasang PIN Baru" : pinMode === "change" ? "Ganti PIN" : "Hapus PIN"}
                  </h3>

                  {pinMode === "change" && (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="PIN Lama (4 Digit)"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full sm:w-64 py-2.5 px-3 rounded-xl border border-[#D5EADF] bg-[#F4FBF7] text-sm font-display text-center tracking-widest outline-none focus:border-[#087443] text-[#10241B]"
                    />
                  )}

                  {pinMode === "remove" ? (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="PIN Saat Ini (4 Digit)"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full sm:w-64 py-2.5 px-3 rounded-xl border border-[#D5EADF] bg-[#F4FBF7] text-sm font-display text-center tracking-widest outline-none focus:border-[#087443] text-[#10241B]"
                    />
                  ) : (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="PIN Baru 4 Digit"
                      value={pinMode === "change" ? newPinInput : pinInput}
                      onChange={(e) =>
                        pinMode === "change"
                          ? setNewPinInput(e.target.value.replace(/\D/g, ""))
                          : setPinInput(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full sm:w-64 py-2.5 px-3 rounded-xl border border-[#D5EADF] bg-[#F4FBF7] text-sm font-display text-center tracking-widest outline-none focus:border-[#087443] text-[#10241B]"
                    />
                  )}

                  {error && <span className="text-xs text-[#D92D3A] font-medium">{error}</span>}

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#087443] hover:bg-[#065b34] text-white transition cursor-pointer shadow-sm"
                    >
                      Simpan PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinMode("idle");
                        setError(null);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-[#587063] hover:text-[#10241B] transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Recovery Code Display */}
              {newRecoveryCode && (
                <div className="mt-2 pt-4 border-t border-[#D5EADF] flex flex-col gap-3">
                  <span className="text-xs font-bold text-[#10241B]">Simpan Kode Pemulihan Anda:</span>
                  <div className="p-3.5 rounded-2xl bg-[#FFF4B8] border border-[#FFE45C] flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[#10241B] tracking-wider">
                      {newRecoveryCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newRecoveryCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-[#D5EADF] text-[#10241B] hover:bg-[#E3F8EC] cursor-pointer"
                      title="Salin kode"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-[#087443]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRecoveryCode(null);
                      setPinMode("idle");
                    }}
                    className="self-start px-4 py-2 rounded-xl text-xs font-bold bg-[#087443] text-white cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </section>

            {/* 2. PRIVASI (HAPUS OTOMATIS) */}
            <section className="bg-white rounded-[20px] p-6 border border-[#D5EADF] shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF4B8] text-[#10241B] flex items-center justify-center shrink-0 border border-[#FFE45C] shadow-sm">
                    <Clock className="w-6 h-6 text-[#087443]" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#10241B]">
                      Hapus otomatis setelah 48 jam
                    </h2>
                    <p className="text-xs text-[#587063] mt-1 max-w-md">
                      File baru akan dihapus otomatis setelah 48 jam. Bisa diubah per file saat diunggah.
                    </p>
                  </div>
                </div>

                {/* Big Custom Toggle Switch (52px x 32px) from design.md */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={data?.autoDeleteEnabled}
                  onClick={handleToggleAutoDelete}
                  className={`relative w-[52px] h-[32px] rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center shrink-0 cursor-pointer ${
                    data?.autoDeleteEnabled ? "bg-[#087443]" : "bg-[#D5EADF]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-200 flex items-center justify-center ${
                      data?.autoDeleteEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${data?.autoDeleteEnabled ? "bg-[#087443]" : "bg-[#587063]"}`} />
                  </span>
                </button>
              </div>

              {/* Retention Micro Indicator */}
              <div className="flex items-center gap-2 mt-1 px-3.5 py-2.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] text-xs text-[#587063]">
                <Clock className="w-4 h-4 text-[#087443] shrink-0" />
                <span>Berkas yang tersisa saat ini mematuhi jadwal kedaluwarsa aktif.</span>
              </div>
            </section>

            {/* 3. PENYIMPANAN & KUOTA */}
            <section className="bg-white rounded-[20px] p-6 border border-[#D5EADF] shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E4EEFF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#10241B]">
                      Kapasitas & Kuota Penyimpanan
                    </h2>
                    <p className="text-xs text-[#587063] mt-0.5">Batas aman dokumen yang disimpan di server.</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-[#E3F8EC] text-[#087443] px-3 py-1 rounded-full border border-[#D5EADF]">
                  Optimal
                </span>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {/* Row 1: File Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#F4FBF7] rounded-xl border border-[#D5EADF]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#10241B]">
                    <FileText className="w-4 h-4 text-[#587063]" />
                    <span>Jumlah file</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <span className="font-display font-bold text-base text-[#10241B]">
                      {data?.filesCount || 0} <span className="text-xs text-[#587063] font-normal">dari {data?.maxFiles || 20}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 sm:w-36 h-2 rounded-full bg-[#D5EADF] overflow-hidden">
                        <div className="h-full bg-[#19C37D] rounded-full transition-all" style={{ width: `${fileCountPercent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-[#587063] w-8 text-right">{fileCountPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Storage Size */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#F4FBF7] rounded-xl border border-[#D5EADF]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#10241B]">
                    <HardDrive className="w-4 h-4 text-[#587063]" />
                    <span>Ruang terpakai</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <span className="font-display font-bold text-base text-[#10241B]">
                      {formatBytes(data?.totalSizeBytes || 0)} <span className="text-xs text-[#587063] font-normal">dari {formatBytes(data?.maxSizeBytes || 200 * 1024 * 1024)}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 sm:w-36 h-2 rounded-full bg-[#D5EADF] overflow-hidden">
                        <div
                          className="h-full bg-[#19C37D] rounded-full transition-all"
                          style={{ width: `${Math.max(2, storagePercent)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#587063] w-8 text-right">{storagePercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. ZONA BAHAYA (WHITE CARD, SUBTLE RED BORDER) */}
            <section className="bg-white rounded-[20px] p-6 border border-[#D92D3A]/30 shadow-soft flex flex-col gap-4">
              <div className="flex items-center gap-2.5 text-[#D92D3A]">
                <div className="w-8 h-8 rounded-lg bg-[#FFEAEC] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#D92D3A]" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#D92D3A]">
                  Zona Bahaya
                </h3>
              </div>

              {/* Action 1: Hapus Semua File */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#10241B]">Hapus semua file</h4>
                  <p className="text-xs text-[#587063] mt-0.5">
                    Menghapus seluruh file tugas di halaman ini sekaligus tanpa bisa dipulihkan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAllFiles}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FFEAEC] text-[#D92D3A] border border-[#D92D3A]/40 transition shrink-0 cursor-pointer"
                >
                  Hapus semua file
                </button>
              </div>

              <div className="h-px bg-[#D5EADF] my-1" />

              {/* Action 2: Hapus Akun Permanen */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#10241B]">Hapus akun permanen</h4>
                  <p className="text-xs text-[#587063] mt-0.5">
                    Menghapus halaman @{username} beserta semua file dan PIN.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D92D3A] hover:bg-red-700 text-white transition shrink-0 cursor-pointer shadow-sm"
                >
                  Hapus Akun
                </button>
              </div>
            </section>

            {/* Auto-Save Footer Note */}
            <footer className="flex items-center justify-center gap-2 pt-2 text-[#587063] text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-[#087443]" />
              <span>Perubahan pengaturan disimpan otomatis.</span>
            </footer>
          </div>
        )}
      </main>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10241B]/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl border border-[#D5EADF] flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEAEC] text-[#D92D3A] flex items-center justify-center mx-auto border border-[#D92D3A]/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#10241B]">Konfirmasi Hapus Akun</h3>
            <p className="text-xs text-[#587063] leading-relaxed">
              Apakah Anda yakin ingin menghapus akun @{username}? Username akan bebas dipakai lagi oleh orang lain dan semua file Anda hilang permanen.
            </p>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#10241B]">
                Ketik username Anda (<b>{username}</b>) untuk konfirmasi:
              </label>
              <input
                type="text"
                required
                placeholder={username}
                value={deleteAccountUsername}
                onChange={(e) => setDeleteAccountUsername(e.target.value.toLowerCase())}
                className="w-full py-2.5 px-3 rounded-xl border border-[#D5EADF] text-sm font-semibold bg-[#F4FBF7] focus:border-[#087443] outline-none text-[#10241B]"
              />
            </div>

            {data?.hasPin && (
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#10241B]">Masukkan PIN 4 Digit</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={deleteAccountPin}
                  onChange={(e) => setDeleteAccountPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#D5EADF] text-sm tracking-widest text-center font-bold bg-[#F4FBF7] focus:border-[#087443] outline-none text-[#10241B]"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountUsername !== username || (data?.hasPin && deleteAccountPin.length !== 4)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#D92D3A] hover:bg-red-700 disabled:opacity-50 text-white transition shadow-sm cursor-pointer"
              >
                Hapus Permanen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountUsername("");
                  setDeleteAccountPin("");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-[#587063] hover:bg-[#E3F8EC] transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
