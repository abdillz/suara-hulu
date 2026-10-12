/* SUARA HULU: data simulasi untuk purwarupa.
   Nama DAS dan provinsi nyata, tetapi SEMUA ANGKA DI FILE INI ADALAH SIMULASI.
   Pada versi produksi, angka diambil dari:
   - Tutupan hutan & batas DAS : Kemenhut / Global Forest Watch
   - Peringatan deforestasi     : GFW Integrated Alerts (GLAD + RADD)
   - Prakiraan hujan            : API publik BMKG (api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...)
   - Kelas bahaya               : InaRISK BNPB
*/
window.SH_DATA = {
  das: [
    { id: 'tamiang', nama: 'DAS Tamiang', provinsi: 'Aceh', kabupaten: 'Aceh Tamiang', sungai: 'Krueng Tamiang',
      luasHuluHa: 90000, tutupan: 22, hilang12: 6.8, peringatanHa: 950, bahaya: 'tinggi', laporan90: 5,
      hujanMm: 120, lat: 4.2, lon: 97.9, seed: 7, warga: 'Desa Sungai Liput (contoh)' },
    { id: 'batangtoru', nama: 'DAS Batang Toru', provinsi: 'Sumatra Utara', kabupaten: 'Tapanuli Selatan', sungai: 'Batang Toru',
      luasHuluHa: 120000, tutupan: 49, hilang12: 4.2, peringatanHa: 380, bahaya: 'tinggi', laporan90: 3,
      hujanMm: 85, lat: 1.5, lon: 99.1, seed: 13, warga: 'Desa Garoga (contoh)' },
    { id: 'kuranji', nama: 'DAS Batang Kuranji', provinsi: 'Sumatra Barat', kabupaten: 'Kota Padang', sungai: 'Batang Kuranji',
      luasHuluHa: 20000, tutupan: 35, hilang12: 4.5, peringatanHa: 210, bahaya: 'tinggi', laporan90: 1,
      hujanMm: 60, lat: -0.9, lon: 100.4, seed: 21, warga: 'Kelurahan Kuranji (contoh)' },
    { id: 'citarum', nama: 'DAS Citarum Hulu', provinsi: 'Jawa Barat', kabupaten: 'Kabupaten Bandung', sungai: 'Citarum',
      luasHuluHa: 180000, tutupan: 9, hilang12: 0.8, peringatanHa: 60, bahaya: 'tinggi', laporan90: 4,
      hujanMm: 40, lat: -7.1, lon: 107.6, seed: 3, warga: 'Desa Dayeuhkolot (contoh)' },
    { id: 'brantas', nama: 'DAS Brantas Hulu', provinsi: 'Jawa Timur', kabupaten: 'Kota Batu', sungai: 'Brantas',
      luasHuluHa: 50000, tutupan: 18, hilang12: 1.2, peringatanHa: 40, bahaya: 'tinggi', laporan90: 2,
      hujanMm: 30, lat: -7.85, lon: 112.5, seed: 31, warga: 'Desa Sumberbrantas (contoh)' },
    { id: 'kapuas', nama: 'DAS Kapuas Hulu', provinsi: 'Kalimantan Barat', kabupaten: 'Kapuas Hulu', sungai: 'Kapuas',
      luasHuluHa: 300000, tutupan: 62, hilang12: 1.6, peringatanHa: 520, bahaya: 'sedang', laporan90: 1,
      hujanMm: 70, lat: 0.9, lon: 112.9, seed: 17, warga: 'Desa Nanga Embaloh (contoh)' },
    { id: 'konaweha', nama: 'DAS Konaweha', provinsi: 'Sulawesi Tenggara', kabupaten: 'Konawe', sungai: 'Konaweha',
      luasHuluHa: 140000, tutupan: 41, hilang12: 2.4, peringatanHa: 260, bahaya: 'sedang', laporan90: 0,
      hujanMm: 50, lat: -3.8, lon: 122.0, seed: 41, warga: 'Desa Wawotobi (contoh)' },
    { id: 'mamberamo', nama: 'DAS Mamberamo', provinsi: 'Papua', kabupaten: 'Mamberamo Raya', sungai: 'Mamberamo',
      luasHuluHa: 700000, tutupan: 88, hilang12: 0.3, peringatanHa: 90, bahaya: 'rendah', laporan90: 0,
      hujanMm: 45, lat: -2.3, lon: 138.0, seed: 53, warga: 'Kampung Kasonaweja (contoh)' },
  ],

  jenisTemuan: [
    { id: 'tebang', label: 'Penebangan pohon', ikon: '🪓' },
    { id: 'alatberat', label: 'Alat berat masuk', ikon: '🚜' },
    { id: 'retakan', label: 'Retakan tanah', ikon: '⛰️' },
    { id: 'keruh', label: 'Air sungai keruh mendadak', ikon: '🌊' },
    { id: 'bakar', label: 'Pembakaran lahan', ikon: '🔥' },
    { id: 'lain', label: 'Lainnya', ikon: '📍' },
  ],

  // laporan contoh agar dasbor tidak kosong saat pertama dibuka (simulasi)
  laporanContoh: [
    { id: 'L-0001', dasId: 'tamiang', jenis: 'alatberat', catatan: 'Dua ekskavator masuk lewat jalan kebun, dekat anak sungai.', anonim: true,
      lat: 4.21, lon: 97.86, waktu: Date.now() - 1000 * 60 * 60 * 52, status: 'diteruskan', foto: null },
    { id: 'L-0002', dasId: 'tamiang', jenis: 'tebang', catatan: 'Tumpukan kayu gelondongan di tepi sungai.', anonim: true,
      lat: 4.24, lon: 97.83, waktu: Date.now() - 1000 * 60 * 60 * 20, status: 'cocok', foto: null },
    { id: 'L-0003', dasId: 'batangtoru', jenis: 'keruh', catatan: 'Air berubah cokelat pekat padahal tidak hujan.', anonim: false,
      lat: 1.52, lon: 99.12, waktu: Date.now() - 1000 * 60 * 60 * 6, status: 'diterima', foto: null },
    { id: 'L-0004', dasId: 'citarum', jenis: 'retakan', catatan: 'Retakan memanjang di lereng kebun sayur.', anonim: true,
      lat: -7.18, lon: 107.65, waktu: Date.now() - 1000 * 60 * 60 * 140, status: 'ditindak', foto: null, waktuTindak: Date.now() - 1000 * 60 * 60 * 70 },
  ],
};
