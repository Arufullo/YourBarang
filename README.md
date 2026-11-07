# YourBarang Demo

Prototipe lokal untuk presentasi tugas besar. HTML, Bootstrap **5.3.3**, CSS kustom, dan JavaScript vanilla. Semua aset runtime disimpan lokal; tidak memakai CDN, Tailwind, API, atau build step.

## Membuka demo

```bash
cd yourbarang-demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Buka **http://127.0.0.1:8000/** di Chrome, Edge, atau Firefox terbaru. Biarkan terminal server terbuka selama demo. Jika port terpakai, gunakan port lain pada perintah dan URL. Jangan membuka lewat `file://`, karena JavaScript memakai ES modules.

## Alur presentasi

1. **L1 Beranda**: 18 laporan Hilang/Temuan dalam satu grid. Cari `dompet` atau `perpustakaan`. Buka **Filter**, pilih jenis/kategori/area/rentang tanggal/status; semua filter digabungkan. Kartu membuka **L2 Detail Laporan** sesuai data. Grid: 2 kolom mulai 360, 3 mulai 768, 4 mulai 992, dan 6 mulai 1280 px. Pagination muncul jika hasil lebih dari 18, termasuk setelah laporan baru diterbitkan.
2. **Buat Laporan → L4 → L2**: isi jenis, judul (5–60 karakter), kategori, area, tanggal, deskripsi (10–300 karakter). Jam WIB dan foto opsional. Pilih foto untuk melihat pratinjau, atau hapus untuk menerbitkan tanpa foto. Coba tanggal masa depan untuk memeriksa pesan kesalahan. Laporan valid langsung membuka detail. Muat ulang: laporan dan fotonya tetap ada. Ciri privat tidak muncul pada halaman publik.
3. **Cari lewat foto**: pilih satu JPG/PNG/WebP maksimal 5 MB. **Cari** aktif setelah gambar berhasil dibaca. Hasil berlabel **Simulasi** muncul pada grid yang sama; filter tetap berlaku. **Hapus Foto** memulihkan kata kunci sebelumnya dengan filter aktif. Coba GIF, berkas rusak, atau berkas >5 MB untuk validasi. Escape/Tutup menutup dialog dan mengembalikan fokus. Sesi foto dihapus setelah 15 menit.
4. **Alur tambahan dari PRD**: buka **Botol biru → Ajukan Klaim → Masuk**. Gunakan email berformat valid dan kata sandi contoh minimal delapan karakter. Isi bukti → **Kirim Klaim → Simulasikan Persetujuan → Atur Pengambilan → Ajukan Jadwal → Simulasikan Setujui Jadwal**. Kedua tombol konfirmasi mewakili dua peran untuk presentasi. Satu konfirmasi belum menyelesaikan laporan; mengubah/membatalkan jadwal menghapus konfirmasi lama. Setelah keduanya, status laporan menjadi Selesai dan hanya muncul di Beranda dengan filter Selesai.
5. **Aktivitas Saya** memuat laporan lokal, klaim, pesan, saran, notifikasi, dan profil. **Kirim Pesan**, diskusi dan balasan, serta tautkan laporan memakai data lokal. **Panduan demo** di footer menyediakan tautan ke **Panel Admin** contoh.

## Acuan visual

Implementasi mengacu pada dokumen desain dan PRD versi 1.1 saat pengembangan. Dokumen tersebut tidak diperlukan untuk menjalankan demo dan tidak disertakan di folder ini.

| Ekspor layar Stitch | Berkas referensi | Pemetaan PRD 1.1 |
| --- | --- | --- |
| L2 Jelajahi Barang Desktop | `references/stitch-desktop.png` | **L1 Beranda** |
| L2 Jelajahi Barang Mobile | `references/stitch-mobile.png` | **L1 Beranda** |

Pemetaan berdasarkan isi layar, bukan nomor lama. Desktop dan mobile diterjemahkan menjadi satu halaman responsif. Foto, susunan galeri datar, warna merah, dan bentuk kartu mengikuti ekspor. Judul, urutan judul/pencarian, informasi kartu, ukuran teks, token warna, margin, dan breakpoint mengikuti DESIGN.md/PRD terbaru. L2 Detail dan L4 Form dibuat dari spesifikasi PRD karena belum ada ekspor desainnya. L3 dan L5–L8 adalah halaman demo tambahan dari PRD; tidak diklaim sebagai desain Stitch.

**Sumber referensi:** implementasi menggunakan ekspor lokal Stitch; kesesuaiannya dengan versi proyek daring belum diverifikasi. Foto disimpan lokal di `assets/`. Asal URL masing-masing foto tercatat di `references/sources.json`, sedangkan gambar layar acuan tersedia di `references/`. ID dan tautan proyek internal tidak disertakan.

Lapisan interaksi dan animasi tersedia di `assets/motion/`.

## Data dan bagian simulasi

- **Benar-benar berfungsi di browser:** routing, pencarian teks, filter gabungan, pagination, form, validasi, decoding/pratinjau foto, penyimpanan laporan dan foto setelah reload, navigasi detail, diskusi lokal, pesan lokal, dan transisi demo klaim/jadwal.
- **Simulasi:** pencocokan gambar tanpa model AI, akun tanpa autentikasi server, otorisasi ruang privat, pengiriman pesan/notifikasi, saran pasangan, peran penemu/penerima, dan keputusan admin. Pencocokan foto memilih daftar contoh deterministik dari nama berkas (`dompet`, `kunci`, `tas`, atau kelompok default), bukan analisis isi gambar. Tidak ada badge skor.
- **Penyimpanan:** `localStorage`, hanya pada browser/origin yang sama. Foto laporan dikecilkan maksimal 1000 px dengan JPEG untuk menghemat kuota; kesalahan kuota ditampilkan saat terbit. Foto pencarian hanya di memori, dibuang setelah 15 menit, Hapus Foto, atau reload. Nama akun demo disimpan, kata sandi tidak disimpan. Ini prototipe tanpa backend; gunakan data contoh untuk ciri privat/bukti.
- **Belum dibangun sebagai sistem produksi:** backend/database, login nyata, pemeriksaan akses di server, model kemiripan foto, moderasi sungguhan, edit/arsip laporan, dan seluruh aturan transaksi klaim bersaing.

## Verifikasi

```bash
npm test
npm run check
```

Tes logika mencakup data awal, pencarian, filter, visibilitas status, urutan kandidat foto, format/ukuran berkas, aturan judul/deskripsi, tanggal/jam WIB, dan escaping HTML.

Skrip Playwright CLI untuk verifikasi browser sudah disediakan; jalankan dari folder ini setelah server aktif:

```bash
npx --yes --package @playwright/cli playwright-cli -s=yourbarang-demo open http://127.0.0.1:8000/
npx --yes --package @playwright/cli playwright-cli -s=yourbarang-demo run-code --filename=checks/browser-flows.js
npx --yes --package @playwright/cli playwright-cli -s=yourbarang-demo close
```

Jika browser Playwright belum tersedia, pasang Chromium terlebih dahulu: `npx playwright install chromium`. Skrip menguji breakpoint, overflow, pencarian/filter, Beranda → Detail, form → detail/reload, Tanpa foto, pagination, validasi unggah, simulasi foto, fokus dialog, serta alur klaim/pengambilan. Screenshot hasil akan ditulis ke `output/playwright/`. Data demo yang ada pada sesi pengujian dicadangkan dan dipulihkan.

**Status verifikasi browser:** alur Playwright belum terverifikasi. Gambar di `references/` adalah acuan Stitch, bukan screenshot hasil pengujian implementasi.

## Publikasi ke GitHub

Gunakan folder `yourbarang-demo` sebagai root repository agar konfigurasi pribadi di folder induk tidak ikut terunggah. `.gitignore` mengecualikan file environment, pola umum kredensial, sesi browser, dependensi, dan hasil pengujian. Jika menambahkan `.env.example`, isi hanya dengan placeholder.

Sebelum commit, periksa daftar file dengan `git status --short` dan isi perubahan yang akan dikirim dengan `git diff --cached`. `.gitignore` tidak melindungi rahasia yang ditulis langsung dalam kode atau file yang sudah dilacak Git.

Demo ini menggunakan autentikasi simulasi dan penyimpanan browser. Gunakan nama, kata sandi, foto, serta bukti kepemilikan contoh. Data di browser tidak ikut masuk repository kecuali diekspor menjadi file atau screenshot.

## Berkas

`index.html` adalah shell halaman; `app.js` memuat halaman/alur; `core.js` memuat logika validasi/pencarian; `data.js` memuat 18 laporan; `styles.css` memuat token dan layout; `assets/` memuat Bootstrap, foto, dan interaksi Taste; `checks/` memuat verifikasi; `references/` memuat sumber desain.
