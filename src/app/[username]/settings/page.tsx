"use client";

import { use, useState, useEffect, FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  HardDrive,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  Copy,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function SettingsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username.toLowerCase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PIN management modals/forms
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

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleAutoDelete = async () => {
    if (!data) return;
    const newStatus = !data.autoDeleteEnabled;

    if (newStatus) {
      if (!confirm("Nyalakan kembali hapus otomatis? Timer 48 jam seluruh file Anda akan dihitung ulang dari saat ini.")) {
        return;
      }
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDeleteEnabled: newStatus }),
      });
      if (res.ok) {
        setData({ ...data, autoDeleteEnabled: newStatus });
        setSuccessMsg(
          newStatus
            ? "Hapus otomatis aktif: Seluruh file Anda akan dihapus dalam 48 jam dari sekarang."
            : "Hapus otomatis dimatikan."
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
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

      loadSettings();
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
        loadSettings();
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar username={username} showActions={false} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/${username}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke File Tugas</span>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Pengaturan Akun</h1>
        <p className="text-xs text-slate-500 mb-6">Kelola keamanan PIN, preferensi hapus otomatis, dan kuota penyimpanan Anda.</p>

        {successMsg && (
          <div className="p-3 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 1. PIN SECTION */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data?.hasPin ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {data?.hasPin ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Keamanan PIN 4 Digit</h3>
                    <p className="text-xs text-slate-500">
                      {data?.hasPin
                        ? "Halaman ini dilindungi PIN. Hanya orang yang tahu PIN yang dapat membukanya."
                        : "Belum ada PIN. Siapa pun yang tahu username dapat melihat dan mencetak file Anda."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!data?.hasPin ? (
                    <button
                      type="button"
                      onClick={() => setPinMode("set")}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      Pasang PIN
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPinMode("change")}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Ubah PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinMode("remove")}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        Hapus PIN
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PIN Forms */}
              {pinMode !== "idle" && !newRecoveryCode && (
                <form onSubmit={handlePinSubmit} className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {pinMode === "set" ? "Pasang PIN Baru" : pinMode === "change" ? "Ganti PIN" : "Hapus PIN"}
                  </h4>

                  {pinMode === "change" && (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="PIN Lama (4 Digit)"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full sm:w-64 py-2 px-3 rounded-xl border border-slate-300 text-sm"
                    />
                  )}

                  {pinMode === "remove" ? (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="Masukkan PIN Saat Ini (4 Digit)"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full sm:w-64 py-2 px-3 rounded-xl border border-slate-300 text-sm"
                    />
                  ) : (
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="PIN 4 Digit (0-9)"
                      value={pinMode === "change" ? newPinInput : pinInput}
                      onChange={(e) =>
                        pinMode === "change"
                          ? setNewPinInput(e.target.value.replace(/\D/g, ""))
                          : setPinInput(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full sm:w-64 py-2 px-3 rounded-xl border border-slate-300 text-sm font-bold tracking-widest text-center"
                    />
                  )}

                  {error && <span className="text-xs text-rose-600">{error}</span>}

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinMode("idle");
                        setError(null);
                      }}
                      className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 transition"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Recovery Code Display */}
              {newRecoveryCode && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <span className="text-xs font-bold text-amber-900">Simpan Kode Pemulihan Anda:</span>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-amber-900 tracking-wider">
                      {newRecoveryCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newRecoveryCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-800"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRecoveryCode(null);
                      setPinMode("idle");
                    }}
                    className="self-start px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </div>

            {/* 2. AUTO-DELETE SECTION */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Hapus Otomatis Default (48 Jam)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jika aktif, file tugas baru yang diunggah akan otomatis terhapus setelah 48 jam untuk menjaga privasi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoDelete}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  data?.autoDeleteEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    data?.autoDeleteEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3. STORAGE QUOTA SECTION */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Kuota Penyimpanan</h3>
                  <p className="text-xs text-slate-500">Batas kapasitas file dan memori untuk akun Anda.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium">Jumlah File</span>
                  <span className="text-lg font-bold text-slate-900">
                    {data?.filesCount} <span className="text-xs text-slate-400 font-normal">/ {data?.maxFiles} file</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[11px] text-slate-500 font-medium">Ruang Terpakai</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatBytes(data?.totalSizeBytes || 0)}{" "}
                    <span className="text-xs text-slate-400 font-normal">/ {formatBytes(data?.maxSizeBytes || 0)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. DANGER ZONE */}
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">Zona Bahaya</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800">Hapus Semua File</h4>
                  <p className="text-[11px] text-slate-500">Menghapus seluruh file tugas yang ada di akun ini sekaligus.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAllFiles}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 transition"
                >
                  Hapus Semua File
                </button>
              </div>

              <div className="h-px bg-rose-200/60 my-1" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800">Hapus Akun Permanen</h4>
                  <p className="text-[11px] text-slate-500">Menghapus akun @{username} beserta semua file dan PIN.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
                >
                  Hapus Akun
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus akun @{username}? Username akan bebas dipakai lagi oleh orang lain dan semua file Anda hilang permanen.
            </p>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-slate-700">
                Ketik username Anda (<b>{username}</b>) untuk konfirmasi:
              </label>
              <input
                type="text"
                required
                placeholder={username}
                value={deleteAccountUsername}
                onChange={(e) => setDeleteAccountUsername(e.target.value.toLowerCase())}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>

            {data?.hasPin && (
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-slate-700">Masukkan PIN 4 Digit</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="PIN 4 Digit"
                  value={deleteAccountPin}
                  onChange={(e) => setDeleteAccountPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm tracking-widest text-center font-bold"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountUsername !== username || (data?.hasPin && deleteAccountPin.length !== 4)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition shadow-sm"
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
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
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
