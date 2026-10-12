/* SUARA HULU: penyimpanan bersama (aplikasi warga + dasbor) dan perhitungan
   Indeks Kesehatan DAS (IKD) sesuai Lampiran 4 esai. */
(function () {
  const KEY = 'suarahulu.v1';
  const D = window.SH_DATA;

  function fresh() {
    return {
      dasId: 'tamiang',
      laporan: D.laporanContoh.map((l) => ({ ...l })),
      tambahanPeringatan: {}, // dasId -> ha tambahan dari simulasi deteksi satelit
      notifikasi: [],
      offline: false,
      hujanSimulasi: {}, // dasId -> true bila juri menyalakan simulasi hujan sangat lebat
      sudahOnboarding: false,
    };
  }

  let memory = null;
  function load() {
    if (memory) return memory;
    try {
      const raw = localStorage.getItem(KEY);
      memory = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
    } catch (e) {
      memory = fresh();
    }
    return memory;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) { /* mode privat: tetap jalan di memori */ }
  }
  function reset() {
    memory = fresh();
    save();
  }
  // sinkron antar-tab (aplikasi warga <-> dasbor)
  const listeners = [];
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    memory = null;
    load();
    listeners.forEach((fn) => fn());
  });

  const fmt = (n, d = 1) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- IKD ---------- */
  const BOBOT = { tutupan: 0.30, laju: 0.25, peringatan: 0.15, bahaya: 0.20, laporan: 0.10 };
  const clamp = (v) => Math.max(0, Math.min(100, v));

  function laporanTerverifikasi(dasId) {
    const s = load();
    const batas = Date.now() - 90 * 24 * 3600 * 1000;
    const dariAplikasi = s.laporan.filter((l) => l.dasId === dasId && l.waktu > batas && ['cocok', 'diteruskan', 'ditindak'].includes(l.status)).length;
    const das = D.das.find((d) => d.id === dasId);
    return das.laporan90 + dariAplikasi;
  }

  function hitungIKD(das) {
    const s = load();
    const tambahan = s.tambahanPeringatan[das.id] || 0;
    const peringatanHa = das.peringatanHa + tambahan;
    const hilang12 = das.hilang12 + (tambahan / das.luasHuluHa) * 100;
    const nLapor = laporanTerverifikasi(das.id);
    const komponen = [
      { id: 'tutupan', nama: 'Tutupan hutan di hulu', nilai: `${das.tutupan}% luas DAS`, skor: clamp((das.tutupan / 30) * 100), bobot: BOBOT.tutupan,
        sumber: 'Kemenhut / Global Forest Watch' },
      { id: 'laju', nama: 'Hutan hilang 12 bulan terakhir', nilai: `${fmt(hilang12)}% dari tutupan`, skor: clamp(100 - hilang12 * 15), bobot: BOBOT.laju,
        sumber: 'Peringatan GLAD + RADD' },
      { id: 'peringatan', nama: 'Peringatan satelit aktif (90 hari)', nilai: `${Math.round(peringatanHa).toLocaleString('id-ID')} ha`, skor: clamp(100 - (peringatanHa / das.luasHuluHa) * 100 * 60), bobot: BOBOT.peringatan,
        sumber: 'Peringatan GLAD + RADD' },
      { id: 'bahaya', nama: 'Bahaya banjir dan longsor', nilai: `Kelas ${das.bahaya}`, skor: { rendah: 100, sedang: 55, tinggi: 15 }[das.bahaya], bobot: BOBOT.bahaya,
        sumber: 'InaRISK BNPB' },
      { id: 'laporan', nama: 'Temuan warga terverifikasi (90 hari)', nilai: `${nLapor} laporan`, skor: clamp(100 - nLapor * 12), bobot: BOBOT.laporan,
        sumber: 'Lapor Hulu' },
    ];
    const skor = Math.round(komponen.reduce((a, k) => a + k.skor * k.bobot, 0));
    const dasar = skor >= 70 ? 'hijau' : skor >= 40 ? 'kuning' : 'merah';
    const hujanMm = s.hujanSimulasi[das.id] ? 135 : das.hujanMm;
    const hujanSangatLebat = hujanMm >= 100; // kategori BMKG: sangat lebat 100 sampai 150 mm/hari
    const urut = ['hijau', 'kuning', 'merah'];
    const status = hujanSangatLebat ? urut[Math.min(2, urut.indexOf(dasar) + 1)] : dasar;
    return { skor, komponen, dasar, status, naik: status !== dasar, hujanMm, hujanSangatLebat, peringatanHa, hilang12, nLapor };
  }

  const STATUS = {
    hijau: { label: 'Sehat', kalimat: 'Hutan di hulu sungaimu relatif terjaga.' },
    kuning: { label: 'Waspada', kalimat: 'Hutan di hulu sungaimu mulai berkurang. Perlu perhatian dan pelaporan.' },
    merah: { label: 'Kritis', kalimat: 'Kerusakan hutan di hulu sungaimu tinggi. Dorong pemerintah daerah bertindak.' },
  };

  const STATUS_LAPORAN = {
    antre: 'Menunggu sinyal',
    diterima: 'Diterima',
    cocok: 'Cocok dengan data satelit',
    diteruskan: 'Diteruskan ke BPBD/Gakkum',
    ditindak: 'Ditindaklanjuti',
  };

  /* ---------- util ---------- */
  function seeded(seed) {
    let t = seed * 9301 + 49297;
    return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; };
  }
  function waktuRelatif(ms) {
    const d = (Date.now() - ms) / 1000;
    if (d < 60) return 'baru saja';
    if (d < 3600) return `${Math.floor(d / 60)} menit lalu`;
    if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
    return `${Math.floor(d / 86400)} hari lalu`;
  }
  function idBaru() {
    return 'L-' + String(Math.floor(Math.random() * 9000) + 1000);
  }

  window.SH = {
    load, save, reset, onChange: (fn) => listeners.push(fn),
    hitungIKD, fmt, STATUS, STATUS_LAPORAN, seeded, waktuRelatif, idBaru,
    das: (id) => D.das.find((d) => d.id === id),
  };
})();
