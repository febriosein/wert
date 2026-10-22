"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Dropzone } from "@/components/Dropzone";
import { FileCard, FileItem } from "@/components/FileCard";
import { QrModal, getCachedQrSession, setCachedQrSession } from "@/components/QrModal";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { Plus, QrCode, RefreshCw, Files, HardDrive, Smartphone } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Global in-memory cache per username to ensure 0ms instantaneous navigation
const filesCache: Record<string, { files: FileItem[]; timestamp: number }> = {};

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
        // Rollback if failed
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

  // Optimistic partial update (Extend 48h, toggle timer, etc.)
  const handleOptimisticUpdate = (id: string, partial: Partial<FileItem>) => {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...partial } : f));
      if (filesCache[username]) filesCache[username].files = next;
      return next;
    });
  };

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar username={username} onOpenQr={() => setIsQrModalOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          /* Sleek Skeleton Loading (never flashes full-page white screen) */
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-16 bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between">
              <div className="h-5 w-40 bg-slate-200 rounded-lg" />
              <div className="h-9 w-32 bg-slate-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-slate-100 rounded" />
                      <div className="h-3 w-1/3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : files.length === 0 ? (
          /* EMPTY STATE (PRD 7.3) */
          <div className="flex flex-col gap-8 animate-in fade-in duration-150">
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Halaman Tugas @{username}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Belum ada file tugas. Unggah dari komputer atau scan QR dari smartphone Anda.
              </p>
            </div>

            {/* Desktop side-by-side (Dropzone + QR) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col">
                <Dropzone onUploadSuccess={() => loadFiles(true)} />
              </div>

              {/* QR Card (hidden on mobile touch, visible on desktop lg screen) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Upload dari Smartphone</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Buka kamera HP Anda, scan QR ini untuk upload langsung tanpa perlu login.
                  </p>

                  <div className="relative w-52 h-52 border-2 border-slate-100 rounded-2xl p-2 bg-white flex items-center justify-center shadow-inner my-4 overflow-hidden">
                    {desktopQrLoading && !desktopQrDataUrl ? (
                      <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-[11px]">Membuat QR...</span>
                      </div>
                    ) : desktopQrDataUrl ? (
                      <img
                        src={desktopQrDataUrl}
                        alt="QR Code upload HP"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Gagal memuat QR</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                  <span>Otomatis tampil di layar ini</span>
                  <button
                    type="button"
                    onClick={() => loadDesktopQr(true)}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Perbarui QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIST OF FILES (PRD 7.3 & 7.5) */
          <div className="flex flex-col gap-6 animate-in fade-in duration-100">
            {/* Top Stats & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Files className="w-4 h-4 text-emerald-600" />
                  <span>{files.length} File Tersimpan</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  <span>{formatBytes(totalSize)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Upload dari HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddFile(!showAddFile)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah File</span>
                </button>
              </div>
            </div>

            {/* Collapsible Dropzone for adding files */}
            {showAddFile && (
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in">
                <Dropzone
                  onUploadSuccess={() => {
                    loadFiles(true);
                    setShowAddFile(false);
                  }}
                />
              </div>
            )}

            {/* Grid of File Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
