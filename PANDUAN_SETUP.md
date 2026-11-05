# Panduan Setup — Sistem Monitoring Lab R&D Fuel Cell ITS

Aplikasi web berbasis **Google Apps Script** + **Google Sheets** (database) + **Google Drive** (penyimpanan foto). Bisa dibuka di HP, tablet, dan laptop. Mendukung mode gelap/terang, responsif, scan QR/barcode via scanner eksternal, dan cetak label QR/barcode per item.

---

## Daftar file proyek

| File | Isi |
|------|-----|
| `Code.gs` | Backend: web app, database Sheets, CRUD, upload foto, denah |
| `Index.html` | Kerangka halaman (HTML shell) |
| `Stylesheet.html` | CSS (tema gelap/terang, responsif) |
| `JavaScript.html` | Logika aplikasi 4 halaman |
| `appsscript.json` | Manifest (zona waktu, izin, konfigurasi web app) |
| `demo.html` | Versi demo mandiri untuk pratinjau (data contoh, tidak perlu deploy) |

---

## A. Cara deploy (manual, ±10 menit)

### 1. Buat proyek Apps Script
1. Buka **https://script.google.com** → **New project**.
2. Ganti nama proyek, mis. `Monitoring Lab Fuel Cell ITS`.

### 2. Masukkan semua file
1. **Code.gs** — hapus isi default, tempel seluruh isi `Code.gs`.
2. Tambah file HTML (tombol **+** → **HTML**) dengan **nama persis** (tanpa `.html`):
   - `Index` → tempel isi `Index.html`
   - `Stylesheet` → tempel isi `Stylesheet.html`
   - `JavaScript` → tempel isi `JavaScript.html`
3. Manifest: klik ⚙️ **Project Settings** → centang **"Show appsscript.json manifest file in editor"**. Buka `appsscript.json` di editor, ganti isinya dengan isi `appsscript.json` di proyek ini.

### 3. (Opsional) Inisialisasi database
Pilih fungsi **`setup`** di toolbar editor → **Run**. Saat diminta, **Authorize** (izinkan akses Spreadsheet & Drive). Ini otomatis membuat:
- Spreadsheet **"DB Monitoring Lab R&D Fuel Cell ITS"** (tab: Peralatan, Bahan, Komponen, Denah, Config)
- Folder Drive **"Foto Monitoring Lab R&D Fuel Cell ITS"**

> Langkah ini opsional — database juga terbuat otomatis saat web app pertama kali dibuka.

### 4. Deploy sebagai Web App
1. **Deploy** → **New deployment** → ikon ⚙️ → pilih **Web app**.
2. Setel:
   - **Execute as:** `Me` (akun Anda)
   - **Who has access:** `Anyone` (agar bisa dibuka siapa pun di lab) atau `Anyone within [organisasi ITS]`.
3. **Deploy** → salin **Web app URL**.
4. Buka URL itu di HP/tablet/laptop. Simpan ke home screen (Add to Home Screen) agar seperti aplikasi.

Setiap kali kode diubah: **Deploy → Manage deployments → Edit (pensil) → Version: New version → Deploy** (URL tetap sama).

---

## B. Cara menemukan database
Di editor Apps Script jalankan fungsi `getDbUrl` → lihat **Execution log** untuk link spreadsheet. Anda bisa mengedit data langsung di Sheets bila perlu (jaga baris header tetap sama).

---

## C. Scan QR/Barcode (scanner eksternal)
Scanner genggam/USB bekerja seperti keyboard. Di halaman **Peralatan / Bahan / Komponen**:
1. Kotak pencarian otomatis fokus. Jika belum, ketuk ikon **scan** di kanan kotak.
2. Tembakkan scanner → kode terketik → otomatis mencari saat ada **Enter** (default scanner).
3. Jika ketemu → langsung buka detail. Jika tidak → tawaran **tambah data baru** dengan kode terisi otomatis.

---

## D. Denah lab (sudah terpasang)
Denah asli lab (hasil scan) **sudah tertanam** di aplikasi beserta **20 zona** yang bisa diklik (Meja Besi 1&2, Lemari Asam, Furnace Tubular, dst — sesuai penomoran di gambar). Tiap zona menampilkan badge nomor + jumlah item terdata, dan membuka daftar isi lokasi saat diketuk. Di mode gelap gambar otomatis ter-invert (putih di atas hitam).

**Mengganti gambar denah** (mis. versi lebih bersih/berwarna):
1. Upload gambar ke Drive, atur **"Anyone with the link – Viewer"**, salin link.
2. Isi baris `DENAH_IMAGE_URL` di tab **Config** pada spreadsheet (atau jalankan `saveDenahImageUrl("URL_GAMBAR")` di editor). Jika kosong, aplikasi memakai denah bawaan yang sudah tertanam.
   - Catatan: koordinat zona memakai rasio potret denah asli (820×1436). Bila gambar baru beda proporsi, sesuaikan juga `DENAH_RATIO` di `JavaScript.html` dan koordinat zona.

**Menyesuaikan zona klik** (tab **Denah** di spreadsheet): tiap baris = 1 area.
- `x, y, w, h` dalam **persen (0–100)** relatif terhadap gambar (responsif di semua layar).
- `nama_lokasi` harus sama dengan pilihan lokasi di form (inilah yang menautkan item ke area).
- `warna` = kode hex garis & badge zona.

> Kolom **lokasi** pada tiap item itulah yang menentukan isinya saat area denah diklik.

**20 lokasi bawaan:** 1 Meja Besi 1&2 · 2 Lemari Besi 2 · 3 Lemari Besi 3&4 · 4 Meja Besi 3 · 5 Alat Spray Coating · 6 Rak Lemari · 7 Lemari Kaca · 8 Meja Panjang · 9 Lemari Kayu 1-4 · 10 Wastafel · 11 Lemari Kayu 5&6 · 12 Lemari Besi 1 · 13 Meja Kayu · 14 Meja Besi 4 · 15 Lemari Asam · 16 Meja Keramik Oven · 17 Meja Kayu Doctor Blade · 18 Meja Kayu 3D Print · 19 Meja Kayu · 20 Furnace Tubular.

---

## E. (Opsional) Kelola lewat GitHub + clasp
Agar kode tersimpan di GitHub dan deploy dari terminal:

```bash
npm install -g @google/clasp
clasp login
clasp create --title "Monitoring Lab Fuel Cell ITS" --type webapp
# salin semua file (.gs, .html, appsscript.json) ke folder proyek
clasp push          # unggah ke Apps Script
clasp deploy        # buat deployment web app
```

Simpan folder ini ke repo GitHub seperti biasa (`git init`, `git add .`, `git commit`, `git push`). File `.clasp.json` menyimpan ID script.

---

## F. Struktur database (referensi kolom)

**Peralatan:** `id, kode, nama, foto, jumlah, kondisi, lokasi, keterangan, last_update`
Kondisi: `unused, broken, bad, fair, good, new`.

**Bahan:** `id, kode, nama_indo, nama_iupac, formula, jumlah, satuan, lokasi, foto, keterangan, last_update`
Satuan: `gr, ml, pcs`.

**Komponen:** `id, kode, nama, foto, jumlah, lokasi, keterangan, last_update`

**Denah:** `id, nama_lokasi, x, y, w, h, warna, keterangan`

**Config:** `key, value` (mis. `DENAH_IMAGE_URL`).

Semua isian form **opsional kecuali nama**. Kode QR kosong akan dibuat otomatis.

---

## Catatan
- **Kompresi foto otomatis:** setiap foto yang diunggah (alat/bahan/komponen) otomatis di-resize (sisi terpanjang maks 1280 px) dan dikompres ke JPEG ~82% di browser sebelum dikirim — menghemat ruang Drive dan mempercepat unggah. Atur lewat `PHOTO_MAXDIM` dan `PHOTO_QUALITY` di `JavaScript.html`.
- Foto disimpan di Drive dan ditampilkan via tautan `lh3.googleusercontent.com/d/<id>`. Pastikan folder foto berbagi "Anyone with link".
- Batas eksekusi Apps Script cukup untuk skala laboratorium (ribuan item). Bila data sangat besar, pertimbangkan paginasi.
- Ambang "stok menipis" default = 5 (ubah `LOW_STOCK` di `JavaScript.html`).
