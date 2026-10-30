"use client";

import { useState } from "react";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Smartphone,
  Printer,
  ShieldCheck,
  FileQuestion,
  Lock,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: "cara-pakai" | "keamanan" | "cetak" | "file";
  question: string;
  answer: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "cara-pakai",
    question: "Bagaimana cara upload file dari HP tanpa login WhatsApp di fotokopi?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>Sangat mudah, Anda tidak perlu mengunduh aplikasi apa pun:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Buka situs <b>wert.web.id</b> di komputer fotokopi dan ketik nama halaman Anda (misal: <code>wert.web.id/namamu</code>).</li>
          <li>Klik tombol <b>Upload dari HP</b> atau lihat kode QR yang tampil di layar komputer.</li>
          <li>Buka kamera ponsel Anda, scan kode QR tersebut, lalu pilih file tugas Anda dari HP.</li>
          <li>File Anda akan langsung muncul di layar komputer fotokopi secara instan!</li>
        </ol>
      </div>
    ),
  },
  {
    id: "faq-2",
    category: "keamanan",
    question: "Apakah orang lain atau tukang fotokopi bisa melihat file pribadi saya?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          Secara default, halaman Anda dapat diakses oleh siapa pun yang mengetahui nama room Anda. Namun, Anda dapat mengaktifkan <b>PIN 4-digit</b> di menu <b>Pengaturan Akun</b>.
        </p>
        <p>
          Setelah PIN diaktifkan, siapa pun yang membuka <code>wert.web.id/namamu</code> harus memasukkan 4 angka PIN yang benar sebelum dapat melihat daftar tugas Anda.
        </p>
      </div>
    ),
  },
  {
    id: "faq-3",
    category: "keamanan",
    question: "Apa itu Recovery Code (WERT-XXXX-XXXX) dan bagaimana jika saya lupa PIN?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          <b>Recovery Code</b> adalah kunci darurat 14 karakter yang diberikan satu kali saat pertama kali Anda membuat akun.
        </p>
        <p>
          Jika Anda lupa PIN 4-digit Anda, klik opsi <i>&quot;Lupa PIN?&quot;</i> pada kotak login, lalu masukkan Recovery Code tersebut untuk mengatur ulang PIN Anda seketika tanpa kehilangan file tugas.
        </p>
      </div>
    ),
  },
  {
    id: "faq-4",
    category: "cetak",
    question: "Mengapa format Word (.docx) saya tidak berantakan saat dibuka di fotokopian?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          Komputer fotokopian sering kali memakai versi Microsoft Word yang berbeda dari laptop Anda, sehingga margin dan nomor halaman sering bergeser.
        </p>
        <p>
          Wert menggunakan mesin render pratinjau in-browser berstandar A4 yang menjaga tata letak, margin, dan tabel tetap rapi sebagaimana dokumen aslinya, serta langsung memicu dialog cetak printer bawaan browser.
        </p>
      </div>
    ),
  },
  {
    id: "faq-5",
    category: "file",
    question: "Format file apa saja yang didukung oleh Wert?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>Wert mendukung seluruh format berkas tugas perkuliahan dan sekolah umum:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Dokumen:</b> PDF (<code>.pdf</code>), Microsoft Word (<code>.docx</code>, <code>.doc</code>), Excel (<code>.xlsx</code>, <code>.xls</code>), PowerPoint (<code>.pptx</code>, <code>.ppt</code>).</li>
          <li><b>Gambar & Scan:</b> JPG, JPEG, PNG, WEBP, dan HEIC (format kamera iPhone).</li>
          <li><b>Arsip:</b> File ZIP (dapat diinspeksi isinya secara aman tanpa mengekstrak).</li>
        </ul>
        <p>Batas ukuran per file adalah <b>50 MB</b>, dengan total kapasitas room hingga <b>100 MB</b>.</p>
      </div>
    ),
  },
  {
    id: "faq-6",
    category: "file",
    question: "Berapa lama file saya akan tersimpan sebelum terhapus otomatis?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          Secara default, seluruh file akan <b>terhapus permanen setelah 24 jam</b> sejak diunggah. Terdapat hitung mundur (countdown pill) di setiap kartu file.
        </p>
        <p>
          Jika Anda masih butuh waktu, Anda dapat mengklik menu titik tiga (⋮) pada kartu file dan memilih <b>Perpanjang 24 Jam</b> atau <b>Simpan Terus</b>.
        </p>
      </div>
    ),
  },
  {
    id: "faq-7",
    category: "cara-pakai",
    question: "Bagaimana cara mengganti file yang salah revisi tanpa mengubah URL room?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          Klik menu titik tiga (⋮) pada file yang ingin diganti, lalu pilih <b>Ganti File (Update)</b>. Unggah revisi baru Anda. File lama akan diganti secara atomik tanpa mengubah urutan antrean cetak Anda.
        </p>
      </div>
    ),
  },
  {
    id: "faq-8",
    category: "cetak",
    question: "Apa fungsi fitur Auto-Logout Timer setelah mencetak?",
    answer: (
      <div className="space-y-2 text-xs sm:text-sm text-[#587063] leading-relaxed">
        <p>
          Banyak mahasiswa lupa menutup browser saat terburu-buru meninggalkan meja fotokopi. Setelah Anda mengklik <b>Cetak Dokumen</b>, Wert akan menampilkan banner hitung mundur <b>60 detik</b>.
        </p>
        <p>
          Jika tidak ada pembatalan, sistem akan otomatis mengeluarkan sesi Anda agar pengguna komputer rental berikutnya tidak dapat melihat dokumen Anda.
        </p>
      </div>
    ),
  },
];

export default function BantuanPage() {
  const [activeTab, setActiveTab] = useState<"all" | "cara-pakai" | "keamanan" | "cetak" | "file">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");
  const [userRoleGuide, setUserRoleGuide] = useState<"student" | "photocopy">("student");

  const filteredFaqs = FAQS.filter((faq) => {
    if (activeTab !== "all" && faq.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return faq.question.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <InfoPageLayout
      title="Pusat Bantuan & FAQ"
      subtitle="Temukan jawaban cepat seputar cara upload file dari smartphone, pratinjau dokumen, pengaturan PIN keamanan, dan tips cetak tugas di komputer fotokopian."
      badge="Panduan & Bantuan"
    >
      <div className="flex flex-col gap-8 text-left">
        {/* Quick Interactive Search */}
        <div className="relative w-full">
          <Search className="w-5 h-5 text-[#587063] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kendala atau pertanyaan (contoh: lupa PIN, upload dari HP, format file)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-[#D5EADF] text-sm text-[#10241B] placeholder-[#587063] focus:outline-none focus:border-[#087443] focus:ring-4 focus:ring-[#19C37D]/20 shadow-xs transition"
          />
        </div>

        {/* Dual-Perspective Guide Switcher (Mahasiswa vs Fotokopi) */}
        <div className="p-6 rounded-[28px] bg-white border border-[#D5EADF] shadow-soft flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5EADF] pb-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-[#087443] uppercase tracking-wider">
                Panduan Kilat 3 Langkah
              </span>
              <h2 className="font-display font-extrabold text-xl text-[#10241B] mt-0.5">
                Cara Kerja Wert di Meja Fotokopi
              </h2>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-[#F4FBF7] p-1 rounded-xl border border-[#D5EADF] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUserRoleGuide("student")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  userRoleGuide === "student"
                    ? "bg-[#087443] text-white shadow-xs"
                    : "text-[#587063] hover:text-[#10241B]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Untuk Pelajar / Mahasiswa</span>
              </button>
              <button
                type="button"
                onClick={() => setUserRoleGuide("photocopy")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  userRoleGuide === "photocopy"
                    ? "bg-[#087443] text-white shadow-xs"
                    : "text-[#587063] hover:text-[#10241B]"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Untuk Operator Fotokopi</span>
              </button>
            </div>
          </div>

          {/* Guide Content: Student Perspective */}
          {userRoleGuide === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E3F8EC] text-[#087443] font-display font-bold text-sm flex items-center justify-center">
                  1
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">Scan QR Komputer</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    Lihat layar komputer fotokopi, buka kamera HP Anda dan arahkan ke kode QR yang tersedia.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E4EEFF] text-[#1D4ED8] font-display font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">Pilih File dari HP</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    Pilih file tugas (.docx, .pdf, atau foto scan) dari galeri atau berkas smartphone Anda.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF4B8] text-[#10241B] font-display font-bold text-sm flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">Muncul & Siap Cetak</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    File Anda seketika muncul di monitor komputer fotokopi tanpa riwayat chat yang tertinggal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guide Content: Photocopy Operator Perspective */}
          {userRoleGuide === "photocopy" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E3F8EC] text-[#087443] font-display font-bold text-sm flex items-center justify-center">
                  1
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">Buka Room Pelanggan</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    Cukup ketik <code>wert.web.id/namamu</code> sesuai nama yang disebutkan pelanggan di meja.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E4EEFF] text-[#1D4ED8] font-display font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">1-Klik &quot;Lihat & Cetak&quot;</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    Klik tombol hijau pada kartu dokumen untuk membuka pratinjau terang dan langsung memicu print.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4FBF7] border border-[#D5EADF] flex flex-col justify-between gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF4B8] text-[#10241B] font-display font-bold text-sm flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#10241B]">Komputer Bersih & Cepat</h3>
                  <p className="text-xs text-[#587063] mt-1 leading-relaxed">
                    Komputer tidak lemot oleh ribuan unduhan file WhatsApp dan bebas dari virus flashdisk asing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Accordion Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display font-extrabold text-2xl text-[#10241B]">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {[
                { id: "all", label: "Semua" },
                { id: "cara-pakai", label: "📱 Cara Pakai" },
                { id: "keamanan", label: "🔒 Keamanan & PIN" },
                { id: "cetak", label: "🖨️ Cetak & Format" },
                { id: "file", label: "📁 Kuota & Waktu" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveTab(chip.id as any)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                    activeTab === chip.id
                      ? "bg-[#087443] text-white shadow-xs"
                      : "bg-white text-[#587063] hover:text-[#10241B] border border-[#D5EADF]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          {filteredFaqs.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-white border border-[#D5EADF] text-center text-xs text-[#587063]">
              Tidak ditemukan pertanyaan yang cocok dengan pencarian &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-[20px] bg-white border transition-all overflow-hidden ${
                      isOpen
                        ? "border-[#087443] shadow-md ring-2 ring-[#087443]/10"
                        : "border-[#D5EADF] hover:border-[#087443]/40 shadow-xs"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer select-none"
                    >
                      <span className="font-display font-bold text-sm sm:text-base text-[#10241B]">
                        {faq.question}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 bg-[#E3F8EC] text-[#087443]" : "bg-[#F4FBF7] text-[#587063]"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-1 border-t border-[#D5EADF]/60 animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact & Feedback Box */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#E3F8EC] border border-[#D5EADF] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#087443] text-white flex items-center justify-center shrink-0 border-2 border-[#10241B] shadow-sticker-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#10241B]">
                Punya Pertanyaan Lain atau Kendala Teknis?
              </h3>
              <p className="text-xs sm:text-sm text-[#587063] mt-0.5">
                Kami siap membantu penyelesaian kendala cetak tugas atau menerima saran fitur baru.
              </p>
            </div>
          </div>

          <a
            href="mailto:bantuan@wert.web.id"
            className="px-5 py-2.5 rounded-xl bg-[#087443] hover:bg-[#065b34] text-white font-display text-xs sm:text-sm font-bold flex items-center gap-2 transition-all btn-tactile shadow-xs shrink-0 cursor-pointer"
          >
            <span>Hubungi Kami</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </InfoPageLayout>
  );
}
