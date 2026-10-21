# Wert (`wert.web.id`) 🖨️📄

> **Akses, Pratinjau, dan Cetak Dokumen Tugas dari Mana Saja — Tanpa Perlu Login WhatsApp di Komputer Fotokopian.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Storage-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## 📌 Latar Belakang & Masalah

Setiap hari, ribuan mahasiswa dan pelajar mencetak tugas di tempat fotokopi/rental komputer dengan cara:
1. **Login WhatsApp Web di Komputer Rental** — Sering kali lupa di-*logout*, sehingga riwayat percakapan pribadi dan data sensitif tertinggal dan dapat dibaca oleh pengguna berikutnya.
2. **Menggunakan Flashdisk** — Sangat rentan tertular virus/malware dari komputer umum yang jarang diperbarui.
3. **Format Dokumen Berantakan** — Membuka file `.docx` di versi Microsoft Office yang berbeda pada komputer fotokopi sering kali merusak tata letak, margin, font, dan nomor halaman.

**Wert** hadir sebagai solusi penyimpanan tugas sementara yang aman, cepat, dan mengutamakan privasi pengguna (*Zero-PII*).

---

## ✨ Fitur Utama

### 1. 🛡️ Tanpa Password & Zero-PII (Privacy-First)
- **Registrasi Instan**: Cukup tentukan `@username` unik (3–30 karakter). Tidak memerlukan email, nomor telepon, atau data pribadi apa pun.
- **PIN 4-Digit Opsional**: Lindungi akses folder tugas Anda dengan PIN cepat. PIN diamankan menggunakan hashing **Argon2id** ditambah server-side *secret pepper*.
- **Recovery Code 12 Karakter**: Format `WERT-XXXX-XXXX` (Base32 *unambiguous*) diberikan saat pertama kali mendaftar sebagai kunci darurat jika lupa PIN.

### 2. 📱 Upload Cepat & Scan QR Smartphone
- **Scan QR Langsung**: Buka kamera HP, scan QR di halaman utama komputer fotokopi, dan upload file dari ponsel tanpa perlu login.
- **Drag & Drop Desktop**: Area upload modern dengan progress bar, tombol retry, dan pembatalan (*abort controller*).
- **Direct-to-Storage Upload**: File diunggah langsung ke Supabase Storage via signed URL untuk kecepatan transfer maksimal.
- **Validasi Magic Bytes**: Verifikasi tipe file sebenarnya di sisi client dan server untuk mencegah file berbahaya yang menyamar.

### 3. 🎯 Konversi Dokumen Presisi Tinggi (Word ↔ PDF)
- **Konversi DOCX ke PDF 100% Identik**: Menggunakan engine konversi *multi-tier* (Microsoft Word COM Automation di Windows / Gotenberg LibreOffice di Docker/Cloud).
  - Posisi teks, font, tabel, margin, header/footer, dan nomor halaman **tidak bergeser sama sekali**.
  - Foto dan gambar di dalam dokumen dipertahankan dalam resolusi penuh (*lossless print quality*).
- **Konversi PDF ke Word (DOCX)**: Mendukung *Mode Presisi* dan *Mode Editable*.
- **Just-In-Time (JIT) Conversion**: Konversi otomatis terjadi saat pratinjau atau saat tombol download PDF ditekan.

### 4. 👁️ Pratinjau & Cetak Dokumen Cepat
- **Universal In-Browser Viewer**: Pratinjau langsung file PDF, Word (DOCX), dan gambar (JPG, PNG, WebP) tanpa aplikasi pihak ketiga.
- **Safe ZIP Archive Inspection**: Membaca daftar isi file ZIP secara aman tanpa mengekstrak (*zero-extraction* via Central Directory parser).
- **Cetak 1-Klik**: Tombol "Cetak Dokumen" langsung memicu dialog cetak printer komputer rental.
- **Pengingat Keluar Komputer Umum**: Menampilkan modal pengingat untuk logout otomatis setelah perintah cetak selesai.

### 5. 🔒 Keamanan Khusus Komputer Rental/Umum
- **Anti-Cache Header**: Semua rute dokumen menggunakan `Cache-Control: private, no-cache, no-store, must-revalidate` agar browser rental tidak menyimpan file di disk/cache.
- **Perlindungan IDOR**: Autentikasi ketat memastikan pengguna lain tidak dapat mengakses, melihat, mengunduh, mengganti, atau menghapus file Anda.
- **Auto-Delete Timer**: File otomatis terhapus setelah 48 jam (dapat disesuaikan atau dinonaktifkan di pengaturan).
- **Pembersihan Otomatis Akun**: Akun yang tidak aktif selama 30 hari akan dihapus otomatis beserta seluruh filenya demi efisiensi dan privasi.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Autentikasi & Keamanan** | `@node-rs/argon2`, HttpOnly Cookie, SHA-256 session token |
| **Database & Storage** | [Supabase](https://supabase.com/) (PostgreSQL & Object Storage) |
| **Sinkronisasi Realtime** | Supabase Realtime WebSocket |
| **Engine Dokumen** | Microsoft Word COM Automation / [Gotenberg 8](https://gotenberg.dev/) (LibreOffice), `docx`, `pdf-parse`, `mammoth` |
| **QR Code** | `qrcode` |
| **Pengujian** | Golden Test Suite & Photocopy Pilot Simulation Suite (Node.js) |

---

## 🚀 Panduan Memulai (Instalasi Lokal)

### Prasyarat
- **Node.js** v20+ atau v22+
- Akun [Supabase](https://supabase.com/) (Database & Storage)
- *(Opsional)* Microsoft Word terpasang (di Windows) atau Docker untuk menjalankan Gotenberg

### 1. Clone Repositori
```bash
git clone https://github.com/febriosein/wert.git
cd wert
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Lengkapi variabel berikut di dalam `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security Secrets (String acak 32+ karakter)
PIN_PEPPER=your_random_secret_pepper_for_argon2
SESSION_SECRET=your_random_32_char_session_secret
CRON_SECRET=your_random_cron_secret

# Konversi Dokumen (Gotenberg Docker jika digunakan)
GOTENBERG_URL=http://localhost:3001
```

### 4. Setup Database & Storage Supabase
Jalankan file SQL migrasi di Supabase SQL Editor:
1. `supabase/migrations/00001_initial_schema.sql` (Tabel `users`, `sessions`, `files`, `upload_sessions`, `conversion_jobs`, dll.)
2. `supabase/migrations/00002_fix_username_regex.sql` (Perbaikan regex username)

Pastikan dua bucket penyimpanan dibuat di **Supabase Storage**:
- `uploads` (Private)
- `derived` (Private)

### 5. Jalankan Layanan Konversi (Pilih salah satu)
- **Di Windows dengan Microsoft Office**: Layanan otomatis menggunakan Microsoft Word asli melalui skrip PowerShell bawaan di `scripts/convert_word.ps1`.
- **Menggunakan Docker (Gotenberg)**:
  ```bash
  docker compose up -d
  ```

### 6. Jalankan Server Development
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Pengujian Otomatis

Aplikasi dilengkapi dengan suite pengujian otomatis untuk memverifikasi fungsionalitas dan keamanan:

### Golden Test Suite (Komponen Inti)
Memverifikasi generator Recovery Code, validasi Magic Bytes file, dan pembacaan arsip ZIP tanpa ekstraksi:
```bash
npm test
```

### Photocopy Pilot Simulation Suite (End-to-End M6)
Simulasi penuh alur mahasiswa di fotokopian (Registrasi, Upload Desktop, Scan QR HP, Konversi Word ke PDF, Download Variant, Atomic Replace, Proteksi IDOR, dan Hapus Akun):
```bash
npm run test:pilot
```

---

## 📁 Struktur Direktori Proyek

```text
wert/
├── public/                 # Aset statis & ikon
├── scripts/
│   ├── convert_word.ps1    # Otomasi konversi MS Word COM presisi tinggi
│   ├── golden_test.mjs     # Test suite unit & parser
│   └── pilot_simulation.mjs # Test suite simulasi E2E pilot
├── src/
│   ├── app/
│   │   ├── [username]/     # Dashboard tugas pengguna & pengaturan
│   │   ├── api/            # Route handler API (auth, files, convert, preview, cron)
│   │   ├── u/[token]/      # Halaman penerima upload via scan QR smartphone
│   │   ├── layout.tsx      # Root layout dengan suppressHydrationWarning
│   │   └── page.tsx        # Landing page & form masuk/daftar
│   ├── components/         # Komponen UI (Dropzone, FileCard, DocumentViewerModal, dll.)
│   ├── lib/
│   │   ├── auth/           # Manajemen PIN, Argon2id, dan Session
│   │   ├── converter/      # Provider konversi multi-tier (Gotenberg & MS Word)
│   │   ├── storage/        # Validator magic bytes & ZIP central directory reader
│   │   └── supabase/       # Klien Supabase browser & admin
│   └── middleware.ts       # Security middleware (CSP, Anti-cache public PC)
├── supabase/
│   └── migrations/         # DDL skema database PostgreSQL
├── docker-compose.yml      # Gotenberg LibreOffice service container
└── vercel.json             # Konfigurasi Cron job untuk Vercel
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE). Dibuat dengan ❤️ untuk mempermudah kehidupan akademis mahasiswa dan menjaga privasi di ruang publik.
