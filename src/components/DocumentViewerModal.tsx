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
  FileText,
  Image as ImageIcon,
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

  const downloadUrl = file ? `/api/files/${file.id}/download` : "";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#10241B]/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[1080px] h-[90vh] rounded-[28px] bg-white shadow-2xl border border-[#D5EADF] flex flex-col overflow-hidden text-left">
        {/* Header Modal Toolbar */}
        <header className="bg-white px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#D5EADF] select-none shrink-0">
          {/* File Metadata (Left Side) */}
          <div className="flex items-center gap-3.5 min-w-0 max-w-[50%]">
            <div className="w-11 h-11 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center shrink-0 border border-[#D5EADF] shadow-sm">
              {isImage ? (
                <ImageIcon className="w-5 h-5 text-[#087443]" />
              ) : (
                <FileText className="w-5 h-5 text-[#087443]" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-[#10241B] truncate" title={file.display_name}>
                  {file.display_name}
                </h2>
                <span className="text-[10px] font-bold uppercase bg-[#E3F8EC] text-[#087443] px-2 py-0.5 rounded-full border border-[#D5EADF] shrink-0">
                  {file.ext}
                </span>
              </div>
              <p className="text-xs text-[#587063] mt-0.5">
                {formatBytes(file.size_bytes)}
              </p>
            </div>
          </div>

          {/* Action Cluster (Right Side) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Main Print Button */}
            {!isZip && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="inline-flex items-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white font-display text-xs sm:text-sm font-bold px-5 sm:px-6 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95 duration-150 cursor-pointer disabled:opacity-50"
              >
                {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>Cetak dokumen</span>
              </button>
            )}

            {/* Secondary: New Tab */}
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-[#E3F8EC] text-[#10241B] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-[#D5EADF] transition-colors"
              title="Buka pratinjau di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Tab baru</span>
            </a>

            {/* Secondary: Download */}
            <a
              href={downloadUrl}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-[#E3F8EC] text-[#10241B] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-[#D5EADF] transition-colors"
              title="Unduh file"
            >
              <Download className="w-4 h-4" />
              <span>Unduh</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-[#E3F8EC] text-[#587063] hover:text-[#10241B] border border-[#D5EADF] transition-colors cursor-pointer"
              title="Tutup dialog"
              aria-label="Tutup Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Crisp Mint Backdrop (#E3F8EC) */}
        <main className="relative flex-1 bg-[#E3F8EC]/50 overflow-auto p-4 sm:p-8 flex justify-center items-start">
          {/* ZIP Viewer */}
          {isZip ? (
            <div className="w-full max-w-2xl bg-white rounded-[24px] border border-[#D5EADF] shadow-soft p-6 flex flex-col gap-4 max-h-[75vh] overflow-hidden my-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF4B8] text-[#10241B] flex items-center justify-center shrink-0 border border-[#FFE45C]">
                  <FolderArchive className="w-6 h-6 text-[#087443]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[#10241B] text-base">Daftar Isi Arsip ZIP</h3>
                  <p className="text-xs text-[#587063]">
                    Isi arsip dibaca langsung dari central directory tanpa diekstrak di server.
                  </p>
                </div>
              </div>

              {loadingZip ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#587063]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#087443]" />
                  <span className="text-xs">Membaca daftar file...</span>
                </div>
              ) : zipEntries.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#587063]">
                  Arsip kosong atau tidak dapat dibaca.
                </div>
              ) : (
                <div className="border border-[#D5EADF] rounded-2xl overflow-auto max-h-[50vh] divide-y divide-[#D5EADF] bg-white">
                  {zipEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 text-xs hover:bg-[#E3F8EC]/40 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                        {entry.isDirectory ? (
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-[#587063] shrink-0" />
                        )}
                        <span className="font-medium text-[#10241B] truncate">{entry.name}</span>
                      </div>
                      {!entry.isDirectory && (
                        <span className="text-[#587063] text-[11px] shrink-0 font-mono">
                          {formatBytes(entry.sizeBytes)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isImage ? (
            /* Image Preview on White Sheet */
            <div className="flex flex-col items-center justify-center w-full min-h-full">
              <div
                className="bg-white rounded-2xl border border-[#D5EADF] shadow-md p-4 max-w-full overflow-hidden transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
              >
                <img
                  src={previewUrl}
                  alt={file.display_name}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl select-none"
                />
              </div>

              {/* Floating Bottom Toolbar for Images */}
              <div className="sticky bottom-4 mt-4 inline-flex items-center gap-1.5 bg-white border border-[#D5EADF] rounded-full px-3 py-1.5 shadow-md text-xs font-semibold z-20">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1 hover:bg-[#E3F8EC] rounded-full text-[#587063] hover:text-[#10241B] transition"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-[#10241B]">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                  className="p-1 hover:bg-[#E3F8EC] rounded-full text-[#587063] hover:text-[#10241B] transition"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:bg-[#E3F8EC] rounded-full text-[#587063] hover:text-[#10241B] ml-1 border-l border-[#D5EADF] pl-2 transition"
                  title="Reset Ukuran"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Document / PDF Iframe Preview */
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {!iframeLoaded && !iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#E3F8EC]/60 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
                  <span className="font-display font-semibold text-sm text-[#10241B]">Menyiapkan pratinjau dokumen...</span>
                </div>
              )}

              {iframeError ? (
                <div className="p-8 rounded-[24px] bg-white border border-[#D5EADF] text-center max-w-md shadow-soft">
                  <AlertCircle className="w-10 h-10 text-[#D92D3A] mx-auto mb-3" />
                  <h3 className="font-display font-bold text-base text-[#10241B]">Pratinjau Belum Tersedia</h3>
                  <p className="text-xs text-[#587063] mt-1 mb-4 leading-relaxed">
                    Browser tidak dapat merender pratinjau ini secara langsung. Kamu tetap dapat mengunduh atau mencetak file aslinya.
                  </p>
                  <a
                    href={downloadUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087443] text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File</span>
                  </a>
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  title={file.display_name}
                  className="w-full h-full rounded-2xl bg-white border border-[#D5EADF] shadow-md"
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                />
              )}
            </div>
          )}

          {/* Hidden Print Frame for Silent Printing */}
          <iframe ref={printFrameRef} className="hidden" title="Print Frame" />
        </main>

        {/* Photocopy Privacy Logout Prompt after printing */}
        {showLogoutPrompt && (
          <div className="p-4 bg-[#FFF4B8] border-t border-[#FFE45C] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#10241B]">
              <Check className="w-4 h-4 text-[#087443] shrink-0" />
              <span>
                <b>Dokumen dikirim ke printer!</b> Jika selesai menggunakan komputer fotokopi, silakan keluar untuk keamanan privasi Anda.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-[#D92D3A] hover:bg-red-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutPrompt(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#D5EADF] text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer"
              >
                Tetap di Halaman
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
