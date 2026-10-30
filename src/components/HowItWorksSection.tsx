import React from "react";
import { Lock, ArrowDownToLine, Sparkles } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section
      aria-label="Cara Penggunaan wert.web.id"
      className="w-full relative py-6 sm:py-8"
    >
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#10241B] tracking-tight">
          Cara menggunakan wert.web.id
        </h2>
        <p className="text-sm sm:text-base text-[#587063] mt-2.5 max-w-xl mx-auto leading-relaxed">
          Cetak tugas hanya dalam 4 langkah mudah tanpa repot login WhatsApp atau colok flashdisk di komputer umum.
        </p>
      </div>

      {/* 4 Step Cards Grid */}
      <div className="relative">
        {/* Subtle dot-matrix pattern background */}
        <div
          className="absolute inset-0 rounded-[28px] pointer-events-none opacity-40 -z-10"
          style={{
            backgroundImage: "radial-gradient(#10241B 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px"
          }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* =========================================
              KARTU 1: Buat & Buka Halaman
             ========================================= */}
          <article className="group bg-white rounded-[24px] border-2 border-[#10241B] shadow-[4px_4px_0px_#10241B] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0px_#10241B]">
            <div>
              {/* Badge Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#087443] text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-xs">
                  01
                </span>
                <span className="px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] font-bold text-xs border border-[#19C37D]/30">
                  Langkah 1
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#10241B] tracking-tight mb-2">
                Buat & Buka Halaman
              </h3>
              <p className="text-xs sm:text-sm text-[#10241B]/80 leading-relaxed mb-6">
                Kunjungi wert.web.id, ketik nama halaman unikmu (misal: <span className="font-semibold text-[#087443]">wert.web.id/tugas-budi</span>). Lalu klik &quot;Buka Halaman&quot;.
              </p>
            </div>

            {/* Mockup Preview */}
            <div className="rounded-2xl border border-[#D5EADF] bg-[#F4FBF7] p-3.5 flex flex-col gap-2.5 shadow-inner">
              <div className="bg-white rounded-xl border border-[#D5EADF] px-3 py-2 flex items-center text-xs font-mono shadow-xs overflow-hidden">
                <span className="text-[#587063] select-none text-[11px] sm:text-xs">wert.web.id/</span>
                <span className="text-[#10241B] font-bold ml-1 text-[11px] sm:text-xs">tugas-budi</span>
                <span className="w-1.5 h-3.5 bg-[#19C37D] ml-0.5 animate-pulse inline-block rounded-xs"></span>
              </div>
              <div className="w-full py-2 px-3 rounded-xl bg-[#087443] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs select-none">
                <span>Buka Halaman</span>
                <span className="text-sm font-extrabold">→</span>
              </div>
            </div>
          </article>

          {/* =========================================
              KARTU 2: Buat PIN Keamanan 4 Digit
             ========================================= */}
          <article className="group bg-white rounded-[24px] border-2 border-[#10241B] shadow-[4px_4px_0px_#10241B] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0px_#10241B]">
            <div>
              {/* Badge Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#10241B] text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-xs">
                  02
                </span>
                <span className="px-3 py-1 rounded-full bg-[#E0E7FF] text-[#3730A3] font-bold text-xs border border-[#C7D2FE]">
                  Langkah 2
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#10241B] tracking-tight mb-2">
                Buat PIN Keamanan 4 Digit
              </h3>
              <p className="text-xs sm:text-sm text-[#10241B]/80 leading-relaxed mb-6">
                Masukkan PIN 4-digit agar dokumen tugasmu aman dan hanya bisa diakses olehmu dan operator fotokopi yang kamu beri izin.
              </p>
            </div>

            {/* Mockup Preview */}
            <div className="rounded-2xl border border-[#D5EADF] bg-[#F4FBF7] p-3.5 flex flex-col items-center justify-center gap-2 shadow-inner">
              <span className="text-[11px] font-semibold text-[#587063]">
                Masukkan PIN Kunci
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-[#D5EADF] flex items-center justify-center text-xs font-black text-[#10241B] shadow-xs"
                  >
                    ●
                  </div>
                ))}
              </div>
              <div className="mt-1 px-2.5 py-1 rounded-full bg-[#E3F8EC] border border-[#19C37D]/40 text-[#087443] text-[10px] font-bold flex items-center gap-1 shadow-xs">
                <Lock className="w-2.5 h-2.5 text-[#087443]" />
                <span>Dokumen Terproteksi Enkripsi</span>
              </div>
            </div>
          </article>

          {/* =========================================
              KARTU 3: Upload File (Laptop / HP)
             ========================================= */}
          <article className="group bg-white rounded-[24px] border-2 border-[#10241B] shadow-[4px_4px_0px_#10241B] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0px_#10241B]">
            <div>
              {/* Badge Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-xs">
                  03
                </span>
                <span className="px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] font-bold text-xs border border-[#BFDBFE]">
                  Langkah 3
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#10241B] tracking-tight mb-2">
                Upload File (Laptop / HP)
              </h3>
              <p className="text-xs sm:text-sm text-[#10241B]/80 leading-relaxed mb-6">
                Unggah langsung dari laptopmu atau scan QR code di layar fotokopi untuk upload instan dari HP tanpa perlu install aplikasi.
              </p>
            </div>

            {/* Mockup Preview */}
            <div className="rounded-2xl border-2 border-dashed border-[#D5EADF] bg-[#F4FBF7]/70 p-3.5 flex flex-col items-center justify-center gap-2.5 text-center shadow-inner">
              <span className="text-[11px] font-semibold text-[#587063]">
                Tarik file atau scan QR
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <span className="px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#DC2626] text-[10px] font-black tracking-wide border border-[#FECACA]">
                  PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#2563EB] text-[10px] font-black tracking-wide border border-[#BFDBFE]">
                  DOCX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FFEDD5] text-[#EA580C] text-[10px] font-black tracking-wide border border-[#FED7AA]">
                  PPTX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#CCFBF1] text-[#0D9488] text-[10px] font-black tracking-wide border border-[#99F6E4]">
                  JPG
                </span>
              </div>
            </div>
          </article>

          {/* =========================================
              KARTU 4: Buka di Fotokopi & Cetak
             ========================================= */}
          <article className="group bg-white rounded-[24px] border-2 border-[#10241B] shadow-[4px_4px_0px_#10241B] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0px_#10241B]">
            <div>
              {/* Badge Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#087443] text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-xs">
                  04
                </span>
                <span className="px-3 py-1 rounded-full bg-[#E3F8EC] text-[#087443] font-bold text-xs border border-[#19C37D]/30">
                  Langkah 4
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-[#10241B] tracking-tight mb-2">
                Buka di Fotokopi & Cetak
              </h3>
              <p className="text-xs sm:text-sm text-[#10241B]/80 leading-relaxed mb-6">
                Tunjukkan link atau nama halaman + PIN ke operator fotokopi. Operator langsung unduh/print, dan file otomatis terhapus dalam 24 jam!
              </p>
            </div>

            {/* Mockup Preview */}
            <div className="rounded-2xl border border-[#D5EADF] bg-[#F4FBF7] p-3.5 flex flex-col gap-2.5 shadow-inner">
              <div className="bg-white rounded-xl border border-[#D5EADF] px-3 py-2 flex items-center justify-between text-xs shadow-xs">
                <span className="font-bold text-[#10241B] truncate max-w-[130px] sm:max-w-[140px] text-[11px] sm:text-xs">
                  Skripsi_Bab_1-3.pdf
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#087443] flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#19C37D] animate-pulse"></span>
                  <span>Siap</span>
                </div>
              </div>
              <div className="w-full py-2 px-3 rounded-xl bg-[#087443] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs select-none">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Download / Print Sekarang</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
