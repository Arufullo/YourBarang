import { seedReports, categories, areas } from './data.js';
import { FILE_ERROR, validatePhoto, validateReport, wibToday, filterReports, simulationCandidates, escapeHTML as esc, readLocal } from './core.js';

const $ = (selector, root=document) => root.querySelector(selector);
const main = $('#main');
const KEY = 'yourbarang.demo.reports.v1';
let saved = readLocal(KEY, []);
if (!Array.isArray(saved)) saved = [];
let user = readLocal('yourbarang.demo.user', null);
let query = '', filters = {}, page = 1, photoSession = null, stagedPhoto = null, stagedName = '', formPhoto = null, photoBusy = false;
let toastTimer, currentReport;
let comments = readLocal('yourbarang.demo.comments', {});
let claims = readLocal('yourbarang.demo.claims', {});
let chats = readLocal('yourbarang.demo.chats', {});
let handovers = readLocal('yourbarang.demo.handovers', {});
const icons = {
  search:'<circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 5 5"/>',
  photo:'<rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="7.5" cy="7.5" r="1.3"/><path d="m4 15 4-4 3 2 5-6"/>',
  filter:'<path d="M2 3h16l-6 7v6l-4 2v-8z"/>',
  back:'<path d="m10 4-6 6 6 6M4 10h13"/>',
  arrow:'<path d="m7 4 6 6-6 6"/>',
  upload:'<path d="M10 13V2M6 6l4-4 4 4M3 13v4h14v-4"/>',
  lock:'<rect x="4" y="8" width="12" height="10" rx="2"/><path d="M6 8V6a4 4 0 0 1 8 0v2"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 20 20" aria-hidden="true">${icons[name]||icons.arrow}</svg>`;
const reports = () => [...saved, ...seedReports].map(r=>claims[r.id]?.status==='Disetujui'?{...r,status:handovers[r.id]?.status==='Selesai'?'Selesai':'Menunggu Pengambilan'}:r);
const reportById = id => reports().find(r=>r.id===id);
const kindLabel = r => `<span class="kind-label ${r.kind==='Hilang'?'lost':''}">${esc(r.kind)}</span>`;
const statusLabel = status => `<span class="status-label">${esc(status)}</span>`;
const options = (values, selected='', blank='Semua') => `<option value="">${blank}</option>${values.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(v)}</option>`).join('')}`;
const dateText = r => `${new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'Asia/Jakarta'}).format(new Date(`${r.date}T00:00:00+07:00`))}${r.time?`, ${r.time.replace(':','.')}`:''}`;
const photo = (r, cls='', eager=false) => `<div class="photo-frame ${cls}">${r.photo?`<img src="${esc(r.photo)}" alt="${esc(r.title)}" width="640" height="480" loading="${eager?'eager':'lazy'}" decoding="async" data-fallback>`:'<span>Tanpa foto</span>'}</div>`;
const back = (href='#/', label='Kembali ke Beranda') => `<a class="back-link" href="${href}">${icon('back')}${label}</a>`;
const simulation = text => `<p class="simulation-note"><span class="demo-label">Simulasi</span> ${text}</p>`;
function store(key,value) { localStorage.setItem(key, JSON.stringify(value)); }
function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
  toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4500);
}
function header(route) {
  $('#header-actions').innerHTML = `<a href="${user?'#/aktivitas':'#/masuk'}">${user?'Aktivitas Saya':'Masuk'}</a><a class="btn ${route==='home'?'btn-primary':'btn-outline-secondary'}" href="#/buat">Buat Laporan</a>`;
}
function card(r,i) {
  return `<a class="report-card card m-zoom" href="#/laporan/${encodeURIComponent(r.id)}" aria-label="${esc(r.title)}, ${esc(r.kind)}, ${esc(r.area)}">${photo(r,'',i<6)}<div class="card-body"><h2 title="${esc(r.title)}">${esc(r.title)}</h2>${kindLabel(r)}<p class="card-meta">${dateText(r)}</p><p class="card-meta" title="${esc(r.area)}">${esc(r.area)}</p></div></a>`;
}
function home() {
  main.innerHTML = `<h1>Barang Hilang dan Temuan</h1>
    <div class="search-toolbar"><div class="search-box" id="search-slot"></div><button class="btn btn-outline-secondary" id="open-photo" type="button">${icon('photo')}Cari lewat foto</button><button class="btn btn-outline-secondary" id="open-filter" type="button">${icon('filter')}<span id="filter-button-label">Filter</span></button></div>
    <div id="active-filters" class="filter-chip-row" hidden></div><div id="photo-note" hidden></div>
    <div class="result-row"><p id="result-count" role="status" aria-live="polite"></p><span>Terbaru dahulu</span></div>
    <div id="report-grid" class="report-grid" aria-label="Daftar laporan"></div><nav id="pagination" class="pagination-bar" aria-label="Halaman laporan" hidden></nav>`;
  renderSearchSlot(); updateGrid();
  $('#open-photo').onclick = openPhoto;
  $('#open-filter').onclick = openFilter;
}
function renderSearchSlot() {
  const slot = $('#search-slot'); if(!slot) return;
  slot.className = photoSession ? 'photo-search-active' : 'search-box';
  slot.innerHTML = photoSession ? `<img src="${photoSession.preview}" alt="Foto pencarian"><span>Hasil lewat foto</span><button class="text-button" id="clear-photo">Hapus Foto</button>` : `${icon('search')}<label for="text-search" class="visually-hidden">Cari nama barang</label><input class="form-control" id="text-search" type="search" placeholder="Cari nama barang" value="${esc(query)}" autocomplete="off">`;
  if(photoSession) $('#clear-photo').onclick = () => { clearPhoto(); $('#text-search').focus(); };
  else $('#text-search').oninput = e => { query=e.target.value; page=1; updateGrid(); };
}
function updateGrid() {
  if(!$('#report-grid')) return;
  const results = filterReports(reports(),filters,query,photoSession?.ids);
  const pages = Math.max(1,Math.ceil(results.length/18)); page=Math.min(page,pages);
  $('#report-grid').innerHTML = results.length ? results.slice((page-1)*18,page*18).map(card).join('') : `<div class="empty-state"><p>${photoSession?'Belum ada barang yang mirip.':'Belum ada laporan yang cocok.'}</p><button id="clear-search" class="btn btn-outline-secondary">Reset Pencarian</button></div>`;
  $('#result-count').textContent = `${results.length} laporan${photoSession?' · Simulasi':''}`;
  $('.result-row>span').textContent = photoSession?'Kandidat contoh':'Terbaru dahulu';
  const active = Object.entries(filters).filter(([,value])=>value);
  $('#filter-button-label').textContent = `Filter${active.length?` (${active.length})`:''}`;
  $('#active-filters').hidden = !active.length;
  const labels = {kind:'Jenis',category:'Kategori',area:'Area',from:'Dari',to:'Sampai',status:'Status'};
  $('#active-filters').innerHTML = active.map(([key,value])=>`<span class="filter-chip">${labels[key]}: ${esc(value)}</span>`).join('') + (active.length?'<button class="text-button small" id="clear-filters">Hapus Filter</button>':'');
  if($('#clear-filters')) $('#clear-filters').onclick=()=>{filters={};page=1;updateGrid();};
  if($('#clear-search')) $('#clear-search').onclick=()=>{query='';filters={};clearPhoto();};
  $('#photo-note').hidden = !photoSession;
  $('#photo-note').innerHTML = photoSession ? simulation('Kandidat ini adalah data contoh, bukan hasil analisis gambar. Filter tetap dapat digunakan.') : '';
  $('#pagination').hidden = pages<=1;
  $('#pagination').innerHTML = `<button class="btn btn-outline-secondary" id="prev-page" ${page===1?'disabled':''}>Sebelumnya</button><span class="page-indicator">${page} / ${pages}</span><button class="btn btn-outline-secondary" id="next-page" ${page===pages?'disabled':''}>Berikutnya</button>`;
  $('#prev-page').onclick=()=>{page--;updateGrid();window.scrollTo(0,0);};
  $('#next-page').onclick=()=>{page++;updateGrid();window.scrollTo(0,0);};
}
function clearPhoto() { ++searchReadVersion;photoSession=null;stagedPhoto=null;stagedName='';$('#search-photo').value='';$('#search-preview').innerHTML='';$('#search-preview').hidden=true;$('#run-photo').disabled=true;page=1;renderSearchSlot();updateGrid(); }
function expirePhoto() { if(photoSession && Date.now()-photoSession.at>=15*60*1000) {clearPhoto();toast('Sesi foto berakhir. Pilih foto lagi.');} }
setInterval(expirePhoto,15000);
document.addEventListener('visibilitychange',expirePhoto);
function openPhoto() {
  ++searchReadVersion;stagedPhoto=null;stagedName='';$('#search-photo').value='';$('#photo-error').textContent='';$('#search-preview').hidden=true;$('#search-preview').innerHTML='';$('#run-photo').disabled=true;
  $('#photo-upload-icon').innerHTML=icon('upload');$('#photo-dialog').showModal();
}
async function readImage(file) {
  const error=validatePhoto(file); if(error) throw new Error(error);
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Foto belum bisa dibaca. Pilih foto lagi.'));reader.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(FILE_ERROR));img.src=data;});
  const ratio=Math.min(1,1000/img.width,1000/img.height);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.78);
}
let searchReadVersion=0;
$('#search-photo').onchange=async e=>{
  const version=++searchReadVersion;stagedPhoto=null;$('#run-photo').disabled=true;$('#photo-error').textContent='';$('#search-preview').hidden=true;
  const file=e.target.files[0];if(!file) return;
  try { const result=await readImage(file);if(version!==searchReadVersion)return;stagedPhoto=result;stagedName=file.name;$('#search-preview').innerHTML=`<img src="${stagedPhoto}" alt="Pratinjau foto pencarian"><span>${esc(file.name)}</span>`;$('#search-preview').hidden=false;$('#run-photo').disabled=false; }
  catch(error){if(version===searchReadVersion)$('#photo-error').textContent=error.message;}
};
$('#run-photo').onclick=()=>{if(!stagedPhoto)return;photoSession={preview:stagedPhoto,ids:simulationCandidates(stagedName),at:Date.now()};stagedPhoto=null;page=1;$('#photo-dialog').close();renderSearchSlot();updateGrid();};
function openFilter() {
  $('#filter-fields').innerHTML=`${selectField('kind','Jenis',['Hilang','Temuan'],filters.kind,'Semua jenis')}${selectField('category','Kategori',categories,filters.category,'Semua kategori')}${selectField('area','Area',areas,filters.area,'Semua area')}
    <div class="form-columns">${inputField('from','Tanggal mulai','date',filters.from||'')}${inputField('to','Tanggal akhir','date',filters.to||'')}</div>
    ${selectField('status','Status',['Aktif','Menunggu Pengambilan','Selesai'],filters.status,'Aktif & Menunggu Pengambilan')}<p id="filter-error" class="field-error" role="alert"></p>`;
  $('#filter-dialog').showModal();
}
$('#filter-form').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));if(values.from&&values.to&&values.from>values.to){$('#filter-error').textContent='Tanggal akhir harus sama atau setelah tanggal mulai.';return;}filters=values;page=1;$('#filter-dialog').close();updateGrid();};
$('#reset-filter').onclick=()=>{filters={};page=1;$('#filter-dialog').close();updateGrid();};
function selectField(name,label,values,selected='',blank='Pilih…') { return `<div class="field-group"><label class="form-label" for="field-${name}">${label}</label><select class="form-select" id="field-${name}" name="${name}" aria-describedby="error-${name}">${options(values,selected,blank)}</select><p class="field-error" id="error-${name}"></p></div>`; }
function inputField(name,label,type='text',value='',attrs='') { return `<div class="field-group"><label class="form-label" for="field-${name}">${label}</label><input class="form-control" type="${type}" id="field-${name}" name="${name}" value="${esc(value)}" ${attrs} aria-describedby="error-${name}"><p class="field-error" id="error-${name}"></p></div>`; }
function detail(id) {
  const r=reportById(id);currentReport=r;
  if(!r){main.innerHTML=`${back()}<h1>Laporan tidak ditemukan</h1><p>Laporan ini belum tersedia di perangkat ini.</p>`;return;}
  const actionable = r.status==='Aktif';
  main.innerHTML=`${back()}<article><div class="detail-grid">${photo(r,'detail-photo',true)}<div class="detail-info"><div class="label-row">${kindLabel(r)}${statusLabel(r.status)}</div><h1>${esc(r.title)}</h1>
    <dl class="detail-facts"><dt>Waktu kejadian</dt><dd>${dateText(r)}${r.time?' WIB':''}</dd><dt>Area</dt><dd>${esc(r.area)}</dd><dt>Kategori</dt><dd>${esc(r.category)}</dd></dl>
    <h2>Deskripsi barang</h2><p class="description">${esc(r.description)}</p>
    <div class="detail-actions">${actionable? r.kind==='Temuan'&&!r.mine?`<a class="btn btn-primary" href="#/klaim/${r.id}">Ajukan Klaim</a>`:'<button class="btn btn-primary" data-action="link">Tautkan Laporan</button>':''}${!r.mine?`<a class="btn btn-outline-secondary" href="#/pesan/${r.id}">Kirim Pesan</a>`:''}</div>
    ${actionable&&r.kind==='Temuan'?'<button class="text-button" data-action="link">Tautkan Laporan</button>':''}
    <p class="report-author">Dilaporkan oleh ${esc(r.author)}${r.mine?' · Laporan Anda':''}</p><button class="text-button small" data-action="flag">Laporkan konten</button></div></div>
    <div class="detail-lower"><section class="section-divider"><h2>Laporan tertaut</h2><div id="linked-reports">${linkedMarkup(r)}</div></section>
    <section class="section-divider" aria-labelledby="discussion-title"><h2 id="discussion-title">Diskusi</h2><div id="discussion-list"></div><form class="comment-form" id="comment-form"><label class="form-label" for="comment">Tulis tanggapan</label><textarea class="form-control" id="comment" name="comment" rows="3" maxlength="300" required placeholder="Bagikan informasi umum tentang barang."></textarea><p class="small text-muted mt-2">Simpan ciri khusus dan bukti kepemilikan di pesan privat.</p><button class="btn btn-outline-secondary" type="submit">Kirim Tanggapan</button></form></section></div></article>`;
  renderComments(r.id);
  $('#comment-form').onsubmit=e=>{e.preventDefault();const text=$('#comment').value.trim();if(!text)return;comments[r.id]=[...(comments[r.id]||[]),{name:user?.name||'Pengunjung demo',text}];store('yourbarang.demo.comments',comments);$('#comment').value='';renderComments(r.id);toast('Tanggapan ditambahkan.');};
  main.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>openAction(el.dataset.action,r));
}
function linkedMarkup(r) {
  const ids=readLocal('yourbarang.demo.links',{})[r.id]||[];
  return ids.length?ids.map(id=>{const t=reportById(id);return t?`<a class="activity-item" href="#/laporan/${t.id}">${photo(t)}<div class="activity-text"><h2>${esc(t.title)}</h2>${kindLabel(t)}</div>${icon('arrow')}</a>`:'';}).join(''):'<p class="text-muted small mb-0">Belum ada laporan tertaut.</p>';
}
function renderComments(id) {
  const entries=comments[id]||[];
  $('#discussion-list').innerHTML=entries.length?entries.map((c,i)=>`<div class="discussion"><span class="comment-author">${esc(c.name)}</span><p>${esc(c.text)}</p><button class="text-button small" data-reply="${i}">Balas</button></div>`).join(''):'<p class="small text-muted">Belum ada tanggapan.</p>';
  main.querySelectorAll('[data-reply]').forEach(btn=>btn.onclick=()=>{$('#comment').value=`@${entries[Number(btn.dataset.reply)].name} `;$('#comment').focus();});
}
function openAction(type,r) {
  $('#action-title').textContent=type==='link'?'Tautkan Laporan':'Laporkan konten';
  if(type==='link') {
    const candidates=reports().filter(t=>t.id!==r.id&&t.kind!==r.kind&&t.status==='Aktif'&&(t.mine||t.id==='1'||t.id==='2'));
    $('#action-content').innerHTML=`${simulation('Pilih laporan Anda dari data contoh.')}<form id="link-form">${selectField('link','Laporan terkait',candidates.map(t=>t.title),'','Pilih laporan')}<p class="field-error" id="link-error" role="alert"></p><button class="btn btn-primary w-100" type="submit">Tautkan Laporan</button></form>`;
    $('#link-form').onsubmit=e=>{e.preventDefault();const title=$('#field-link').value;const target=candidates.find(t=>t.title===title);if(!target){$('#link-error').textContent='Pilih laporan terkait.';return;}const links=readLocal('yourbarang.demo.links',{});links[r.id]=[...new Set([...(links[r.id]||[]),target.id])];links[target.id]=[...new Set([...(links[target.id]||[]),r.id])];store('yourbarang.demo.links',links);$('#action-dialog').close();$('#linked-reports').innerHTML=linkedMarkup(r);toast('Laporan ditautkan.');};
  } else {
    $('#action-content').innerHTML=`<form id="flag-form"><label class="form-label" for="flag-reason">Alasan aduan</label><textarea class="form-control" id="flag-reason" rows="3" required minlength="10" maxlength="300"></textarea><p class="small text-muted mt-2">Aduan demo tidak dikirim ke moderator.</p><button class="btn btn-primary w-100 mt-3" type="submit">Kirim Aduan</button></form>`;
    $('#flag-form').onsubmit=e=>{e.preventDefault();$('#action-dialog').close();toast('Aduan demo dicatat.');};
  }
  $('#action-dialog').showModal();
}
function createReport() {
  formPhoto=null;photoBusy=false;
  main.innerHTML=`<div class="form-page">${back()}<h1>Buat Laporan</h1><form id="report-form" novalidate>
    <fieldset class="mb-0"><legend class="form-label">Jenis laporan</legend><div class="report-type"><label class="type-option"><input type="radio" name="kind" value="Hilang" checked>Hilang</label><label class="type-option"><input type="radio" name="kind" value="Temuan">Temuan</label></div></fieldset>
    ${inputField('title','Nama barang','text','','minlength="5" maxlength="60" required placeholder="Contoh: Dompet hitam"')}
    ${selectField('category','Kategori',categories,'','Pilih kategori')}${selectField('area','Area kejadian',areas,'','Pilih area')}
    <div class="form-columns">${inputField('date','Tanggal kejadian','date','','required max="'+wibToday()+'"')}${inputField('time','Jam <span class="optional">(opsional, WIB)</span>','time')}</div>
    <div class="field-group"><label class="form-label" for="field-description">Deskripsi barang</label><textarea class="form-control" id="field-description" name="description" rows="4" minlength="10" maxlength="300" required aria-describedby="error-description description-count" placeholder="Ceritakan ciri barang dan lokasi kejadiannya."></textarea><div class="d-flex justify-content-between gap-2 mt-1"><p id="error-description" class="field-error"></p><span class="small text-muted ms-auto" id="description-count">0 / 300</span></div></div>
    <div class="field-group"><label class="form-label" for="report-photo">Foto barang <span class="optional">(opsional)</span></label><label class="upload-zone" for="report-photo">${icon('upload')}<span class="fw-bold">Pilih Foto</span><span class="small text-muted">Satu JPG, PNG, atau WebP · Maksimal 5 MB</span><input class="visually-hidden" id="report-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="report-photo-error"></label><div id="report-preview" class="upload-preview" hidden></div><p class="field-error" id="report-photo-error" role="alert"></p><button class="text-button small" id="remove-report-photo" type="button" hidden>Hapus Foto</button></div>
    <div class="field-group"><label class="form-label" for="field-private">Ciri khusus (privat) <span class="optional">(opsional)</span></label><textarea class="form-control" id="field-private" name="private" rows="3" maxlength="300" placeholder="Ciri yang hanya diketahui pemilik barang."></textarea><p class="small text-muted mt-2">Tidak ditampilkan di laporan publik.</p></div>
    <p id="publish-error" class="field-error" role="alert"></p><div class="form-bottom"><a href="#/" class="btn btn-outline-secondary">Batal</a><button class="btn btn-primary" id="publish-report" type="submit">Terbitkan Laporan</button></div></form></div>`;
  $('#field-description').oninput=e=>$('#description-count').textContent=`${e.target.value.length} / 300`;
  let readVersion=0;
  $('#remove-report-photo').onclick=()=>{++readVersion;formPhoto=null;photoBusy=false;$('#publish-report').disabled=false;$('#report-photo').value='';$('#report-preview').hidden=true;$('#report-photo-error').textContent='';$('#remove-report-photo').hidden=true;};
  $('#report-photo').onchange=async e=>{
    const version=++readVersion;formPhoto=null;$('#report-preview').hidden=true;$('#report-photo-error').textContent='';const file=e.target.files[0];if(!file)return;
    $('#remove-report-photo').hidden=false;
    photoBusy=true;$('#publish-report').disabled=true;
    try { const result=await readImage(file);if(version!==readVersion||!e.target.isConnected)return;formPhoto=result;$('#report-preview').innerHTML=`<img src="${formPhoto}" alt="Pratinjau foto laporan"><span>${esc(file.name)}</span>`;$('#report-preview').hidden=false; }
    catch(error){if(version===readVersion&&e.target.isConnected)$('#report-photo-error').textContent=error.message;}
    finally{if(version===readVersion&&e.target.isConnected){photoBusy=false;$('#publish-report').disabled=false;}}
  };
  $('#report-form').onsubmit=e=>{
    e.preventDefault();if(photoBusy)return;
    const data=Object.fromEntries(new FormData(e.target));const errors=validateReport(data);
    e.target.querySelectorAll('.is-invalid').forEach(el=>{el.classList.remove('is-invalid');el.removeAttribute('aria-invalid');});
    e.target.querySelectorAll('[id^=error-]').forEach(el=>el.textContent='');
    Object.entries(errors).forEach(([key,value])=>{const el=$(`#field-${key}`);if(el){el.classList.add('is-invalid');el.setAttribute('aria-invalid','true');$(`#error-${key}`).textContent=value;}});
    if(Object.keys(errors).length){e.target.querySelector('.is-invalid')?.focus();return;}
    if($('#report-photo-error').textContent){$('#report-photo').focus();return;}
    const {private:privateNotes,...publicData}=data;
    const r={...publicData,title:data.title.trim(),description:data.description.trim(),id:`demo-${crypto.randomUUID()}`,photo:formPhoto,status:'Aktif',author:user?.name||'Anda (demo)',mine:true,createdAt:new Date().toISOString()};
    try {const next=[r,...saved];store(KEY,next);if(privateNotes.trim())store(`yourbarang.demo.private.${r.id}`,privateNotes.trim());saved=next;if(!user){user={name:'Pengguna demo'};store('yourbarang.demo.user',user);}query='';filters={};page=1;photoSession=null;location.hash=`/laporan/${r.id}`;toast('Laporan terbit.');}
    catch{$('#publish-error').textContent='Penyimpanan browser penuh atau tidak tersedia. Hapus foto, lalu coba lagi.';}
  };
}
function auth(register=false) {
  main.innerHTML=`<div class="auth-page">${back()}<h1>${register?'Daftar':'Masuk'} YourBarang</h1>${simulation('Gunakan email dan kata sandi contoh. Tidak ada autentikasi server; kata sandi tidak disimpan.')}<form id="auth-form">${register?inputField('name','Nama','text','','required minlength="2" maxlength="60" autocomplete="name"'):''}${inputField('email','Email','email','','required autocomplete="email" placeholder="nama@kampus.ac.id"')}<div class="field-group"><label class="form-label" for="password">Kata sandi</label><div class="password-wrap"><input type="password" id="password" class="form-control" required minlength="8" autocomplete="${register?'new-password':'current-password'}"><button class="btn btn-outline-secondary" type="button" id="show-password" aria-pressed="false">Tampilkan</button></div><p class="small text-muted mt-2">Minimal 8 karakter.</p></div><button class="btn btn-primary w-100" type="submit">${register?'Daftar':'Masuk'}</button></form><p class="text-center small mt-4">${register?'Sudah punya akun? <a href="#/masuk">Masuk</a>':'Belum punya akun? <a href="#/daftar">Daftar</a>'}</p></div>`;
  $('#show-password').onclick=()=>{const show=$('#password').type==='password';$('#password').type=show?'text':'password';$('#show-password').textContent=show?'Sembunyikan':'Tampilkan';$('#show-password').setAttribute('aria-pressed',String(show));};
  $('#auth-form').onsubmit=e=>{e.preventDefault();user={name:register?$('#field-name').value.trim():'Pengguna demo'};store('yourbarang.demo.user',user);const next=sessionStorage.getItem('yourbarang.demo.next');sessionStorage.removeItem('yourbarang.demo.next');location.hash=next||'/aktivitas';toast('Masuk ke sesi demo.');};
}
function requireDemoUser(next) { if(user)return true;sessionStorage.setItem('yourbarang.demo.next',next);location.hash='/masuk';return false; }
function summary(r) {return `<a class="summary-item text-decoration-none" href="#/laporan/${r.id}">${photo(r,'',true)}<div><h2>${esc(r.title)}</h2><div class="label-row">${kindLabel(r)}${statusLabel(r.status)}</div></div></a>`;}
function claimPage(id,messageOnly=false) {
  const r=reportById(id);if(!r){detail(id);return;}if(!requireDemoUser(`${messageOnly?'/pesan/':'/klaim/'}${id}`))return;
  if(!messageOnly&&(r.mine||r.kind!=='Temuan'||(r.status!=='Aktif'&&!claims[id]))){main.innerHTML=`${back(`#/laporan/${id}`,'Kembali ke Detail')}<h1>Klaim belum tersedia</h1><p>Laporan ini tidak dapat diklaim.</p>`;return;}
  const c=claims[id];
  main.innerHTML=`<div class="form-page">${back(`#/laporan/${id}`,'Kembali ke Detail')}<h1>${messageOnly?'Pesan Privat':'Klaim Barang'}</h1>${simulation('Alur privat memakai akun dan data lokal untuk presentasi.')}<div class="panel">${summary(r)}
    ${messageOnly?'':c?`<h2>Status klaim</h2><p>${statusLabel(c.status)}</p><p class="small text-muted">Bukti kepemilikan Anda</p><p class="description">${esc(c.evidence)}</p>${c.status==='Menunggu Pemeriksaan'?'<button id="approve-demo" class="btn btn-outline-secondary">Simulasikan Persetujuan</button>':`<a class="btn btn-primary" href="#/pengambilan/${id}">Atur Pengambilan</a>`}`:`<form id="claim-form"><label class="form-label" for="claim-evidence">Bukti kepemilikan</label><textarea class="form-control" id="claim-evidence" rows="4" required minlength="10" maxlength="600" placeholder="Jelaskan ciri khusus yang membuktikan barang ini milik Anda."></textarea><p class="small text-muted mt-2">Bukti tidak ditampilkan di halaman publik.</p><label class="form-label mt-3" for="claim-photo">Lampiran <span class="optional">(opsional)</span></label><input class="form-control" id="claim-photo" type="file" accept="image/jpeg,image/png,image/webp"><div id="claim-preview" class="upload-preview" hidden></div><p class="field-error" id="claim-error" role="alert"></p><button class="btn btn-primary w-100 mt-4" id="send-claim" type="submit">Kirim Klaim</button></form>`}
    <section class="${messageOnly?'':'section-divider'}"><h2>Percakapan privat</h2><div class="chat-log" id="chat-log"></div><form class="chat-form" id="chat-form"><label class="visually-hidden" for="chat-text">Pesan</label><input class="form-control" id="chat-text" required maxlength="600" placeholder="Tulis pesan…"><button class="btn btn-outline-secondary" type="submit">Kirim Pesan</button></form></section></div></div>`;
  if($('#claim-form')) {
    let claimPhoto=null,claimBusy=false;
    $('#claim-photo').onchange=async e=>{claimPhoto=null;$('#claim-preview').hidden=true;$('#claim-error').textContent='';const file=e.target.files[0];if(!file)return;claimBusy=true;$('#send-claim').disabled=true;try{claimPhoto=await readImage(file);$('#claim-preview').innerHTML=`<img src="${claimPhoto}" alt="Pratinjau lampiran bukti"><span>${esc(file.name)}</span>`;$('#claim-preview').hidden=false;}catch(error){$('#claim-error').textContent=error.message;}finally{claimBusy=false;$('#send-claim').disabled=false;}};
    $('#claim-form').onsubmit=e=>{e.preventDefault();if(claimBusy||$('#claim-error').textContent)return;claims[id]={evidence:$('#claim-evidence').value.trim(),attachment:claimPhoto,status:'Menunggu Pemeriksaan'};store('yourbarang.demo.claims',claims);claimPage(id);toast('Klaim demo terkirim.');};
  }
  if($('#approve-demo'))$('#approve-demo').onclick=()=>{claims[id].status='Disetujui';store('yourbarang.demo.claims',claims);claimPage(id);toast('Persetujuan disimulasikan.');};
  renderChat(id);
  $('#chat-form').onsubmit=e=>{e.preventDefault();const text=$('#chat-text').value.trim();if(!text)return;chats[id]=[...(chats[id]||[]),{text,me:true}];store('yourbarang.demo.chats',chats);$('#chat-text').value='';renderChat(id);};
}
function renderChat(id) {$('#chat-log').innerHTML=(chats[id]||[{text:'Halo, silakan jelaskan barang yang ingin Anda tanyakan. Pesan ini adalah contoh demo.',me:false}]).map(m=>`<div class="chat-bubble ${m.me?'me':''}"><p>${esc(m.text)}</p><small>${m.me?'Anda':'Penemu · Simulasi'}</small></div>`).join('');}
function pickup(id) {
  const r=reportById(id);if(!r){detail(id);return;}if(!requireDemoUser(`/pengambilan/${id}`))return;
  if(claims[id]?.status!=='Disetujui'){main.innerHTML=`${back(`#/klaim/${id}`,'Kembali ke Klaim')}<h1>Pengambilan belum tersedia</h1><p>Jadwal tersedia setelah klaim disetujui.</p>`;return;}
  const h=handovers[id];
  main.innerHTML=`<div class="form-page">${back(`#/klaim/${id}`,'Kembali ke Klaim')}<h1>Pengambilan Barang</h1>${simulation('Peran penemu dan penerima diperagakan di perangkat yang sama.')}<div class="panel">${summary(r)}${h?`<h2>Jadwal pengambilan</h2><p>${esc(h.date)} · ${esc(h.time)} WIB<br>${esc(h.location)}</p><p>${statusLabel(h.status)}</p>${h.status==='Diusulkan'?'<button class="btn btn-primary" id="accept-schedule">Simulasikan Setujui Jadwal</button>':''}${['Disepakati','Selesai'].includes(h.status)?`<div class="confirmation-row"><span>Penemu</span>${h.finder?'<strong>Sudah konfirmasi</strong>':'<button class="btn btn-outline-secondary" data-confirm="finder">Konfirmasi Penemu</button>'}</div><div class="confirmation-row"><span>Penerima</span>${h.receiver?'<strong>Sudah konfirmasi</strong>':'<button class="btn btn-outline-secondary" data-confirm="receiver">Konfirmasi Penerima</button>'}</div>`:''}${h.status!=='Selesai'?'<div class="d-flex gap-3 mt-3"><button class="text-button" id="change-schedule">Ubah Jadwal</button><button class="text-button" id="cancel-schedule">Batalkan Jadwal</button></div>':'<p class="mt-3 mb-0">Serah terima selesai setelah kedua pihak mengonfirmasi.</p>'}`:`<form id="schedule-form">${inputField('pickup-date','Tanggal','date',wibToday(),'required min="'+wibToday()+'"')}${inputField('pickup-time','Jam (WIB)','time','13:00','required')}${inputField('pickup-location','Lokasi pertemuan','text','Lobi Perpustakaan','required minlength="5" maxlength="120"')}<button class="btn btn-primary w-100" type="submit">Ajukan Jadwal</button></form>`}</div></div>`;
  if($('#schedule-form'))$('#schedule-form').onsubmit=e=>{e.preventDefault();handovers[id]={date:$('#field-pickup-date').value,time:$('#field-pickup-time').value,location:$('#field-pickup-location').value.trim(),status:'Diusulkan',finder:false,receiver:false};savePickup(id);};
  if($('#accept-schedule'))$('#accept-schedule').onclick=()=>{h.status='Disepakati';savePickup(id);};
  main.querySelectorAll('[data-confirm]').forEach(btn=>btn.onclick=()=>{h[btn.dataset.confirm]=true;if(h.finder&&h.receiver)h.status='Selesai';savePickup(id);});
  for(const selector of ['#change-schedule','#cancel-schedule'])if($(selector))$(selector).onclick=()=>{delete handovers[id];savePickup(id);toast(selector==='#change-schedule'?'Konfirmasi lama dihapus. Ajukan jadwal baru.':'Jadwal dibatalkan.');};
}
function savePickup(id){store('yourbarang.demo.handovers',handovers);pickup(id);}
function activity(tab='laporan') {
  if(!requireDemoUser(`/aktivitas/${tab}`))return;
  const tabs={laporan:'Laporan',klaim:'Klaim',pesan:'Pesan',saran:'Saran',notifikasi:'Notifikasi',profil:'Profil'};if(!tabs[tab])tab='laporan';
  main.innerHTML=`${back()}<h1>Aktivitas Saya</h1><nav class="activity-nav" aria-label="Jenis aktivitas">${Object.entries(tabs).map(([key,label])=>`<a class="activity-tab" href="#/aktivitas/${key}" ${key===tab?'aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="activity-mobile"><label class="visually-hidden" for="activity-select">Jenis aktivitas</label><select id="activity-select" class="form-select">${Object.entries(tabs).map(([key,label])=>`<option value="${key}" ${key===tab?'selected':''}>${label}</option>`).join('')}</select></div><div id="activity-content"></div>`;
  $('#activity-select').onchange=e=>location.hash=`/aktivitas/${e.target.value}`;
  const box=$('#activity-content');
  const list=(items,href,description)=>items.map(r=>`<a class="activity-item" href="${href(r)}">${photo(r)}<div class="activity-text"><h2>${esc(r.title)}</h2><p>${description(r)}</p></div>${icon('arrow')}</a>`).join('');
  if(tab==='laporan') box.innerHTML=list(saved,r=>`#/laporan/${r.id}`,r=>`${r.kind} · ${r.status} · ${esc(r.area)}`)||'<p class="text-muted">Belum ada laporan Anda. <a href="#/buat">Buat Laporan</a></p>';
  if(tab==='klaim') box.innerHTML=list(reports().filter(r=>claims[r.id]),r=>`#/klaim/${r.id}`,r=>esc(claims[r.id].status))||'<p class="text-muted">Belum ada klaim. <a href="#/">Cari barang di Beranda</a></p>';
  if(tab==='pesan') box.innerHTML=list(reports().filter(r=>chats[r.id]),r=>`#/pesan/${r.id}`,r=>esc(chats[r.id].at(-1).text))||'<p class="text-muted">Belum ada percakapan. Buka Kirim Pesan pada detail laporan.</p>';
  if(tab==='saran') box.innerHTML=simulation('Pasangan laporan berikut memakai data contoh.')+list([seedReports[1],seedReports[14]],r=>`#/laporan/${r.id}`,()=> 'Area sama, selisih 1 hari');
  if(tab==='notifikasi') box.innerHTML=Object.keys(claims).length?list(reports().filter(r=>claims[r.id]),r=>`#/klaim/${r.id}`,r=>`Klaim ${esc(claims[r.id].status.toLowerCase())}`):'<p class="text-muted">Belum ada notifikasi baru.</p>';
  if(tab==='profil') {box.innerHTML=`<div class="form-page m-0">${simulation('Profil ini hanya disimpan di browser.')}<form id="profile-form">${inputField('name','Nama','text',user.name,'required minlength="2" maxlength="60"')}<button class="btn btn-primary" type="submit">Simpan Profil</button></form><button class="text-button mt-4" id="logout">Keluar</button></div>`;$('#profile-form').onsubmit=e=>{e.preventDefault();user.name=$('#field-name').value.trim();store('yourbarang.demo.user',user);toast('Profil disimpan.');};$('#logout').onclick=()=>{user=null;localStorage.removeItem('yourbarang.demo.user');location.hash='/';toast('Keluar dari sesi demo.');};}
}
function guide() {
  main.innerHTML=`<div class="form-page">${back()}<h1>Panduan Demo</h1><ol class="guide-list"><li>Cari nama barang di Beranda atau gunakan Filter, lalu pilih kartu untuk membuka detail.</li><li>Pilih Buat Laporan, isi data, lalu Terbitkan Laporan. Laporan tersimpan pada browser ini.</li><li>Buka Cari lewat foto, pilih satu gambar, lalu Cari. Hapus Foto mengembalikan pencarian teks.</li><li>Untuk alur lanjutan, pilih laporan Temuan aktif → Ajukan Klaim → Masuk dengan data contoh → Kirim Klaim → Simulasikan Persetujuan → Atur Pengambilan.</li></ol><p class="subtle-note">Pencocokan foto, akun, klaim, pesan, dan pengambilan adalah simulasi lokal. Tidak ada data yang dikirim ke server.</p><h2>Halaman demo</h2><div class="d-flex gap-2 flex-wrap"><a class="btn btn-outline-secondary" href="#/aktivitas">Aktivitas Saya</a><a class="btn btn-outline-secondary" href="#/admin">Panel Admin</a></div></div>`;
}
function admin() {
  main.innerHTML=`${back()}<h1>Panel Admin</h1>${simulation('Antrean contoh untuk demo navigasi; keputusan tidak memoderasi data publik.')}<div class="activity-nav d-flex" aria-label="Antrean admin"><button class="activity-tab border-0" id="moderation-tab" aria-current="page">Moderasi</button><button class="activity-tab border-0" id="dispute-tab">Sengketa</button></div><div id="admin-content"></div>`;
  const renderAdmin=dispute=>{$('#admin-content').innerHTML=`<table class="table admin-table"><thead><tr><th>Konten</th><th>Alasan</th><th>Status</th><th></th></tr></thead><tbody><tr><td>${dispute?'Klaim Botol biru':'Komentar pada Botol biru'}</td><td>${dispute?'Bukti kepemilikan diperselisihkan':'Kontak pribadi dipublikasikan'}</td><td>${dispute?'Dalam Peninjauan':'Belum ditinjau'}</td><td><button class="text-button" id="review-admin">Tinjau</button></td></tr></tbody></table>`;$('#review-admin').onclick=()=>{$('#action-title').textContent=dispute?'Tinjau Sengketa':'Tinjau Aduan';$('#action-content').innerHTML=`<form id="decision-form">${selectField('decision','Keputusan',dispute?['Kembalikan ke Pemeriksaan','Tolak Klaim']:['Sembunyikan Konten','Pulihkan Konten'])}<label class="form-label" for="admin-reason">Alasan keputusan</label><textarea class="form-control" id="admin-reason" required minlength="10" rows="3"></textarea><button class="btn btn-primary w-100 mt-4">Simpan Keputusan</button></form>`;$('#action-dialog').showModal();$('#decision-form').onsubmit=e=>{e.preventDefault();if(!$('#field-decision').value){$('#field-decision').focus();return;}$('#action-dialog').close();toast('Keputusan demo dicatat.');};};};
  $('#moderation-tab').onclick=()=>{$('#moderation-tab').setAttribute('aria-current','page');$('#dispute-tab').removeAttribute('aria-current');renderAdmin(false);};$('#dispute-tab').onclick=()=>{$('#dispute-tab').setAttribute('aria-current','page');$('#moderation-tab').removeAttribute('aria-current');renderAdmin(true);};renderAdmin(false);
}
function route() {
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const parts=location.hash.replace(/^#\/?/,'').split('/');const [name,id]=parts;header(!name?'home':name);
  const titles={'':'Barang Hilang dan Temuan',laporan:'Detail Laporan',buat:'Buat Laporan',masuk:'Masuk',daftar:'Daftar',klaim:'Klaim Barang',pesan:'Pesan Privat',pengambilan:'Pengambilan',aktivitas:'Aktivitas Saya',panduan:'Panduan Demo',admin:'Panel Admin'};
  document.title=`${titles[name]||'Halaman'} — YourBarang`;
  if(!name)home();else if(name==='laporan')detail(decodeURIComponent(id||''));else if(name==='buat')createReport();else if(name==='masuk'||name==='daftar')auth(name==='daftar');else if(name==='klaim'||name==='pesan')claimPage(id,name==='pesan');else if(name==='pengambilan')pickup(id);else if(name==='aktivitas')activity(id);else if(name==='panduan')guide();else if(name==='admin')admin();else main.innerHTML=`${back()}<h1>Halaman tidak ditemukan</h1>`;
  window.scrollTo(0,0);main.focus({preventScroll:true});expirePhoto();
}
document.querySelectorAll('[data-close]').forEach(btn=>btn.onclick=()=>btn.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}});});
document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement && e.target.hasAttribute('data-fallback'))e.target.parentElement.innerHTML='<span>Tanpa foto</span>';},true);
window.addEventListener('hashchange',route);
route();
