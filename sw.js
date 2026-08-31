/* Service Worker — Burūj al-Qur'ān PWA */
const CACHE_NAME = 'buruj-v31';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=4',
  './data.js',
  './canvas.js?v=4',
  './ui.js?v=4',
  './manifest.json'
];

/* Install: cache core assets */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Activate: clean old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: network-first for API calls, cache-first for assets */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* API calls (Quran text, audio) — always network, don't cache */
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  /* Local assets — network first, fallback to cache */
  e.respondWith(
    fetch(e.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return response;
    }).catch(() => caches.match(e.request))
  );
});
