# YourBarang Demo

Prototipe lokal untuk presentasi tugas besar. HTML, Bootstrap **5.3.3**, CSS kustom, dan JavaScript vanilla. Semua aset runtime disimpan lokal; tidak memakai CDN, Tailwind, API, atau build step.

## Membuka demo

```bash
cd yourbarang-demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Buka **http://127.0.0.1:8000/** di Chrome, Edge, atau Firefox terbaru. Biarkan terminal server terbuka selama demo. Jika port terpakai, gunakan port lain pada perintah dan URL. Jangan membuka lewat `file://`, karena JavaScript memakai ES modules.

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

Periksa juga seluruh riwayat commit yang akan di-push, termasuk berkas yang pernah ditambahkan lalu dihapus. Pastikan tidak ada API key Stitch, token GitHub, kredensial, atau isi file `.env` di kode, aset, maupun riwayat tersebut. File `.envrc`, penyimpanan kredensial Git/GitHub lokal, dan folder `.secrets/` juga dikecualikan.

Demo ini menggunakan autentikasi simulasi dan penyimpanan browser. Gunakan nama, kata sandi, foto, serta bukti kepemilikan contoh. Data di browser tidak ikut masuk repository kecuali diekspor menjadi file atau screenshot.

## Berkas

`index.html` adalah shell halaman; `app.js` memuat halaman/alur; `core.js` memuat logika validasi/pencarian; `data.js` memuat 18 laporan; `styles.css` memuat token dan layout; `assets/` memuat Bootstrap, foto, dan interaksi Taste; `checks/` memuat verifikasi; `references/` memuat sumber desain.
