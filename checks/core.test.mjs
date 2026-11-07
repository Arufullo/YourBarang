import test from 'node:test';
import assert from 'node:assert/strict';
import { seedReports } from '../data.js';
import { FILE_ERROR, MAX_PHOTO_SIZE, validatePhoto, validateReport, filterReports, simulationCandidates, escapeHTML, wibToday } from '../core.js';

const now=new Date('2026-11-06T08:00:00Z');
const valid={kind:'Hilang',title:'Dompet hitam',category:'Dompet & kartu',area:'Perpustakaan',date:'2026-11-06',time:'14:20',description:'Dompet kulit hitam tertinggal di meja baca.'};
test('18 laporan campuran, awal publik hanya Aktif dan Menunggu Pengambilan',()=>{
  const result=filterReports(seedReports);
  assert.equal(result.length,18);assert.equal(new Set(result.map(r=>r.kind)).size,2);
  assert.equal(result[0].title,'Dompet hitam');assert.equal(result.at(-1).title,'Kunci rumah');
});
test('pencarian judul, deskripsi dan area tanpa membedakan huruf besar',()=>{
  assert.equal(filterReports(seedReports,{},'DOMPET').length,2);
  assert.equal(filterReports(seedReports,{},'stopkontak')[0].id,'10');
  assert.deepEqual(filterReports(seedReports,{},'perpustakaan').map(r=>r.id),['1','6','10','13']);
});
test('filter gabungan jenis, kategori, area, tanggal dan status',()=>{
  assert.deepEqual(filterReports(seedReports,{kind:'Temuan',category:'Botol minum',area:'Lapangan',from:'2026-11-04',to:'2026-11-04',status:'Menunggu Pengambilan'}).map(r=>r.id),['16']);
  assert.equal(filterReports(seedReports,{kind:'Temuan'},'dompet').length,0);
});
test('Selesai memerlukan filter; arsip dan konten tersembunyi selalu dikecualikan',()=>{
  const data=['Selesai','Diarsipkan','Disembunyikan'].map((status,i)=>({...seedReports[0],id:String(i),status}));
  assert.equal(filterReports(data).length,0);assert.equal(filterReports(data,{status:'Selesai'}).length,1);
  assert.equal(filterReports(data,{status:'Diarsipkan'}).length,0);
});
test('hasil foto mengikuti urutan kandidat dan filter aktif tanpa kata kunci teks',()=>{
  assert.deepEqual(filterReports(seedReports,{},'tidak cocok',['16','2']).map(r=>r.id),['16','2']);
  assert.deepEqual(filterReports(seedReports,{area:'Kantin'},'', ['16','2']).map(r=>r.id),['2']);
  assert.equal(filterReports([{...seedReports[0],photo:null}],{},'', ['1']).length,0);
});
test('kandidat foto adalah contoh deterministik, tanpa skor palsu',()=>{
  assert.deepEqual(simulationCandidates('Dompet-saya.jpg'),['1','15','7']);
  assert.deepEqual(simulationCandidates('barang.png'),['2','16','8','12','6','1']);
});
test('JPG, PNG dan WebP diterima hingga tepat 5 MB',()=>{
  for(const type of ['image/jpeg','image/png','image/webp'])assert.equal(validatePhoto({type,size:MAX_PHOTO_SIZE}),'');
});
test('format keliru, berkas kosong dan kelebihan 5 MB ditolak',()=>{
  for(const file of [null,{type:'image/gif',size:100},{type:'image/jpeg',size:MAX_PHOTO_SIZE+1},{type:'image/png',size:0}])assert.equal(validatePhoto(file),FILE_ERROR);
});
test('laporan valid dengan dan tanpa jam',()=>{
  assert.deepEqual(validateReport(valid,now),{});assert.deepEqual(validateReport({...valid,time:''},now),{});
});
test('kolom wajib serta panjang judul/deskripsi divalidasi',()=>{
  const errors=validateReport({},now);for(const key of ['kind','title','category','area','date','description'])assert.ok(errors[key]);
  assert.ok(validateReport({...valid,title:'   a   '},now).title);
  assert.ok(validateReport({...valid,title:'a'.repeat(61)},now).title);
  assert.ok(validateReport({...valid,description:'a'.repeat(301)},now).description);
});
test('tanggal dan jam masa depan ditolak memakai WIB',()=>{
  assert.ok(validateReport({...valid,date:'2026-11-07'},now).date);
  assert.ok(validateReport({...valid,time:'15:01'},now).time);
  assert.equal(validateReport({...valid,time:'15:00'},now).time,undefined);
});
test('pergantian hari WIB tidak mengikuti zona waktu komputer',()=>{
  assert.equal(wibToday(new Date('2026-11-06T18:00:00Z')),'2026-11-07');
});
test('teks pengguna diloloskan sebelum masuk HTML',()=>{
  assert.equal(escapeHTML('<img onerror="x"> & \'a\''),'&lt;img onerror=&quot;x&quot;&gt; &amp; &#39;a&#39;');
});
