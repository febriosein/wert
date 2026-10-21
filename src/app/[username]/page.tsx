"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Dropzone } from "@/components/Dropzone";
import { FileCard, FileItem } from "@/components/FileCard";
import { QrModal } from "@/components/QrModal";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { Plus, QrCode, RefreshCw, Files, HardDrive, Smartphone } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UserDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username.toLowerCase();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);

  // Desktop empty state QR token
  const [desktopQrDataUrl, setDesktopQrDataUrl] = useState<string | null>(null);
  const [desktopQrLoading, setDesktopQrLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Gagal memuat file:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDesktopQr = useCallback(async () => {
    setDesktopQrLoading(true);
    try {
      const res = await fetch("/api/upload-sessions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDesktopQrDataUrl(data.qrDataUrl);
      }
    } catch (err) {
      console.error("Gagal memuat QR desktop:", err);
    } finally {
      setDesktopQrLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
    loadDesktopQr();

    // 1. Supabase Realtime subscription (Instant sync on upload/update)
    const channel = supabaseClient
      .channel("public:files")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        () => {
          loadFiles();
        }
      )
      .subscribe();

    // 2. Polling every 3 seconds as fallback (PRD 7.3)
    const interval = setInterval(loadFiles, 3000);

    return () => {
      supabaseClient.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadFiles, loadDesktopQr]);

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Hapus file ini permanen?")) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus file:", err);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar username={username} onOpenQr={() => setIsQrModalOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-medium">Memuat file tugas...</span>
          </div>
        ) : files.length === 0 ? (
          /* EMPTY STATE (PRD 7.3) */
          <div className="flex flex-col gap-8">
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
                <Dropzone onUploadSuccess={loadFiles} />
              </div>

              {/* QR Card (hidden on mobile touch, visible on desktop lg screen) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Upload dari Smartphone</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Buka kamera HP Anda, scan QR ini untuk upload langsung tanpa perlu login.
                  </p>

                  <div className="relative w-52 h-52 border-2 border-slate-100 rounded-xl p-2 bg-white flex items-center justify-center shadow-inner my-4">
                    {desktopQrLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                    ) : desktopQrDataUrl ? (
                      <img
                        src={desktopQrDataUrl}
                        alt="QR Code upload HP"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Gagal memuat QR</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Otomatis tampil di layar ini</span>
                  <button
                    type="button"
                    onClick={loadDesktopQr}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Perbarui QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIST OF FILES (PRD 7.3 & 7.5) */
          <div className="flex flex-col gap-6">
            {/* Top Stats & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
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
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in fade-in">
                <Dropzone
                  onUploadSuccess={() => {
                    loadFiles();
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
                  onRefresh={loadFiles}
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
