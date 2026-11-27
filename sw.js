/* ═══════════════════════════════════════════════════════════
   VDB MUSIC — Service Worker v63
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'vdb-pwa-v63';           // ← MUDOU (era v62)
const CACHE_OFFLINE = 'vdb-offline-v1';     // ← NÃO MEXER

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon512.png',
  './favicon30.png'
];

/* INSTALL */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(err => console.warn('[SW] Erro no install:', err))
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k !== CACHE_NAME && k !== CACHE_OFFLINE)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* FETCH */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  if (
    url.includes('raw.githubusercontent.com') ||
    url.includes('.mp3') || url.includes('.mp4') ||
    url.includes('.m4a') || url.includes('.opus') ||
    url.includes('.webm') || url.includes('.ogg') ||
    url.includes('.wav') || url.includes('qrserver.com')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone).catch(() => {}))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});

/* MESSAGE */
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
