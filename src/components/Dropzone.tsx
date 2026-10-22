"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { validateMagicBytes } from "@/lib/storage/validator";

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "validating" | "uploading" | "done" | "error";
  error?: string;
  abortController?: AbortController;
}

interface DropzoneProps {
  onUploadSuccess: () => void;
  token?: string; // Optional token if uploading via mobile /u/[token]
  replaceFileId?: string; // Optional file ID if in replacement mode
}

export function Dropzone({ onUploadSuccess, token, replaceFileId }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const newItems: UploadingFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: "validating",
      abortController: new AbortController(),
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Start upload queue
    newItems.forEach((item) => uploadSingleFile(item));
  };

  const uploadSingleFile = async (item: UploadingFile) => {
    const ext = item.file.name.split(".").pop()?.toLowerCase() || "";

    // 1. Client-side magic bytes validation
    try {
      const slice = item.file.slice(0, 64);
      const arrayBuffer = await slice.arrayBuffer();
      const validation = validateMagicBytes(new Uint8Array(arrayBuffer), ext);

      if (!validation.valid) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: validation.reason || "Format file tidak valid." }
              : i
          )
        );
        return;
      }
    } catch {
      // Continue if slice is not supported
    }

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 15 } : i))
    );

    // 2. If in replacement mode
    if (replaceFileId) {
      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const res = await fetch(`/api/files/${replaceFileId}/replace`, {
          method: "PUT",
          body: formData,
          signal: item.abortController?.signal,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengganti file");

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 100, status: "done" } : i))
        );
        onUploadSuccess();
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: err.message } : i))
        );
      }
      return;
    }

    // 3. Direct upload via Signed Upload URL (or mobile QR token upload)
    try {
      if (token) {
        // Mobile QR token route
        const formData = new FormData();
        formData.append("file", item.file);

        const res = await fetch(`/api/u/${token}/upload`, {
          method: "POST",
          body: formData,
          signal: item.abortController?.signal,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengunggah file");

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 100, status: "done" } : i))
        );
        onUploadSuccess();
      } else {
        // Direct Signed URL route for zero Vercel payload limit issues
        // Step A: Init signed URL
        const initRes = await fetch("/api/files/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: item.file.name,
            fileSize: item.file.size,
            ext,
            mime: item.file.type,
          }),
          signal: item.abortController?.signal,
        });

        const initData = await initRes.json();
        if (!initRes.ok) throw new Error(initData.error || "Gagal inisialisasi upload");

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 45 } : i))
        );

        // Step B: Upload binary using standard XMLHttpRequest for real progress tracking
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", initData.signedUrl);
          xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round(45 + (e.loaded / e.total) * 45); // 45% -> 90%
              setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Storage error (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("Koneksi internet terputus saat upload."));
          xhr.onabort = () => reject(new Error("Upload dibatalkan"));

          if (item.abortController) {
            item.abortController.signal.addEventListener("abort", () => xhr.abort());
          }

          xhr.send(item.file);
        });

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 95 } : i))
        );

        // Step C: Complete registration in DB
        const completeRes = await fetch("/api/files/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: initData.fileId,
            storageKey: initData.storageKey,
            fileName: item.file.name,
            size: item.file.size,
            ext,
            mime: item.file.type,
          }),
        });

        const completeData = await completeRes.json();
        if (!completeRes.ok) throw new Error(completeData.error || "Gagal menyimpan data file");

        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: 100, status: "done" } : i))
        );
        onUploadSuccess();
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "Upload dibatalkan") {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: err.message } : i))
      );
    }
  };

  const handleCancel = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.abortController) {
      item.abortController.abort();
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRetry = (item: UploadingFile) => {
    const retryItem: UploadingFile = {
      ...item,
      status: "validating",
      progress: 0,
      error: undefined,
      abortController: new AbortController(),
    };
    setItems((prev) => prev.map((i) => (i.id === item.id ? retryItem : i)));
    uploadSingleFile(retryItem);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-[24px] p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? "border-brand-deep bg-mint/90 scale-[1.01]"
            : "border-line hover:border-brand-deep/50 bg-surface hover:bg-mint/20 shadow-soft"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={!replaceFileId}
          accept=".docx,.pdf,.xlsx,.pptx,.jpg,.jpeg,.png,.heic,.zip"
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          capture="environment"
          accept="image/*"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center text-brand-deep mb-1 border border-line shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-display font-bold text-ink text-lg sm:text-xl">
            {replaceFileId ? "Pilih file pengganti" : "Tarik file tugas ke sini atau klik untuk memilih"}
          </h3>
          <p className="text-muted text-xs sm:text-sm mt-1">
            Word (.docx), PDF (.pdf), Excel (.xlsx), PPTX, Foto (JPG, PNG, HEIC), ZIP (Maks. 50 MB)
          </p>
        </div>

        {/* Buttons for touch / mobile */}
        <div
          className="flex flex-wrap items-center justify-center gap-2.5 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold bg-brand-deep hover:bg-[#065b34] text-white shadow-sm transition cursor-pointer"
          >
            Pilih File
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-surface hover:bg-mint text-ink border border-line shadow-sm transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-brand-deep" />
            <span>Ambil Foto</span>
          </button>
        </div>
      </div>

      {/* Progress queue list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col p-3 rounded-2xl border border-slate-200 bg-white shadow-sm text-xs sm:text-sm gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-[70%]">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                  <span className="text-slate-400 text-xs shrink-0">({formatBytes(item.size)})</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "uploading" && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold text-xs">{item.progress}%</span>
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title="Batalkan upload"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {item.status === "done" && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai</span>
                    </span>
                  )}

                  {item.status === "error" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRetry(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        title="Coba upload ulang"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ulangi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {item.status === "uploading" && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === "error" && (
                <span className="text-rose-600 text-xs font-medium">{item.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
