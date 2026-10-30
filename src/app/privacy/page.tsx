import { InfoPageLayout } from "@/components/InfoPageLayout";
import { ShieldCheck, Lock, Clock, Ban, Server, FileCheck, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - wert.web.id",
  description: "Prinsip Zero-PII dan perlindungan privasi dokumen tugas di wert.web.id.",
};

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Kebijakan Privasi"
      subtitle="Dirancang dari awal dengan prinsip Zero-PII (Zero Personally Identifiable Information) agar dokumen tugasmu tidak tertinggal di komputer umum fotokopian."
      badge="Keamanan & Privasi"
    >
      <div className="flex flex-col gap-6 text-left">
        {/* Highlight Card: 4 Jaminan Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E3F8EC] text-[#087443] flex items-center justify-center shrink-0 border border-[#D5EADF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#10241B]">Zero-PII (Tanpa Data Pribadi)</h3>
              <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                Tidak ada nama lengkap, nomor HP, email, atau password. Cukup buat room unik @namamu.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4B8] text-[#10241B] flex items-center justify-center shrink-0 border border-[#FFE45C]">
              <Clock className="w-5 h-5 text-[#087443]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#10241B]">Hapus Otomatis 24 Jam</h3>
              <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                Semua file tugas otomatis terhapus bersih dari server dalam 24 jam demi keamanan tugasmu.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E4EEFF] text-[#1D4ED8] flex items-center justify-center shrink-0 border border-blue-200">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#10241B]">Bebas Pelatihan AI</h3>
              <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                File tugasmu tidak pernah dibaca bot, tidak diindeks mesin pencari, dan tidak dipakai melatih model AI.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-[22px] bg-white border border-[#D5EADF] shadow-soft flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFEAEC] text-[#D92D3A] flex items-center justify-center shrink-0 border border-red-200">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#10241B]">Anti-Cache Komputer Publik</h3>
              <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                Header anti-cache ketat mencegah browser fotokopi menyimpan salinan file di harddisk lokal.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Legal Document Container */}
        <article className="bg-white p-6 sm:p-10 rounded-[28px] border border-[#D5EADF] shadow-soft flex flex-col gap-8 text-[#10241B]">
          <div className="border-b border-[#D5EADF] pb-4">
            <span className="text-[11px] font-mono font-semibold text-[#587063] uppercase tracking-wider">
              Dokumen Kebijakan Resmi
            </span>
            <p className="text-xs text-[#587063] mt-1">Terakhir diperbarui: 30 Oktober 2026</p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <span>Filosofi & Data yang Kami Kumpulkan</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Wert (<b className="text-[#10241B]">wert.web.id</b>) lahir untuk mengatasi masalah ribuan mahasiswa dan pelajar yang terpaksa login WhatsApp Web atau mencolokkan flashdisk bervirus di komputer rental fotokopian. Kami mengadopsi prinsip <b>Privacy by Design</b>:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#587063] pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <span>
                  <b className="text-[#10241B]">Nama Halaman (@username):</b> Karakter alfanumerik bebas yang Anda pilih sendiri tanpa memerlukan email maupun nomor telepon.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <span>
                  <b className="text-[#10241B]">PIN 4-Digit (Opsional):</b> Jika diaktifkan, PIN di-hash satu arah menggunakan standar kriptografi <b>Argon2id</b> dengan salt acak dan secret pepper tingkat server. Kami tidak dapat mengetahui PIN asli Anda.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <span>
                  <b className="text-[#10241B]">File Dokumen Tugas:</b> Hanya disimpan sementara di media penyimpanan terisolasi untuk tujuan pratinjau dan instruksi cetak ke printer.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <span>
                  <b className="text-[#10241B]">Hash IP & User-Agent Sementara:</b> Dipakai murni untuk pembatasan laju (*rate limiting*) guna mencegah serangan bot atau brute-force PIN.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <span>Siklus Hidup File & Penghapusan Otomatis (Auto-Delete)</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Kami tidak bertindak sebagai media arsip file permanen. Setiap file yang diunggah memiliki timer penghapusan otomatis:
            </p>
            <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] text-xs sm:text-sm space-y-2">
              <p>
                ⏱️ <b>Default 24 Jam:</b> Setelah 24 jam sejak waktu unggah, cron server akan menghapus file fisik dari Supabase Storage dan menghapus metadata dari basis data secara permanen.
              </p>
              <p>
                🔄 <b>Perpanjangan & Pengaturan Manual:</b> Anda memiliki opsi melalui menu file untuk memperpanjang timer 24 jam lagi, menyimpannya tanpa batas waktu (*keep permanently*), atau menghapus file seketika.
              </p>
              <p>
                🧹 <b>Pembersihan Akun Pasif (30 Hari):</b> Akun yang tidak memiliki aktivitas berkunjung selama 30 hari akan dihapus otomatis beserta seluruh filenya demi mendaur ulang ruang dan username.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                3
              </span>
              <span>Proteksi Komputer Rental Fotokopi</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Komputer rental fotokopian diakses oleh puluhan orang bergantian setiap hari. Untuk melindungi kerahasiaan tugas Anda:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#587063]">
              <li>
                Semua respons file disajikan dengan header HTTP: <br />
                <code className="text-[11px] font-mono bg-[#E3F8EC] text-[#087443] px-2 py-0.5 rounded">
                  Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0
                </code>
              </li>
              <li>
                Sistem menyediakan modal dialog peringatan keluar (*Auto-Logout Guard*) setelah perintah cetak dikirim ke printer.
              </li>
              <li>
                Mekanisme IDOR (Insecure Direct Object Reference) yang ketat memastikan tidak ada orang lain yang dapat memanipulasi file Anda tanpa hak akses yang sah.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#10241B] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E3F8EC] text-[#087443] text-xs font-mono font-bold flex items-center justify-center">
                4
              </span>
              <span>Kepatuhan Regulasi & Perlindungan Hukum</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#587063] leading-relaxed">
              Layanan Wert tunduk dan mematuhi prinsip-prinsip pelindungan data yang diatur dalam <b>Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</b>. Anda memiliki hak penuh untuk menghapus data Anda kapan saja melalui fitur <i>Hapus Akun & Seluruh File</i> di menu Pengaturan.
            </p>
          </section>
        </article>
      </div>
    </InfoPageLayout>
  );
}
