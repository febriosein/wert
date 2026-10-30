import { InfoPageLayout } from "@/components/InfoPageLayout";
import { FileText, HardDrive, AlertTriangle, ShieldAlert, CheckCircle, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan - wert.web.id",
  description: "Ketentuan penggunaan platform cetak dokumen sementara wert.web.id.",
};

export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Syarat & Ketentuan Layanan"
      subtitle="Panduan dan batas penggunaan platform wert.web.id untuk memastikan layanan tetap cepat, aman, dan adil bagi seluruh pelajar dan pelaku fotokopi."
      badge="Aturan Layanan"
    >
      <div className="flex flex-col gap-6 text-left">
        {/* Quick Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex flex-col justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center border border-[#D5EADF]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl text-[#10241B]">100 MB</span>
              <p className="text-xs text-[#587063] mt-0.5">Batas total kuota penyimpanan per room tugas.</p>
            </div>
          </div>

          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex flex-col justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4B8] text-[#10241B] flex items-center justify-center border border-[#FFE45C]">
              <FileText className="w-5 h-5 text-[#087443]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl text-[#10241B]">20 File</span>
              <p className="text-xs text-[#587063] mt-0.5">Maksimal 20 dokumen aktif per akun secara bersamaan.</p>
            </div>
          </div>

          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex flex-col justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFEAEC] text-[#D92D3A] flex items-center justify-center border border-red-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl text-[#10241B]">Magic Bytes</span>
              <p className="text-xs text-[#587063] mt-0.5">Validasi biner otomatis menolak virus/file menyamar.</p>
            </div>
          </div>
        </div>

        {/* Detailed Terms Container */}
        <article className="bg-white p-6 sm:p-10 rounded-[28px] border border-[#D5EADF] shadow-soft flex flex-col gap-8 text-[#10241B]">
          <div className="border-b border-[#D5EADF] pb-4">
            <span className="text-[11px] font-mono font-semibold text-[#587063] uppercase tracking-wider">
              Perjanjian Penggunaan
            </span>
            <p className="text-xs text-[#587063] mt-1">Terakhir diperbarui: 30 Oktober 2026</p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <span>Sifat & Tujuan Layanan</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Platform <b className="text-[#10241B]">wert.web.id</b> disediakan sebagai sarana transfer file sementara (*transient document relay*) untuk memfasilitasi kebutuhan pratinjau dan pencetakan di mesin printer komputer publik.
            </p>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Wert <b>bukan</b> merupakan penyedia media penyimpanan awan (*cloud archive*) jangka panjang. Pengguna diwajibkan tetap menyimpan salinan utama (*master backup*) dokumen tugas di perangkat pribadi masing-masing.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <span>Batasan Teknis & Kuota Penyimpanan</span>
            </h2>
            <div className="border border-[#D5EADF] rounded-2xl overflow-hidden divide-y divide-[#D5EADF] text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3.5 bg-[#F4FBF7]">
                <span className="font-semibold text-[#10241B]">Batas Kuota per Room</span>
                <span className="font-mono font-bold text-[#087443]">100 MB</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="font-semibold text-[#10241B]">Batas Ukuran per File</span>
                <span className="font-mono font-bold text-[#087443]">50 MB</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#F4FBF7]">
                <span className="font-semibold text-[#10241B]">Maksimal Jumlah File Aktif</span>
                <span className="font-mono font-bold text-[#087443]">20 File</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="font-semibold text-[#10241B]">Format Dokumen Resmi</span>
                <span className="font-medium text-[#587063]">PDF, DOCX, DOC, XLSX, PPTX, JPG, PNG, WEBP, HEIC, ZIP</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#F4FBF7]">
                <span className="font-semibold text-[#10241B]">Masa Kedaluwarsa Standar</span>
                <span className="font-mono font-bold text-[#087443]">24 Jam (Bisa diperpanjang)</span>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                3
              </span>
              <span>Konten yang Dilarang & Validasi Magic Bytes</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Pengguna dilarang keras mengunggah file yang mengandung:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#587063]">
              <li>Perangkat perusak (*malware*), trojan, virus, berkas executable (.exe, .bat, .sh), atau skrip exploitasi.</li>
              <li>Konten yang melanggar norma hukum Republik Indonesia (termasuk pornografi, perjudian ilegal, dan materi terorisme).</li>
              <li>Dokumen curian atau data rahasia pihak ketiga tanpa izin sah.</li>
            </ul>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed mt-2">
              🛡️ <b>Verifikasi Magic Bytes:</b> Setiap file diperiksa signature byte biner aslinya di sisi browser dan server. Upaya mengubah ekstensi file berbahaya (misalnya mengubah <code>virus.exe</code> menjadi <code>tugas.docx</code>) akan otomatis ditolak dan diblokir oleh sistem.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                4
              </span>
              <span>Tanggung Jawab di Komputer Umum Fotokopi</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Meskipun Wert telah menyediakan proteksi anti-cache dan dialog pengingat keluar (*Auto-Logout Timer*), pengguna tetap bertanggung jawab secara sadar untuk menekan tombol <b>Keluar</b> setelah selesai mencetak dokumen di komputer fotokopian yang dipakai bersama banyak orang.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                5
              </span>
              <span>Penafian & Ketersediaan Layanan</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Layanan Wert disediakan dengan dasar *&quot;sebagaimana adanya&quot; (as-is)*. Kami terus berupaya menjaga waktu henti (*uptime*) mendekati 99.9%, namun tidak bertanggung jawab atas kerugian tidak langsung yang disebabkan oleh gangguan jaringan internet pihak ketiga atau kelalaian pengguna dalam menyimpan recovery code PIN.
            </p>
          </section>
        </article>
      </div>
    </InfoPageLayout>
  );
}
