import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Syarat & Ketentuan Layanan</h1>
              <p className="text-xs text-slate-500">Terakhir diperbarui: 22 Oktober 2026</p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed flex flex-col gap-4">
            <p>
              Dengan mengakses atau menggunakan platform <b>wert.web.id</b>, Anda menyetujui ketentuan layanan di bawah ini:
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">1. Tujuan Penggunaan</h3>
            <p>
              Wert disediakan semata-mata sebagai sarana penyimpanan dan transfer dokumen sementara untuk keperluan pratinjau dan pencetakan (khususnya di toko fotokopian, rental komputer, atau perpustakaan). Layanan ini bukan merupakan layanan arsip file permanen atau cloud storage jangka panjang.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">2. Konten yang Dilarang</h3>
            <p>
              Pengguna dilarang keras mengunggah:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>File yang melanggar hukum Republik Indonesia.</li>
              <li>Perangkat lunak berbahaya, malware, virus, atau script eksploitasi.</li>
              <li>Materi pornografi atau materi yang melanggar kesusilaan.</li>
              <li>Konten hak cipta pihak ketiga tanpa hak atau izin yang sah.</li>
            </ul>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">3. Batasan Kuota & Penghapusan Otomatis</h3>
            <p>
              Setiap akun dibatasi hingga 20 file dan maksimal 100 MB. File akan terhapus otomatis setelah 24 jam kecuali diatur sebaliknya oleh pengguna. Pengelola berhak menghapus akun yang tidak memiliki aktivitas selama 30 hari guna mendaur ulang username yang tidak terpakai.
            </p>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2">4. Penafian Tanggung Jawab (Disclaimer)</h3>
            <p>
              Layanan disediakan &quot;apa adanya&quot; (as-is). Pengguna bertanggung jawab penuh untuk memastikan salinan asli dokumen tersimpan di perangkat pribadi masing-masing sebelum mencetak.
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
