async page => {
  // Run with Playwright CLI from yourbarang-demo; this uses that CLI's own browser session.
  const base='http://127.0.0.1:8000/';
  const check=(condition,message)=>{if(!condition)throw new Error(message);};
  const results=[];
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  const backup=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('yourbarang.demo.')).map(k=>[k,localStorage.getItem(k)]));
  const reset=async()=>{await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('yourbarang.demo.')).forEach(k=>localStorage.removeItem(k)));await page.goto(base);await page.reload();await page.locator('.report-card').first().waitFor();};
  const noOverflow=async()=>check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Ada gulir horizontal');
  try {
    for(const [width,columns] of [[1280,6],[992,4],[768,3],[360,2]]) {
      await reset();await page.setViewportSize({width,height:900});
      const actual=await page.locator('#report-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
      check(actual===columns,`${width}px: seharusnya ${columns} kolom, aktual ${actual}`);
      check(await page.locator('.report-card').count()===18,'Grid harus berisi 18 laporan');await noOverflow();
      if(width===1280||width===360)await page.screenshot({path:`output/playwright/beranda-${width}.png`,fullPage:true});
      results.push(`Grid ${width}px: ${columns} kolom, 18 kartu, tanpa overflow`);
    }
    for(const width of [1280,360]) {
      await reset();await page.setViewportSize({width,height:900});
      await page.locator('#text-search').fill('dompet');check(await page.locator('.report-card').count()===2,'Pencarian dompet harus dua hasil');
      await page.getByRole('button',{name:'Filter',exact:true}).click();await page.locator('#field-kind').selectOption('Temuan');await page.getByRole('button',{name:'Terapkan Filter'}).click();
      await page.getByText('Belum ada laporan yang cocok.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Hapus Filter',exact:true}).click();
      await page.locator('.report-card').first().click();await page.getByRole('heading',{name:'Dompet hitam',exact:true,level:1}).waitFor();await noOverflow();
      await page.screenshot({path:`output/playwright/detail-${width}.png`,fullPage:true});
      await page.getByRole('link',{name:'Buat Laporan',exact:true}).click();
      await page.getByRole('button',{name:'Terbitkan Laporan',exact:true}).click();await page.getByText('Judul harus 5–60 karakter.',{exact:true}).waitFor();
      await page.locator('#field-title').fill(`Dompet demo ${width}`);await page.locator('#field-category').selectOption('Dompet & kartu');await page.locator('#field-area').selectOption('Perpustakaan');
      const today=await page.evaluate(()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10));
      await page.locator('#field-date').fill('2099-01-01');await page.locator('#field-description').fill('Dompet hitam tertinggal di meja baca lantai dua.');
      await page.getByRole('button',{name:'Terbitkan Laporan',exact:true}).click();await page.getByText('Pilih tanggal hari ini atau sebelumnya.',{exact:true}).waitFor();await page.locator('#field-date').fill(today);
      await page.locator('#report-photo').setInputFiles('assets/item-01.jpg');await page.locator('#report-preview img').waitFor();
      if(width===360)await page.getByRole('button',{name:'Hapus Foto',exact:true}).click();
      await page.locator('#field-private').fill('RAHASIA-DEMO-TIDAK-PUBLIK');await noOverflow();
      await page.screenshot({path:`output/playwright/form-${width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Terbitkan Laporan',exact:true}).click();await page.waitForURL(/#\/laporan\/demo-/);
      await page.getByRole('heading',{name:`Dompet demo ${width}`,exact:true,level:1}).waitFor();
      check(!(await page.locator('body').innerText()).includes('RAHASIA-DEMO-TIDAK-PUBLIK'),'Ciri privat tampil di publik');
      await page.reload();await page.getByRole('heading',{name:`Dompet demo ${width}`,exact:true,level:1}).waitFor();
      if(width===1280)check(await page.locator('.detail-photo img').count()===1,'Foto laporan tidak bertahan setelah reload');
      else await page.locator('.detail-photo').getByText('Tanpa foto',{exact:true}).waitFor();
      await page.getByRole('link',{name:'Kembali ke Beranda',exact:true}).click();await page.locator('.report-card').first().waitFor();
      check(await page.locator('.report-card').count()===18,'Pagination harus membatasi 18 kartu');await page.getByRole('button',{name:'Berikutnya',exact:true}).click();check(await page.locator('.report-card').count()===1,'Halaman dua harus satu laporan');
      await page.getByRole('button',{name:'Sebelumnya',exact:true}).click();
      await page.locator('#text-search').fill('dompet');
      await page.getByRole('button',{name:'Cari lewat foto',exact:true}).click();
      check(await page.locator('#run-photo').isDisabled(),'Cari aktif sebelum memilih foto');
      await page.locator('#search-photo').setInputFiles({name:'invalid.gif',mimeType:'image/gif',buffer:Buffer.from('invalid')});await page.getByText('Pilih JPG, PNG, atau WebP maksimal 5 MB.',{exact:true}).waitFor();
      await page.locator('#search-photo').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});check(await page.locator('#run-photo').isDisabled(),'Berkas >5MB diterima');
      await page.locator('#search-photo').setInputFiles('assets/item-02.jpg');await page.locator('#search-preview img').waitFor();
      await page.screenshot({path:`output/playwright/dialog-foto-${width}.png`});
      await page.locator('#run-photo').click();await page.locator('#photo-dialog').waitFor({state:'hidden'});check(await page.locator('.report-card').count()===6,'Hasil simulasi default harus enam');await page.getByText('Simulasi',{exact:true}).waitFor();await noOverflow();
      await page.getByRole('button',{name:'Hapus Foto',exact:true}).click();check(await page.locator('#text-search').inputValue()==='dompet','Teks pencarian tidak dipulihkan');
      await page.getByRole('button',{name:'Cari lewat foto',exact:true}).click();await page.keyboard.press('Escape');
      check(await page.locator('#open-photo').evaluate(el=>el===document.activeElement),'Fokus tidak kembali ke pembuka dialog');
      results.push(`${width}px: pencarian, filter, Beranda → Detail, Form → Detail, reload, pagination, foto, validasi & pemulihan teks lulus`);
    }
    await reset();await page.goto(base+'#/laporan/2');await page.getByRole('link',{name:'Ajukan Klaim',exact:true}).click();
    await page.locator('#field-email').fill('demo@kampus.ac.id');await page.locator('#password').fill('contohdemo');await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.locator('#claim-evidence').waitFor();
    await page.locator('#claim-evidence').fill('Ada stiker kecil berbentuk bintang pada dasar botol.');await page.getByRole('button',{name:'Kirim Klaim',exact:true}).click();await page.getByRole('button',{name:'Simulasikan Persetujuan',exact:true}).click();
    await page.getByRole('link',{name:'Atur Pengambilan',exact:true}).click();await page.getByRole('button',{name:'Ajukan Jadwal',exact:true}).click();await page.getByRole('button',{name:'Simulasikan Setujui Jadwal',exact:true}).click();
    await page.getByRole('button',{name:'Konfirmasi Penemu',exact:true}).click();check(await page.getByRole('button',{name:'Konfirmasi Penerima',exact:true}).count()===1,'Satu konfirmasi menutup pengambilan');
    await page.getByRole('button',{name:'Ubah Jadwal',exact:true}).click();await page.getByRole('button',{name:'Ajukan Jadwal',exact:true}).click();await page.getByRole('button',{name:'Simulasikan Setujui Jadwal',exact:true}).click();check(await page.getByRole('button',{name:'Konfirmasi Penemu',exact:true}).count()===1,'Konfirmasi lama belum direset');
    await page.getByRole('button',{name:'Konfirmasi Penemu',exact:true}).click();await page.getByRole('button',{name:'Konfirmasi Penerima',exact:true}).click();await page.getByText('Serah terima selesai setelah kedua pihak mengonfirmasi.',{exact:true}).waitFor();
    results.push('Alur demo klaim → jadwal → perubahan → dua konfirmasi lulus');check(errors.length===0,`JavaScript error: ${errors.join('; ')}`);
    return {status:'PASS',results};
  } finally {
    await page.evaluate(entries=>{Object.keys(localStorage).filter(k=>k.startsWith('yourbarang.demo.')).forEach(k=>localStorage.removeItem(k));for(const [key,value] of entries)localStorage.setItem(key,value);},backup);
    await page.goto(base);await page.reload();
  }
}
