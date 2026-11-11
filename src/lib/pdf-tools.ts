/**
 * Configuration and metadata for PDF conversion tools linking to iLovePDF (Indonesian edition).
 */

export interface PdfToolItem {
  id: string;
  title: string;
  description: string;
  url: string;
  formatFrom: string;
  formatTo: string;
  isPopular?: boolean;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export const CONVERT_TO_PDF_TOOLS: PdfToolItem[] = [
  {
    id: "word-to-pdf",
    title: "WORD to PDF",
    description: "Ubah dokumen Word (.docx, .doc) ke PDF agar format & nomor halaman tidak berantakan.",
    url: "https://www.ilovepdf.com/id/word-ke-pdf",
    formatFrom: "DOCX",
    formatTo: "PDF",
    isPopular: true,
    accentColor: "#3B82F6",
    badgeBg: "bg-[#E4EEFF]",
    badgeText: "text-[#1D4ED8]",
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Gabungkan foto tugas atau hasil scan kamera smartphone menjadi 1 berkas PDF rapi.",
    url: "https://www.ilovepdf.com/id/jpg-ke-pdf",
    formatFrom: "JPG",
    formatTo: "PDF",
    isPopular: true,
    accentColor: "#F59E0B",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#B45309]",
  },
  {
    id: "powerpoint-to-pdf",
    title: "POWERPOINT to PDF",
    description: "Ubah slide presentasi (.pptx, .ppt) menjadi dokumen PDF siap cetak per halaman.",
    url: "https://www.ilovepdf.com/id/powerpoint-ke-pdf",
    formatFrom: "PPTX",
    formatTo: "PDF",
    accentColor: "#FF9A3D",
    badgeBg: "bg-[#FFEFDD]",
    badgeText: "text-[#A4510A]",
  },
  {
    id: "excel-to-pdf",
    title: "EXCEL to PDF",
    description: "Konversi spreadsheet Excel (.xlsx, .xls) ke tabel PDF yang pas dicetak di kertas.",
    url: "https://www.ilovepdf.com/id/excel-ke-pdf",
    formatFrom: "XLSX",
    formatTo: "PDF",
    accentColor: "#10B981",
    badgeBg: "bg-[#E3F8EC]",
    badgeText: "text-[#087443]",
  },
  {
    id: "html-to-pdf",
    title: "HTML to PDF",
    description: "Simpan halaman web atau artikel internet langsung ke dokumen format PDF.",
    url: "https://www.ilovepdf.com/id/html-ke-pdf",
    formatFrom: "HTML",
    formatTo: "PDF",
    accentColor: "#EAB308",
    badgeBg: "bg-[#FEF9C3]",
    badgeText: "text-[#854D0E]",
  },
];

export const CONVERT_FROM_PDF_TOOLS: PdfToolItem[] = [
  {
    id: "pdf-to-word",
    title: "PDF to WORD",
    description: "Ekstrak teks dan tabel dari PDF kembali ke format Word (.docx) untuk diedit jika ada typo.",
    url: "https://www.ilovepdf.com/id/pdf-ke-word",
    formatFrom: "PDF",
    formatTo: "DOCX",
    isPopular: true,
    accentColor: "#3B82F6",
    badgeBg: "bg-[#E4EEFF]",
    badgeText: "text-[#1D4ED8]",
  },
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Ekstrak setiap halaman dokumen PDF menjadi gambar JPEG berkualitas tinggi.",
    url: "https://www.ilovepdf.com/id/pdf-ke-jpg",
    formatFrom: "PDF",
    formatTo: "JPG",
    accentColor: "#F59E0B",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#B45309]",
  },
  {
    id: "pdf-to-powerpoint",
    title: "PDF to POWERPOINT",
    description: "Ubah kembali file PDF presentasi ke dalam slide PowerPoint (.pptx).",
    url: "https://www.ilovepdf.com/id/pdf-ke-powerpoint",
    formatFrom: "PDF",
    formatTo: "PPTX",
    accentColor: "#FF9A3D",
    badgeBg: "bg-[#FFEFDD]",
    badgeText: "text-[#A4510A]",
  },
  {
    id: "pdf-to-excel",
    title: "PDF to EXCEL",
    description: "Tarik data tabel dari file PDF langsung ke lembar kerja Excel dalam hitungan detik.",
    url: "https://www.ilovepdf.com/id/pdf-ke-excel",
    formatFrom: "PDF",
    formatTo: "XLSX",
    accentColor: "#10B981",
    badgeBg: "bg-[#E3F8EC]",
    badgeText: "text-[#087443]",
  },
  {
    id: "pdf-to-pdfa",
    title: "PDF to PDF/A",
    description: "Ubah dokumen PDF biasa ke standar PDF/A untuk pengarsipan jangka panjang & skripsi.",
    url: "https://www.ilovepdf.com/id/pdf-ke-pdfa",
    formatFrom: "PDF",
    formatTo: "PDF/A",
    accentColor: "#6366F1",
    badgeBg: "bg-[#EEF2FF]",
    badgeText: "text-[#4338CA]",
  },
];

export const EXTRA_PDF_TOOLS: PdfToolItem[] = [
  {
    id: "merge-pdf",
    title: "Gabungkan PDF",
    description: "Gabungkan beberapa file PDF terpisah menjadi 1 file lengkap berurutan.",
    url: "https://www.ilovepdf.com/id/menggabungkan-pdf",
    formatFrom: "PDFs",
    formatTo: "PDF",
    isPopular: true,
    accentColor: "#EF4444",
    badgeBg: "bg-[#FEE2E2]",
    badgeText: "text-[#B91C1C]",
  },
  {
    id: "compress-pdf",
    title: "Kompres PDF",
    description: "Kecilkan ukuran file PDF agar hemat kuota dan mudah diunggah/dikirim.",
    url: "https://www.ilovepdf.com/id/kompres-pdf",
    formatFrom: "PDF",
    formatTo: "PDF",
    isPopular: true,
    accentColor: "#10B981",
    badgeBg: "bg-[#E3F8EC]",
    badgeText: "text-[#087443]",
  },
];
