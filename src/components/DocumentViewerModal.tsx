"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  LogOut,
  Check,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FolderArchive,
  File,
  Folder,
  ExternalLink,
} from "lucide-react";
import { FileItem } from "./FileCard";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/utils";

interface DocumentViewerModalProps {
  file: FileItem | null;
  onClose: () => void;
}

interface ZipEntry {
  name: string;
  sizeBytes: number;
  isDirectory: boolean;
}

export function DocumentViewerModal({ file, onClose }: DocumentViewerModalProps) {
  const router = useRouter();
  const [printing, setPrinting] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Reset loading states when file changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
  }, [file?.id]);

  // ZIP contents state
  const [zipEntries, setZipEntries] = useState<ZipEntry[]>([]);
  const [loadingZip, setLoadingZip] = useState(false);

  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const isZip = file?.ext.toLowerCase() === "zip";
  const isImage = file ? ["jpg", "jpeg", "png", "heic", "webp"].includes(file.ext.toLowerCase()) : false;
  const isOffice = file ? ["docx", "doc", "pptx", "xlsx"].includes(file.ext.toLowerCase()) : false;

  const downloadUrl = file ? `/api/files/${file.id}/download?variant=original` : "";
  const previewUrl = file ? `/api/files/${file.id}/preview` : "";

  // Fetch zip contents if it's a zip file
  useEffect(() => {
    if (file && isZip) {
      setLoadingZip(true);
      fetch(`/api/files/${file.id}/archive-contents`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setZipEntries(data.entries || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingZip(false));
    }
  }, [file, isZip]);

  if (!file) return null;

  const handlePrint = () => {
    setPrinting(true);
    const targetUrl = previewUrl;

    if (printFrameRef.current) {
      printFrameRef.current.src = targetUrl;
      printFrameRef.current.onload = () => {
        try {
          printFrameRef.current?.contentWindow?.focus();
          printFrameRef.current?.contentWindow?.print();
        } catch {
          window.open(targetUrl, "_blank");
        } finally {
          setPrinting(false);
          setShowLogoutPrompt(true);
        }
      };
    } else {
      window.open(targetUrl, "_blank");
      setPrinting(false);
      setShowLogoutPrompt(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[92vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50/90 select-none">
          {/* File Info */}
          <div className="flex items-center gap-2 truncate max-w-[45%]">
            <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
              {file.display_name}
            </span>
            <span className="text-[11px] uppercase bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md shrink-0">
              {file.ext}
            </span>
          </div>

          {/* Center Zoom Controls (Images & Docs) */}
          {isImage && (
            <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-slate-700">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 ml-1 border-l pl-2"
                title="Reset Ukuran"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isZip && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Cetak Dokumen</span>
              </button>
            )}

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition"
              title="Buka pratinjau di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Tab Baru</span>
            </a>

            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition"
              title="Download file asli"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              title="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center relative">
          {/* A. ZIP ARSIP VIEWER (PRD 7.5) */}
          {isZip ? (
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Daftar Isi Arsip ZIP</h3>
                  <p className="text-xs text-slate-500">
                    Isi arsip dibaca langsung dari central directory tanpa diekstrak di server.
                  </p>
                </div>
              </div>

              {loadingZip ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Membaca daftar file...</span>
                </div>
              ) : zipEntries.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Arsip kosong atau tidak dapat dibaca.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-auto max-h-[50vh] divide-y divide-slate-100">
                  {zipEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[80%]">
                        {entry.isDirectory ? (
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 truncate">{entry.name}</span>
                      </div>
                      {!entry.isDirectory && (
                        <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                          {formatBytes(entry.sizeBytes)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{zipEntries.length} item dalam arsip</span>
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP Asli</span>
                </a>
              </div>
            </div>
          ) : isImage ? (
            /* B. IMAGE VIEWER */
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={downloadUrl}
                alt={file.display_name}
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg transition-transform duration-150"
              />
            </div>
          ) : (
            /* C. PDF & CONVERTED DOCUMENTS VIEWER */
            <div className="relative w-full h-full">
              {!iframeLoaded && !iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl z-10 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">
                    {isOffice && !file?.pdf_key
                      ? "Mengonversi dokumen Word ke PDF presisi tinggi..."
                      : "Menyiapkan pratinjau dokumen..."}
                  </span>
                </div>
              )}

              {iframeError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white rounded-2xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <h4 className="font-bold text-slate-800 text-sm">Pratinjau tidak dapat dimuat</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Browser Anda membatasi pratinjau PDF. Anda tetap dapat mengunduh atau membuka langsung di tab baru.
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Tab Baru</span>
                    </a>
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh File Asli</span>
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  title={file.display_name}
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                  className="w-full h-full rounded-2xl bg-white shadow-inner border border-slate-200"
                />
              )}
            </div>
          )}
        </div>

        {/* Hidden print iframe */}
        <iframe ref={printFrameRef} className="hidden" title="print_iframe_silent" />

        {/* Public Computer Logout Reminder Modal (PRD 7.2 & 7.6) */}
        {showLogoutPrompt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Perintah Cetak Dikirim</h3>
              <p className="text-xs text-slate-600 mt-2 mb-5 leading-relaxed">
                Jika Anda menggunakan <b>komputer fotokopian / rental</b>, keluar sekarang demi menjaga privasi file tugas Anda dari pengguna berikutnya.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Sekarang (Aman)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutPrompt(false)}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Tetap di Halaman
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
