"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Dropzone } from "@/components/Dropzone";
import { FileCard, FileItem } from "@/components/FileCard";
import { QrModal, getCachedQrSession, setCachedQrSession } from "@/components/QrModal";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { DeleteFileModal } from "@/components/DeleteFileModal";
import {
  Plus,
  QrCode,
  RefreshCw,
  Files,
  HardDrive,
  Smartphone,
  AlertCircle,
  ArrowUpRight,
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Trash2,
  Download,
  Printer,
  UploadCloud,
  X,
  Clock,
  FileText,
  Check,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Global in-memory cache per username to ensure 0ms instantaneous navigation
const filesCache: Record<string, { files: FileItem[]; timestamp: number }> = {};
const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_COUNT = 20;

export default function UserDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username.toLowerCase();

  const cachedData = filesCache[username];
  const [files, setFiles] = useState<FileItem[]>(() => cachedData?.files || []);
  const [loading, setLoading] = useState(() => !cachedData);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);

  // Desktop empty state QR token
  const initialQr = getCachedQrSession();
  const [desktopQrDataUrl, setDesktopQrDataUrl] = useState<string | null>(initialQr?.qrDataUrl || null);
  const [desktopQrLoading, setDesktopQrLoading] = useState(false);

  // Fase 2: Toolbar, Search, Filter, Multi-select, and Drag states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "pdf" | "doc" | "image" | "urgent">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // File Deletion via Custom Confirmation Modal
  const handleRequestDelete = (file: FileItem) => {
    setFileToDelete(file);
  };

  const handleConfirmDelete = async (id: string) => {
    const previous = files;
    const nextFiles = files.filter((f) => f.id !== id);

    // 0ms instant UI update
    setFiles(nextFiles);
    if (filesCache[username]) {
      filesCache[username].files = nextFiles;
    }
    setFileToDelete(null);

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

  // Category counts
  const counts = {
    all: files.length,
    pdf: files.filter((f) => (f.ext || "").toLowerCase() === "pdf").length,
    doc: files.filter((f) => ["docx", "doc"].includes((f.ext || "").toLowerCase())).length,
    image: files.filter((f) => ["png", "jpg", "jpeg", "webp", "gif"].includes((f.ext || "").toLowerCase())).length,
    urgent: files.filter((f) => {
      if (!f.expires_at) return false;
      const rem = new Date(f.expires_at).getTime() - Date.now();
      return rem > 0 && rem < 6 * 60 * 60 * 1000;
    }).length,
  };

  const filteredFiles = files.filter((file) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = file.display_name.toLowerCase().includes(q);
      const matchExt = (file.ext || "").toLowerCase().includes(q);
      if (!matchName && !matchExt) return false;
    }

    // 2. Category
    const cleanExt = (file.ext || "").toLowerCase();
    if (categoryFilter === "pdf") return cleanExt === "pdf";
    if (categoryFilter === "doc") return ["docx", "doc"].includes(cleanExt);
    if (categoryFilter === "image") return ["png", "jpg", "jpeg", "webp", "gif"].includes(cleanExt);
    if (categoryFilter === "urgent") {
      if (!file.expires_at) return false;
      const rem = new Date(file.expires_at).getTime() - Date.now();
      return rem > 0 && rem < 6 * 60 * 60 * 1000;
    }
    return true;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map((f) => f.id));
    }
  };

  const handleBatchDownload = () => {
    selectedIds.forEach((id, idx) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/api/files/${id}/download`;
        link.setAttribute("download", "");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  const handleBatchPrint = () => {
    const first = files.find((f) => f.id === selectedIds[0]);
    if (first) {
      setSelectedFile(first);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} file yang dipilih secara permanen?`)) return;

    const previous = files;
    const toDeleteSet = new Set(selectedIds);
    const nextFiles = files.filter((f) => !toDeleteSet.has(f.id));

    setFiles(nextFiles);
    if (filesCache[username]) filesCache[username].files = nextFiles;
    setSelectedIds([]);

    try {
      await Promise.all(
        Array.from(toDeleteSet).map((id) =>
          fetch(`/api/files/${id}`, { method: "DELETE" })
        )
      );
    } catch {
      setFiles(previous);
      if (filesCache[username]) filesCache[username].files = previous;
      alert("Gagal menghapus beberapa file di server.");
    }
  };

  useEffect(() => {
    // 1. Keyboard shortcut '/' focuses search
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && selectedIds.length > 0) {
        setSelectedIds([]);
      }
    };

    // 2. Clipboard Paste ('Ctrl + V') directly uploads screenshots
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const pasted = Array.from(e.clipboardData.files);
        setPendingUploadFiles(pasted);
        setShowAddFile(true);
      }
    };

    // 3. Global Drag Enter
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        setIsGlobalDragging(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("dragenter", handleDragEnter);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("dragenter", handleDragEnter);
    };
  }, [selectedIds.length]);

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setPendingUploadFiles(dropped);
      setShowAddFile(true);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const storagePercent = Math.min(100, Math.max(1, (totalSize / MAX_STORAGE_BYTES) * 100));
  const isStorageWarning = storagePercent >= 80;
  const isStorageCritical = storagePercent >= 95;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-[#10241B] overflow-x-hidden selection:bg-[#E3F8EC] selection:text-[#087443]">
      <Navbar username={username} />

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          /* Sleek Skeleton Loading */
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-[#D5EADF] rounded-xl" />
                <div className="h-4 w-64 bg-[#D5EADF]/60 rounded-lg" />
              </div>
              <div className="h-12 w-36 bg-[#D5EADF] rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white border border-[#D5EADF] rounded-[20px] p-4 flex flex-col justify-between">
                  <div className="h-28 bg-[#D5EADF]/50 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-[#D5EADF] rounded" />
                    <div className="h-3 w-1/3 bg-[#D5EADF]/60 rounded" />
                  </div>
                  <div className="h-10 bg-[#D5EADF]/40 rounded-xl" />
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
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#10241B] tracking-tight">
                  File tugasmu
                </h1>
                <p className="text-sm text-[#587063] mt-1">
                  <span className="hidden lg:inline">Belum ada file. Tarik file ke sini, atau scan QR dari HP.</span>
                  <span className="lg:hidden">Belum ada file. Ketuk &apos;Tambah file&apos; untuk mulai mengunggah.</span>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="hidden lg:flex px-4 py-2.5 rounded-[14px] bg-white border border-[#D5EADF] text-[#10241B] font-semibold text-xs sm:text-sm hover:bg-[#E3F8EC] transition items-center gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#087443]" />
                  <span>Upload dari HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddFile(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[14px] bg-[#087443] text-white font-display font-bold text-sm border-2 border-[#10241B] shadow-sticker hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-6 rounded-[24px] bg-white border border-[#D5EADF] shadow-soft text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center mb-2 shadow-sm border border-[#D5EADF]">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-[#10241B] text-lg">Upload dari Smartphone</h3>
                  <p className="text-xs text-[#587063] mt-1 max-w-xs">
                    Buka kamera HP Anda, scan QR ini untuk upload langsung tanpa perlu login.
                  </p>

                  <div className="relative w-52 h-52 border-2 border-[#10241B] rounded-2xl p-2 bg-white flex items-center justify-center shadow-sticker my-5 overflow-hidden">
                    {desktopQrLoading && !desktopQrDataUrl ? (
                      <div className="w-full h-full bg-[#F4FBF7] rounded-xl animate-pulse flex flex-col items-center justify-center gap-2 text-[#587063]">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#087443]" />
                        <span className="text-xs">Membuat QR...</span>
                      </div>
                    ) : desktopQrDataUrl ? (
                      <img
                        src={desktopQrDataUrl}
                        alt="QR Code upload HP"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-xs text-[#587063]">Gagal memuat QR</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#587063] pt-3 border-t border-[#D5EADF]">
                  <span>Otomatis tampil di layar ini</span>
                  <button
                    type="button"
                    onClick={() => loadDesktopQr(true)}
                    className="inline-flex items-center gap-1 font-bold text-[#087443] hover:underline transition cursor-pointer"
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
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#10241B] tracking-tight">
                  File tugasmu
                </h1>
                {/* Meta Summary + Progress Meter */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-sm text-[#587063]">
                    <span className="font-semibold text-[#10241B]">{files.length} file</span>
                    <span>·</span>
                    <span>{formatBytes(totalSize)} dari 100 MB</span>
                    {isStorageWarning && (
                      <Link
                        href={`/${username}/settings`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-[#FFF4B8] px-2 py-0.5 rounded-full border border-[#FFE45C] ml-2 hover:underline"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Atur penyimpanan</span>
                      </Link>
                    )}
                  </div>
                  {/* Thin Progress Meter (height 6px, radius 999) */}
                  <div className="w-48 sm:w-64 h-1.5 rounded-full bg-[#D5EADF] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isStorageCritical ? "bg-[#D92D3A]" : isStorageWarning ? "bg-[#FFE45C]" : "bg-[#19C37D]"
                      }`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tambah File (Sticker Style) */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="hidden lg:flex px-4 py-3 rounded-[16px] bg-white border border-[#D5EADF] text-[#10241B] font-semibold text-xs sm:text-sm hover:bg-[#E3F8EC] transition items-center gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#087443]" />
                  <span>Upload dari HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddFile(!showAddFile)}
                  className="w-full sm:w-auto px-5 py-3 rounded-[16px] bg-[#087443] text-white font-display font-bold text-sm border-2 border-[#10241B] shadow-sticker hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah file</span>
                </button>
              </div>
            </div>

            {/* Collapsible Dropzone */}
            {showAddFile && (
              <div className="p-4 sm:p-6 rounded-[24px] bg-white border border-[#D5EADF] shadow-soft animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-base text-[#10241B]">Upload Dokumen Baru</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFile(false);
                      setPendingUploadFiles([]);
                    }}
                    className="p-1 rounded-lg text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Dropzone
                  initialFiles={pendingUploadFiles}
                  onUploadSuccess={() => {
                    loadFiles(true);
                    setShowAddFile(false);
                    setPendingUploadFiles([]);
                  }}
                />
              </div>
            )}

            {/* FASE 2: INTERACTIVE FILTER & SEARCH TOOLBAR */}
            <div className="flex flex-col gap-3.5 bg-white p-3.5 sm:p-4 rounded-[22px] border border-[#D5EADF] shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* 1. Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
                  {[
                    { id: "all", label: "Semua", count: counts.all },
                    { id: "pdf", label: "PDF", count: counts.pdf },
                    { id: "doc", label: "Word", count: counts.doc },
                    { id: "image", label: "Foto", count: counts.image },
                    { id: "urgent", label: "Mendesak", count: counts.urgent },
                  ].map((chip) => {
                    const isActive = categoryFilter === chip.id;
                    const isUrgentChip = chip.id === "urgent" && chip.count > 0;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setCategoryFilter(chip.id as any)}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? "bg-[#087443] text-white shadow-xs"
                            : isUrgentChip
                            ? "bg-[#FFEAEC] text-[#D92D3A] border border-[#D92D3A]/30 hover:bg-[#FFEAEC]/80"
                            : "bg-[#F4FBF7] text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] border border-[#D5EADF]"
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? "bg-white/25 text-white"
                              : isUrgentChip
                              ? "bg-[#D92D3A] text-white"
                              : "bg-[#D5EADF] text-[#10241B]"
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Search & View Mode Controls */}
                <div className="flex items-center gap-2">
                  {/* Search Bar with Shortcut hint */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-[#587063] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari file..."
                      className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] text-xs text-[#10241B] placeholder-[#587063] focus:outline-none focus:ring-2 focus:ring-[#19C37D]/30 focus:border-[#087443] transition"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#587063] hover:text-[#10241B]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#587063] bg-white border border-[#D5EADF] rounded px-1.5 py-0.2 font-mono">
                        /
                      </kbd>
                    )}
                  </div>

                  {/* View Mode Toggle (Grid vs List) */}
                  <div className="flex items-center bg-[#F4FBF7] border border-[#D5EADF] rounded-xl p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-white text-[#087443] shadow-2xs font-bold"
                          : "text-[#587063] hover:text-[#10241B]"
                      }`}
                      title="Tampilan Grid"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-white text-[#087443] shadow-2xs font-bold"
                          : "text-[#587063] hover:text-[#10241B]"
                      }`}
                      title="Tampilan List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Select All Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedIds.length === filteredFiles.length && filteredFiles.length > 0
                        ? "bg-[#087443] text-white border-[#087443]"
                        : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#E3F8EC] hover:text-[#10241B]"
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {selectedIds.length === filteredFiles.length && filteredFiles.length > 0
                        ? "Batal Semua"
                        : "Pilih Semua"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* EMPTY SEARCH / FILTER STATE */}
            {filteredFiles.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-[#D5EADF] p-10 text-center flex flex-col items-center justify-center gap-2 animate-in fade-in">
                <Search className="w-10 h-10 text-[#587063]/50 mb-1" />
                <h3 className="font-display font-bold text-base text-[#10241B]">Tidak Ada File yang Cocok</h3>
                <p className="text-xs text-[#587063] max-w-sm">
                  Tidak ditemukan file untuk kategori ini atau pencarian &quot;{searchQuery}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#E3F8EC] text-[#087443] font-bold text-xs hover:bg-[#D5EADF] transition cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* 3-COLUMN RESPONSIVE GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={(f) => setSelectedFile(f)}
                    onDelete={handleRequestDelete}
                    onRefresh={() => loadFiles(true)}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    isSelected={selectedIds.includes(file.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT LIST VIEW */
              <div className="flex flex-col gap-2.5">
                {filteredFiles.map((file) => {
                  const isSelected = selectedIds.includes(file.id);
                  const cleanExt = (file.ext || "").toLowerCase();
                  return (
                    <div
                      key={file.id}
                      className={`group bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex items-center justify-between gap-3 shadow-xs hover:shadow-sm ${
                        isSelected
                          ? "border-[#087443] ring-2 ring-[#087443]/20 bg-[#E3F8EC]/20"
                          : "border-[#D5EADF] hover:border-[#19C37D]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Row Selection Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(file.id)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? "bg-[#087443] text-white"
                              : "border border-[#D5EADF] bg-white text-transparent hover:border-[#587063]"
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? "text-white" : "opacity-0"}`} />
                        </button>

                        {/* File Mini Thumbnail / Icon */}
                        <div
                          onClick={() => setSelectedFile(file)}
                          className="w-10 h-10 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                        >
                          {["png", "jpg", "jpeg", "webp"].includes(cleanExt) ? (
                            <img
                              src={`/api/files/${file.id}/preview`}
                              alt={file.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : cleanExt === "pdf" ? (
                            <span className="text-[10px] font-extrabold text-[#B4232E] bg-[#FFEAE7] px-1.5 py-0.5 rounded">
                              PDF
                            </span>
                          ) : (
                            <FileText className="w-5 h-5 text-[#087443]" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0">
                          <h4
                            onClick={() => setSelectedFile(file)}
                            className="font-display font-bold text-sm text-[#10241B] truncate max-w-[130px] sm:max-w-xs md:max-w-md hover:text-[#087443] cursor-pointer"
                            title={file.display_name}
                          >
                            {file.display_name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#587063] mt-0.5">
                            <span className="uppercase font-semibold">{file.ext}</span>
                            <span>•</span>
                            <span>{formatBytes(file.size_bytes)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Row Action Buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedFile(file)}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white text-xs font-bold btn-tactile cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Lihat & cetak</span>
                        </button>
                        <a
                          href={`/api/files/${file.id}/download`}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#F4FBF7] hover:bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B] flex items-center justify-center transition cursor-pointer"
                          title="Unduh"
                        >
                          <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(file)}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-[#FFEAEC] text-[#587063] hover:text-[#D92D3A] border border-[#D5EADF] flex items-center justify-center transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING MULTI-SELECT BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#10241B] text-white px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-[24px] shadow-2xl border-2 border-white/20 flex items-center justify-between sm:justify-center gap-2.5 sm:gap-5 w-[calc(100vw-24px)] sm:w-auto max-w-[460px] animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center gap-2 border-r border-white/20 pr-3 sm:pr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#19C37D] animate-ping" />
            <span className="font-display font-bold text-xs sm:text-sm whitespace-nowrap">
              {selectedIds.length} file dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchPrint}
              className="px-3.5 py-1.5 rounded-xl bg-[#19C37D] hover:bg-[#15a86a] text-[#10241B] font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Cetak file antrean"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDownload}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh semua file yang dipilih"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-xl bg-[#D92D3A]/80 hover:bg-[#D92D3A] text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Hapus file terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/70 hover:text-white transition ml-1"
              title="Batal pilih"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN DRAG & DROP OVERLAY */}
      {isGlobalDragging && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsGlobalDragging(false)}
          onDrop={handleGlobalDrop}
          className="fixed inset-0 z-50 bg-[#E3F8EC]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-[#087443] animate-in fade-in"
        >
          <div className="bg-white p-8 rounded-[32px] border-2 border-[#10241B] shadow-sticker-lg flex flex-col items-center text-center max-w-md animate-bounce">
            <UploadCloud className="w-16 h-16 text-[#087443] mb-4" />
            <h2 className="font-display font-extrabold text-2xl text-[#10241B]">Lepas File di Sini</h2>
            <p className="text-sm text-[#587063] mt-2 leading-relaxed">
              File tugasmu akan langsung ditambahkan ke antrean cetak tanpa login.
            </p>
          </div>
        </div>
      )}

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

      <DeleteFileModal
        file={fileToDelete}
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
