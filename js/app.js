/* SUARA HULU: aplikasi warga */
(function () {
  const D = window.SH_DATA;
  const $ = (sel, el = document) => el.querySelector(sel);
  const view = $('#view');
  let tab = 'sungaiku';
  let draft = { foto: null, jenis: null, catatan: '', lokasi: null, lokasiSimulasi: false, anonim: true };

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const st = () => SH.load();
  const dasAktif = () => SH.das(st().dasId);

  /* ---------- toast & sheet ---------- */
  function toast(judul, isi, tipe = '') {
    const t = $('#toast');
    t.innerHTML = `<div class="toast ${tipe}" role="status"><div class="toast-app"><span class="logo-kecil" aria-hidden="true"></span>SUARA HULU · sekarang</div><strong>${esc(judul)}</strong><p>${esc(isi)}</p></div>`;
    t.classList.add('tampil');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('tampil'), 5200);
  }
  function sheet(html) {
    const s = $('#sheet');
    s.innerHTML = `<div class="sheet-latar" data-tutup></div><div class="sheet-isi" role="dialog" aria-modal="true">${html}<button class="tombol sekunder lebar" data-tutup>Tutup</button></div>`;
    s.classList.add('tampil');
    s.querySelectorAll('[data-tutup]').forEach((b) => b.addEventListener('click', () => s.classList.remove('tampil')));
    const f = s.querySelector('button, [tabindex]');
    if (f) f.focus();
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const das = dasAktif();
    $('#nama-das').textContent = das.nama;
    $('#lokasi-das').textContent = `${das.kabupaten}, ${das.provinsi}`;
    $('#indikator-sinyal').hidden = !st().offline;
    const belum = st().notifikasi.filter((n) => n.dasId === das.id && !n.dibaca).length;
    const b = $('#badge-notif');
    b.textContent = belum;
    b.hidden = belum === 0;
  }

  /* ---------- onboarding / pilih DAS ---------- */
  function pilihDAS(pertama) {
    const daftar = D.das.map((d) => `<button class="pilihan-das" data-das="${d.id}"><strong>${d.nama}</strong><span>${d.kabupaten}, ${d.provinsi}</span></button>`).join('');
    sheet(`<h2>${pertama ? 'Sungai mana yang mengalir di dekat rumahmu?' : 'Ganti sungai'}</h2>
      <p class="kecil">SUARA HULU memantau hulu sungai itu dan mengabarimu bila hutannya rusak.</p>
      <button class="tombol utama lebar" id="pakai-lokasi">Gunakan lokasiku</button>
      <p class="kecil" id="info-lokasi"></p>
      <div class="daftar-das">${daftar}</div>`);
    $('#pakai-lokasi').addEventListener('click', () => {
      $('#info-lokasi').textContent = 'Mencari DAS terdekat...';
      if (!navigator.geolocation) { $('#info-lokasi').textContent = 'Perangkat tidak mendukung lokasi. Pilih dari daftar di bawah.'; return; }
      navigator.geolocation.getCurrentPosition((p) => {
        const { latitude: la, longitude: lo } = p.coords;
        const terdekat = D.das.reduce((a, d) => (Math.hypot(d.lat - la, d.lon - lo) < Math.hypot(a.lat - la, a.lon - lo) ? d : a));
        setDAS(terdekat.id);
        toast('DAS ditemukan', `Lokasimu paling dekat dengan ${terdekat.nama} di antara DAS contoh purwarupa.`);
      }, () => { $('#info-lokasi').textContent = 'Izin lokasi ditolak atau tidak tersedia. Pilih dari daftar di bawah.'; }, { timeout: 6000 });
    });
    document.querySelectorAll('.pilihan-das').forEach((b) => b.addEventListener('click', () => setDAS(b.dataset.das)));
  }
  function setDAS(id) {
    const s = st();
    s.dasId = id;
    s.sudahOnboarding = true;
    SH.save();
    $('#sheet').classList.remove('tampil');
    render();
  }

  /* ---------- Sungaiku ---------- */
  function vSungaiku() {
    const das = dasAktif();
    const ikd = SH.hitungIKD(das);
    const S = SH.STATUS[ikd.status];
    return `
      <section class="kartu peta-kartu">${SHPeta.petaDAS(das, ikd)}</section>
      <section class="kartu status status-${ikd.status}">
        <div class="status-baris">
          <div class="skor"><span class="angka">${ikd.skor}</span><span class="dari">/100</span></div>
          <div>
            <p class="status-label"><span class="titik"></span>${S.label}</p>
            <p class="status-sub">Indeks Kesehatan DAS ${esc(das.sungai)}</p>
          </div>
        </div>
        <p class="status-kalimat">${S.kalimat} Dalam 12 bulan terakhir, ${SH.fmt(ikd.hilang12)}% hutan di hulunya hilang.</p>
        ${ikd.naik ? `<p class="status-naik">Status naik dari ${SH.STATUS[ikd.dasar].label.toLowerCase()} karena BMKG memprakirakan hujan sangat lebat (${ikd.hujanMm} mm/hari).</p>` : ''}
        <div class="aksi-baris">
          <button class="tombol sekunder" id="dengarkan">Dengarkan</button>
          <button class="tombol teks" id="kenapa">Kenapa ini penting?</button>
        </div>
      </section>
      <section class="kartu">
        <h3>Hutan di hulu, lima tahun terakhir</h3>
        ${SHPeta.grafikTren(das, ikd)}
      </section>
      <section class="kartu">
        <details>
          <summary>Rincian indeks</summary>
          <ul class="komponen">
            ${ikd.komponen.map((k) => `<li>
              <div class="komp-atas"><span>${k.nama}</span><span class="komp-nilai">${k.nilai}</span></div>
              <div class="bar" aria-hidden="true"><span style="width:${k.skor}%"></span></div>
              <div class="komp-bawah"><span>Skor ${Math.round(k.skor)}, bobot ${Math.round(k.bobot * 100)}%</span><span>${k.sumber}</span></div>
            </li>`).join('')}
          </ul>
          <p class="kecil">Bobot awal ini akan dikalibrasi dengan data kejadian bencana historis (DIBI BNPB).</p>
        </details>
      </section>`;
  }
  function bindSungaiku() {
    const das = dasAktif();
    const ikd = SH.hitungIKD(das);
    $('#dengarkan').addEventListener('click', () => {
      const teks = `Status ${das.nama}: ${SH.STATUS[ikd.status].label}. Skor ${ikd.skor} dari 100. ${SH.STATUS[ikd.status].kalimat}`;
      if (!('speechSynthesis' in window)) { toast('Suara tidak tersedia', 'Browser ini belum mendukung pembacaan teks.'); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(teks);
      u.lang = 'id-ID';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    });
    $('#kenapa').addEventListener('click', () => sheet(`
      <h2>Kenapa hulu penting untukmu?</h2>
      <p>Hutan di hulu bekerja seperti spons. Tanah hutan tropis yang utuh bisa meresapkan hingga 55% air hujan, sehingga air yang langsung mengalir ke sungai hanya 10 sampai 20%.</p>
      <p>Saat hutan hilang, hujan deras langsung turun ke sungai bersama lumpur dan batang pohon. Itulah yang terjadi pada banjir bandang Sumatra akhir 2025.</p>
      <p>Kerusakan di hulu terekam satelit setiap minggu. SUARA HULU menyampaikannya kepadamu agar bisa ditindaklanjuti sebelum musim hujan.</p>
      <p class="kecil">Sumber: UGM (2025); Auriga Nusantara (2026).</p>`));
  }

  /* ---------- Hulu Berbicara ---------- */
  function vHulu() {
    const das = dasAktif();
    const ikd = SH.hitungIKD(das);
    const s = st();
    const daftar = s.notifikasi.filter((n) => n.dasId === das.id).sort((a, b) => b.waktu - a.waktu);
    s.notifikasi.forEach((n) => { if (n.dasId === das.id) n.dibaca = true; });
    SH.save();
    return `
      <section class="kartu">
        <h2>Hulu ${esc(das.sungai)} berbicara</h2>
        <p class="kecil">Kabar terbaru dari satelit dan BMKG tentang hulu sungaimu.</p>
        <div class="cuaca">
          <div><span class="cuaca-angka">${ikd.hujanMm}</span> mm/hari</div>
          <div class="kecil">Prakiraan hujan tertinggi 3 hari ke depan, BMKG${s.hujanSimulasi[das.id] ? ' (simulasi hujan sangat lebat)' : ' (data contoh)'}</div>
        </div>
      </section>
      <section class="kartu simulasi">
        <h3>Simulasi untuk demo</h3>
        <button class="tombol utama lebar" id="sim-satelit">Simulasikan deteksi satelit baru</button>
        <label class="sakelar"><input type="checkbox" id="sim-hujan" ${s.hujanSimulasi[das.id] ? 'checked' : ''}><span></span>BMKG memprakirakan hujan sangat lebat</label>
      </section>
      <section class="notif-daftar" aria-live="polite">
        ${daftar.length ? daftar.map((n) => `
          <article class="notif notif-${n.status}">
            <div class="notif-kepala"><strong>${esc(n.judul)}</strong><time>${SH.waktuRelatif(n.waktu)}</time></div>
            <p>${esc(n.isi)}</p>
          </article>`).join('') : `<p class="kosong">Belum ada kabar baru dari hulu. Tekan "Simulasikan deteksi satelit baru" untuk melihat cara kerja notifikasi.</p>`}
      </section>
      <p class="penafian">Ini bukan perintah evakuasi. Untuk peringatan darurat, ikuti informasi resmi BPBD dan BMKG.</p>`;
  }
  function bindHulu() {
    const das = dasAktif();
    $('#sim-satelit').addEventListener('click', () => {
      const s = st();
      const sebelum = SH.hitungIKD(das);
      const ha = Math.round(8 + Math.random() * 40);
      s.tambahanPeringatan[das.id] = (s.tambahanPeringatan[das.id] || 0) + ha * 25; // diperbesar agar efeknya terlihat di demo
      const sesudah = SH.hitungIKD(das);
      const judul = `Pembukaan hutan ${ha} ha terdeteksi`;
      const isi = `Satelit mendeteksi pembukaan hutan baru di hulu ${das.sungai} minggu ini. Indeks turun dari ${sebelum.skor} ke ${sesudah.skor}${sesudah.status !== sebelum.status ? `, status menjadi ${SH.STATUS[sesudah.status].label.toLowerCase()}` : ''}.`;
      s.notifikasi.push({ dasId: das.id, waktu: Date.now(), judul, isi, status: sesudah.status, dibaca: tab === 'hulu' });
      SH.save();
      toast(`Hulu ${das.sungai} berbicara`, isi, sesudah.status);
      render();
    });
    $('#sim-hujan').addEventListener('change', (e) => {
      const s = st();
      const sebelum = SH.hitungIKD(das);
      s.hujanSimulasi[das.id] = e.target.checked;
      const sesudah = SH.hitungIKD(das);
      if (e.target.checked) {
        const isi = `BMKG memprakirakan hujan ${sesudah.hujanMm} mm/hari dalam 3 hari ke depan.${sesudah.naik ? ` Karena hulu sedang rusak, status naik menjadi ${SH.STATUS[sesudah.status].label.toLowerCase()}.` : ''}`;
        s.notifikasi.push({ dasId: das.id, waktu: Date.now(), judul: 'Hujan sangat lebat diprakirakan', isi, status: sesudah.status, dibaca: true });
        toast('Hujan sangat lebat diprakirakan', isi, sesudah.status);
      } else if (sebelum.status !== sesudah.status) {
        toast('Prakiraan hujan turun', `Status kembali ${SH.STATUS[sesudah.status].label.toLowerCase()}.`, sesudah.status);
      }
      SH.save();
      render();
    });
  }

  /* ---------- Lapor Hulu ---------- */
  function vLapor() {
    const s = st();
    const das = dasAktif();
    const riwayat = s.laporan.filter((l) => l.dasId === das.id).sort((a, b) => b.waktu - a.waktu);
    const urutan = ['diterima', 'cocok', 'diteruskan', 'ditindak'];
    return `
      <section class="kartu">
        <label class="sakelar"><input type="checkbox" id="mode-offline" ${s.offline ? 'checked' : ''}><span></span>Mode tanpa sinyal (simulasi)</label>
        ${s.offline ? '<p class="kecil">Laporan akan disimpan di ponsel dan terkirim otomatis saat sinyal kembali.</p>' : ''}
      </section>
      <form class="kartu form-lapor" id="form-lapor" novalidate>
        <h2>Laporkan temuan di hulu</h2>
        <fieldset>
          <legend>Foto temuan</legend>
          <label class="ambil-foto">
            <input type="file" accept="image/*" capture="environment" id="foto" />
            ${draft.foto ? `<img src="${draft.foto}" alt="Pratinjau foto temuan" />` : '<span>Ambil atau pilih foto</span>'}
          </label>
          <p class="kecil">Waktu dan lokasi foto tercatat otomatis.</p>
        </fieldset>
        <fieldset>
          <legend>Apa yang kamu temukan?</legend>
          <div class="chip-grup" role="radiogroup">
            ${D.jenisTemuan.map((j) => `<button type="button" role="radio" aria-checked="${draft.jenis === j.id}" class="chip ${draft.jenis === j.id ? 'aktif' : ''}" data-jenis="${j.id}"><span aria-hidden="true">${j.ikon}</span>${j.label}</button>`).join('')}
          </div>
        </fieldset>
        <fieldset>
          <legend><label for="catatan">Keterangan singkat (boleh dikosongkan)</label></legend>
          <textarea id="catatan" rows="2" placeholder="Contoh: dua ekskavator masuk lewat jalan kebun">${esc(draft.catatan)}</textarea>
        </fieldset>
        <fieldset>
          <legend>Lokasi</legend>
          <p class="lokasi-teks" id="lokasi-teks">${draft.lokasi ? `${draft.lokasi.lat.toFixed(4)}, ${draft.lokasi.lon.toFixed(4)}${draft.lokasiSimulasi ? ' (simulasi)' : ''}` : 'Belum diambil'}</p>
          <button type="button" class="tombol sekunder" id="ambil-lokasi">${draft.lokasi ? 'Perbarui lokasi' : 'Ambil lokasi'}</button>
        </fieldset>
        <label class="sakelar"><input type="checkbox" id="anonim" ${draft.anonim ? 'checked' : ''}><span></span>Kirim secara anonim</label>
        <p class="kecil">${draft.anonim ? 'Namamu tidak dikirim, dan lokasi hanya ditampilkan ke publik dalam radius 1 km.' : 'Namamu akan terlihat oleh petugas yang memverifikasi.'}</p>
        <p class="galat" id="galat" role="alert"></p>
        <button type="submit" class="tombol utama lebar">${s.offline ? 'Simpan laporan' : 'Kirim laporan'}</button>
      </form>
      <section class="kartu">
        <h3>Laporanmu</h3>
        ${riwayat.length ? `<ul class="riwayat">${riwayat.map((l) => {
          const j = D.jenisTemuan.find((x) => x.id === l.jenis);
          const idx = urutan.indexOf(l.status);
          return `<li>
            <div class="riwayat-kepala"><span>${j ? j.ikon : ''} ${j ? j.label : ''}</span><time>${SH.waktuRelatif(l.waktu)}</time></div>
            ${l.status === 'antre' ? '<p class="antre">Menunggu sinyal</p>' : `<ol class="tahap">${urutan.map((u, i) => `<li class="${i <= idx ? 'selesai' : ''}">${SH.STATUS_LAPORAN[u]}</li>`).join('')}</ol>`}
          </li>`;
        }).join('')}</ul>` : '<p class="kosong">Belum ada laporan untuk DAS ini.</p>'}
      </section>`;
  }
  function kompresFoto(file) {
    return new Promise((ok, gagal) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const m = 640, k = Math.min(1, m / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = gagal;
        img.src = r.result;
      };
      r.onerror = gagal;
      r.readAsDataURL(file);
    });
  }
  function bindLapor() {
    const das = dasAktif();
    $('#mode-offline').addEventListener('change', (e) => {
      const s = st();
      s.offline = e.target.checked;
      if (!s.offline) {
        const antre = s.laporan.filter((l) => l.status === 'antre');
        antre.forEach((l) => { l.status = 'diterima'; jadwalkanVerifikasi(l.id); });
        if (antre.length) toast('Sinyal kembali', `${antre.length} laporan yang tersimpan sudah terkirim.`);
      }
      SH.save();
      render();
    });
    $('#foto').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { draft.foto = await kompresFoto(f); } catch (err) { draft.foto = null; }
      if (!draft.lokasi) ambilLokasi();
      render();
    });
    document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { draft.jenis = c.dataset.jenis; draft.catatan = $('#catatan').value; render(); }));
    $('#catatan').addEventListener('input', (e) => { draft.catatan = e.target.value; });
    $('#ambil-lokasi').addEventListener('click', ambilLokasi);
    $('#anonim').addEventListener('change', (e) => { draft.anonim = e.target.checked; draft.catatan = $('#catatan').value; render(); });
    $('#form-lapor').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!draft.foto) { $('#galat').textContent = 'Tambahkan foto temuan agar laporan bisa diverifikasi.'; return; }
      if (!draft.jenis) { $('#galat').textContent = 'Pilih jenis temuan.'; return; }
      const s = st();
      const lok = draft.lokasi || { lat: das.lat + 0.03, lon: das.lon - 0.03 };
      const lap = { id: SH.idBaru(), dasId: das.id, jenis: draft.jenis, catatan: draft.catatan.trim(), anonim: draft.anonim,
        lat: lok.lat, lon: lok.lon, waktu: Date.now(), status: s.offline ? 'antre' : 'diterima', foto: draft.foto };
      s.laporan.push(lap);
      SH.save();
      draft = { foto: null, jenis: null, catatan: '', lokasi: null, lokasiSimulasi: false, anonim: true };
      if (s.offline) toast('Laporan disimpan', 'Laporan akan terkirim otomatis saat ada sinyal.');
      else { toast('Laporan terkirim', 'Laporanmu sedang dicocokkan dengan data satelit.'); jadwalkanVerifikasi(lap.id); }
      render();
    });
  }
  function ambilLokasi() {
    const das = dasAktif();
    const fallback = () => {
      draft.lokasi = { lat: das.lat + (Math.random() - 0.5) * 0.08, lon: das.lon + (Math.random() - 0.5) * 0.08 };
      draft.lokasiSimulasi = true;
      if (tab === 'lapor') { draft.catatan = $('#catatan') ? $('#catatan').value : draft.catatan; render(); }
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition((p) => {
      // purwarupa: lokasi asli dipakai bila berada dekat DAS contoh, selain itu disimulasikan di hulu DAS
      const { latitude: la, longitude: lo } = p.coords;
      if (Math.hypot(la - das.lat, lo - das.lon) < 0.5) { draft.lokasi = { lat: la, lon: lo }; draft.lokasiSimulasi = false; if (tab === 'lapor') render(); }
      else fallback();
    }, fallback, { timeout: 5000 });
  }
  function jadwalkanVerifikasi(id) {
    setTimeout(() => {
      const s = st();
      const l = s.laporan.find((x) => x.id === id);
      if (!l || l.status !== 'diterima') return;
      l.status = 'cocok';
      SH.save();
      toast('Laporan cocok dengan data satelit', 'Ada peringatan deforestasi di sekitar lokasimu. Laporan masuk antrean petugas.');
      render();
    }, 4500);
  }

  /* ---------- Suarakan ---------- */
  function gambarKartu(canvas) {
    const das = dasAktif();
    const ikd = SH.hitungIKD(das);
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    const css = getComputedStyle(document.documentElement);
    const v = (n) => css.getPropertyValue(n).trim();
    const warna = { hijau: v('--hijau'), kuning: v('--kuning'), merah: v('--merah') }[ikd.status];
    ctx.fillStyle = v('--hutan');
    ctx.fillRect(0, 0, W, H);
    // kontur dekoratif
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 12; i++) { ctx.beginPath(); ctx.ellipse(220, 200, 90 * i, 70 * i, -0.3, 0, Math.PI * 2); ctx.stroke(); }
    const huruf = v('--huruf') || 'sans-serif';
    ctx.fillStyle = '#fff';
    ctx.font = `600 44px ${huruf}`;
    ctx.fillText(`Hulu ${das.sungai} kehilangan`, 80, 360);
    const haHilang = Math.round((das.luasHuluHa * das.tutupan / 100) * (ikd.hilang12 / 100));
    ctx.font = `800 190px ${huruf}`;
    ctx.fillText(`${haHilang.toLocaleString('id-ID')} ha`, 70, 560);
    ctx.font = `600 44px ${huruf}`;
    ctx.fillText('hutan dalam 12 bulan terakhir.', 80, 640);
    ctx.font = `400 40px ${huruf}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Hilir kita yang menanggung banjirnya.', 80, 720);
    // status
    ctx.fillStyle = warna;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(80, 800, 560, 96, 48); else ctx.rect(80, 800, 560, 96); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 40px ${huruf}`;
    ctx.fillText(`Status ${SH.STATUS[ikd.status].label}: ${ikd.skor}/100`, 120, 862);
    ctx.font = `600 30px ${huruf}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${das.nama}, ${das.provinsi}`, 80, 985);
    ctx.font = `400 24px ${huruf}`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Data simulasi purwarupa SUARA HULU', 80, 1025);
    ctx.font = `800 36px ${huruf}`;
    ctx.fillStyle = '#fff';
    ctx.fillText('SUARA HULU', 80, 140);
  }
  function vSuarakan() {
    return `
      <section class="kartu">
        <h2>Suarakan kondisi hulumu</h2>
        <p class="kecil">Data hulu diubah menjadi kartu siap sebar dan laporan resmi untuk pemerintah.</p>
        <canvas id="kartu-visual" class="kartu-visual" aria-label="Kartu visual kondisi hulu"></canvas>
        <div class="aksi-baris">
          <button class="tombol utama" id="unduh-kartu">Unduh kartu</button>
          <button class="tombol sekunder" id="bagikan-kartu">Bagikan</button>
        </div>
      </section>
      <section class="kartu">
        <h3>Laporan resmi</h3>
        <p class="kecil">Ringkasan indeks dan laporan warga terverifikasi, siap dikirim ke BPBD, dinas lingkungan hidup, atau Gakkum.</p>
        <button class="tombol sekunder lebar" id="laporan-resmi">Buat laporan resmi</button>
      </section>`;
  }
  function bindSuarakan() {
    const c = $('#kartu-visual');
    const gambar = () => gambarKartu(c);
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(gambar);
    gambar();
    const das = dasAktif();
    $('#unduh-kartu').addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = `suara-hulu-${das.id}.png`;
      a.href = c.toDataURL('image/png');
      a.click();
      toast('Kartu diunduh', 'Kartu tersimpan di perangkatmu dan siap dibagikan.');
    });
    $('#bagikan-kartu').addEventListener('click', () => {
      c.toBlob(async (blob) => {
        const file = new File([blob], `suara-hulu-${das.id}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], text: `Kondisi hulu ${das.nama}. #SuaraHulu` }); } catch (e) { /* dibatalkan */ }
        } else toast('Bagikan belum didukung', 'Browser ini belum bisa berbagi gambar langsung. Gunakan tombol Unduh kartu.');
      });
    });
    $('#laporan-resmi').addEventListener('click', () => bukaLaporanResmi(das));
  }
  function bukaLaporanResmi(das) {
    const ikd = SH.hitungIKD(das);
    const lap = st().laporan.filter((l) => l.dasId === das.id && ['cocok', 'diteruskan', 'ditindak'].includes(l.status));
    const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const w = window.open('', '_blank');
    if (!w) { toast('Jendela diblokir', 'Izinkan pop-up untuk membuat laporan resmi.'); return; }
    w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Laporan Kondisi Hulu ${esc(das.nama)}</title>
      <style>body{font:14px/1.6 Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#17241E}h1{font-size:22px;margin:0}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eef2ea}.catatan{font-size:12px;color:#555}@media print{button{display:none}}</style></head><body>
      <p>Nomor: SH/${das.id.toUpperCase()}/${Date.now().toString().slice(-5)}<br>Tanggal: ${tgl}</p>
      <p>Kepada Yth.<br>Kepala BPBD dan Kepala Dinas Lingkungan Hidup ${esc(das.kabupaten)}<br>di tempat</p>
      <h1>Laporan Kondisi Hulu ${esc(das.nama)}</h1>
      <p>Berdasarkan pemantauan SUARA HULU, Indeks Kesehatan ${esc(das.nama)} saat ini <strong>${ikd.skor}/100 (${SH.STATUS[ikd.status].label})</strong>. Dalam 12 bulan terakhir, ${SH.fmt(ikd.hilang12)}% tutupan hutan di hulu hilang, dengan ${Math.round(ikd.peringatanHa).toLocaleString('id-ID')} ha peringatan deforestasi aktif dalam 90 hari terakhir.</p>
      <table><tr><th>Komponen</th><th>Nilai</th><th>Skor</th><th>Sumber</th></tr>
      ${ikd.komponen.map((k) => `<tr><td>${k.nama}</td><td>${k.nilai}</td><td>${Math.round(k.skor)}</td><td>${k.sumber}</td></tr>`).join('')}</table>
      <h2 style="font-size:16px">Temuan warga terverifikasi</h2>
      ${lap.length ? `<table><tr><th>Kode</th><th>Temuan</th><th>Koordinat (dibulatkan)</th><th>Waktu</th></tr>${lap.map((l) => `<tr><td>${l.id}</td><td>${(D.jenisTemuan.find((j) => j.id === l.jenis) || {}).label || ''}${l.catatan ? `: ${esc(l.catatan)}` : ''}</td><td>${l.lat.toFixed(2)}, ${l.lon.toFixed(2)}</td><td>${new Date(l.waktu).toLocaleString('id-ID')}</td></tr>`).join('')}</table>` : '<p>Belum ada temuan terverifikasi.</p>'}
      <p>Kami memohon pemeriksaan lapangan di area tersebut serta evaluasi izin dan rencana rehabilitasi bila diperlukan.</p>
      <p class="catatan">Identitas pelapor anonim tidak dicantumkan. Pelapor dilindungi Pasal 66 UU No. 32 Tahun 2009 dan Permen LHK No. 10 Tahun 2024. Dokumen ini dibuat oleh purwarupa SUARA HULU; seluruh angka adalah data simulasi.</p>
      <button onclick="print()">Cetak atau simpan sebagai PDF</button></body></html>`);
    w.document.close();
  }

  /* ---------- router ---------- */
  const VIEWS = {
    sungaiku: [vSungaiku, bindSungaiku],
    hulu: [vHulu, bindHulu],
    lapor: [vLapor, bindLapor],
    suarakan: [vSuarakan, bindSuarakan],
  };
  function render() {
    renderHeader();
    const [v, b] = VIEWS[tab];
    const scroll = view.scrollTop;
    view.innerHTML = v();
    b();
    view.scrollTop = scroll;
    renderHeader();
    document.querySelectorAll('.tabs button').forEach((t) => t.setAttribute('aria-current', t.dataset.tab === tab ? 'page' : 'false'));
  }
  document.querySelectorAll('.tabs button').forEach((t) => t.addEventListener('click', () => {
    tab = t.dataset.tab;
    view.scrollTop = 0;
    render();
    view.scrollTop = 0;
  }));
  $('#ganti-das').addEventListener('click', () => pilihDAS(false));
  const reset = $('#reset-demo');
  if (reset) reset.addEventListener('click', () => { SH.reset(); draft.foto = null; tab = 'sungaiku'; render(); pilihDAS(true); });
  SH.onChange(render);

  // laporan yang masih "diterima" saat halaman dibuka ulang ikut diverifikasi
  st().laporan.filter((l) => l.status === 'diterima' && Date.now() - l.waktu < 60000).forEach((l) => jadwalkanVerifikasi(l.id));

  render();
  if (!st().sudahOnboarding) pilihDAS(true);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
