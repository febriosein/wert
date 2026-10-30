# PRD Wert (wert.web.id)

Akses, pratinjau, dan cetak file tugas dari mana saja

Versi 1.1 · 22 Oktober 2026 · Status: Disetujui (Approved) · Nama produk: Wert (wert.web.id)

## 1. Ringkasan

Wert adalah web app untuk menyimpan file tugas sementara dan membukanya dari komputer mana pun, terutama komputer fotokopian, tanpa login WhatsApp. Pengguna cukup mengetik username (ditambah PIN 4 angka bila dipasang), lalu file tampil di `wert.web.id/username` dengan pratinjau akurat dan tombol update, download, download PDF (untuk Word), download Word (untuk PDF), serta cetak. File terhapus otomatis setelah 24 jam dan fitur ini bisa dimatikan.

Stack: Next.js di Vercel, Supabase (Postgres + Storage), dan satu layanan konversi dokumen terpisah.

## 2. Latar Belakang dan Masalah

Alur saat ini: buka WhatsApp Web di komputer fotokopian, scan QR, cari file di antara chat, unduh, lalu cetak. Masalahnya:

- Privasi: chat dan kontak terbuka di komputer umum, dan ada risiko lupa logout.
- Lambat: scan QR, mencari file, dan mengunduh ulang setiap kali.
- Berantakan: file tugas menumpuk di chat dan di komputer fotokopian.
- Tampilan tidak terjamin: file Word yang dibuka di aplikasi lain bisa bergeser sebelum dicetak.

## 3. Tujuan, Non-Tujuan, dan Metrik

Tujuan:

1. Dari membuka situs sampai tombol Print siap dalam ≤ 20 detik untuk pengguna lama.
2. Pratinjau = hasil cetak = PDF unduhan (satu sumber kebenaran).
3. Konversi DOCX ke PDF dan PDF ke DOCX dengan fidelitas setinggi mungkin, gambar tidak dikompresi ulang.
4. Privasi sejak awal: file sementara, sesi pendek, tanpa data pribadi.
5. Upload dari HP tanpa login lewat QR.

Non-tujuan v1: edit dokumen online, penyimpanan jangka panjang, berbagi link publik, aplikasi native, pembayaran, integrasi langsung dengan mesin fotokopi.

Metrik keberhasilan:

- Waktu median buka situs sampai Print ≤ 20 detik.
- Keberhasilan konversi ≥ 98% dan skor fidelitas golden set sesuai Bagian 14.
- ≥ 40% akun memasang PIN.
- ≥ 30% pengguna kembali dalam 7 hari.
- Error upload < 2%.

## 4. Pengguna dan Skenario

Pengguna utama: pelajar/mahasiswa yang mengerjakan tugas di laptop atau HP lalu mencetak di fotokopian. Pengguna sekunder: operator fotokopian yang membuka halaman di komputer toko.

User story:

- Saya ingin membuat halaman hanya dengan username, tanpa email dan password.
- Saya ingin memasang PIN agar orang lain tidak bisa membuka file saya.
- Saya ingin upload dari HP dengan scan QR di layar komputer fotokopian tanpa login.
- Saya ingin pratinjau Word tampil persis seperti di Microsoft Word sebelum dicetak.
- Saya ingin mengunduh PDF dari file Word tanpa layout bergeser.
- Saya ingin file hilang sendiri setelah 48 jam, atau mematikan fitur itu.

## 5. Ruang Lingkup dan Fase

Prioritas: P0 wajib untuk MVP, P1 penting setelah MVP, P2 opsional.

- Fase 1 (MVP): akun username + PIN, kode pemulihan PIN, halaman pengguna, dropzone, QR upload (empty state & tombol header), semua tipe upload, pratinjau semua tipe, download asli & PDF (DOCX, PPTX, XLSX), print, update file, hapus otomatis per file & global, pengaturan.
- Fase 2: PDF ke DOCX (Mode Presisi & Mode Editable), peringatan font, optimasi pipeline konversi.
- Fase 3: OCR untuk PDF hasil scan, unduh semua sebagai ZIP, mode gelap, ganti username, notifikasi.

## 6. Alur Pengguna

**A. Masuk atau membuat halaman**

1. Buka wert.web.id, ketik username, tekan “Buka”.
2. Username belum ada: tampil “Buat halaman wert.web.id/username” dengan opsi PIN 4 angka (boleh dilewati). Setelah dibuat, halaman terbuka.
3. Username sudah ada tanpa PIN: halaman langsung terbuka. Jika ber-PIN: layar PIN tampil dulu.

**B. Upload dari desktop:** halaman kosong menampilkan dropzone, pengguna drag & drop atau klik, progres tampil, lalu file muncul di daftar.

**C. Upload dari HP:** halaman kosong di desktop menampilkan QR, HP scan dan membuka `/u/{token}` tanpa login/PIN, pengguna memilih atau memotret file, lalu layar desktop terbarui otomatis.

**D. Cetak:** klik file, lihat pratinjau, tekan Print, dialog cetak browser muncul, lalu tampil pertanyaan “Keluar sekarang?”.

**E. Hapus otomatis:** tiap file punya hitung mundur, dan saat habis file dihapus permanen.

## 7. Kebutuhan Fungsional

### 7.1 Akun dan Username

- (P0) Username 3–20 karakter: a–z, 0–9, `-`, `_` (tidak diawali atau diakhiri simbol), disimpan huruf kecil, dengan cek ketersediaan real-time.
- (P0) Daftar kata terlarang agar tidak bentrok dengan rute aplikasi: admin, api, app, login, settings, u, privacy, terms, static, www, wert, dan sejenisnya.
- (P0) Tanpa email, password, atau nomor HP.
- (P0) Username tidak dapat diganti di v1 karena mengubah link (P2: ganti username).
- (P0) Akun tanpa file dan tanpa aktivitas selama 30 hari dihapus otomatis agar username bisa dipakai kembali.

### 7.2 PIN dan Sesi

- (P0) PIN 4 angka bersifat opsional: dibuat saat registrasi, atau ditambah, diubah, dan dihapus di Pengaturan. Ubah dan hapus PIN meminta PIN lama.
- (P0) PIN disimpan sebagai hash Argon2id dengan salt unik dan pepper di server, tidak pernah plaintext.
- (P0) Anti-tebak: 10.000 kombinasi mudah ditembak, sehingga maksimum 5 kali salah per username per 15 menit lalu dikunci 15 menit, ditambah rate limit per IP, Cloudflare Turnstile setelah 3 kali salah, dan pesan error generik.
- (P0) Sesi memakai cookie HttpOnly, Secure, SameSite=Lax; idle 30 menit, maksimum 2 jam; tombol “Keluar” jelas; tidak ada “ingat saya” secara default.
- (P1) Mode komputer umum: `Cache-Control: no-store`, pertanyaan “Keluar sekarang?” setelah cetak, dan opsi “perangkat pribadi” 7 hari dengan peringatan.
- (P0) Pemulihan PIN: kode pemulihan 12 karakter (format: `WERT-XXXX-XXXX`) yang ditampilkan sekali saat PIN dipasang dan disimpan sebagai hash (`recovery_hash`), plus opsi hard reset (hapus seluruh file dan PIN bila kode pemulihan hilang) agar username tidak terkunci selamanya.

### 7.3 Halaman Pengguna dan Empty State

- URL `wert.web.id/{username}`; header berisi username, Pengaturan, dan Keluar.
- Bila ada file: daftar kartu file (ikon tipe, nama, ukuran, waktu upload, hitung mundur hapus) dan tombol “Tambah file”.
- Bila belum ada file: File Dropzone besar. Di desktop, QR code tampil di samping dropzone. Di mobile QR tidak dirender sama sekali; yang tampil hanya dropzone dengan tombol “Pilih file” dan “Ambil foto”.
- Aturan QR: hanya saat akun belum punya file; hanya pada viewport desktop (media query `(min-width:1024px) and (pointer:fine)`); token diminta ke server hanya bila kondisi itu terpenuhi; QR dirotasi tiap 10 menit dengan hitung mundur dan tombol “Perbarui QR”.
- Begitu file pertama masuk, dari desktop maupun HP, tampilan beralih otomatis ke daftar file (Supabase Realtime, fallback polling 3 detik).
- (P0) Menu / tombol “Upload dari HP (QR)” selalu dapat diakses dari header/navbar walau akun sudah memiliki file, membuka modal/drawer QR yang aktif.

### 7.4 Upload

- (P0) Dropzone mendukung drag & drop, klik, multi-file, progres per file, batal, coba ulang, dan upload resumable (TUS).
- (P0) Tipe didukung: .docx, .pdf, .xlsx (diasumsikan “.xlxs” berarti .xlsx), .pptx, .jpg/.jpeg, .png, .heic, .zip. Selain itu ditolak dengan pesan jelas. Validasi ekstensi, MIME, dan magic bytes di klien dan server.
- (P0) Batas (asumsi, dapat dikonfigurasi): 50 MB per file, 20 file per akun, 100 MB total per akun.
- (P0) Upload langsung ke Supabase Storage lewat signed upload URL atau TUS, bukan lewat Vercel Function, karena batas body request Vercel Function sekitar 4,5 MB.
- (P0) Nama file disanitasi, object key acak (UUID), dan nama duplikat diberi akhiran (1).
- (P0) Upload via QR: halaman `/u/{token}` mobile-first tanpa login atau PIN. Token hanya boleh upload (tidak bisa melihat atau mengunduh file), acak ≥ 128 bit (disimpan sebagai hash), TTL 10 menit yang diperpanjang saat aktif hingga maksimum 30 menit, batas 20 file, dan rate limit per token/IP. Token hanya diterbitkan kepada sesi yang sudah lolos PIN. Layar HP menampilkan “Pilih file”, “Ambil foto”, status tiap file, dan pesan “Selesai, cek layar komputer”.

### 7.5 Pratinjau

Prinsip: semua dokumen dirender menjadi PDF lalu ditampilkan dengan PDF.js. Hasil konversi di-cache di Storage dan dibuat ulang saat file di-update. Cara ini menjamin pratinjau = hasil cetak = PDF unduhan. Renderer JavaScript khusus DOCX tidak dipakai karena hasilnya sering berantakan, dan viewer pihak ketiga (Office Online, Google) tidak dipakai karena menuntut file publik atau mengirim file ke pihak lain.

| Tipe | Pratinjau | Cetak | Unduhan |
| --- | --- | --- | --- |
| PDF | File asli lewat PDF.js | File asli | Asli; tombol “Download Word” |
| DOCX | Dikonversi ke PDF lalu PDF.js | PDF hasil konversi | Asli; tombol “Download PDF” |
| PPTX | Dikonversi ke PDF (1 slide = 1 halaman) | PDF hasil konversi | Asli; tombol “Download PDF” |
| XLSX | Dikonversi ke PDF mengikuti pengaturan halaman sheet | PDF hasil konversi | Asli; tombol “Download PDF” |
| JPG, PNG | Gambar asli dengan zoom dan geser | Disesuaikan ke halaman | Asli |
| HEIC | Derivatif JPEG kualitas tinggi; HEIC asli tidak diubah | Derivatif | HEIC asli (P2: JPG) |
| ZIP | Tanpa pratinjau; daftar isi (nama, ukuran) dibaca dari central directory tanpa ekstrak | Tidak ada | Asli |

Viewer: zoom, fit-width, penomoran halaman, render sesuai devicePixelRatio agar tajam, render halaman secara lazy, status “Menyiapkan pratinjau…”, dan fallback error “Pratinjau gagal, file asli tetap bisa diunduh”.

### 7.6 Aksi pada File

- Update file (P0): pilih file pengganti dan konfirmasi. File lama diganti secara atomik (ID dan posisi sama; jika upload gagal, file lama tetap utuh), pratinjau dibuat ulang, dan timer 24 jam di-reset. Tanpa riwayat versi di v1.
- Download (P0): file asli byte-identik lewat signed URL berumur ≤ 60 detik, `Content-Disposition: attachment`, nama asli.
- Download PDF (P0, untuk .docx, .pptx, .xlsx): hasil konversi yang sama dengan pratinjau; nama `{nama}.pdf`.
- Download Word (P1, khusus .pdf): konversi sesuai Bagian 7.8, berjalan asinkron dengan status progres.
- Print (P0): .docx, .pptx, .xlsx mencetak PDF hasil konversi; PDF mencetak file aslinya; gambar mencetak versi yang disesuaikan ke halaman. Implementasi: muat PDF di iframe tersembunyi lalu panggil `print()`, dengan fallback membuka PDF di tab baru (viewer bawaan browser). Uji di Chrome, Edge, Firefox, Safari, dan di komputer fotokopian nyata karena mode kiosk bisa memblokir popup.
- Hapus (P0) dengan konfirmasi. P2: ganti nama, pilih banyak, unduh semua.

### 7.7 Konversi DOCX ke PDF

Persyaratan produk: posisi teks, font, tabel, header/footer, nomor halaman, dan batas halaman tidak bergeser; teks tidak pindah halaman; gambar tidak berpindah posisi; foto tidak dikompresi ulang, tidak di-downsample, dan resolusinya tidak berubah.

**Catatan teknis yang jujur:** DOCX tidak menyimpan “halaman” jadi. Tata letak dihitung oleh mesin render saat file dibuka. Hanya Microsoft Word sendiri yang menjamin layout 100% identik dengan Word. Mesin lain bisa sangat dekat untuk dokumen tugas umum, tetapi dapat berbeda pada font yang tidak terpasang, tabel kompleks, text box, SmartArt, WordArt, rumus, dan field. Karena itu target diukur lewat kriteria teruji (Bagian 14), bukan klaim “identik mutlak”.

Pilihan mesin (perlu keputusan):

- A. Gotenberg/LibreOffice self-hosted di container terpisah (Fly.io, Railway, Cloud Run, atau VPS). Murah, data tetap privat, fidelitas baik untuk dokumen umum. Vercel tidak cocok menjalankan LibreOffice. Wajib memasang font metrik-kompatibel (Carlito, Caladea, Liberation) dan font umum lain yang lisensinya jelas.
- B. API atau library komersial dengan mesin layout sendiri (misalnya Aspose.Words). Biasanya fidelitas lebih tinggi, berbayar, dan file dikirim ke pihak ketiga bila memakai cloud.
- C. Microsoft Graph (konversi di Word Online lewat OneDrive/SharePoint). Paling dekat dengan Word, tetapi butuh tenant Microsoft 365 berlisensi, file sementara diunggah ke tenant, dan ada kuota API.

Rekomendasi: mulai dengan A di balik antarmuka `ConversionProvider` agar mudah diganti, uji dengan golden set, dan pindah ke B atau C bila hasil di bawah target pada dokumen nyata.

Aturan konversi:

- (P0) Matikan reduksi resolusi gambar (`ReduceImageResolution=false`) dan gunakan kompresi lossless atau pass-through JPEG asli (`UseLosslessCompression=true` atau Quality 100). Ukuran PDF akan lebih besar; itu trade-off yang disengaja.
- (P0) Embed semua font; jangan mengubah ke PDF/A atau mengaktifkan optimasi ukuran.
- (P0) Verifikasi otomatis setelah konversi: jumlah halaman, daftar font (`pdffonts`), dan dimensi piksel gambar (`pdfimages -list`) dibandingkan dengan media di `word/media/`. Bila berbeda, catat di log dan tampilkan peringatan.
- (P1) Deteksi font di `fontTable.xml` yang tidak tersedia di mesin konversi, lalu tampilkan “Font X tidak tersedia, tampilan bisa sedikit berbeda. Untuk hasil paling akurat, simpan sebagai PDF dari Word lalu upload PDF.”
- (P0) Sandbox: container tanpa akses jaringan keluar, timeout 60 detik, batas CPU dan memori, makro dan link eksternal dinonaktifkan, konversi asinkron lewat tabel `conversion_jobs`.
- Perilaku field (daftar isi, referensi silang, nomor halaman romawi atau arab per section) wajib diuji di golden set.

### 7.8 Konversi PDF ke DOCX

Persyaratan produk: hasil terlihat sama dengan PDF (posisi teks, font, tabel, header/footer, nomor halaman, batas halaman) dan gambar tidak dikompresi ulang atau di-downsample.

**Catatan teknis yang jujur:** PDF berisi instruksi menggambar pada koordinat tetap, bukan paragraf, tabel, atau alur teks. Hasil yang sama persis dengan PDF sekaligus mudah diedit tidak bisa dijamin; selalu ada trade-off. Karena itu ada dua mode:

- Mode Presisi (default): tampilan diutamakan. Teks ditempatkan pada posisi absolut (frame atau text box), jumlah halaman sama, gambar disematkan dari stream aslinya tanpa re-encode. Kurang nyaman diedit.
- Mode Editable (P1): paragraf dan tabel direkonstruksi sehingga mudah diedit pengguna di Microsoft Word, dengan opsi pemilihan mode sebelum unduh.

Mesin yang dievaluasi: Adobe PDF Services API (umumnya dinilai berkualitas tinggi, berbayar per transaksi, file dikirim ke Adobe), pdf2docx (open-source, dijalankan di container; cukup untuk PDF sederhana, lemah untuk layout kompleks), atau API komersial lain. Pilih berdasarkan golden set, bukan reputasi.

- (P1) Ekstrak gambar asli (`pdfimages -all` atau pass-through) lalu sematkan tanpa re-encode.
- (P1) Label tombol “Download Word (.docx)” dengan tooltip “Hasil konversi PDF ke Word bisa sedikit berbeda dari PDF asli”.
- (P1) Kasus gagal: PDF terenkripsi atau ber-password menampilkan pesan jelas; PDF hasil scan menampilkan peringatan (OCR di Fase 3).

### 7.9 Hapus Otomatis 24 Jam

- (P0) Default aktif per file: tiap file memiliki timer mandiri (`expires_at`, default 24 jam sejak upload atau update).
- (P0) Kontrol per file & global: Pengguna dapat mematikan auto-delete untuk file tertentu (`expires_at = NULL`) atau menekan tombol “Perpanjang 24 jam”. Di Pengaturan akun juga terdapat saklar preferensi default untuk file baru.
- (P0) Hitung mundur di tiap file (“Dihapus dalam 23 j 12 m”), kuning di bawah 6 jam, merah di bawah 1 jam. (P1: tombol “Perpanjang 24 jam”.)
- (P0) Eksekusi: Supabase `pg_cron` tiap 10 menit memicu job purge (Edge Function atau route Vercel dengan secret) yang menghapus objek Storage, derivatif (PDF hasil konversi, JPEG HEIC), dan baris database. Vercel Cron pada plan gratis terbatas frekuensinya, jadi cek batas plan sebelum memakainya.
- (P0) Penghapusan lazy: semua query memfilter `expires_at > now()` dan signed URL tidak diterbitkan untuk file kedaluwarsa, sehingga file tidak bisa diakses meski job purge terlambat.
- (P1) Job rekonsiliasi harian membandingkan Storage dengan database dan membersihkan objek yatim.
- Penghapusan permanen, tanpa tempat sampah. Karena tidak ada email, pemberitahuan hanya berupa banner di halaman.

### 7.10 Pengaturan

- PIN: pasang, ubah, hapus.
- Hapus otomatis: aktif atau nonaktif.
- Hapus semua file.
- Hapus akun (ketik username dan PIN bila ada).
- Info kuota terpakai.
- Keluar.

## 8. Kebutuhan UX

- Bahasa Indonesia; halaman upload mobile-first, halaman pratinjau dan cetak dioptimalkan untuk desktop.
- Halaman masuk berisi satu input besar dengan autofocus dan tombol “Buka”.
- Input PIN bersifat numerik (`inputmode=numeric`), tidak diisi otomatis browser.
- Semua keadaan dirancang: kosong, memuat, error, kedaluwarsa, kuota penuh, koneksi putus.
- Aksesibilitas WCAG AA: navigasi keyboard, fokus terlihat, kontras cukup.
- Browser komputer fotokopian bisa lama: dukung dua versi mayor terakhir Chrome, Edge, Firefox, serta Safari iOS 15+.

## 9. Arsitektur Teknis

- Next.js (App Router, TypeScript) di Vercel untuk UI dan Route Handlers. Domain wert.web.id diarahkan ke Vercel dengan HTTPS dan HSTS.
- Supabase Postgres untuk data. Karena tidak memakai Supabase Auth, aktifkan RLS tanpa policy publik dan akses semua data lewat server dengan service role.
- Supabase Storage dengan bucket privat `uploads` dan `derived`. Cek batas ukuran file per plan Supabase sebelum menetapkan batas 50 MB.
- Layanan konversi di container terpisah (Gotenberg/LibreOffice, plus mesin PDF ke DOCX), hanya dapat dipanggil dengan secret atau allowlist IP.
- Antrian job lewat tabel `conversion_jobs` (queued, running, done, failed) dengan retry maksimum 2 kali. Klien memantau status lewat Realtime atau polling. Konversi harus asinkron karena batas durasi Vercel Function.
- Sesi: ID acak 256-bit di cookie, disimpan sebagai hash di tabel `sessions`.
- Rate limiting dengan Upstash Redis atau Vercel Firewall; Cloudflare Turnstile untuk anti-bot.
- Observabilitas: Sentry, Vercel Analytics, log terstruktur tanpa isi dokumen, alert saat konversi gagal.

## 10. Model Data

- `users`: id, username (unik, citext), pin\_hash (null), pin\_failed\_count, pin\_locked\_until, auto\_delete\_enabled (default true), recovery\_hash (null), created\_at, last\_active\_at.
- `files`: id, user\_id, display\_name, ext, mime, size\_bytes, storage\_key, kind, status (uploading, ready, processing, failed), pdf\_key, docx\_key, preview\_key, page\_count, missing\_fonts, created\_at, updated\_at, expires\_at (null), version.
- `sessions`: id\_hash, user\_id, expires\_at, last\_seen\_at, ip\_hash.
- `upload_tokens`: id, token\_hash, user\_id, expires\_at, max\_files, files\_uploaded, revoked\_at.
- `conversion_jobs`: id, file\_id, type (docx\_to\_pdf, pdf\_to\_docx, pptx\_to\_pdf, xlsx\_to\_pdf, heic\_to\_jpg), status, attempts, error, started\_at, finished\_at.
- Indeks: `users(username)`, `files(user_id)`, `files(expires_at)` parsial untuk nilai non-null.

## 11. Rute dan API

Halaman: `/`, `/{username}`, `/{username}/settings`, `/u/{token}`, `/privacy`, `/terms`.

API utama:

- `POST /api/auth/check`, `/register`, `/login`, `/logout`.
- `GET /api/files`; `POST /api/files/init` (signed upload atau TUS); `POST /api/files/{id}/complete`; `PUT /api/files/{id}/replace`; `DELETE /api/files/{id}`.
- `GET /api/files/{id}/download?variant=original|pdf|docx`; `POST /api/files/{id}/convert`.
- `POST /api/upload-sessions` (butuh sesi) menghasilkan token dan URL QR; `POST /api/u/{token}/files/init` (anonim, dibatasi token).
- `PATCH /api/settings`; `POST /api/settings/pin`.
- `POST /api/cron/purge` (dilindungi secret).

Semua endpoint memvalidasi kepemilikan file di server (cegah IDOR) dan memakai token CSRF untuk operasi yang mengubah data.

## 12. Keamanan dan Privasi

- **Akses hanya dengan username:** tanpa PIN, siapa pun yang tahu atau menebak username dapat melihat, mengunduh, dan menghapus file. Ini konsekuensi desain yang diminta. Mitigasi: dorong pemasangan PIN (banner saat upload pertama: “Pasang PIN agar file tidak bisa dibuka orang lain”), tanpa daftar atau pencarian pengguna, rate limit pada pengecekan username, `noindex` (robots dan `X-Robots-Tag`), dan hapus otomatis 48 jam.
- **PIN 4 angka lemah:** hash Argon2id, lockout, Turnstile, dan rate limit (lihat 7.2).
- **Penyimpanan file:** bucket privat, signed URL ≤ 60 detik, object key acak, `Cache-Control: private, no-store`, enkripsi at rest bawaan Supabase.
- **File berbahaya:** validasi magic bytes; konversi di sandbox tanpa jaringan; ZIP tidak pernah diekstrak di server (hanya baca daftar isi dengan batas jumlah entri); `X-Content-Type-Options: nosniff`; tidak pernah menyajikan HTML dari upload; (P2) pindai ClamAV.
- **Token QR:** acak ≥ 128 bit, TTL singkat, hanya-upload, rate limit, kuota. Token hanya diterbitkan ke sesi yang lolos PIN. Foto QR yang tersebar tidak berbahaya setelah TTL habis.
- **Komputer umum:** sesi pendek, no-store, tombol Keluar menonjol, prompt keluar setelah cetak.
- **Web:** CSP ketat, CSRF, sanitasi nama file saat ditampilkan, dan `pdfjs-dist` selalu versi terbaru (versi lama punya celah XSS, CVE-2024-4367).
- **Penyalahgunaan sebagai hosting file:** batas pembuatan akun per IP (mis. 5 per hari), kuota kecil, dan form laporan penyalahgunaan.
- **Hukum:** siapkan Kebijakan Privasi dan Syarat Layanan; data dikumpulkan seminimal mungkin (username, hash IP, user agent); log tidak memuat isi dokumen; file tidak dipakai untuk analitik atau pelatihan AI. Konsultasikan dengan ahli hukum terkait UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022).

## 13. Kebutuhan Non-Fungsional

- Performa: LCP < 2,5 detik di 4G; halaman pertama PDF ≤ 5 MB tampil < 2 detik; konversi DOCX ≤ 5 MB p95 < 30 detik; PDF ke DOCX p95 < 90 detik.
- Ketersediaan target 99,5% (bergantung SLA vendor).
- Skala awal: 1.000 akun aktif. Hitung biaya Storage dan konversi untuk skenario terburuk sebelum rilis.
- Cadangan database harian; file tidak dicadangkan karena sementara.

## 14. Pengujian dan Kriteria Penerimaan

**Golden test set:** ≥ 50 DOCX tugas nyata (cover, daftar isi, header/footer, nomor halaman, tabel dengan merge cell, foto 5–20 MP, rumus, footnote, kolom, section landscape, font Times New Roman, Calibri, Arial, Cambria, dan font kustom), ≥ 30 PDF (dari Word, LaTeX, Canva, hasil scan), 10 PPTX, 10 XLSX, foto HEIC dari iPhone. Referensi: PDF yang diekspor dari Microsoft Word asli.

**Penerimaan DOCX ke PDF** (ambang dikalibrasi saat pilot):

- Jumlah halaman sama pada ≥ 95% dokumen (target 100% untuk dokumen tanpa fitur lanjutan).
- Kemiripan visual per halaman SSIM ≥ 0,97 pada 150 DPI terhadap referensi, sisanya ditinjau manual.
- Blok teks bergeser ≤ 1 mm pada ≥ 95% halaman.
- 100% gambar: dimensi piksel di PDF sama dengan sumber di `word/media/`, tanpa downsample; kompresi lossless atau JPEG asli.
- Header/footer dan nomor halaman muncul pada halaman yang sama.
- Semua font yang tersedia tertanam; font yang tidak tersedia dilaporkan.

**Penerimaan PDF ke DOCX (Mode Presisi):** jumlah halaman sama, dimensi piksel gambar sama, teks dapat dicari dan disalin, SSIM ≥ 0,90 terhadap PDF asal (dikalibrasi saat pilot).

**Pengujian fungsional dan keamanan:** e2e Playwright untuk alur A–E termasuk QR di Safari iOS dan Chrome Android; uji IDOR (akun A tidak bisa mengakses file akun B); uji kedaluwarsa signed URL dan token QR; uji lockout PIN; uji purge dengan waktu dipercepat; uji beban upload dan konversi paralel; uji langsung di minimal 3 fotokopian.

## 15. Risiko dan Mitigasi

- Ekspektasi “sama persis” tidak realistis: golden set, transparansi di UI, opsi mesin B atau C, tips upload PDF dari Word.
- Kualitas PDF ke DOCX: Mode Presisi, label jujur pada tombol, jadwalkan di Fase 2.
- Data bocor karena akses tanpa PIN: nudge PIN, hapus 48 jam, rate limit.
- Biaya mesin komersial dan Storage: kuota, hapus otomatis, anggaran per konversi.
- Batas Vercel dan Supabase (body, durasi, ukuran file): upload langsung ke Storage dan konversi asinkron.
- Komputer fotokopian membatasi browser, popup, atau print: uji lapangan dini.
- Lisensi font Microsoft: gunakan font metrik-kompatibel; jangan mendistribusikan font tanpa lisensi.
- HEIC tidak tampil di semua browser: derivatif JPEG di server.
- Penyalahgunaan dan masalah hukum: batas akun, laporan penyalahgunaan, kebijakan privasi.

## 16. Milestone (estimasi kasar untuk 1 developer)

- M0, 3 hari: domain, proyek Vercel dan Supabase, skema, CI.
- M1, 1,5 minggu: akun, PIN, sesi, halaman pengguna.
- M2, 1,5 minggu: dropzone, TUS, QR upload, daftar file real-time.
- M3, 2 minggu: pipeline pratinjau, DOCX ke PDF, print, download, golden test.
- M4, 1 minggu: hapus otomatis, pengaturan, pengerasan keamanan.
- M5, 1,5 minggu: PDF ke DOCX, PPTX, XLSX, HEIC, ZIP, polesan UI.
- M6, 1 minggu: pilot di fotokopian, perbaikan, rilis.

Total sekitar 9–10 minggu.

## 17. Keputusan Final & Rencana Implementasi

Berdasarkan keputusan produk per 22 Oktober 2026, seluruh pertanyaan terbuka telah disepakati sebagai berikut:

1. **Mesin Konversi: Opsi A (Gratis / Open Source - Gotenberg / LibreOffice)**
   - Menggunakan Gotenberg (LibreOffice headless) yang di-deploy dalam container gratis/murah (Cloud Run free tier, Railway, atau VPS sendiri).
   - Anggaran bulanan lisensi software: Rp 0 / $0.
   - Dilengkapi paket font metrik-kompatibel lengkap (Carlito, Caladea, Liberation Fonts, plus open-source clones untuk Times New Roman, Calibri, Arial, dan Cambria).
   - Diisolasi di balik interface `DocumentConverterProvider` agar dapat diganti jika dibutuhkan di masa mendatang.

2. **Pemulihan PIN: Kode Pemulihan 12-Karakter (Tanpa Email)**
   - Saat pengguna membuat PIN 4 angka, sistem meng-generate kode pemulihan unik 12 karakter (format: `WERT-XXXX-XXXX`, Base32/alfanumerik) dan meminta pengguna menyimpannya.
   - Disimpan di database sebagai hash (`recovery_hash`), tidak pernah disimpan plaintext.
   - Prinsip Zero-PII tetap terjaga (tanpa meminta email atau nomor telepon).
   - Sedia juga opsi *hard reset* (hapus seluruh file & PIN lama) jika pengguna lupa PIN dan kehilangan kode pemulihan.

3. **Hapus Otomatis (Auto-Delete): Berbasis Per File**
   - Tiap file memiliki countdown timer mandiri (`expires_at`, default 48 jam).
   - Pengguna dapat mematikan auto-delete per file tertentu atau memperpanjang timer (+48 jam) langsung dari daftar file.
   - Di Pengaturan akun tetap ada default preferensi global untuk file-file baru yang diunggah.

4. **Visibilitas QR Upload dari HP: Ya, Tersedia Setiap Saat**
   - Pada *empty state* desktop: QR ditampilkan besar di samping dropzone.
   - Saat akun sudah memiliki file: terdapat tombol/menu permanen "Upload dari HP (QR)" di header/navigasi yang membuka Modal/Drawer berisi QR Code interaktif.

5. **Download PDF untuk PPTX dan XLSX: Ya, Sedia Tombol "Download PDF"**
   - Karena PPTX dan XLSX sudah dikonversi menjadi PDF untuk pratinjau dan pencetakan, tombol "Download PDF" langsung menyajikan file PDF hasil konversi (`pdf_key`) yang sudah ada di Supabase Storage tanpa beban komputasi tambahan.

6. **PDF ke Word: Ya, Menyediakan Mode Presisi dan Mode Editable**
   - Mode Presisi (default): menjaga tampilan visual, margin, posisi gambar, dan tabel identik dengan PDF asli untuk keperluan cetak.
   - Mode Editable: merekonstruksi paragraf dan alur teks agar mudah diedit pengguna di Microsoft Word.
   - Ditandai dengan label dan tooltip informatif di UI.

7. **Penghapusan Akun Tidak Aktif: 30 Hari**
   - Akun tanpa file dan tanpa aktivitas selama 30 hari akan dihapus otomatis oleh sistem cron agar username dapat digunakan kembali oleh pengguna lain.

8. **Branding & Model Bisnis: Ya, "Wert" (wert.web.id) & 100% Gratis**
   - Nama resmi: **Wert** dengan domain `wert.web.id`.
   - Model bisnis awal: 100% gratis untuk pengguna tanpa biaya langganan, dengan opsi tip/donasi sukarela komunitas (Saweria/Kofi).
