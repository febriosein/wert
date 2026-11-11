"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Globe,
  Layers,
  Minimize2,
  RefreshCw,
  Search,
  Scissors,
  PenLine,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  ScanText,
  Stamp,
  Hash,
  EyeOff,
  GitCompare,
  FileCheck,
} from "lucide-react";
import {
  ALL_PDF_TOOLS,
  PdfToolItem,
  PdfToolProvider,
  PdfToolCategory,
} from "@/lib/pdf-tools";

interface PdfToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PdfToolsModal({ isOpen, onClose }: PdfToolsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<"all" | PdfToolProvider>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | PdfToolCategory>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut Escape & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const renderToolIcon = (tool: PdfToolItem) => {
    const id = tool.id.toLowerCase();
    const f = tool.formatFrom.toLowerCase();

    // Specific PDF24 tool icons
    if (id.includes("pisah")) return <Scissors className="w-6 h-6 text-[#F59E0B]" />;
    if (id.includes("edit") || id.includes("sunting")) return <PenLine className="w-6 h-6 text-[#3B82F6]" />;
    if (id.includes("tanda-tangan")) return <PenLine className="w-6 h-6 text-[#6366F1]" />;
    if (id.includes("amankan") || id.includes("lindungi")) return <Lock className="w-6 h-6 text-[#475569]" />;
    if (id.includes("buka-kunci")) return <Unlock className="w-6 h-6 text-[#8B5CF6]" />;
    if (id.includes("putar")) return <RotateCw className="w-6 h-6 text-[#06B6D4]" />;
    if (id.includes("hapus")) return <Trash2 className="w-6 h-6 text-[#EF4444]" />;
    if (id.includes("ekstrak-halaman")) return <FileCheck className="w-6 h-6 text-[#0EA5E9]" />;
    if (id.includes("ocr")) return <ScanText className="w-6 h-6 text-[#3B82F6]" />;
    if (id.includes("watermark") || id.includes("tanda-air")) return <Stamp className="w-6 h-6 text-[#475569]" />;
    if (id.includes("nomor-halaman")) return <Hash className="w-6 h-6 text-[#059669]" />;
    if (id.includes("bandingkan")) return <GitCompare className="w-6 h-6 text-[#F59E0B]" />;
    if (id.includes("hitamkan")) return <EyeOff className="w-6 h-6 text-[#1E293B]" />;

    // General format icons
    if (f.includes("doc") || f === "word") {
      return <FileText className="w-6 h-6 text-[#3B82F6]" />;
    }
    if (f.includes("jpg") || f.includes("image") || f.includes("img")) {
      return <ImageIcon className="w-6 h-6 text-[#F59E0B]" />;
    }
    if (f.includes("ppt")) {
      return <Presentation className="w-6 h-6 text-[#FF9A3D]" />;
    }
    if (f.includes("xls")) {
      return <FileSpreadsheet className="w-6 h-6 text-[#10B981]" />;
    }
    if (f === "html" || f === "url") {
      return <Globe className="w-6 h-6 text-[#EAB308]" />;
    }
    if (f.includes("pdfs") || f === "merge" || id.includes("gabung") || id.includes("superposisi")) {
      return <Layers className="w-6 h-6 text-[#EF4444]" />;
    }
    if (f === "compress" || id.includes("kompres")) {
      return <Minimize2 className="w-6 h-6 text-[#10B981]" />;
    }
    return <FileText className="w-6 h-6" style={{ color: tool.accentColor }} />;
  };

  const filteredTools = useMemo(() => {
    return ALL_PDF_TOOLS.filter((tool) => {
      // Provider filter
      if (providerFilter !== "all" && tool.provider !== providerFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && tool.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          tool.title.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.formatFrom.toLowerCase().includes(q) ||
          tool.formatTo.toLowerCase().includes(q) ||
          tool.provider.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [providerFilter, categoryFilter, searchQuery]);

  const counts = useMemo(() => {
    const iloveCount = ALL_PDF_TOOLS.filter((t) => t.provider === "ilovepdf").length;
    const pdf24Count = ALL_PDF_TOOLS.filter((t) => t.provider === "pdf24").length;
    return {
      total: ALL_PDF_TOOLS.length,
      ilovepdf: iloveCount,
      pdf24: pdf24Count,
    };
  }, []);

  if (!isOpen || !mounted) return null;

  const renderToolCard = (tool: PdfToolItem) => (
    <a
      key={tool.id}
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-white hover:bg-[#F4FBF7] rounded-[22px] border-2 border-[#D5EADF] hover:border-[#087443] p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:bg-white transition-all">
        {renderToolIcon(tool)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-extrabold text-sm sm:text-base text-[#10241B] group-hover:text-[#087443] transition-colors">
              {tool.title}
            </h4>
            {tool.isPopular && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFE45C] text-[#10241B] text-[10px] font-black uppercase tracking-wider border border-[#10241B]/15 shadow-2xs">
                Populer
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#087443] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span className="hidden sm:inline">Buka</span>
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>

        <p className="text-xs text-[#587063] mt-1.5 leading-relaxed">
          {tool.description}
        </p>

        <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-[#D5EADF]/60">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8AA095]">
            <span className={`px-2 py-0.5 rounded-md ${tool.badgeBg} ${tool.badgeText}`}>
              {tool.formatFrom}
            </span>
            <span className="text-sm font-extrabold text-[#587063]">→</span>
            <span className="px-2 py-0.5 rounded-md bg-[#FFEAE7] text-[#B4232E]">
              {tool.formatTo}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              tool.provider === "ilovepdf"
                ? "bg-[#FFEAE7] text-[#D92D3A] border-[#D92D3A]/20"
                : "bg-[#FFF4E5] text-[#D97706] border-[#D97706]/20"
            }`}
          >
            {tool.provider === "ilovepdf" ? "iLovePDF" : "PDF24"}
          </span>
        </div>
      </div>
    </a>
  );

  const modalContent = (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#F4FBF7] text-[#10241B] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR */}
      <header className="h-16 w-full px-4 sm:px-8 border-b border-[#D5EADF] bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] hover:bg-[#E3F8EC] text-xs sm:text-sm font-bold text-[#10241B] hover:text-[#087443] transition cursor-pointer btn-tactile shadow-2xs"
            title="Kembali ke halaman utama Wert"
          >
            <ChevronLeft className="w-4 h-4 text-[#087443]" />
            <span>Kembali ke Wert</span>
          </button>

          <div className="hidden sm:block h-6 w-px bg-[#D5EADF]" />

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E3F8EC] flex items-center justify-center text-[#087443] border border-[#D5EADF]">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold text-base text-[#10241B]">
              Pusat Konversi & Olah Dokumen
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E3F8EC] text-[#087443] text-[10px] font-bold border border-[#D5EADF]">
              iLovePDF + PDF24
            </span>
          </div>
        </div>

        {/* Right: Quick External Links & Close Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://www.ilovepdf.com/id"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4FBF7] border border-[#D5EADF] text-xs font-semibold text-[#587063] hover:text-[#D92D3A] transition"
            title="Kunjungi situs resmi iLovePDF Indonesia"
          >
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>iLovePDF Resmi</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href="https://tools.pdf24.org/id/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4FBF7] border border-[#D5EADF] text-xs font-semibold text-[#587063] hover:text-[#D97706] transition"
            title="Kunjungi situs resmi PDF24 Tools Indonesia"
          >
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>PDF24 Tools Resmi</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[#D5EADF] bg-[#F4FBF7] hover:bg-[#FFEAEC] text-[#587063] hover:text-[#D92D3A] flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup jendela penuh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto w-full scrollbar-thin">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#D5EADF]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] text-xs font-bold border border-[#D5EADF] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alat Bantu Fotokopi, Skripsi & Mahasiswa</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-[#10241B] tracking-tight">
                Pusat Konversi & Olah Dokumen
              </h1>
              <p className="text-sm sm:text-base text-[#587063] mt-2 max-w-2xl leading-relaxed">
                Pilih alat konversi terpercaya dari <b>iLovePDF</b> atau <b>PDF24 Tools</b> untuk merapikan, mengonversi, memberi nomor halaman, atau mengedit berkas tugas sebelum dicetak.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full lg:w-80 relative shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari alat (Word, Split, Nomor, Sensor)..."
                className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-white border-2 border-[#D5EADF] focus:border-[#087443] text-sm text-[#10241B] placeholder-[#8AA095] outline-none shadow-2xs transition"
              />
              <Search className="w-4 h-4 text-[#8AA095] absolute left-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-[#8AA095] hover:text-[#10241B] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Controls Bar: Provider Selector & Category Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
            {/* Segmented Provider Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-white border-2 border-[#D5EADF] shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setProviderFilter("all")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                  providerFilter === "all"
                    ? "bg-[#087443] text-white shadow-xs"
                    : "text-[#587063] hover:text-[#10241B] hover:bg-[#F4FBF7]"
                }`}
              >
                Semua Penyedia ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter("ilovepdf")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  providerFilter === "ilovepdf"
                    ? "bg-[#087443] text-white shadow-xs"
                    : "text-[#587063] hover:text-[#10241B] hover:bg-[#F4FBF7]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                iLovePDF ({counts.ilovepdf})
              </button>
              <button
                type="button"
                onClick={() => setProviderFilter("pdf24")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  providerFilter === "pdf24"
                    ? "bg-[#087443] text-white shadow-xs"
                    : "text-[#587063] hover:text-[#10241B] hover:bg-[#F4FBF7]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                PDF24 Tools ({counts.pdf24})
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-[#10241B] text-white border-[#10241B]"
                    : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#F4FBF7]"
                }`}
              >
                Semua Kategori
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("convert_to")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 cursor-pointer ${
                  categoryFilter === "convert_to"
                    ? "bg-[#087443] text-white border-[#087443]"
                    : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#F4FBF7]"
                }`}
              >
                Ke PDF
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("convert_from")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 cursor-pointer ${
                  categoryFilter === "convert_from"
                    ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                    : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#F4FBF7]"
                }`}
              >
                Dari PDF
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("organize")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 cursor-pointer ${
                  categoryFilter === "organize"
                    ? "bg-[#B45309] text-white border-[#B45309]"
                    : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#F4FBF7]"
                }`}
              >
                Atur & Pisah
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("security_edit")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 cursor-pointer ${
                  categoryFilter === "security_edit"
                    ? "bg-[#6D28D9] text-white border-[#6D28D9]"
                    : "bg-white text-[#587063] border-[#D5EADF] hover:bg-[#F4FBF7]"
                }`}
              >
                Edit & Keamanan
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-[#587063]">
            <span>
              Menampilkan <b>{filteredTools.length}</b> alat{" "}
              {providerFilter !== "all" && `dari ${providerFilter === "ilovepdf" ? "iLovePDF" : "PDF24 Tools"}`}
              {searchQuery && ` untuk pencarian "${searchQuery}"`}
            </span>

            {(searchQuery || providerFilter !== "all" || categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setProviderFilter("all");
                  setCategoryFilter("all");
                }}
                className="text-[#087443] font-bold hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* TOOLS GRID (3 Columns on Large Screens, 2 on Tablet, 1 on Mobile) */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map(renderToolCard)}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-[#D5EADF] flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">🔍</span>
              <h3 className="font-display font-extrabold text-base text-[#10241B]">
                Tidak ada alat yang cocok
              </h3>
              <p className="text-xs text-[#587063] max-w-sm">
                Coba gunakan kata kunci format lain seperti <b>Word</b>, <b>JPG</b>, <b>Split</b>, atau ganti filter penyedia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setProviderFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#087443] text-white font-bold text-xs btn-tactile cursor-pointer"
              >
                Tampilkan Semua Alat
              </button>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D5EADF] shadow-xs flex items-start gap-3.5 text-xs text-[#587063] leading-relaxed">
            <span className="text-xl select-none">💡</span>
            <div>
              <p className="font-bold text-[#10241B] mb-0.5">Petunjuk Alur Konversi & Pencetakan:</p>
              <p>
                1. Klik alat yang kamu butuhkan untuk membukanya di situs resmi <b>iLovePDF</b> atau <b>PDF24 Tools</b>.<br />
                2. Unggah berkas, lakukan konversi/pengeditan, lalu unduh hasilnya ke perangkatmu.<br />
                3. Kembali ke jendela <b className="text-[#087443]">wert.web.id</b> ini untuk langsung mengunggah file hasil siap cetak ke antrean fotokopi.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM FOOTER BAR */}
      <footer className="py-4 px-4 sm:px-8 border-t border-[#D5EADF] bg-white/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#587063] shrink-0">
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap">
          <span className="font-display font-bold text-[#10241B]">wert.web.id</span>
          <span>•</span>
          <span>Didukung oleh</span>
          <a
            href="https://www.ilovepdf.com/id"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#D92D3A] hover:underline inline-flex items-center gap-1"
          >
            iLovePDF
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>&</span>
          <a
            href="https://tools.pdf24.org/id/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#D97706] hover:underline inline-flex items-center gap-1"
          >
            PDF24 Tools
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="hidden md:inline">• 100% Gratis & Layanan Resmi Terpercaya.</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-2 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white font-bold text-xs transition cursor-pointer shadow-sm btn-tactile"
        >
          Selesai / Tutup
        </button>
      </footer>
    </div>
  );

  return createPortal(modalContent, document.body);
}
