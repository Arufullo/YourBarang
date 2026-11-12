# YourBarang Demo

Prototipe lokal untuk presentasi tugas besar. HTML, Bootstrap **5.3.3**, CSS kustom, dan JavaScript vanilla. Semua aset runtime disimpan lokal; tidak memakai CDN, Tailwind, API, atau build step.

## Membuka demo

```bash
cd yourbarang-demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Buka **http://127.0.0.1:8000/** di Chrome, Edge, atau Firefox terbaru. Biarkan terminal server terbuka selama demo. Jika port terpakai, gunakan port lain pada perintah dan URL. Jangan membuka lewat `file://`, karena JavaScript memakai ES modules.

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
