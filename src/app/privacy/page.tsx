import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar showActions={false} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Kebijakan Privasi</h1>
              <p className="text-xs text-slate-500">Terakhir diperbarui: 22 Oktober 2026</p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed flex flex-col gap-4">
            <p>
              Wert (wert.web.id) dirancang dengan prinsip <b>Privasi sejak Awal (Privacy by Design)</b> dan <b>Zero-PII</b>. Layanan ini dibuat untuk membantu pelajar, mahasiswa, dan masyarakat mencetak dokumen sementara di komputer umum tanpa harus login WhatsApp Web atau meninggalkan jejak data pribadi.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">1. Data yang Kami Kumpulkan</h3>
            <p>
              Kami tidak mengumpulkan nama lengkap, nomor telepon, alamat email, atau kata sandi Anda. Data yang diproses sistem hanya mencakup:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Username</b> yang Anda pilih secara sukarela.</li>
              <li><b>PIN 4 angka</b> (disimpan sebagai hash satu arah Argon2id dengan salt unik dan pepper, tidak pernah disimpan dalam bentuk teks biasa).</li>
              <li><b>File tugas yang Anda unggah</b> semata-mata untuk tujuan pratinjau dan pencetakan.</li>
              <li><b>Hash IP dan User Agent</b> untuk keperluan pencegahan serangan bot (brute-force rate limiting) yang kedaluwarsa secara berkala.</li>
            </ul>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">2. Hapus Otomatis (Auto-Delete)</h3>
            <p>
              Secara default, seluruh file yang Anda unggah akan <b>terhapus secara permanen setelah 48 jam</b>. Anda dapat mematikan fitur ini atau memperpanjang timer melalui tombol pengaturan file. Ketika file dihapus, file asli beserta turunan PDF pratinjaunya langsung dihapus dari media penyimpanan.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">3. Pemrosesan & Penyimpanan Dokumen</h3>
            <p>
              File dokumen yang Anda unggah disimpan dengan aman di penyimpanan terisolasi. File Anda <b>tidak pernah dijual, tidak pernah dianalisis untuk profil iklan, dan tidak pernah digunakan untuk pelatihan kecerdasan buatan (AI)</b>.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">4. Kepatuhan Hukum</h3>
            <p>
              Layanan ini mematuhi ketentuan prinsip pelindungan data pribadi di Republik Indonesia sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60">
        © 2026 wert.web.id
      </footer>
    </div>
  );
}
