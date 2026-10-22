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
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Lihat & Cetak</span>
          </button>

          <a
            href={`/api/files/${file.id}/download`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </a>
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
    </>
  );
}
