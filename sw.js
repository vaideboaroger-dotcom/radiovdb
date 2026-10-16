/* VDB MUSIC - Service Worker */
const CACHE_VERSION = 'vdb-sw-v1';
const CACHE_APP = 'vdb-app-v1';
const CACHE_OFFLINE = 'vdb-offline-v1'; // mesmo nome usado no HTML

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon512.png',
  './favicon30.png'
];

/* Instala: cacheia o app shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APP).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

/* Ativa: limpa caches antigos (mantém o vdb-offline-v1) */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_APP && k !== CACHE_OFFLINE && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

/* Fetch: estratégia mista */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignora métodos não-GET
  if (req.method !== 'GET') return;

  // Ignora chrome-extension, etc
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Áudio (.mp3, .m4a, etc): cache-first (offline)
  if (/\.(mp3|m4a|ogg|wav|aac|opus|mp4|webm)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_OFFLINE).then((cache) => {
        return cache.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              cache.put(req, clone).catch(() => {});
            }
            return res;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // JSON de gêneros (github raw): network-first com fallback pro cache
  if (url.hostname.includes('raw.githubusercontent.com') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_APP).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }).catch(() => {
        return caches.match(req).then((cached) => {
          return cached || new Response('[]', { headers: { 'Content-Type': 'application/json' } });
        });
      })
    );
    return;
  }

  // App shell: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_APP).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        });
      })
    );
    return;
  }

  // Default: network
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
