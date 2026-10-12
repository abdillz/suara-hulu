# SUARA HULU: Purwarupa Aplikasi

Purwarupa aplikasi untuk esai **"SUARA HULU: Aplikasi Pemantau Kesehatan Daerah Aliran Sungai Berbasis Satelit dan Partisipasi Warga untuk Mencegah Bencana Hidrometeorologi di Indonesia"** (ScreenShot Competition 2026).

Isinya dua bagian yang saling terhubung:

1. **Aplikasi warga** (`index.html`) dengan fitur Sungaiku, Hulu Berbicara, Lapor Hulu, dan Suarakan.
2. **Dasbor pemda/BPBD** (`dasbor.html`) untuk memantau status DAS dan menindaklanjuti laporan warga.

> Semua angka di purwarupa ini adalah **data simulasi**. Nama DAS dipakai sebagai contoh supaya demo terasa nyata.

---

## Cara menjalankan

### Cara 1: langsung buka (paling mudah)
1. Ekstrak zip.
2. Klik dua kali `index.html`. Aplikasi terbuka di browser (Chrome atau Edge disarankan).
3. Untuk dasbor, tekan tombol **Buka dasbor pemda** di panel kiri, atau buka `dasbor.html`.

Aplikasi dan dasbor berbagi data lewat penyimpanan browser. Laporan yang dikirim dari aplikasi warga langsung muncul di dasbor, dan sebaliknya.

### Cara 2: lewat server lokal (untuk mode tanpa sinyal dan buka di HP)
Kalau Python sudah terpasang, jalankan perintah ini dari folder purwarupa:

```
python -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser. Dengan cara ini, *service worker* aktif sehingga aplikasi tetap bisa dibuka tanpa internet setelah kunjungan pertama.

Untuk mencoba di HP, sambungkan HP dan laptop ke Wi-Fi yang sama, lalu buka `http://<alamat-IP-laptop>:8000` di HP. Kamera dan "Bagikan" bekerja paling baik di HP.

---

## Alur demo untuk juri (sekitar 3 menit)

1. **Pilih DAS.** Saat pertama dibuka, pilih DAS Tamiang (atau tekan *Gunakan lokasiku*).
2. **Sungaiku.** Lihat peta hulu dengan titik merah peringatan satelit dan gelombang "suara" dari hulu. Lihat Indeks Kesehatan DAS, tekan **Dengarkan** (status dibacakan dalam bahasa Indonesia), lalu buka **Rincian indeks**.
3. **Hulu Berbicara.** Tekan **Simulasikan deteksi satelit baru**. Notifikasi muncul dan indeks turun. Nyalakan **BMKG memprakirakan hujan sangat lebat**. Status naik satu tingkat.
4. **Lapor Hulu.** Nyalakan **Mode tanpa sinyal**, kirim foto temuan, dan lihat status "Menunggu sinyal". Matikan mode itu. Laporan terkirim otomatis lalu dicocokkan dengan data satelit.
5. **Suarakan.** Unduh kartu visual dan tekan **Buat laporan resmi** (bisa dicetak atau disimpan sebagai PDF).
6. **Dasbor pemda.** Laporan baru muncul di tab *Perlu tindakan*. Tekan **Teruskan ke Gakkum/BPBD**, lalu **Tandai sudah ditindaklanjuti**. Kembali ke aplikasi warga. Tahapan laporan ikut berubah.

Tombol **Ulangi demo dari awal** mengembalikan semua data ke kondisi awal.

---

## Hubungan fitur dengan esai

| Bagian esai | Di purwarupa |
|---|---|
| Fitur Sungaiku dan Indeks Kesehatan DAS (Lampiran 4) | Tab Sungaiku: peta hulu, skor 0 sampai 100, status hijau/kuning/merah, rincian lima komponen |
| Fitur Hulu Berbicara dan pemicu hujan BMKG | Tab Hulu Berbicara: notifikasi deteksi satelit, status naik bila hujan sangat lebat (100 mm/hari atau lebih) |
| Fitur Lapor Hulu | Tab Lapor: foto, jenis temuan, lokasi otomatis, anonim secara bawaan, verifikasi silang |
| Fitur Suarakan | Tab Suarakan: kartu visual siap sebar, laporan resmi untuk BPBD/dinas/Gakkum |
| Dasbor pemda (Gambar L2e) | `dasbor.html`: peta status, peringkat DAS, antrean laporan, rekomendasi tindakan |
| Mitigasi sinyal lemah (Lampiran 3) | Mode tanpa sinyal: laporan disimpan lalu terkirim otomatis; *service worker* untuk akses tanpa internet |
| Mitigasi keamanan pelapor | Anonim aktif secara bawaan; koordinat di laporan resmi dibulatkan |
| Mitigasi laporan palsu | Status "Cocok dengan data satelit" sebelum laporan diteruskan |
| Mitigasi salah tafsir peringatan | Penafian "Ini bukan perintah evakuasi" di setiap notifikasi |
| Mitigasi literasi digital | Status berbasis warna dan tombol **Dengarkan** (teks dibacakan) |

---

## Rumus Indeks Kesehatan DAS (IKD)

Sama dengan Lampiran 4 esai. Bobot ini adalah rancangan awal yang akan dikalibrasi dengan data kejadian bencana historis DIBI BNPB.

| Komponen | Bobot | Penilaian di purwarupa |
|---|---|---|
| Tutupan hutan di hulu | 30% | skor penuh bila tutupan 30% atau lebih |
| Hutan hilang 12 bulan | 25% | 100 dikurangi 15 per 1% hutan hilang |
| Peringatan satelit aktif 90 hari | 15% | makin luas peringatan, makin rendah skor |
| Bahaya banjir dan longsor (InaRISK) | 20% | rendah 100, sedang 55, tinggi 15 |
| Temuan warga terverifikasi 90 hari | 10% | 100 dikurangi 12 per laporan |

Status: **Sehat** 70 sampai 100, **Waspada** 40 sampai 69, **Kritis** 0 sampai 39. Status naik satu tingkat bila BMKG memprakirakan hujan sangat lebat.

Kode perhitungan ada di `js/core.js` (fungsi `hitungIKD`).

---

## Struktur folder

```
suara-hulu-prototipe/
├── index.html        aplikasi warga
├── dasbor.html       dasbor pemda/BPBD
├── css/gaya.css      gaya aplikasi warga
├── css/dasbor.css    gaya dasbor
├── js/data.js        data simulasi DAS dan laporan contoh
├── js/core.js        penyimpanan bersama dan rumus IKD
├── js/peta.js        peta kontur DAS dan grafik tren (SVG)
├── js/app.js         logika aplikasi warga
├── js/dasbor.js      logika dasbor
├── assets/ikon.svg   ikon aplikasi
├── manifest.json     agar bisa dipasang di layar utama HP
└── sw.js             service worker untuk akses tanpa internet
```

---

## Jalur menuju data nyata

Purwarupa ini sengaja tidak memanggil server mana pun agar bisa dibuka tanpa internet saat presentasi. Untuk versi produksi, data simulasi di `js/data.js` diganti dengan sumber berikut:

| Data | Sumber | Cara akses |
|---|---|---|
| Peringatan deforestasi (GLAD + RADD) | Global Forest Watch | Data API GFW (`data-api.globalforestwatch.org`, dataset `gfw_integrated_alerts`), perlu kunci API gratis |
| Prakiraan cuaca per desa | BMKG | `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=<kode wilayah desa>`, wajib mencantumkan BMKG sebagai sumber |
| Kelas bahaya banjir dan longsor | InaRISK BNPB | layanan peta InaRISK |
| Batas DAS dan tutupan hutan | Kemenhut | data spasial resmi |
| Riwayat kejadian bencana (kalibrasi IKD) | DIBI BNPB | unduhan data DIBI |

Rancangan arsitekturnya ada di Gambar L4 esai: penjadwal mingguan mengambil data satelit, server menghitung IKD per DAS, lalu hasilnya dikirim ke aplikasi warga, gerbang SMS, dan dasbor.

---

## Batasan purwarupa

- Angka DAS, peringatan, prakiraan hujan, dan laporan contoh adalah simulasi.
- Peta DAS berupa ilustrasi kontur, bukan batas DAS sebenarnya.
- Notifikasi dan SMS ditampilkan sebagai simulasi di dalam aplikasi.
- Verifikasi laporan disimulasikan dengan jeda beberapa detik.
- Data tersimpan di browser perangkat yang dipakai, bukan di server.
- Huruf Plus Jakarta Sans dimuat dari Google Fonts. Tanpa internet, aplikasi memakai huruf bawaan perangkat.
