export const FILE_ERROR = 'Pilih JPG, PNG, atau WebP maksimal 5 MB.';
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export function validatePhoto(file) {
  return !file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > MAX_PHOTO_SIZE || file.size === 0 ? FILE_ERROR : '';
}
export function wibToday(now = new Date()) {
  return new Date(now.getTime()+7*60*60*1000).toISOString().slice(0,10);
}
export function validateReport(data, now = new Date()) {
  const errors = {};
  const title = (data.title || '').trim();
  const description = (data.description || '').trim();
  if (!['Hilang','Temuan'].includes(data.kind)) errors.kind = 'Pilih jenis laporan.';
  if (title.length < 5 || title.length > 60) errors.title = 'Judul harus 5–60 karakter.';
  if (!data.category) errors.category = 'Pilih kategori barang.';
  if (!data.area) errors.area = 'Pilih area kejadian.';
  if (!data.date) errors.date = 'Isi tanggal kejadian.';
  else if (data.date > wibToday(now)) errors.date = 'Pilih tanggal hari ini atau sebelumnya.';
  else if (data.time && new Date(`${data.date}T${data.time}:00+07:00`).getTime() > now.getTime()) errors.time = 'Waktu kejadian tidak boleh di masa depan (WIB).';
  if (description.length < 10 || description.length > 300) errors.description = 'Deskripsi harus 10–300 karakter.';
  return errors;
}
export function filterReports(reports, filters = {}, query = '', photoIds = null) {
  const text = query.toLocaleLowerCase('id').trim();
  const result = reports.filter(r => {
    if (['Diarsipkan','Disembunyikan'].includes(r.status)) return false;
    if (filters.status ? r.status !== filters.status : !['Aktif','Menunggu Pengambilan'].includes(r.status)) return false;
    if (filters.kind && r.kind !== filters.kind) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.area && r.area !== filters.area) return false;
    if (filters.from && r.date < filters.from) return false;
    if (filters.to && r.date > filters.to) return false;
    if (photoIds) return photoIds.includes(r.id) && Boolean(r.photo);
    return !text || `${r.title} ${r.description} ${r.area}`.toLocaleLowerCase('id').includes(text);
  });
  return result.sort((a,b)=>photoIds ? photoIds.indexOf(a.id)-photoIds.indexOf(b.id) : new Date(b.createdAt)-new Date(a.createdAt));
}
export function simulationCandidates(filename) {
  const name = filename.toLowerCase();
  if (/dompet|wallet/.test(name)) return ['1','15','7'];
  if (/kunci|key/.test(name)) return ['18','3','13'];
  if (/ear|charger|mouse|flash/.test(name)) return ['6','10','17','13'];
  if (/tas|bag|kanvas/.test(name)) return ['7','12','11'];
  return ['2','16','8','12','6','1'];
}
export function escapeHTML(value='') {
  return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
