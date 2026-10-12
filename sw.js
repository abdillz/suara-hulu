/* Service worker: menyimpan aplikasi di ponsel agar tetap bisa dibuka tanpa sinyal.
   Aktif hanya saat purwarupa dijalankan lewat server (http/https), bukan dari file langsung. */
const CACHE = 'suarahulu-v1';
const FILES = ['./', 'index.html', 'dasbor.html', 'css/gaya.css', 'css/dasbor.css', 'js/data.js', 'js/core.js', 'js/peta.js', 'js/app.js', 'js/dasbor.js', 'assets/ikon.svg', 'manifest.json'];

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).catch(() => caches.match('index.html'))));
});
