"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Dropzone } from "@/components/Dropzone";
import { FileCard, FileItem } from "@/components/FileCard";
import { QrModal, getCachedQrSession, setCachedQrSession } from "@/components/QrModal";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { Plus, QrCode, RefreshCw, Files, HardDrive, Smartphone, AlertCircle, ArrowUpRight } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Global in-memory cache per username to ensure 0ms instantaneous navigation
const filesCache: Record<string, { files: FileItem[]; timestamp: number }> = {};
const MAX_STORAGE_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_FILE_COUNT = 20;

export default function UserDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username.toLowerCase();

  const cachedData = filesCache[username];
  const [files, setFiles] = useState<FileItem[]>(() => cachedData?.files || []);
  const [loading, setLoading] = useState(() => !cachedData);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);

  // Desktop empty state QR token
  const initialQr = getCachedQrSession();
  const [desktopQrDataUrl, setDesktopQrDataUrl] = useState<string | null>(initialQr?.qrDataUrl || null);
  const [desktopQrLoading, setDesktopQrLoading] = useState(false);

  const loadFiles = useCallback(async (silent = false) => {
    // Only show full loading if we have zero cached files
    if (!silent && !filesCache[username]) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        const freshFiles = data.files || [];
        filesCache[username] = { files: freshFiles, timestamp: Date.now() };
        setFiles(freshFiles);
      }
    } catch (err) {
      console.error("Gagal memuat file:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const loadDesktopQr = useCallback(async (forceRefresh = false) => {
    const valid = getCachedQrSession();
    if (!forceRefresh && valid) {
      setDesktopQrDataUrl(valid.qrDataUrl);
      return;
    }

    setDesktopQrLoading(true);
    try {
      const res = await fetch("/api/upload-sessions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCachedQrSession({
          qrDataUrl: data.qrDataUrl,
          targetUrl: data.url,
          expiresAt: new Date(data.expiresAt),
        });
        setDesktopQrDataUrl(data.qrDataUrl);
      }
    } catch (err) {
      console.error("Gagal memuat QR desktop:", err);
    } finally {
      setDesktopQrLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch (silent background revalidation if cached)
    loadFiles(Boolean(filesCache[username]));
    loadDesktopQr(false);

    // 1. Supabase Realtime subscription (Instant sync on upload/update)
    const channel = supabaseClient
      .channel("public:files")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        () => {
          loadFiles(true); // Silent revalidation without spinner
        }
      )
      .subscribe();

    // 2. Revalidate when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadFiles(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabaseClient.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadFiles, loadDesktopQr, username]);

  // Optimistic File Deletion (0ms response)
  const handleDeleteFile = async (id: string) => {
    if (!confirm("Hapus file ini permanen?")) return;
    const previous = files;
    const nextFiles = files.filter((f) => f.id !== id);

    // 0ms instant UI update
    setFiles(nextFiles);
    if (filesCache[username]) {
      filesCache[username].files = nextFiles;
    }

    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setFiles(previous);
        if (filesCache[username]) filesCache[username].files = previous;
        alert("Gagal menghapus file di server.");
      }
    } catch (err) {
      console.error("Gagal menghapus file:", err);
      setFiles(previous);
      if (filesCache[username]) filesCache[username].files = previous;
    }
  };

  const handleOptimisticUpdate = (id: string, partial: Partial<FileItem>) => {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...partial } : f));
      if (filesCache[username]) filesCache[username].files = next;
      return next;
    });
  };

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const storagePercent = Math.min(100, Math.max(1, (totalSize / MAX_STORAGE_BYTES) * 100));
  const isStorageWarning = storagePercent >= 80;
  const isStorageCritical = storagePercent >= 95;

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink selection:bg-mint selection:text-brand-deep">
      <Navbar username={username} onOpenQr={() => setIsQrModalOpen(true)} />

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          /* Sleek Skeleton Loading */
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-line rounded-xl" />
                <div className="h-4 w-64 bg-line/60 rounded-lg" />
              </div>
              <div className="h-12 w-36 bg-line rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-surface border border-line rounded-[20px] p-4 flex flex-col justify-between">
                  <div className="h-28 bg-line/50 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-line rounded" />
                    <div className="h-3 w-1/3 bg-line/60 rounded" />
                  </div>
                  <div className="h-10 bg-line/40 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : files.length === 0 ? (
          /* EMPTY STATE (from design.md section 5.2) */
          <div className="flex flex-col gap-8 animate-in fade-in duration-150">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
              <div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
                  File tugasmu
                </h1>
                <p className="text-sm text-muted mt-1">
                  Belum ada file. Tarik file ke sini, atau scan QR dari HP.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-4 py-2.5 rounded-[14px] bg-surface border border-line text-ink font-semibold text-xs sm:text-sm hover:bg-mint transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-brand-deep" />
                  <span>Upload dari HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddFile(true)}
                  className="px-5 py-2.5 rounded-[14px] bg-brand-deep text-white font-display font-bold text-sm border-2 border-ink shadow-sticker hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah file</span>
                </button>
              </div>
            </div>

            {/* Desktop side-by-side (Dropzone + QR) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col">
                <Dropzone onUploadSuccess={() => loadFiles(true)} />
              </div>

              {/* QR Card (Desktop view) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 rounded-[24px] bg-surface border border-line shadow-soft text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-mint text-brand-deep flex items-center justify-center mb-2 shadow-sm border border-line">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-ink text-lg">Upload dari Smartphone</h3>
                  <p className="text-xs text-muted mt-1 max-w-xs">
                    Buka kamera HP Anda, scan QR ini untuk upload langsung tanpa perlu login.
                  </p>

                  <div className="relative w-52 h-52 border-2 border-ink rounded-2xl p-2 bg-surface flex items-center justify-center shadow-sticker my-5 overflow-hidden">
                    {desktopQrLoading && !desktopQrDataUrl ? (
                      <div className="w-full h-full bg-bg rounded-xl animate-pulse flex flex-col items-center justify-center gap-2 text-muted">
                        <RefreshCw className="w-6 h-6 animate-spin text-brand-deep" />
                        <span className="text-xs">Membuat QR...</span>
                      </div>
                    ) : desktopQrDataUrl ? (
                      <img
                        src={desktopQrDataUrl}
                        alt="QR Code upload HP"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-xs text-muted">Gagal memuat QR</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-line">
                  <span>Otomatis tampil di layar ini</span>
                  <button
                    type="button"
                    onClick={() => loadDesktopQr(true)}
                    className="inline-flex items-center gap-1 font-bold text-brand-deep hover:underline transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Perbarui QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIST OF FILES (from design.md section 5.2) */
          <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-100">
            {/* Header: Title, Storage Progress Meter, & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
              <div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
                  File tugasmu
                </h1>
                {/* Meta Summary + Progress Meter */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="font-semibold text-ink">{files.length} file</span>
                    <span>·</span>
                    <span>{formatBytes(totalSize)} dari 200 MB</span>
                    {isStorageWarning && (
                      <Link
                        href={`/${username}/settings`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-hl-soft px-2 py-0.5 rounded-full border border-hl ml-2 hover:underline"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Atur penyimpanan</span>
                      </Link>
                    )}
                  </div>
                  {/* Thin Progress Meter (height 6px, radius 999) */}
                  <div className="w-48 sm:w-64 h-1.5 rounded-full bg-line overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isStorageCritical ? "bg-danger" : isStorageWarning ? "bg-hl" : "bg-brand"
                      }`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tambah File (Sticker Style) */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-4 py-3 rounded-[16px] bg-surface border border-line text-ink font-semibold text-xs sm:text-sm hover:bg-mint transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-brand-deep" />
                  <span className="hidden sm:inline">Upload dari HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddFile(!showAddFile)}
                  className="px-5 py-3 rounded-[16px] bg-brand-deep text-white font-display font-bold text-sm border-2 border-ink shadow-sticker hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah file</span>
                </button>
              </div>
            </div>

            {/* Collapsible Dropzone */}
            {showAddFile && (
              <div className="p-4 sm:p-6 rounded-[24px] bg-surface border border-line shadow-soft animate-in fade-in">
                <Dropzone
                  onUploadSuccess={() => {
                    loadFiles(true);
                    setShowAddFile(false);
                  }}
                />
              </div>
            )}

            {/* 3-Column Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={(f) => setSelectedFile(f)}
                  onDelete={handleDeleteFile}
                  onRefresh={() => loadFiles(true)}
                  onOptimisticUpdate={handleOptimisticUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        username={username}
      />

      <DocumentViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}
