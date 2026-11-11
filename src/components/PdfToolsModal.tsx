"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Globe,
  Layers,
  Minimize2,
  RefreshCw,
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
  const [mobileTab, setMobileTab] = useState<"to_pdf" | "from_pdf" | "extra">("to_pdf");

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
      return <FileText className="w-5 h-5 text-[#3B82F6]" />;
    }
    if (f.includes("jpg") || f.includes("image")) {
      return <ImageIcon className="w-5 h-5 text-[#F59E0B]" />;
    }
    if (f.includes("ppt")) {
      return <Presentation className="w-5 h-5 text-[#FF9A3D]" />;
    }
    if (f.includes("xls")) {
      return <FileSpreadsheet className="w-5 h-5 text-[#10B981]" />;
    }
    if (f === "html") {
      return <Globe className="w-5 h-5 text-[#EAB308]" />;
    }
    if (f.includes("pdfs") || f === "merge") {
      return <Layers className="w-5 h-5 text-[#EF4444]" />;
    }
    if (f === "compress") {
      return <Minimize2 className="w-5 h-5 text-[#10B981]" />;
    }
    return <FileText className="w-5 h-5" style={{ color }} />;
  };

  const renderToolCard = (tool: PdfToolItem) => (
    <a
      key={tool.id}
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-[#F4FBF7]/80 hover:bg-white rounded-2xl border border-[#D5EADF] hover:border-[#087443] p-3 sm:p-3.5 flex items-start gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs"
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#D5EADF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
        {renderToolIcon(tool.formatFrom, tool.accentColor)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-display font-extrabold text-xs sm:text-sm text-[#10241B] group-hover:text-[#087443] transition-colors">
              {tool.title}
            </h4>
            {tool.isPopular && (
              <span className="px-1.5 py-0.2 rounded-md bg-[#FFE45C] text-[#10241B] text-[9px] font-black uppercase tracking-wider border border-[#10241B]/10">
                Populer
              </span>
            )}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#8AA095] group-hover:text-[#087443] shrink-0 transition-colors" />
        </div>

        <p className="text-[11px] text-[#587063] mt-0.5 leading-snug line-clamp-1 sm:line-clamp-2">
          {tool.description}
        </p>

        <div className="flex items-center gap-1 mt-1.5 text-[9px] sm:text-[10px] font-mono font-bold text-[#8AA095]">
          <span className={`px-1.5 py-0.2 rounded ${tool.badgeBg} ${tool.badgeText}`}>
            {tool.formatFrom}
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.2 rounded bg-[#FFEAE7] text-[#B4232E]">
            {tool.formatTo}
          </span>
        </div>
      </div>
    </a>
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[#10241B]/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[88vh] my-auto rounded-[28px] bg-white p-4 sm:p-6 shadow-2xl border-2 border-[#10241B] flex flex-col text-left overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer z-20"
          aria-label="Tutup menu konversi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 sm:gap-3.5 mb-4 pr-10 shrink-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#E3F8EC] flex items-center justify-center text-[#087443] border border-[#D5EADF] shadow-sm shrink-0">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-2xl font-extrabold text-[#10241B]">
                Pusat Konversi Dokumen
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#E3F8EC] text-[#087443] text-[10px] font-bold border border-[#D5EADF]">
                via iLovePDF
              </span>
            </div>
            <p className="text-xs text-[#587063] mt-0.5">
              Ubah format berkas tugasmu dengan cepat sebelum dicetak. Tautan dibuka di tab baru secara aman.
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="grid grid-cols-3 md:hidden p-1 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] gap-1 mb-3 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("to_pdf")}
            className={`py-1.5 rounded-lg transition ${
              mobileTab === "to_pdf"
                ? "bg-white text-[#087443] shadow-xs"
                : "text-[#587063]"
            }`}
          >
            Ke PDF
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("from_pdf")}
            className={`py-1.5 rounded-lg transition ${
              mobileTab === "from_pdf"
                ? "bg-white text-[#087443] shadow-xs"
                : "text-[#587063]"
            }`}
          >
            Dari PDF
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("extra")}
            className={`py-1.5 rounded-lg transition ${
              mobileTab === "extra"
                ? "bg-white text-[#087443] shadow-xs"
                : "text-[#587063]"
            }`}
          >
            Lainnya
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin min-h-0">
          {/* Desktop 2-Column Grid / Mobile Filtered View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* COLUMN 1: CONVERT TO PDF */}
            <div
              className={`flex flex-col gap-2 ${
                mobileTab !== "to_pdf" ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D5EADF]">
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-[#087443]">
                  Convert to PDF
                </span>
                <span className="text-[10px] text-[#587063] font-mono font-medium">5 Alat</span>
              </div>
              <div className="flex flex-col gap-2">
                {CONVERT_TO_PDF_TOOLS.map(renderToolCard)}
              </div>
            </div>

            {/* COLUMN 2: CONVERT FROM PDF */}
            <div
              className={`flex flex-col gap-2 ${
                mobileTab !== "from_pdf" ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D5EADF]">
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-[#1D4ED8]">
                  Convert from PDF
                </span>
                <span className="text-[10px] text-[#587063] font-mono font-medium">5 Alat</span>
              </div>
              <div className="flex flex-col gap-2">
                {CONVERT_FROM_PDF_TOOLS.map(renderToolCard)}
              </div>
            </div>
          </div>

          {/* EXTRA POPULAR TOOLS: GABUNGKAN & KOMPRES PDF */}
          <div
            className={`pt-2 border-t border-[#D5EADF] ${
              mobileTab === "to_pdf" || mobileTab === "from_pdf" ? "hidden md:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-extrabold text-xs uppercase tracking-wider text-[#10241B]">
                Alat PDF Populer Tambahan
              </span>
              <span className="text-[10px] text-[#587063]">Sering digunakan mahasiswa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {EXTRA_PDF_TOOLS.map(renderToolCard)}
            </div>
          </div>
        </div>

        {/* Modal Footer with Attribution */}
        <div className="pt-3.5 mt-2 border-t border-[#D5EADF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#587063] shrink-0">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
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
            <span>• Layanan konversi berkas resmi & terpercaya.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#F4FBF7] hover:bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B] font-semibold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
