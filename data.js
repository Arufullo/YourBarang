export const categories = ['Dompet & kartu', 'Botol minum', 'Kunci', 'Aksesori', 'Elektronik', 'Tas', 'Pakaian', 'Alat tulis', 'Lainnya'];
export const areas = ['Perpustakaan', 'Kantin', 'Parkiran', 'Gedung A', 'Gedung B', 'Lapangan'];
const rows = [
  ['Dompet hitam','Hilang','Perpustakaan','2026-11-06','09:15','Dompet & kartu','Dompet kulit hitam tertinggal di meja baca Perpustakaan lantai 2. Bagian depan memiliki logo kecil.'],
  ['Botol biru','Temuan','Kantin','2026-11-06','09:00','Botol minum','Botol minum biru dengan tutup hitam ditemukan di meja kantin. Barang disimpan oleh penemu.'],
  ['Kunci motor','Hilang','Parkiran','2026-11-06','08:45','Kunci','Kunci motor dengan tali gantungan biru hilang di sekitar parkiran kampus.'],
  ['Kacamata hitam','Temuan','Gedung A','2026-11-06','08:30','Aksesori','Kacamata hitam berbingkai tebal ditemukan di meja ruang kelas Gedung A.'],
  ['Payung lipat','Hilang','Gedung B','2026-11-05','17:10','Aksesori','Payung lipat hitam tertinggal di koridor Gedung B setelah kuliah sore.'],
  ['Earphone putih','Temuan','Perpustakaan','2026-11-05','16:40','Elektronik','Earphone putih beserta kotak pengisi daya ditemukan di meja perpustakaan.'],
  ['Tas kanvas','Hilang','Kantin','2026-11-05','15:20','Tas','Tas kanvas warna krem tertinggal di sandaran kursi kantin.'],
  ['Jam tangan','Temuan','Lapangan','2026-11-05','14:50','Aksesori','Jam tangan analog dengan tali cokelat ditemukan di bangku tepi lapangan.'],
  ['Buku catatan','Hilang','Gedung A','2026-11-05','13:30','Alat tulis','Buku catatan bersampul biru dengan karet pengikat tertinggal di ruang kuliah.'],
  ['Charger laptop','Temuan','Perpustakaan','2026-11-05','12:15','Elektronik','Charger laptop hitam ditemukan di dekat stopkontak meja baca perpustakaan.'],
  ['Jaket abu-abu','Hilang','Gedung B','2026-11-05','11:00','Pakaian','Jaket abu-abu bertudung tertinggal di kursi ruang kelas Gedung B.'],
  ['Tempat pensil','Temuan','Kantin','2026-11-05','10:20','Alat tulis','Tempat pensil hijau muda ditemukan di salah satu meja kantin.'],
  ['Flashdisk','Hilang','Perpustakaan','2026-11-04','16:30','Elektronik','Flashdisk warna perak tertinggal di komputer perpustakaan.'],
  ['Helm hitam','Temuan','Parkiran','2026-11-04','15:10','Lainnya','Helm hitam dengan kaca gelap ditemukan di bangku dekat parkiran.'],
  ['Dompet cokelat','Hilang','Gedung A','2026-11-04','14:00','Dompet & kartu','Dompet kulit cokelat hilang di sekitar ruang kelas Gedung A.'],
  ['Botol hijau','Temuan','Lapangan','2026-11-04','12:40','Botol minum','Botol minum hijau dengan pegangan tutup ditemukan di tepi lapangan.'],
  ['Mouse nirkabel','Hilang','Gedung B','2026-11-04','11:15','Elektronik','Mouse nirkabel abu-abu tertinggal di meja ruang belajar Gedung B.'],
  ['Kunci rumah','Temuan','Kantin','2026-11-04','10:00','Kunci','Sekumpulan kunci dengan gantungan kayu berbentuk rumah ditemukan di kantin.']
];
export const seedReports = rows.map((r,i)=>({id:String(i+1),title:r[0],kind:r[1],area:r[2],date:r[3],time:r[4],category:r[5],description:r[6],photo:`assets/item-${String(i+1).padStart(2,'0')}.jpg`,status:i===15?'Menunggu Pengambilan':'Aktif',author:i%2?'Nadia Putri':'Raka Pratama',createdAt:`${r[3]}T${r[4]}:00+07:00`,demo:true}));
