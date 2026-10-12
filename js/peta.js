/* SUARA HULU: peta DAS bergaya kontur (SVG, tanpa internet) dan grafik tren. */
(function () {
  const W = 340, H = 250;
  const HULU = { x: 78, y: 62 };

  function smooth(pts) {
    // Catmull-Rom tertutup ke Bezier
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }

  function kontur(rand, r, cx, cy) {
    const pts = [];
    const N = 22;
    const fase = rand() * 6;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const noise = 1 + 0.14 * Math.sin(a * 3 + fase) + 0.08 * Math.sin(a * 5 + fase * 2) + (rand() - 0.5) * 0.06;
      pts.push([cx + Math.cos(a) * r * noise * 1.25, cy + Math.sin(a) * r * noise]);
    }
    return smooth(pts);
  }

  function petaDAS(das, ikd) {
    const rand = window.SH.seeded(das.seed);
    const warnaStatus = { hijau: 'var(--hijau)', kuning: 'var(--kuning)', merah: 'var(--merah)' }[ikd.status];
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="peta" role="img" aria-label="Peta ${das.nama}: hulu di kiri atas, lokasimu di hilir kanan bawah">`;
    svg += `<rect width="${W}" height="${H}" fill="var(--peta-dasar)"/>`;

    // kontur topografi berpusat di hulu
    for (let i = 9; i >= 1; i--) {
      const r = 14 + i * 19;
      const isHulu = i <= 3;
      const fill = isHulu ? `fill="var(--hutan)" fill-opacity="${(0.12 + das.tutupan / 260).toFixed(2)}"` : 'fill="none"';
      svg += `<path d="${kontur(rand, r, HULU.x + i * 6, HULU.y + i * 4)}" ${fill} stroke="var(--kontur)" stroke-width="${i % 3 === 0 ? 1.1 : 0.6}"/>`;
    }

    // sungai utama dan anak sungai
    const start = [HULU.x - 8, HULU.y - 10];
    const end = [W - 40, H - 30];
    const mid1 = [130 + rand() * 20, 95 + rand() * 20];
    const mid2 = [215 + rand() * 20, 160 + rand() * 15];
    const utama = `M${start} C${start[0] + 30},${start[1] + 30} ${mid1[0] - 30},${mid1[1] - 10} ${mid1} S${mid2[0] - 30},${mid2[1] - 20} ${mid2} S${end[0] - 30},${end[1] - 5} ${end}`;
    svg += `<path d="${utama}" fill="none" stroke="var(--sungai)" stroke-width="3.2" stroke-linecap="round"/>`;
    const cabang = [
      [[HULU.x + 40, HULU.y - 40], [HULU.x + 20, HULU.y + 8]],
      [[HULU.x - 40, HULU.y + 40], [HULU.x + 5, HULU.y + 18]],
      [[175, 50], mid1],
      [[150, 200], mid2],
      [[285, 120], mid2],
    ];
    cabang.forEach(([a, b]) => {
      const c = [(a[0] + b[0]) / 2 + (rand() - 0.5) * 30, (a[1] + b[1]) / 2 + (rand() - 0.5) * 30];
      svg += `<path d="M${a} Q${c} ${b}" fill="none" stroke="var(--sungai)" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
    });

    // tambalan peringatan deforestasi di zona hulu
    const rasio = ikd.peringatanHa / das.luasHuluHa;
    const n = Math.max(2, Math.min(18, Math.round(3 + rasio * 1500)));
    let terakhir = null;
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, r = 12 + rand() * 50;
      const x = HULU.x + 15 + Math.cos(a) * r * 1.2, y = HULU.y + 12 + Math.sin(a) * r * 0.8;
      const s = 3 + rand() * 5;
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${(s * 0.8).toFixed(1)}" fill="var(--merah)" opacity=".85" transform="rotate(${(rand() * 40 - 20).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      terakhir = [x, y];
    }
    // "suara" dari hulu: gelombang dari peringatan terbaru
    if (terakhir) {
      const [x, y] = terakhir;
      svg += `<g class="suara" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <circle r="6" fill="none" stroke="${warnaStatus}" stroke-width="1.5"/>
        <circle r="6" fill="none" stroke="${warnaStatus}" stroke-width="1.5"/>
        <circle r="6" fill="none" stroke="${warnaStatus}" stroke-width="1.5"/>
      </g>`;
    }

    // lokasi warga di hilir
    svg += `<g transform="translate(${end[0] - 4} ${end[1] - 6})">
      <path d="M0,-16 C-7,-16 -10,-10 -10,-6 C-10,1 0,9 0,9 C0,9 10,1 10,-6 C10,-10 7,-16 0,-16Z" fill="var(--tinta)"/>
      <circle cy="-7" r="3.4" fill="var(--kertas)"/>
    </g>`;
    svg += `<text x="${HULU.x - 52}" y="${HULU.y - 34}" class="peta-label">Hulu</text>`;
    svg += `<text x="${end[0] - 70}" y="${end[1] + 14}" class="peta-label">Kamu di hilir</text>`;
    svg += `<text x="10" y="${H - 10}" class="peta-legenda"><tspan fill="var(--merah)">■</tspan> peringatan satelit 90 hari</text>`;
    svg += '</svg>';
    return svg;
  }

  function grafikTren(das, ikd) {
    // tren tutupan 5 tahun (simulasi mundur dari kondisi sekarang)
    const tahun = [2021, 2022, 2023, 2024, 2025];
    const rand = window.SH.seeded(das.seed + 5);
    const nilai = [];
    let v = das.tutupan;
    for (let i = 4; i >= 0; i--) {
      nilai[i] = v;
      v = v / (1 - (i === 4 ? ikd.hilang12 : das.hilang12 * (0.4 + rand() * 0.5)) / 100);
    }
    const w = 300, h = 110, px = 30, py = 16;
    const max = Math.ceil(Math.max(...nilai) / 10) * 10, min = Math.max(0, Math.floor(Math.min(...nilai) / 10) * 10 - 10);
    const X = (i) => px + (i * (w - px - 14)) / 4;
    const Y = (val) => py + ((max - val) * (h - py * 2)) / (max - min || 1);
    let pts = nilai.map((val, i) => `${X(i).toFixed(1)},${Y(val).toFixed(1)}`).join(' ');
    let s = `<svg viewBox="0 0 ${w} ${h}" class="tren" role="img" aria-label="Tutupan hutan hulu turun dari ${nilai[0].toFixed(0)}% pada 2021 menjadi ${nilai[4].toFixed(0)}% pada 2025">`;
    [max, (max + min) / 2, min].forEach((g) => {
      s += `<line x1="${px}" x2="${w - 8}" y1="${Y(g)}" y2="${Y(g)}" stroke="var(--garis)" stroke-width="1"/>`;
      s += `<text x="${px - 6}" y="${Y(g) + 4}" text-anchor="end" class="tren-sumbu">${Math.round(g)}%</text>`;
    });
    s += `<polyline points="${pts}" fill="none" stroke="var(--hutan)" stroke-width="2.5" stroke-linejoin="round"/>`;
    nilai.forEach((val, i) => {
      s += `<circle cx="${X(i)}" cy="${Y(val)}" r="${i === 4 ? 4.5 : 3}" fill="${i === 4 ? 'var(--hutan)' : 'var(--kertas)'}" stroke="var(--hutan)" stroke-width="2"><title>${tahun[i]}: ${window.SH.fmt(val)}%</title></circle>`;
      s += `<text x="${X(i)}" y="${h - 1}" text-anchor="middle" class="tren-sumbu">${tahun[i]}</text>`;
    });
    s += `<text x="${X(4) - 6}" y="${Y(nilai[4]) - 9}" text-anchor="end" class="tren-nilai">${nilai[4].toFixed(0)}%</text>`;
    return s + '</svg>';
  }

  window.SHPeta = { petaDAS, grafikTren };
})();
