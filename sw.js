/* ═══════════════════════════════════════════════════════════
   VDB MUSIC v005 — Service Worker
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'vdb-pwa-v62';           // Cache do app (HTML, CSS, JS)
const CACHE_OFFLINE = 'vdb-offline-v1';     // Cache de áudio offline (NÃO DELETAR)

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon512.png',
  './favicon30.png'
];

/* ═══════════════════════════════════════════
   INSTALL — cacheia o app shell
   ═══════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(err => console.warn('[SW] Erro no install:', err))
      .then(() => self.skipWaiting())
  );
});

/* ═══════════════════════════════════════════
   ACTIVATE — limpa caches antigos
   ⚠️ PRESERVA: vdb-offline-v1 (áudios baixados)
   ═══════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k !== CACHE_NAME && k !== CACHE_OFFLINE)  // 👈 preserva offline
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* ═══════════════════════════════════════════
   FETCH — estratégia mista
   ═══════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  /* 🔇 Ignora (não intercepta):
     - JSONs do GitHub (gêneros/mídias)
     - Áudios (.mp3, .m4a, .opus, etc)
     - Vídeos (.mp4, .webm)
     - QR Code API
     O HTML cuida do cache desses */
  if (
    url.includes('raw.githubusercontent.com') ||
    url.includes('.mp3') ||
    url.includes('.mp4') ||
    url.includes('.m4a') ||
    url.includes('.opus') ||
    url.includes('.webm') ||
    url.includes('.ogg') ||
    url.includes('.wav') ||
    url.includes('qrserver.com')
  ) return;

  /* 🌐 Estratégia: network-first com fallback pro cache */
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

/* ═══════════════════════════════════════════
   MESSAGE — permite forçar update pelo app
   ═══════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
