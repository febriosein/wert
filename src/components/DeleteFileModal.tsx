"use client";

import { useState } from "react";
import {
  X,
  Trash2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Archive,
  FileCode,
  Clock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { FileItem } from "./FileCard";
import { formatBytes, formatCountdown } from "@/lib/utils";

interface DeleteFileModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileId: string) => Promise<void> | void;
}

export function DeleteFileModal({ file, isOpen, onClose, onConfirm }: DeleteFileModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !file) return null;

  const countdown = formatCountdown(file.expires_at);
  const cleanExt = (file.ext || "").toLowerCase();

  const getFileTypeStyle = (ext: string) => {
    if (ext === "pdf") {
      return {
        bg: "bg-[#FFEAE7]",
        text: "text-[#B4232E]",
        icon: <FileText className="w-5 h-5 text-[#FF5A4F]" />,
      };
    }
    if (["docx", "doc"].includes(ext)) {
      return {
        bg: "bg-[#E4EEFF]",
        text: "text-[#1D4ED8]",
        icon: <FileText className="w-5 h-5 text-[#3B82F6]" />,
      };
    }
    if (["png", "jpg", "jpeg", "heic", "webp"].includes(ext)) {
      return {
        bg: "bg-[#EFE9FF]",
        text: "text-[#6D3FD6]",
        icon: <ImageIcon className="w-5 h-5 text-[#8B5CF6]" />,
      };
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      return {
        bg: "bg-[#E3F8EC]",
        text: "text-[#087443]",
        icon: <FileSpreadsheet className="w-5 h-5 text-[#19C37D]" />,
      };
    }
    if (["pptx", "ppt"].includes(ext)) {
      return {
        bg: "bg-[#FFEFDD]",
        text: "text-[#A4510A]",
        icon: <Presentation className="w-5 h-5 text-[#FF9A3D]" />,
      };
    }
    if (["zip", "rar", "7z"].includes(ext)) {
      return {
        bg: "bg-[#EDF3EF]",
        text: "text-[#3F5448]",
        icon: <Archive className="w-5 h-5 text-[#8AA095]" />,
      };
    }
    return {
      bg: "bg-[#EDF3EF]",
      text: "text-[#3F5448]",
      icon: <FileCode className="w-5 h-5 text-[#8AA095]" />,
    };
  };

  const style = getFileTypeStyle(cleanExt);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(file.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10241B]/60 backdrop-blur-md animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={loading ? undefined : onClose} />

      {/* Modal Dialog Container */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deleteModalTitle"
        aria-describedby="deleteModalDesc"
        className="relative w-full max-w-[460px] bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_24px_50px_-12px_rgba(19,27,46,0.25)] border border-[#D5EADF] flex flex-col gap-5 text-left z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Tutup jendela konfirmasi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title Group */}
        <div className="flex items-start gap-4 pr-6">
          {/* Danger Icon Badge 48x48 */}
          <div className="w-12 h-12 rounded-[16px] bg-[#FFEAEC] flex items-center justify-center shrink-0 text-[#D92D3A] shadow-sm border border-[#D92D3A]/20">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D92D3A] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D92D3A]"></span>
              Tindakan Permanen
            </span>
            <h2 id="deleteModalTitle" className="font-display text-[21px] leading-tight font-extrabold text-[#10241B]">
              Hapus file ini permanen?
            </h2>
          </div>
        </div>

        {/* Description / Explanation */}
        <p id="deleteModalDesc" className="text-sm text-[#587063] leading-relaxed">
          File ini akan dihapus dari halaman tugasmu dan <span className="font-semibold text-[#10241B]">tidak bisa dikembalikan lagi</span>. Siapa pun yang mengakses tautan atau kios ini tidak akan bisa melihat atau mencetaknya lagi.
        </p>

        {/* Target File Summary Snippet */}
        <div className="bg-[#F4FBF7] border border-[#D5EADF] rounded-[16px] p-3.5 flex items-center gap-3">
          {/* File Icon Badge */}
          <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
            {style.icon}
          </div>

          {/* File Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <p className="font-bold text-sm text-[#10241B] truncate" title={file.display_name}>
              {file.display_name}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#587063] mt-0.5">
              <span>{formatBytes(file.size_bytes)}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-white border border-[#D5EADF] text-[#10241B]">
                {file.ext}
              </span>
              {file.expires_at ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#D92D3A] font-medium text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{countdown.text}</span>
                  </span>
                </>
              ) : (
                <>
                  <span>•</span>
                  <span className="text-[#587063] font-medium text-xs">Disimpan terus</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice Note */}
        <div className="flex items-center gap-2 px-1 text-xs text-[#587063]">
          <ShieldCheck className="w-4 h-4 text-[#087443] shrink-0" />
          <span>Riwayat pencetakan akan otomatis dibersihkan dari server.</span>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-1">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-1/2 h-[46px] rounded-[14px] bg-white hover:bg-[#F4FBF7] text-[#10241B] border border-[#D5EADF] text-sm font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          {/* Delete Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-1/2 h-[46px] rounded-[14px] bg-[#D92D3A] hover:bg-[#b81f2a] text-white text-sm font-bold shadow-md shadow-[#D92D3A]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
