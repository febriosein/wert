"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  ArrowRight,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Globe,
  Archive,
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
  const [mobileTab, setMobileTab] = useState<"to_pdf" | "from_pdf" | "extra">("to_pdf");

  if (!isOpen) return null;

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
      className="group relative bg-[#F4FBF7]/60 hover:bg-white rounded-2xl border border-[#D5EADF] hover:border-[#087443] p-3.5 sm:p-4 flex items-start gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="w-10 h-10 rounded-xl bg-white border border-[#D5EADF] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
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

        <p className="text-[11px] text-[#587063] mt-1 leading-snug line-clamp-2">
          {tool.description}
        </p>

        <div className="flex items-center gap-1 mt-2 text-[10px] font-mono font-bold text-[#8AA095]">
          <span className={`px-1.5 py-0.5 rounded ${tool.badgeBg} ${tool.badgeText}`}>
            {tool.formatFrom}
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.5 rounded bg-[#FFEAE7] text-[#B4232E]">
            {tool.formatTo}
          </span>
        </div>
      </div>
    </a>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#10241B]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl border border-[#D5EADF] flex flex-col text-left overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#587063] hover:text-[#10241B] hover:bg-[#E3F8EC] transition cursor-pointer z-10"
          aria-label="Tutup menu konversi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-[#E3F8EC] flex items-center justify-center text-[#087443] border border-[#D5EADF] shadow-sm shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#10241B]">
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
        <div className="grid grid-cols-3 md:hidden p-1 rounded-xl bg-[#F4FBF7] border border-[#D5EADF] gap-1 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab("to_pdf")}
            className={`py-2 rounded-lg transition ${
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
            className={`py-2 rounded-lg transition ${
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
            className={`py-2 rounded-lg transition ${
              mobileTab === "extra"
                ? "bg-white text-[#087443] shadow-xs"
                : "text-[#587063]"
            }`}
          >
            Lainnya
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
          {/* Desktop 2-Column Grid / Mobile Filtered View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* COLUMN 1: CONVERT TO PDF */}
            <div
              className={`flex flex-col gap-2.5 ${
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
              className={`flex flex-col gap-2.5 ${
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
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-display font-extrabold text-xs uppercase tracking-wider text-[#10241B]">
                Alat PDF Populer Tambahan
              </span>
              <span className="text-[10px] text-[#587063]">Sering digunakan mahasiswa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXTRA_PDF_TOOLS.map(renderToolCard)}
            </div>
          </div>
        </div>

        {/* Modal Footer with Attribution */}
        <div className="pt-4 mt-3 border-t border-[#D5EADF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#587063]">
          <div className="flex items-center gap-1.5">
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
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-[#F4FBF7] hover:bg-[#E3F8EC] border border-[#D5EADF] text-[#10241B] font-semibold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
