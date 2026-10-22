# design.md — wert.web.id (desain ulang)

Dokumen desain untuk redesign **wert.web.id**, layanan titip file tugas untuk dicetak tanpa lewat WhatsApp. Mencakup 4 layar: **Beranda**, **Daftar file**, **Pratinjau & cetak** (modal), **Pengaturan akun**.

Dokumen ini ditulis agar bisa langsung dipakai sebagai acuan implementasi (Next.js + Tailwind CSS), termasuk oleh AI coding agent.

---

## 1. Konsep

**Siapa pemakainya:** pelajar dan mahasiswa yang berdiri di depan meja fotokopi, sering memegang HP, sering terburu-buru.

**Tugas utama situs:** file sampai ke tangan tukang fotokopi secepat mungkin, dengan rasa aman bahwa file itu akan hilang sendiri.

**Arah visual: "kertas cerah, stabilo kuning".**
Dasarnya putih-mint yang segar, hijau cerah sebagai warna merek, dan satu sentuhan kuning stabilo untuk hal yang perlu diperhatikan. Rasa "fotokopian" muncul lewat bentuk lembaran kertas, label jenis file berwarna, dan tombol utama bergaya stiker (bergeser saat ditekan).

**Prinsip:**
1. **Satu momen berani per layar.** Beranda: kolom alamat raksasa. Daftar file: tombol Tambah file. Sisanya tenang dan rapi.
2. **Waktu hapus adalah fitur utama**, bukan keterangan kecil. Dibuat jelas dengan label waktu berwarna.
3. **Setiap file punya wajah sendiri** (warna jenis file + thumbnail), bukan deretan kartu putih yang sama.
4. **Mobile dulu.** Lebih dari separuh pemakaian terjadi di HP.
5. **Terang di mana-mana.** Tidak ada panel abu gelap, termasuk di area pratinjau.

---

## 2. Perubahan dari desain lama

| Masalah di desain lama | Solusi di desain baru |
|---|---|
| Beranda kosong, kartu kecil melayang di tengah | Beranda dua kolom: judul + kolom alamat besar di kiri, ilustrasi printer-lembaran di kanan |
| Tiga kartu fitur sempit, teks terpotong baris | Satu pita horizontal dengan tiga item, tiap item punya warna ikon sendiri |
| Semua kartu file identik, nama file terpotong | Kartu berpanel warna jenis file + thumbnail, nama dua baris, nama lengkap muncul saat di-hover/ditekan lama |
| Sisa waktu hapus hanya teks kecil | Label waktu berubah warna: hijau → kuning → merah menurut sisa waktu |
| Pratinjau PDF berlatar abu gelap, tombol cetak ganda (modal dan toolbar bawaan browser) | Latar mint terang, toolbar sendiri, satu tombol Cetak yang jelas |
| Kuota hanya angka | Meter progres dengan peringatan warna |
| Zona bahaya berlatar pink penuh | Kartu putih berbingkai merah tipis; tombol merah solid hanya muncul di dialog konfirmasi |
| Bahasa formal ("Anda") | Bahasa akrab ("kamu"), kalimat pendek |

> Catatan: lingkaran hitam berlogo **N** di pojok kiri bawah pada screenshot adalah indikator dev Next.js. Tidak tampil di versi produksi dan tidak perlu didesain.

---

## 3. Design tokens

### 3.1 Warna

| Token | Nama | Hex | Dipakai untuk |
|---|---|---|---|
| `--ink` | Tinta | `#10241B` | Teks utama, bingkai stiker, ikon |
| `--muted` | Abu hijau | `#587063` | Teks sekunder, placeholder |
| `--bg` | Kertas mint | `#F4FBF7` | Latar halaman |
| `--surface` | Putih | `#FFFFFF` | Kartu, modal, input |
| `--line` | Garis | `#D5EADF` | Border tipis, pemisah |
| `--mint` | Mint | `#E3F8EC` | Latar ikon, baris terpilih, hover |
| `--brand` | Hijau segar | `#19C37D` | Isi dekoratif, meter, status aktif (teks di atasnya wajib `--ink`) |
| `--brand-deep` | Hijau tua | `#087443` | Tombol utama (teks putih), tautan, teks hijau |
| `--hl` | Stabilo | `#FFE45C` | Sorotan, peringatan lembut, fokus perhatian |
| `--hl-soft` | Stabilo muda | `#FFF4B8` | Latar label peringatan |
| `--danger` | Merah | `#D92D3A` | Teks/tombol hapus |
| `--danger-soft` | Merah muda | `#FFEAEC` | Latar label bahaya |

**Warna jenis file** (panel kartu, ikon, label):

| Jenis | Isi | Latar muda | Teks |
|---|---|---|---|
| PDF | `#FF5A4F` | `#FFEAE7` | `#B4232E` |
| DOCX / DOC | `#3B82F6` | `#E4EEFF` | `#1D4ED8` |
| Gambar (PNG, JPG) | `#8B5CF6` | `#EFE9FF` | `#6D3FD6` |
| XLSX / CSV | `#19C37D` | `#E3F8EC` | `#087443` |
| PPTX | `#FF9A3D` | `#FFEFDD` | `#A4510A` |
| Lainnya | `#8AA095` | `#EDF3EF` | `#3F5448` |

**Aturan kontras:** teks di atas `--brand` dan `--hl` selalu `--ink`. Teks putih hanya di atas `--brand-deep` atau `--ink`. Teks kecil merah memakai `--danger`, bukan merah PDF.

### 3.2 Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul, wordmark, angka besar | **Bricolage Grotesque** | 700–800 | Karakter kuat, sedikit nyentrik. Letter-spacing `-0.02em` |
| Isi, tombol, label | **Plus Jakarta Sans** | 400–700 | Ramah, mudah dibaca, bagus untuk teks Indonesia |

Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`. Muat lewat `next/font/google` dengan `display: swap`.

**Skala (rasio ±1.25):**

| Token | Desktop | Mobile | Line-height | Dipakai |
|---|---|---|---|---|
| `display` | 56 | 36 | 1.05 | Judul beranda |
| `h1` | 36 | 28 | 1.15 | Judul halaman (Pengaturan akun) |
| `h2` | 24 | 20 | 1.25 | Judul bagian, judul modal |
| `h3` | 18 | 17 | 1.3 | Nama file, judul baris pengaturan |
| `body` | 16 | 16 | 1.55 | Isi |
| `small` | 14 | 14 | 1.45 | Meta, bantuan |
| `tiny` | 12 | 12 | 1.4 | Label jenis file |

Panjang baris isi maksimal ±65 karakter. Kalimat sentence case di seluruh antarmuka. Tidak memakai huruf kapital semua untuk label.

### 3.3 Bentuk, jarak, bayangan

**Jarak:** kelipatan 4 (`4 8 12 16 24 32 48 64 96`). Container maksimal **1120 px**, padding samping 24 (mobile 16).

**Radius bertingkat** (tidak satu ukuran untuk semua):

| Elemen | Radius |
|---|---|
| Label jenis file, chip kecil | 8 |
| Tombol, input biasa | 14 |
| Kartu file, kartu pengaturan | 20 |
| Kolom alamat beranda | 24 |
| Modal | 28 |
| Pil status (waktu hapus), toggle | 999 |

**Bayangan:**
- **Lembut (default):** `0 1px 2px rgba(8,116,67,.06), 0 8px 24px rgba(8,116,67,.08)` — kehijauan, bukan abu.
- **Stiker (hanya 1 elemen utama per layar):** bingkai 2 px `--ink` + `box-shadow: 4px 4px 0 var(--ink)`.
  - Hover: geser `-1px, -1px`, bayangan `5px 5px 0`.
  - Ditekan: geser `4px, 4px`, bayangan `0 0 0`. Ini umpan balik tindakan, jadi boleh dianimasikan.

### 3.4 Ikon

Lucide, stroke 1.75, ukuran 20 (16 di dalam label kecil, 24 di dalam tile). Ikon selalu menyertai teks pada aksi penting; ikon tunggal hanya untuk Pengaturan, Tutup, dan menu titik tiga, semuanya dengan `aria-label`.

### 3.5 Implementasi cepat

```css
:root {
  --ink: #10241B;   --muted: #587063;
  --bg: #F4FBF7;    --surface: #FFFFFF;   --line: #D5EADF;
  --mint: #E3F8EC;  --brand: #19C37D;     --brand-deep: #087443;
  --hl: #FFE45C;    --hl-soft: #FFF4B8;
  --danger: #D92D3A; --danger-soft: #FFEAEC;
  --shadow-soft: 0 1px 2px rgba(8,116,67,.06), 0 8px 24px rgba(8,116,67,.08);
  --shadow-sticker: 4px 4px 0 var(--ink);
}
```

```ts
// tailwind.config.ts (extend)
colors: {
  ink: "#10241B", muted: "#587063", bg: "#F4FBF7", line: "#D5EADF",
  mint: "#E3F8EC", brand: { DEFAULT: "#19C37D", deep: "#087443" },
  hl: { DEFAULT: "#FFE45C", soft: "#FFF4B8" },
  danger: { DEFAULT: "#D92D3A", soft: "#FFEAEC" },
},
borderRadius: { chip: "8px", ctl: "14px", card: "20px", hero: "24px", modal: "28px" },
fontFamily: {
  display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
  sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
},
```

---

## 4. Komponen bersama

### 4.1 Header (semua layar)
- Tinggi 64, putih 85% + blur, garis bawah `--line`, sticky.
- Kiri: logo (kotak hijau 40×40, radius 12, ikon printer putih) + wordmark **wert**`.web.id` (Bricolage 800; "wert" `--ink`, ".web.id" `--brand-deep`) + tagline "Cetak tugas tanpa WhatsApp" (`small`, `--muted`).
- Kanan (setelah masuk): chip halaman `@nama` (latar `--mint`, titik hijau kecil di kiri), tombol Upload dari HP, ikon Pengaturan, tombol Keluar (teks `--danger`, tanpa latar sampai hover).
- Mobile: tagline disembunyikan; Upload dari HP dan Keluar masuk ke menu di bawah chip `@nama`.

### 4.2 Tombol

| Varian | Tampilan | Dipakai |
|---|---|---|
| Utama | Latar `--brand-deep`, teks putih, tinggi 48, radius 14 | Cetak, Buka halaman, Simpan |
| Stiker | Utama + bingkai ink 2 px + bayangan stiker | Satu aksi terpenting per layar |
| Sekunder | Putih, border `--line`, teks `--ink` | Unduh, Tab baru, Ubah PIN |
| Teks | Tanpa latar, teks `--brand-deep` | Aksi ringan, "Kembali" |
| Bahaya | Putih + border/teks `--danger`; **solid merah hanya di dialog konfirmasi** | Hapus |

Target sentuh minimal 44×44. Status fokus: cincin 3 px `--brand` dengan jarak 2 px. Keadaan memuat: spinner kecil menggantikan ikon, teks tetap, tombol nonaktif.

### 4.3 Label jenis file
Kotak kecil radius 8, tinggi 22, latar dan teks menurut tabel 3.1, teks `tiny` tebal: `PDF`, `DOCX`, `PNG`.

### 4.4 Label waktu hapus ("pita hitung mundur")
Pil dengan ikon jam, teks `small`. **Warna menurut sisa waktu, ikon dan teks tetap ada agar tidak bergantung warna saja.**

| Sisa waktu | Latar | Teks | Contoh |
|---|---|---|---|
| Lebih dari 24 jam | `--mint` | `--brand-deep` | Dihapus dalam 38 j 4 m |
| 6–24 jam | `--hl-soft` | `--ink` | Dihapus dalam 11 j |
| Kurang dari 6 jam | `--danger-soft` | `--danger` | Dihapus dalam 2 j 15 m |
| Tidak dihapus | Abu `#EDF3EF` | `--muted` | Disimpan terus (ikon pin) |

`aria-label` penuh: "File ini akan dihapus dalam 38 jam 4 menit".

### 4.5 Meter progres
Tinggi 8, radius 999, latar `--mint`, isi `--brand`. Di atas 80% isi berubah `--hl`, di atas 95% menjadi `--danger`. Lebar minimal isi 6 px agar nilai kecil tetap terlihat. Selalu disertai angka di atasnya.

### 4.6 Toast
Kiri bawah (desktop) atau atas (mobile), putih, bayangan lembut, ikon sesuai hasil, hilang sendiri setelah 4 detik. Nama aksi sama dengan tombolnya: tombol "Hapus" → toast "File dihapus".

---

## 5. Layar

### 5.1 Beranda — "Buka halaman tugas"

**Tujuan:** pengguna mengetik nama halamannya lalu masuk, tanpa berpikir.

```
┌──────────────────────────────────────────────────────────────┐
│ [▣] wert.web.id                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Kirim file,                         ┌───────────────────┐   │
│  langsung cetak.                     │  ilustrasi:       │   │
│                                      │  HP + QR ─╮       │   │
│  Buka halaman tugasmu dan tunjukkan  │      printer      │   │
│  ke tukang fotokopi.                 │   ▭ ▭ ▭ lembaran  │   │
│                                      │  PDF DOCX PNG     │   │
│  ╔═══════════════════════════════╗   └───────────────────┘   │
│  ║ wert.web.id/ namamu   [Buka halaman] ║  ← kolom bergaya stiker
│  ╚═══════════════════════════════╝                           │
│  3–20 karakter: huruf kecil, angka, - atau _                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ [⎙ Siap cetak     │ [▯ Upload dari HP │ [◷ Hapus otomatis   │
│   ≤ 20 detik]     │   lewat scan QR]  │   setelah 48 jam]   │
└──────────────────────────────────────────────────────────────┘
```

**Perataan:** semua teks rata kiri; ilustrasi di kanan. Mobile: satu kolom, ilustrasi menyusut di atas judul atau disembunyikan di layar < 380 px.

**Isi dan copy:**
- Judul (`display`): **Kirim file, langsung cetak.**
- Subjudul (`body`, `--muted`, maks 2 baris): Buka halaman tugasmu, lalu tunjukkan ke tukang fotokopi. Tanpa chat WhatsApp.
- Label di atas kolom: **Nama halamanmu**

**Kolom alamat (momen berani layar ini):**
- Tinggi 72 (mobile 64), radius 24, latar putih, gaya stiker.
- Awalan `wert.web.id/` dalam Bricolage 600 22 px `--muted`, lalu input Bricolage 600 22 px `--ink`, placeholder `namamu`.
- Tombol **Buka halaman** (utama, tinggi 52, radius 16) di dalam kolom, sisi kanan. Mobile: tombol turun di bawah kolom, selebar penuh.
- Teks bantuan di bawahnya: "3–20 karakter: huruf kecil, angka, - atau _".

**Keadaan kolom:**

| Keadaan | Tampilan |
|---|---|
| Kosong | Tombol nonaktif (`--brand-deep` 40%) |
| Valid | Ikon centang hijau di kanan input, tombol aktif |
| Karakter tidak valid | Bingkai tetap ink, teks bantuan menjadi `--danger`: "Hanya huruf kecil, angka, - dan _" |
| Terlalu pendek | Bantuan: "Minimal 3 karakter" |
| Halaman dilindungi PIN | Setelah Buka halaman, muncul 4 kotak PIN (lihat 5.5) |
| Memuat | Spinner di tombol, teks tetap "Buka halaman" |

**Ilustrasi "printer-lembaran"** (SVG/CSS, tanpa foto stok): badan printer `--brand` berbingkai ink 2 px; tiga lembar keluar dengan kemiringan −4°, 0°, +5°, tiap lembar membawa label jenis file (PDF merah, DOCX biru, PNG ungu); HP kecil di kiri dengan QR, dihubungkan garis putus-putus ke printer. Satu garis stabilo kuning di salah satu lembar sebagai "coretan".

**Pita fitur:** satu panel putih radius 20 berisi tiga kolom dengan pemisah vertikal tipis (bukan tiga kartu terpisah). Tiap item: tile ikon 48×48 radius 14 + judul `h3` + satu baris `small`.
- Hijau (printer): **Siap cetak ≤ 20 detik** — Tanpa login WhatsApp
- Biru (ponsel): **Upload dari HP** — Scan QR, pilih file atau foto
- Kuning (jam): **Hapus otomatis 48 jam** — File tugasmu tidak menumpuk

Mobile: ketiganya menjadi daftar vertikal, ikon di kiri.

**Satu momen gerak (saat halaman dibuka):** tiga lembar meluncur keluar dari printer berurutan, total ±1,2 detik, sekali saja. Tidak ada animasi masuk lain di halaman ini.

---

### 5.2 Daftar file

**Tujuan:** menemukan file dan mencetaknya dalam dua ketukan.

```
┌────────────────────────────────────────────────────────────────┐
│ [▣] wert.web.id        (● @nama)  [Upload dari HP] ⚙  Keluar   │
├────────────────────────────────────────────────────────────────┤
│  File tugasmu                          ╔═══════════════════╗   │
│  4 file · 2,7 MB dari 200 MB           ║  + Tambah file    ║   │
│  ▓░░░░░░░░░░░░░░░░░░                   ╚═══════════════════╝   │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │▒▒ thumb ▒▒ │  │▒▒ ikon ▒▒  │  │▒▒ ikon ▒▒  │               │
│  │▒▒ (ungu)▒▒ │  │▒▒ (biru) ▒▒│  │▒▒ (biru) ▒▒│               │
│  ├────────────┤  ├────────────┤  ├────────────┤               │
│  │Nama_Proyek │  │SURAT_PERMO │  │Laprak_Ke5_ │               │
│  │_23.png   ⋮ │  │HONAN_PEMAN⋮│  │G1A026014 ⋮ │               │
│  │PNG · 1,3 MB│  │DOCX · 15KB │  │DOCX · 408KB│               │
│  │(◷ 38 j 4 m)│  │(⌖ Disimpan)│  │(◷ 38 j 2 m)│               │
│  │[Lihat&cetak][⭳]│ ...        │  ...                          │
│  └────────────┘  └────────────┘  └────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

**Struktur:**
- **Kepala halaman** (tanpa kartu pembungkus): judul `h1` "File tugasmu", di bawahnya ringkasan "4 file · 2,7 MB dari 200 MB" dengan meter progres tipis. Tombol **Tambah file** di kanan (varian stiker, satu-satunya di layar ini). Tombol Upload dari HP ada di header, tidak diulang di sini.
- **Grid file:** 3 kolom (≥ 1024), 2 kolom (≥ 640), 1 kolom di mobile. Jarak 20.

**Kartu file** (radius 20, putih, border `--line`, bayangan lembut):
1. **Panel atas** tinggi 112, latar warna muda jenis file. Gambar: thumbnail asli (halaman pertama PDF, gambar PNG/JPG, `object-fit: cover`). DOCX dan jenis lain: ikon besar 40 px berwarna jenis file di tengah.
2. **Nama file** `h3`, maksimal 2 baris lalu elipsis di tengah (ekstensi tetap terlihat). Nama lengkap lewat `title`/tooltip.
3. **Baris meta:** label jenis file + ukuran (`small`, `--muted`).
4. **Label waktu hapus** (lihat 4.4).
5. **Aksi:** tombol **Lihat & cetak** (utama, mengisi lebar) + tombol ikon **Unduh** (sekunder, 44×44, `aria-label="Unduh"`).
6. **Menu ⋮** di pojok kanan panel atas (tombol bulat putih 36×36, bayangan lembut). Isi: **Ganti nama**, **Atur waktu hapus**, **Hapus** (merah, dengan konfirmasi). Item menu mengikuti kebutuhan sistem yang ada.

Kartu yang waktu hapusnya < 6 jam mendapat border kiri `--danger` 3 px agar mudah dikenali.

**Mobile:** kartu berubah horizontal: thumbnail/ikon 72×72 di kiri, teks di kanan, aksi di baris bawah. Tombol Tambah file menjadi bar tetap di bawah layar (stiker, selebar penuh, dengan jarak aman area gestur). Di HP, label tombol menjadi **Ambil foto atau pilih file**; Upload dari HP di header disembunyikan karena pengguna sudah di HP.

**Keadaan:**
- **Kosong:** lembar kertas besar bersudut terlipat berbingkai putus-putus (area drop). Teks: "Belum ada file. Tarik file ke sini, atau scan QR dari HP." Dua tombol: **Tambah file** (stiker) dan **Upload dari HP**.
- **Menyeret file ke halaman:** seluruh area konten tertutup lapisan `--mint` 90% dengan bingkai putus-putus `--brand-deep`, teks "Lepas file untuk mengunggah".
- **Mengunggah:** kartu sementara dengan skeleton panel, nama file, meter progres di tempat label waktu. Selesai: kartu "mengendap" (naik 4 px lalu turun, 200 ms) dan toast "File ditambahkan".
- **Kuota hampir penuh:** ringkasan berubah kuning (≥ 80%) atau merah (≥ 95%) dengan teks "Sisa ruang 12 MB" dan tautan "Atur penyimpanan" ke Pengaturan akun.
- **Gagal memuat:** teks "File belum bisa dimuat. Periksa koneksi, lalu coba lagi." + tombol **Coba lagi**.

**Modal "Upload dari HP":** kiri kode QR besar (200×200, bingkai ink 2 px, radius 20), kanan tiga langkah singkat ("Buka kamera HP", "Arahkan ke kode", "Pilih file"), di bawahnya tautan pendek yang bisa disalin dengan tombol **Salin tautan**. Masa berlaku kode mengikuti sistem dan ditampilkan sebagai teks kecil.

---

### 5.3 Pratinjau & cetak (modal)

**Tujuan:** memastikan file benar, lalu mencetak. Satu aksi utama.

```
┌──────────────────────────────────────────────────────────────┐
│ [PDF] TEMPLATE_LAPRAK_PSM_-_C…6_.pdf       [⎙ Cetak dokumen] │
│       28 halaman · 1 MB       [↗ Tab baru] [⭳ Unduh]    ✕   │
├──────────────────────────────────────────────────────────────┤
│  (latar mint #E3F8EC)                                        │
│        ┌──────────────────────────┐                          │
│        │  halaman PDF (putih)     │                          │
│        │                          │                          │
│        └──────────────────────────┘                          │
├──────────────────────────────────────────────────────────────┤
│        ‹  1 / 28  ›        − 100% +        ⟲ putar           │
└──────────────────────────────────────────────────────────────┘
```

**Modal:** lebar maks 1080, tinggi 90 vh, radius 28, putih, lapisan belakang `--ink` 50% + blur 4 px. Mobile: layar penuh (tanpa radius atas), muncul dari bawah.

**Header:**
- Kiri: tile ikon jenis file 44×44 + nama file (`h3`, satu baris, elipsis di tengah dengan ekstensi terlihat) + baris meta "28 halaman · 1 MB".
- Kanan: **Cetak dokumen** (utama, ikon printer, paling menonjol), **Tab baru** dan **Unduh** (sekunder), tutup (✕, ikon 44×44).
- Mobile: nama file di baris atas dengan tombol tutup; **Cetak dokumen** menjadi bar tetap di bawah selebar penuh; Tab baru dan Unduh masuk ke menu ⋮.

**Area pratinjau:**
- Latar `--mint`, halaman putih dengan bayangan lembut. **Bukan abu gelap.**
- Rekomendasi implementasi: render dengan **PDF.js** memakai toolbar sendiri (di bawah), dan jangan tampilkan toolbar bawaan browser. Dengan begitu tampilan konsisten di semua browser dan **tombol cetak tidak ganda** (di desain lama ada dua ikon cetak berbeda).
- Toolbar bawah: halaman sebelumnya/berikutnya, "1 / 28" (bisa diketik), perkecil/perbesar dengan nilai persen, putar. Latar putih, radius 999, melayang di tengah bawah dengan bayangan lembut.

**Keadaan:**
- **Memuat:** skeleton halaman putih berdenyut halus + "Menyiapkan pratinjau…".
- **Pratinjau tidak tersedia** (mis. DOCX yang tidak bisa dirender): panel tengah dengan ikon jenis file besar, teks "Pratinjau belum tersedia untuk file ini. Kamu tetap bisa mencetak atau mengunduhnya." Tombol Cetak dokumen dan Unduh tetap aktif.
- **Gagal:** "File tidak bisa dibuka. Coba unduh lalu buka di perangkatmu." + **Coba lagi**.

**Perilaku:** `Esc` menutup, fokus terkunci di dalam modal, fokus kembali ke tombol **Lihat & cetak** yang membukanya. Klik latar belakang juga menutup.

---

### 5.4 Pengaturan akun

**Tujuan:** mengatur keamanan dan penyimpanan dengan jelas, dan mencegah salah hapus.

```
┌──────────────────────────────────────────────────────────────┐
│ [▣] wert.web.id                                              │
├──────────────────────────────────────────────────────────────┤
│  ‹ File tugas                                                │
│  Pengaturan akun                                             │
│  Atur PIN, penghapusan otomatis, dan ruang penyimpanan.      │
│                                                              │
│  ┌ Keamanan ──────────────────────────────────────────────┐ │
│  │ [🔒] PIN 4 digit  (Aktif)        [Ubah PIN]  Hapus PIN │ │
│  │      Hanya yang tahu PIN bisa membuka halamanmu.       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌ Privasi ───────────────────────────────────────────────┐ │
│  │ [◷] Hapus otomatis setelah 48 jam              ( ●━ )  │ │
│  │     Berlaku untuk file baru yang kamu unggah.          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌ Penyimpanan ───────────────────────────────────────────┐ │
│  │ Jumlah file         4 dari 20       ▓▓░░░░░░░░         │ │
│  │ Ruang terpakai      2,7 dari 200 MB ░░░░░░░░░░         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌ Zona bahaya (border merah tipis) ──────────────────────┐ │
│  │ Hapus semua file                    [Hapus semua file] │ │
│  │ Menghapus seluruh file di halaman ini sekaligus.       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Tata letak:** satu kolom, lebar maks 720, rata kiri. Setiap bagian adalah kartu radius 20 dengan judul bagian (`h3`) di dalamnya, sehingga isi tiap kartu berbeda bentuk (tombol, toggle, meter), bukan pola yang sama diulang.

**Isi per bagian:**
1. **Keamanan:** tile ikon gembok hijau, judul "PIN 4 digit" + label status **Aktif** (latar `--mint`, teks `--brand-deep`) atau **Belum diatur** (`--hl-soft`). Aksi: **Ubah PIN** (sekunder), **Hapus PIN** (teks merah). Hapus PIN meminta PIN saat ini dulu. Jika belum ada PIN: satu tombol **Buat PIN**.
2. **Privasi:** tile ikon jam kuning. Toggle besar (52×32, aktif `--brand-deep` dengan titik putih; nonaktif abu). Teks keterangan: "File baru akan dihapus otomatis setelah 48 jam. Bisa diubah per file."
3. **Penyimpanan:** dua baris dengan meter progres (lihat 4.5). Angka dalam Bricolage 700 20 px. 4/20 file = 20%, 2,7/200 MB ≈ 1,4%.
4. **Zona bahaya:** kartu **putih** dengan border 1 px `--danger` 40% dan ikon peringatan merah kecil. Tombol **Hapus semua file** berbentuk bahaya (putih, border merah). Item bahaya lain di bawahnya (terpotong pada screenshot) mengikuti pola baris yang sama.

**Dialog konfirmasi hapus semua file:**
- Judul: "Hapus semua file?"
- Isi: "4 file (2,7 MB) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
- Kolom: "Ketik nama halamanmu untuk melanjutkan", tombol **Hapus semua file** (**solid** `--danger`, teks putih) baru aktif setelah nama cocok. Tombol **Batal** (sekunder) di sebelahnya, fokus awal ada di Batal.
- Setelah berhasil: toast "Semua file dihapus" dan kembali ke daftar file (keadaan kosong).

**Simpan otomatis:** perubahan toggle langsung tersimpan dengan toast "Pengaturan disimpan". Tidak ada tombol Simpan.

---

### 5.5 Masukkan PIN (bila halaman dilindungi)
Empat kotak angka 56×64, radius 14, border 2 px `--line`, kotak aktif border `--brand-deep` dengan cincin fokus. Tempel PIN dari papan klip mengisi keempat kotak. Salah PIN: kotak bergetar halus 200 ms, bingkai `--danger`, pesan "PIN salah. Coba lagi." Pada layar angka HP, gunakan `inputmode="numeric"`.

---

## 6. Gerak

| Momen | Perilaku | Durasi |
|---|---|---|
| Buka beranda | Tiga lembar meluncur dari printer, sekali | ±1,2 s |
| Tekan tombol stiker | Geser dan bayangan mengecil | 80 ms |
| Buka modal | Skala 0,98 → 1 + fade (mobile: naik dari bawah) | 160 ms |
| File selesai diunggah | Kartu naik 4 px lalu turun | 200 ms |
| PIN salah | Getar horizontal ±6 px | 200 ms |

Selain tabel ini, tidak ada animasi masuk pada tiap bagian halaman dan tidak ada efek hover pada setiap kartu. Hormati `prefers-reduced-motion`: semua gerak di atas diganti perubahan tanpa animasi (opasitas saja).

---

## 7. Gaya bahasa

- Bahasa Indonesia santai namun jelas, **kamu** (bukan "Anda"), kalimat aktif dan pendek, sentence case.
- Tombol menyebut persis apa yang terjadi, dan nama aksinya sama di seluruh alur:

| Tombol | Toast / hasil |
|---|---|
| Buka halaman | (masuk ke daftar file) |
| Tambah file | File ditambahkan |
| Lihat & cetak | (membuka pratinjau) |
| Unduh | File diunduh |
| Hapus | File dihapus |
| Hapus semua file | Semua file dihapus |
| Ubah PIN | PIN diubah |

- Kesalahan menjelaskan apa yang salah dan cara memperbaikinya, tanpa minta maaf berlebihan. Contoh: "File terlalu besar. Batas ukuran per file 50 MB." (angka disesuaikan dengan batas sistem sebenarnya).
- Keadaan kosong mengajak bertindak, bukan sekadar "Tidak ada data".
- Label lama → baru: "Alamat Halaman" → **Nama halamanmu**; "Buka →" → **Buka halaman**; "Kembali ke File Tugas" → **File tugas**.

---

## 8. Responsif

| Breakpoint | Perilaku |
|---|---|
| < 640 | 1 kolom, bar aksi tetap di bawah, modal layar penuh, header ringkas |
| 640–1023 | Grid file 2 kolom, beranda tetap satu kolom dengan ilustrasi di bawah judul |
| ≥ 1024 | Beranda dua kolom, grid file 3 kolom, container 1120 |

Hormati area aman perangkat (`env(safe-area-inset-bottom)`) untuk bar tetap di bawah.

---

## 9. Aksesibilitas (batas minimum)

- Kontras teks ≥ 4,5:1 (token di bagian 3 sudah dipilih untuk itu).
- Fokus keyboard selalu terlihat; urutan Tab mengikuti urutan visual.
- Modal: fokus terkunci, `role="dialog"`, `aria-labelledby` ke nama file, `Esc` menutup.
- Informasi waktu hapus memakai ikon dan teks, bukan warna saja.
- Menu ⋮ dan tombol ikon punya `aria-label`; toggle memakai `role="switch"` dengan `aria-checked`.
- Target sentuh ≥ 44×44.

---

## 10. Urutan pengerjaan yang disarankan

1. Pasang font, token warna, radius, dan bayangan (bagian 3).
2. Buat komponen bersama: Header, Tombol, Label jenis file, Label waktu hapus, Meter, Toast (bagian 4).
3. Kerjakan **Daftar file** terlebih dulu (paling sering dipakai), lalu **Pratinjau & cetak**.
4. Lanjut **Beranda** beserta ilustrasi, lalu **Pengaturan akun** dan dialog konfirmasi.
5. Terakhir: keadaan kosong/memuat/gagal, gerak, dan pemeriksaan aksesibilitas.
