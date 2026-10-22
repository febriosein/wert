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
  Pin,
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
  onOptimisticUpdate?: (id: string, partial: Partial<FileItem>) => void;
}

export function FileCard({ file, onPreview, onDelete, onRefresh, onOptimisticUpdate }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  const countdown = formatCountdown(file.expires_at);
  const cleanExt = (file.ext || "").toLowerCase();

  // Color tokens per file type from design.md
  const getFileTypeStyle = (ext: string) => {
    if (ext === "pdf") {
      return {
        bg: "bg-[#FFEAE7]",
        text: "text-[#B4232E]",
        color: "#FF5A4F",
        badgeBg: "bg-[#FFEAE7] text-[#B4232E]",
        icon: <FileText className="w-9 h-9 text-[#FF5A4F]" />,
      };
    }
    if (["docx", "doc"].includes(ext)) {
      return {
        bg: "bg-[#E4EEFF]",
        text: "text-[#1D4ED8]",
        color: "#3B82F6",
        badgeBg: "bg-[#E4EEFF] text-[#1D4ED8]",
        icon: <FileText className="w-9 h-9 text-[#3B82F6]" />,
      };
    }
    if (["png", "jpg", "jpeg", "heic", "webp"].includes(ext)) {
      return {
        bg: "bg-[#EFE9FF]",
        text: "text-[#6D3FD6]",
        color: "#8B5CF6",
        badgeBg: "bg-[#EFE9FF] text-[#6D3FD6]",
        icon: <ImageIcon className="w-9 h-9 text-[#8B5CF6]" />,
      };
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      return {
        bg: "bg-[#E3F8EC]",
        text: "text-[#087443]",
        color: "#19C37D",
        badgeBg: "bg-[#E3F8EC] text-[#087443]",
        icon: <FileSpreadsheet className="w-9 h-9 text-[#19C37D]" />,
      };
    }
    if (["pptx", "ppt"].includes(ext)) {
      return {
        bg: "bg-[#FFEFDD]",
        text: "text-[#A4510A]",
        color: "#FF9A3D",
        badgeBg: "bg-[#FFEFDD] text-[#A4510A]",
        icon: <Presentation className="w-9 h-9 text-[#FF9A3D]" />,
      };
    }
    if (["zip", "rar", "7z"].includes(ext)) {
      return {
        bg: "bg-[#EDF3EF]",
        text: "text-[#3F5448]",
        color: "#8AA095",
        badgeBg: "bg-[#EDF3EF] text-[#3F5448]",
        icon: <Archive className="w-9 h-9 text-[#8AA095]" />,
      };
    }
    return {
      bg: "bg-[#EDF3EF]",
      text: "text-[#3F5448]",
      color: "#8AA095",
      badgeBg: "bg-[#EDF3EF] text-[#3F5448]",
      icon: <FileCode className="w-9 h-9 text-[#8AA095]" />,
    };
  };

  const style = getFileTypeStyle(cleanExt);
  const isUrgent = Boolean(file.expires_at && countdown.isUrgent);

  const handleExtend = async () => {
    setShowMenu(false);
    const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    onOptimisticUpdate?.(file.id, { expires_at: newExpiresAt });
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });
    } catch {
      onRefresh();
    }
  };

  const handleToggleAutoDelete = async () => {
    setShowMenu(false);
    const newExpiresAt = file.expires_at ? null : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    onOptimisticUpdate?.(file.id, { expires_at: newExpiresAt });
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_auto_delete" }),
      });
    } catch {
      onRefresh();
    }
  };

  return (
    <>
      <div className="group relative bg-surface rounded-[20px] overflow-hidden border border-line shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        {/* Critical Expiration Accent: 3px red left bar if < 6 hours */}
        {isUrgent && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-danger z-20"></div>
        )}

        <div>
          {/* Top Panel (112px) Color-Coded by File Type */}
          <div className={`h-28 w-full ${style.bg} relative flex items-center justify-center overflow-hidden`}>
            {/* Center File Icon / Preview Tile */}
            <div className="w-14 h-14 rounded-2xl bg-surface shadow-sm flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              {style.icon}
            </div>

            {/* Menu ⋮ Button (36x36px) */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur-md text-muted hover:text-ink hover:bg-surface flex items-center justify-center shadow-sm transition-all"
                title="Opsi File"
                aria-label="Opsi File"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 z-30 w-52 rounded-2xl bg-surface border border-line shadow-xl py-1.5 text-xs text-ink animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReplaceModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-mint flex items-center gap-2 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ganti File (Update)</span>
                  </button>

                  {file.expires_at && (
                    <button
                      type="button"
                      onClick={handleExtend}
                      className="w-full text-left px-3.5 py-2 hover:bg-mint flex items-center gap-2 text-brand-deep font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Perpanjang 48 Jam</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleAutoDelete}
                    className="w-full text-left px-3.5 py-2 hover:bg-mint flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <span>{file.expires_at ? "Matikan Hapus Otomatis" : "Aktifkan Hapus 48 Jam"}</span>
                  </button>

                  <div className="h-px bg-line my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(file.id);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-danger-soft text-danger font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus File</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Info */}
          <div className="p-5 pb-3 text-left">
            {/* File Name (max 2 lines) */}
            <h3
              onClick={() => onPreview(file)}
              className="font-display font-bold text-base text-ink line-clamp-2 leading-snug group-hover:text-brand-deep transition-colors min-h-[44px] cursor-pointer"
              title={file.display_name}
            >
              {file.display_name}
            </h3>

            {/* Meta row: Badge + Size */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[8px] uppercase tracking-wider ${style.badgeBg}`}>
                {file.ext}
              </span>
              <span className="text-muted text-xs font-medium">
                • {formatBytes(file.size_bytes)}
              </span>
            </div>

            {/* Countdown pill with exact design token colors */}
            <div className="mt-3.5">
              {!file.expires_at ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF3EF] text-muted text-xs font-semibold">
                  <Pin className="w-3.5 h-3.5" />
                  <span>Disimpan terus</span>
                </div>
              ) : countdown.isUrgent ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger-soft text-danger text-xs font-bold border border-danger/30 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{countdown.text}</span>
                </div>
              ) : countdown.isWarning ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hl-soft text-ink text-xs font-semibold border border-hl">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{countdown.text}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-brand-deep text-xs font-semibold border border-line">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{countdown.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Lihat & Cetak + Unduh */}
        <div className="p-5 pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="flex-1 py-2.5 px-4 rounded-[14px] bg-brand-deep hover:bg-[#065b34] text-white font-display text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Lihat & cetak</span>
          </button>

          <a
            href={`/api/files/${file.id}/download`}
            className="w-11 h-11 shrink-0 rounded-[14px] bg-bg hover:bg-mint border border-line text-ink flex items-center justify-center transition-colors cursor-pointer"
            title="Unduh file"
            aria-label="Unduh file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Replace File Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-[28px] bg-surface p-6 sm:p-8 shadow-2xl border border-line flex flex-col gap-4 text-left">
            <button
              type="button"
              onClick={() => setShowReplaceModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-muted hover:text-ink hover:bg-mint transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display text-xl font-bold text-ink">Ganti File Dokumen</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
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
    </>
  );
}
