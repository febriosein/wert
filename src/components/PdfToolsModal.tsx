"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  CONVERT_TO_PDF_TOOLS,
  CONVERT_FROM_PDF_TOOLS,
  EXTRA_PDF_TOOLS,
  PdfToolItem,
} from "@/lib/pdf-tools";

interface PdfToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PdfToolsModal({ isOpen, onClose }: PdfToolsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<"all" | "to_pdf" | "from_pdf" | "extra">("all");

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

  if (!isOpen || !mounted) return null;

  const renderToolIcon = (format: string, color: string) => {
    const f = format.toLowerCase();
    if (f.includes("doc") || f === "word") {
      return <FileText className="w-6 h-6 text-[#3B82F6]" />;
    }
    if (f.includes("jpg") || f.includes("image")) {
      return <ImageIcon className="w-6 h-6 text-[#F59E0B]" />;
    }
    if (f.includes("ppt")) {
      return <Presentation className="w-6 h-6 text-[#FF9A3D]" />;
    }
    if (f.includes("xls")) {
      return <FileSpreadsheet className="w-6 h-6 text-[#10B981]" />;
    }
    if (f === "html") {
      return <Globe className="w-6 h-6 text-[#EAB308]" />;
    }
    if (f.includes("pdfs") || f === "merge") {
      return <Layers className="w-6 h-6 text-[#EF4444]" />;
    }
    if (f === "compress") {
      return <Minimize2 className="w-6 h-6 text-[#10B981]" />;
    }
    return <FileText className="w-6 h-6" style={{ color }} />;
  };

  const matchesSearch = (tool: PdfToolItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      tool.title.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.formatFrom.toLowerCase().includes(q) ||
      tool.formatTo.toLowerCase().includes(q)
    );
  };

  const renderToolCard = (tool: PdfToolItem) => (
    <a
      key={tool.id}
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-white hover:bg-[#F4FBF7] rounded-[22px] border-2 border-[#D5EADF] hover:border-[#087443] p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:bg-white transition-all">
        {renderToolIcon(tool.formatFrom, tool.accentColor)}
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

        <div className="flex items-center gap-1.5 mt-3 text-xs font-mono font-bold text-[#8AA095]">
          <span className={`px-2 py-0.5 rounded-md ${tool.badgeBg} ${tool.badgeText}`}>
            {tool.formatFrom}
          </span>
          <span className="text-sm font-extrabold text-[#587063]">→</span>
          <span className="px-2 py-0.5 rounded-md bg-[#FFEAE7] text-[#B4232E]">
            {tool.formatTo}
          </span>
        </div>
      </div>
    </a>
  );

  const filteredToPdf = CONVERT_TO_PDF_TOOLS.filter(matchesSearch);
  const filteredFromPdf = CONVERT_FROM_PDF_TOOLS.filter(matchesSearch);
  const filteredExtra = EXTRA_PDF_TOOLS.filter(matchesSearch);

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
              Pusat Konversi Dokumen
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E3F8EC] text-[#087443] text-[10px] font-bold border border-[#D5EADF]">
              via iLovePDF
            </span>
          </div>
        </div>

        {/* Right: Close Button & Attribution Pill */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.ilovepdf.com/id"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4FBF7] border border-[#D5EADF] text-xs font-semibold text-[#587063] hover:text-[#087443] transition"
          >
            <span>iLovePDF Resmi</span>
            <ExternalLink className="w-3.5 h-3.5" />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#D5EADF]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] text-xs font-bold border border-[#D5EADF] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alat Bantu Fotokopi & Mahasiswa</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-[#10241B] tracking-tight">
                Pusat Konversi Format Dokumen
              </h1>
              <p className="text-sm sm:text-base text-[#587063] mt-2 max-w-2xl leading-relaxed">
                Ubah format dokumen tugasmu sebelum dicetak. Cegah format Word berantakan dengan mengubahnya ke PDF, atau gabungkan foto tugas jadi 1 berkas rapi.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari format (mis: Word, JPG)..."
                className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-white border-2 border-[#D5EADF] focus:border-[#087443] text-sm text-[#10241B] placeholder-[#8AA095] outline-none shadow-2xs transition"
              />
              <Search className="w-4 h-4 text-[#8AA095] absolute left-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-[#8AA095] hover:text-[#10241B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Tab Filter (Optional on smaller devices) */}
          <div className="grid grid-cols-4 md:hidden p-1 rounded-xl bg-white border border-[#D5EADF] gap-1 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileTab("all")}
              className={`py-2 rounded-lg transition ${
                mobileTab === "all" ? "bg-[#087443] text-white shadow-xs" : "text-[#587063]"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("to_pdf")}
              className={`py-2 rounded-lg transition ${
                mobileTab === "to_pdf" ? "bg-[#087443] text-white shadow-xs" : "text-[#587063]"
              }`}
            >
              Ke PDF
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("from_pdf")}
              className={`py-2 rounded-lg transition ${
                mobileTab === "from_pdf" ? "bg-[#087443] text-white shadow-xs" : "text-[#587063]"
              }`}
            >
              Dari PDF
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("extra")}
              className={`py-2 rounded-lg transition ${
                mobileTab === "extra" ? "bg-[#087443] text-white shadow-xs" : "text-[#587063]"
              }`}
            >
              Lainnya
            </button>
          </div>

          {/* TWO-COLUMN GRID: CONVERT TO PDF & CONVERT FROM PDF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* COLUMN 1: CONVERT TO PDF */}
            {(mobileTab === "all" || mobileTab === "to_pdf") && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#087443]/30">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#087443]"></span>
                    <h3 className="font-display font-extrabold text-base sm:text-lg text-[#10241B] uppercase tracking-wide">
                      Convert to PDF
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E3F8EC] text-[#087443] border border-[#D5EADF]">
                    {filteredToPdf.length} Alat
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredToPdf.length > 0 ? (
                    filteredToPdf.map(renderToolCard)
                  ) : (
                    <div className="p-6 text-center text-xs text-[#587063] bg-white rounded-2xl border border-[#D5EADF]">
                      Tidak ada alat konversi yang sesuai kata kunci.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COLUMN 2: CONVERT FROM PDF */}
            {(mobileTab === "all" || mobileTab === "from_pdf") && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#1D4ED8]/30">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1D4ED8]"></span>
                    <h3 className="font-display font-extrabold text-base sm:text-lg text-[#10241B] uppercase tracking-wide">
                      Convert from PDF
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E4EEFF] text-[#1D4ED8] border border-[#D5EADF]">
                    {filteredFromPdf.length} Alat
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredFromPdf.length > 0 ? (
                    filteredFromPdf.map(renderToolCard)
                  ) : (
                    <div className="p-6 text-center text-xs text-[#587063] bg-white rounded-2xl border border-[#D5EADF]">
                      Tidak ada alat konversi yang sesuai kata kunci.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* EXTRA POPULAR TOOLS: GABUNGKAN & KOMPRES PDF */}
          {(mobileTab === "all" || mobileTab === "extra") && (
            <div className="flex flex-col gap-4 pt-4 border-t border-[#D5EADF]">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5A4F]"></span>
                  <h3 className="font-display font-extrabold text-base sm:text-lg text-[#10241B] uppercase tracking-wide">
                    Alat PDF Populer Tambahan
                  </h3>
                </div>
                <span className="text-xs text-[#587063]">Sangat sering dibutuhkan mahasiswa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredExtra.map(renderToolCard)}
              </div>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D5EADF] shadow-xs flex items-start gap-3.5 text-xs text-[#587063] leading-relaxed">
            <span className="text-xl select-none">💡</span>
            <div>
              <p className="font-bold text-[#10241B] mb-0.5">Petunjuk Konversi & Pencetakan Tugas:</p>
              <p>
                Setelah file berhasil dikonversi di situs iLovePDF, unduh file PDF hasil konversi ke perangkatmu, lalu buka kembali halaman <b className="text-[#087443]">wert.web.id</b> untuk langsung mengunggahnya ke antrean cetak fotokopi.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM FOOTER BAR */}
      <footer className="py-4 px-4 sm:px-8 border-t border-[#D5EADF] bg-white/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#587063] shrink-0">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="font-display font-bold text-[#10241B]">wert.web.id</span>
          <span>•</span>
          <span>Didukung oleh</span>
          <a
            href="https://www.ilovepdf.com/id"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#087443] hover:underline inline-flex items-center gap-1"
          >
            iLovePDF.com
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="hidden md:inline">• Layanan konversi berkas resmi terpercaya.</span>
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
