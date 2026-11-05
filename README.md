# Monitoring Lab R&D Fuel Cell ITS

Sistem monitoring inventaris **Laboratorium R&D Fuel Cell ITS** berbasis **Google Apps Script** + **Google Sheets** (database) + **Google Drive** (foto). Web app responsif untuk HP, tablet, dan laptop; mendukung mode gelap/terang, scan QR/barcode via scanner eksternal, dan cetak label QR/barcode per item.

## Fitur

- **Halaman Informasi** — denah lab interaktif (20 zona dapat diklik, badge nomor + jumlah item terdata), daftar alat rusak, bahan habis/menipis, dan komponen habis/menipis.
- **Database Peralatan / Bahan / Komponen** — tampilan galeri & tabel, pencarian + auto-search scanner QR/barcode, sorting, detail item dengan tanggal update terakhir, cetak QR/barcode.
- **Tambah/Edit data** — foto (dengan **kompresi otomatis** di browser), nama, lokasi via denah, jumlah, kode QR/barcode. Semua opsional kecuali nama.
- **Tema gelap/terang**, responsif, font nyaman dibaca (Inter).
- Database (Spreadsheet) & folder foto (Drive) dibuat **otomatis** saat web app pertama dibuka.

## Struktur file

| File | Isi |
|------|-----|
| `Code.gs` | Backend Apps Script: web app, CRUD, upload foto, denah |
| `Index.html` | Kerangka halaman |
| `Stylesheet.html` | CSS (tema, responsif) |
| `JavaScript.html` | Logika aplikasi 4 halaman |
| `appsscript.json` | Manifest (zona waktu, izin, konfigurasi web app) |
| `demo.html` | Versi demo mandiri (data contoh, buka langsung di browser) |
| `assets/` | Gambar denah bersih & emblem logo |
| `PANDUAN_SETUP.md` | Panduan deploy lengkap (Bahasa Indonesia) |

## Deploy singkat

Lihat **[PANDUAN_SETUP.md](PANDUAN_SETUP.md)** untuk langkah lengkap. Ringkas:

1. Buat proyek di https://script.google.com, tempel `Code.gs` dan file HTML (`Index`, `Stylesheet`, `JavaScript`) + `appsscript.json`.
2. **Deploy → New deployment → Web app** (Execute as: Me; Who has access: Anyone).
3. Buka URL web app.

### Via clasp (opsional)

```bash
npm install -g @google/clasp
clasp login
clasp create --title "Monitoring Lab Fuel Cell ITS" --type webapp
clasp push
clasp deploy
```

## Lisensi

Penggunaan internal Laboratorium R&D Fuel Cell ITS.
