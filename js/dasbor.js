/* SUARA HULU: dasbor pemerintah daerah/BPBD */
(function () {
  const D = window.SH_DATA;
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let filterProv = '';
  let filterStatus = 'perlu';

  const prov = [...new Set(D.das.map((d) => d.provinsi))];
  $('#filter-provinsi').innerHTML += prov.map((p) => `<option>${p}</option>`).join('');
  $('#filter-provinsi').addEventListener('change', (e) => { filterProv = e.target.value; render(); });

  const dasTampil = () => D.das.filter((d) => !filterProv || d.provinsi === filterProv);

  function ringkas(list) {
    const s = SH.load();
    const ikd = list.map((d) => SH.hitungIKD(d));
    const merah = ikd.filter((i) => i.status === 'merah').length;
    const ids = list.map((d) => d.id);
    const lap = s.laporan.filter((l) => ids.includes(l.dasId));
    const menunggu = lap.filter((l) => ['diterima', 'cocok'].includes(l.status)).length;
    const selesai = lap.filter((l) => l.waktuTindak);
    const rata = selesai.length ? Math.round(selesai.reduce((a, l) => a + (l.waktuTindak - l.waktu), 0) / selesai.length / 3600000) : null;
    const ha = Math.round(ikd.reduce((a, i) => a + i.peringatanHa, 0));
    $('#ringkas').innerHTML = `
      <div><span class="d-angka merah-teks">${merah}</span><span>DAS berstatus kritis</span></div>
      <div><span class="d-angka">${menunggu}</span><span>laporan menunggu tindak lanjut</span></div>
      <div><span class="d-angka">${rata === null ? 'belum ada' : rata + ' jam'}</span><span>rata-rata waktu tindak lanjut</span></div>
      <div><span class="d-angka">${ha.toLocaleString('id-ID')}</span><span>ha peringatan satelit 90 hari</span></div>`;
  }

  function peta(list) {
    // proyeksi sederhana bujur/lintang Indonesia
    const W = 640, H = 260, x = (lon) => ((lon - 94) / (142 - 94)) * W, y = (lat) => ((7 - lat) / (7 + 11)) * H;
    const pulau = [['Sumatra', 101.5, -3.2], ['Jawa', 109.5, -9.9], ['Kalimantan', 112.5, 3.6], ['Sulawesi', 119.2, 2.2], ['Papua', 135.5, -6.6]];
    let s = `<svg viewBox="0 0 ${W} ${H}" class="peta-nas" role="img" aria-label="Sebaran DAS contoh di Indonesia dan statusnya">`;
    for (let lo = 95; lo <= 140; lo += 5) s += `<line x1="${x(lo)}" x2="${x(lo)}" y1="0" y2="${H}" stroke="var(--garis)" stroke-width=".6"/>`;
    for (let la = 5; la >= -10; la -= 5) s += `<line y1="${y(la)}" y2="${y(la)}" x1="0" x2="${W}" stroke="var(--garis)" stroke-width=".6"/>`;
    s += `<line y1="${y(0)}" y2="${y(0)}" x1="0" x2="${W}" stroke="var(--kontur)" stroke-width="1" stroke-dasharray="4 4"/>`;
    pulau.forEach(([n, lo, la]) => { s += `<text x="${x(lo)}" y="${y(la)}" class="peta-pulau">${n}</text>`; });
    list.forEach((d) => {
      const i = SH.hitungIKD(d);
      const r = 6 + Math.sqrt(d.luasHuluHa) / 70;
      const kiri = d.lon > 130 || d.id === 'citarum';
      s += `<g class="titik-das" data-das="${d.id}" tabindex="0" role="button" aria-label="${d.nama}, status ${SH.STATUS[i.status].label}, indeks ${i.skor}">
        <circle cx="${x(d.lon)}" cy="${y(d.lat)}" r="${r.toFixed(1)}" fill="var(--${i.status})" fill-opacity=".85" stroke="#fff" stroke-width="2"/>
        <text x="${kiri ? x(d.lon) - r - 4 : x(d.lon) + r + 4}" y="${y(d.lat) + 4}" text-anchor="${kiri ? 'end' : 'start'}" class="peta-das">${d.nama.replace('DAS ', '')} ${i.skor}</text></g>`;
    });
    s += `</svg><div class="legenda"><span><i style="background:var(--hijau)"></i>Sehat</span><span><i style="background:var(--kuning)"></i>Waspada</span><span><i style="background:var(--merah)"></i>Kritis</span></div>`;
    $('#peta-nasional').innerHTML = s;
    document.querySelectorAll('.titik-das').forEach((g) => {
      g.addEventListener('click', () => panel(g.dataset.das));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panel(g.dataset.das); } });
    });
  }

  function tabelDAS(list) {
    const baris = list.map((d) => ({ d, i: SH.hitungIKD(d) })).sort((a, b) => a.i.skor - b.i.skor);
    $('#tabel-das').innerHTML = `<thead><tr><th>DAS</th><th>Indeks</th><th>Hutan hilang 12 bln</th><th>Laporan terverifikasi</th></tr></thead><tbody>
      ${baris.map(({ d, i }) => `<tr tabindex="0" data-das="${d.id}">
        <td class="kol-das"><strong>${d.nama}</strong><br><span class="kecil">${d.kabupaten}, ${d.provinsi}</span></td>
        <td><span class="pil pil-${i.status}">${i.skor} ${SH.STATUS[i.status].label}</span>${i.naik ? '<br><span class="kecil">naik karena hujan</span>' : ''}</td>
        <td>${SH.fmt(i.hilang12)}%</td>
        <td>${i.nLapor}</td></tr>`).join('')}</tbody>`;
    document.querySelectorAll('#tabel-das tbody tr').forEach((tr) => {
      tr.addEventListener('click', () => panel(tr.dataset.das));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') panel(tr.dataset.das); });
    });
  }

  const FILTER = {
    perlu: { label: 'Perlu tindakan', cocok: (l) => ['diterima', 'cocok'].includes(l.status) },
    diteruskan: { label: 'Diteruskan', cocok: (l) => l.status === 'diteruskan' },
    ditindak: { label: 'Selesai', cocok: (l) => l.status === 'ditindak' },
    semua: { label: 'Semua', cocok: () => true },
  };
  function tabelLaporan(list) {
    const s = SH.load();
    const ids = list.map((d) => d.id);
    $('#tab-status').innerHTML = Object.entries(FILTER).map(([k, f]) => {
      const n = s.laporan.filter((l) => ids.includes(l.dasId) && f.cocok(l)).length;
      return `<button role="tab" aria-selected="${filterStatus === k}" data-f="${k}">${f.label} (${n})</button>`;
    }).join('');
    document.querySelectorAll('#tab-status button').forEach((b) => b.addEventListener('click', () => { filterStatus = b.dataset.f; render(); }));
    const lap = s.laporan.filter((l) => ids.includes(l.dasId) && FILTER[filterStatus].cocok(l)).sort((a, b) => b.waktu - a.waktu);
    if (!lap.length) {
      $('#tabel-laporan').innerHTML = `<tbody><tr><td class="kosong">Tidak ada laporan di kategori ini. Kirim laporan dari aplikasi warga untuk melihatnya muncul di sini.</td></tr></tbody>`;
      return;
    }
    $('#tabel-laporan').innerHTML = `<thead><tr><th>Foto</th><th>Temuan</th><th>DAS</th><th>Masuk</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>
      ${lap.map((l) => {
        const j = D.jenisTemuan.find((x) => x.id === l.jenis) || {};
        const das = SH.das(l.dasId);
        const aksi = l.status === 'antre' ? '<span class="kecil">Belum terkirim</span>'
          : l.status === 'diterima' ? `<button class="tombol sekunder kecil-t" data-aksi="cocok" data-id="${l.id}">Tandai cocok dengan satelit</button>`
          : l.status === 'cocok' ? `<button class="tombol utama kecil-t" data-aksi="diteruskan" data-id="${l.id}">Teruskan ke Gakkum/BPBD</button>`
          : l.status === 'diteruskan' ? `<button class="tombol utama kecil-t" data-aksi="ditindak" data-id="${l.id}">Tandai sudah ditindaklanjuti</button>`
          : '<span class="kecil">Selesai</span>';
        return `<tr>
          <td>${l.foto ? `<img class="foto-mini" src="${l.foto}" alt="Foto temuan ${esc(j.label || '')}">` : '<span class="foto-kosong" aria-label="Tanpa foto">tanpa foto</span>'}</td>
          <td><strong>${j.ikon || ''} ${j.label || ''}</strong><br><span class="kecil">${esc(l.catatan || 'Tanpa keterangan')}</span><br><span class="kecil">${l.anonim ? 'Pelapor anonim' : 'Pelapor terdaftar'}, ${l.lat.toFixed(2)}, ${l.lon.toFixed(2)}</span></td>
          <td>${das.nama}</td>
          <td>${SH.waktuRelatif(l.waktu)}</td>
          <td>${SH.STATUS_LAPORAN[l.status]}</td>
          <td>${aksi}</td></tr>`;
      }).join('')}</tbody>`;
    document.querySelectorAll('[data-aksi]').forEach((b) => b.addEventListener('click', () => {
      const st = SH.load();
      const l = st.laporan.find((x) => x.id === b.dataset.id);
      l.status = b.dataset.aksi;
      if (l.status === 'ditindak') l.waktuTindak = Date.now();
      SH.save();
      render();
    }));
  }

  function panel(id) {
    const d = SH.das(id);
    const i = SH.hitungIKD(d);
    const p = $('#d-panel');
    p.hidden = false;
    p.innerHTML = `<div class="d-panel-latar" data-tutup></div>
      <aside class="d-panel-isi" role="dialog" aria-modal="true" aria-label="Rincian ${d.nama}">
        <p class="kecil">${d.kabupaten}, ${d.provinsi}</p>
        <h2>${d.nama}</h2>
        <p><span class="pil pil-${i.status}">${i.skor}/100 ${SH.STATUS[i.status].label}</span></p>
        <ul class="komponen">${i.komponen.map((k) => `<li><div class="komp-atas"><span>${k.nama}</span><span class="komp-nilai">${k.nilai}</span></div>
          <div class="bar" aria-hidden="true"><span style="width:${k.skor}%"></span></div>
          <div class="komp-bawah"><span>Skor ${Math.round(k.skor)}, bobot ${Math.round(k.bobot * 100)}%</span><span>${k.sumber}</span></div></li>`).join('')}</ul>
        <h3>Rekomendasi tindakan</h3>
        <ul class="rekom">
          ${i.status === 'merah' ? '<li>Kirim tim verifikasi lapangan ke titik peringatan satelit terbaru.</li><li>Evaluasi izin dan tata ruang di zona hulu bersama dinas kehutanan.</li>' : ''}
          ${i.hujanSangatLebat ? '<li>Koordinasikan kesiapsiagaan desa di hilir dengan BPBD karena hujan sangat lebat diprakirakan.</li>' : ''}
          <li>Masukkan zona hulu dengan peringatan aktif ke prioritas rehabilitasi DAS.</li>
          <li>Ajak desa di sepanjang DAS memakai Dana Desa fokus ketahanan iklim untuk kader pemantau.</li>
        </ul>
        <button class="tombol sekunder lebar" data-tutup>Tutup</button>
      </aside>`;
    p.querySelectorAll('[data-tutup]').forEach((b) => b.addEventListener('click', () => { p.hidden = true; }));
    p.querySelector('button').focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#d-panel').hidden = true; });

  function render() {
    const list = dasTampil();
    ringkas(list);
    peta(list);
    tabelDAS(list);
    tabelLaporan(list);
  }
  SH.onChange(render);
  setInterval(render, 30000);
  render();
})();
