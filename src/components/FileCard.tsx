"use client";

import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Archive,
  Download,
  Printer,
  Trash2,
  Clock,
  MoreVertical,
  RotateCcw,
  RefreshCw,
  FileCode,
  X,
  FileDown,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatBytes, formatCountdown } from "@/lib/utils";
import { Dropzone } from "./Dropzone";

export interface FileItem {
  id: string;
  display_name: string;
  ext: string;
  size_bytes: number;
  status: "uploading" | "ready" | "processing" | "failed";
  pdf_key?: string | null;
  docx_key?: string | null;
  expires_at?: string | null;
  created_at: string;
}

interface FileCardProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function FileCard({ file, onPreview, onDelete, onRefresh }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  // PDF to DOCX modal & conversion state
  const [showDocxModal, setShowDocxModal] = useState(false);
  const [docxMode, setDocxMode] = useState<"precision" | "editable">("precision");
  const [convertingDocx, setConvertingDocx] = useState(false);

  // Office to PDF download & conversion state
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const countdown = formatCountdown(file.expires_at);

  const getFileIcon = (ext: string) => {
    const clean = ext.toLowerCase();
    if (["docx", "doc"].includes(clean)) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    if (["xlsx", "xls", "csv"].includes(clean)) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    }
    if (["pptx", "ppt"].includes(clean)) {
      return <Presentation className="w-6 h-6 text-amber-600" />;
    }
    if (clean === "pdf") {
      return <FileText className="w-6 h-6 text-rose-600" />;
    }
    if (["jpg", "jpeg", "png", "heic", "webp"].includes(clean)) {
      return <ImageIcon className="w-6 h-6 text-purple-600" />;
    }
    if (["zip", "rar", "7z"].includes(clean)) {
      return <Archive className="w-6 h-6 text-amber-500" />;
    }
    return <FileCode className="w-6 h-6 text-slate-600" />;
  };

  const handleExtend = async () => {
    setUpdating(true);
    setShowMenu(false);
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });
      onRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAutoDelete = async () => {
    setUpdating(true);
    setShowMenu(false);
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_auto_delete" }),
      });
      onRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertPdfToDocx = async () => {
    setConvertingDocx(true);
    try {
      const res = await fetch(`/api/files/${file.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pdf_to_docx", mode: docxMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengonversi ke Word");

      setShowDocxModal(false);
      onRefresh();
      // Download directly
      window.location.href = `/api/files/${file.id}/download?variant=docx`;
    } catch (err: any) {
      alert(err.message || "Gagal mengonversi");
    } finally {
      setConvertingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setConvertingPdf(true);
    setConversionError(null);
    try {
      const res = await fetch(`/api/files/${file.id}/download?variant=pdf`);
      if (!res.ok) {
        let msg = "Gagal memproses konversi ke PDF.";
        try {
          const errData = await res.json();
          if (errData?.error) msg = errData.error;
        } catch {
          // keep default message
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = file.display_name.replace(/\.[^/.]+$/, "");
      a.download = `${baseName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onRefresh();
    } catch (err: any) {
      setConversionError(err.message || "Gagal memproses konversi ke PDF.");
    } finally {
      setConvertingPdf(false);
    }
  };

  const isConvertibleToPdf = ["docx", "pptx", "xlsx"].includes(file.ext.toLowerCase());
  const isPdf = file.ext.toLowerCase() === "pdf";

  return (
    <>
      <div className="relative flex flex-col justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition group">
        {/* Top File info */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {getFileIcon(file.ext)}
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition cursor-pointer"
              onClick={() => onPreview(file)}
              title={file.display_name}
            >
              {file.display_name}
            </h4>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{formatBytes(file.size_bytes)}</span>
              <span>•</span>
              <span className="uppercase font-medium text-[10px] tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                {file.ext}
              </span>
            </div>

            {/* Countdown badge */}
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  !file.expires_at
                    ? "bg-slate-100 text-slate-600"
                    : countdown.isUrgent
                    ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                    : countdown.isWarning
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{countdown.text}</span>
              </span>
            </div>
          </div>

          {/* More Actions dropdown button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowReplaceModal(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-800"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ganti File (Update)</span>
                </button>

                {isPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDocxModal(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-blue-600"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Word (.docx)</span>
                  </button>
                )}

                {file.expires_at && (
                  <button
                    type="button"
                    onClick={handleExtend}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-600 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Perpanjang 48 Jam</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleAutoDelete}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{file.expires_at ? "Matikan Hapus Otomatis" : "Aktifkan Hapus 48 Jam"}</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(file.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Lihat & Cetak</span>
          </button>

          <a
            href={`/api/files/${file.id}/download?variant=original`}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Download file asli"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Asli</span>
          </a>

          {isConvertibleToPdf && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={convertingPdf}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition disabled:opacity-50"
              title="Download versi PDF hasil konversi"
            >
              {convertingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </>
              )}
            </button>
          )}

          {isPdf && (
            <button
              type="button"
              onClick={() => setShowDocxModal(true)}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
              title="Download versi Word DOCX"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
          )}
        </div>
      </div>

      {/* Replace File Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setShowReplaceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Ganti File Dokumen</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mengganti isi file <b>{file.display_name}</b> secara atomik. Timer 48 jam akan di-reset dan pratinjau diperbarui.
              </p>
            </div>

            <Dropzone
              replaceFileId={file.id}
              onUploadSuccess={() => {
                setShowReplaceModal(false);
                onRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* PDF to DOCX Modal (PRD Section 7.8) */}
      {showDocxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setShowDocxModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konversi PDF ke Word</h3>
                <p className="text-xs text-slate-500">Pilih mode konversi untuk dokumen Anda:</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label
                onClick={() => setDocxMode("precision")}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  docxMode === "precision"
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    docxMode === "precision" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  }`}
                >
                  {docxMode === "precision" && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-slate-900">Mode Presisi (Rekomendasi Cetak)</span>
                  <span className="text-[11px] text-slate-500">
                    Menjaga posisi gambar, tabel, dan margin agar tidak bergeser saat dicetak di fotokopian.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setDocxMode("editable")}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  docxMode === "editable"
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    docxMode === "editable" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  }`}
                >
                  {docxMode === "editable" && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-slate-900">Mode Editable</span>
                  <span className="text-[11px] text-slate-500">
                    Teks dan paragraf dapat diedit dengan mudah di Microsoft Word.
                  </span>
                </div>
              </label>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              ℹ️ <i>Hasil konversi PDF ke Word bisa sedikit berbeda dari PDF asli jika PDF berasal dari scan dokumen.</i>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConvertPdfToDocx}
                disabled={convertingDocx}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center justify-center gap-1.5"
              >
                {convertingDocx ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengonversi...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Mulai & Unduh Word</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDocxModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Error Modal */}
      {conversionError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setConversionError(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Gagal Mengonversi ke PDF</h3>
                <p className="text-xs text-slate-500">Terjadi kendala saat memproses dokumen</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 leading-relaxed">
              {conversionError}
            </div>

            {conversionError.includes("CONVERTAPI_SECRET") || conversionError.includes("Layanan konversi") ? (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">
                💡 <b>Solusi Admin Vercel:</b> Pastikan Environment Variable <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">CONVERTAPI_SECRET</code> telah diisi di pengaturan proyek Vercel (dapatkan kunci gratis di <a href="https://www.convertapi.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">convertapi.com</a>).
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`/api/files/${file.id}/download?variant=original`}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Asli (.docx)</span>
              </a>
              <button
                type="button"
                onClick={() => setConversionError(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
