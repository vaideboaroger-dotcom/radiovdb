/* ============================================================
   VDB MUSIC — Service Worker (sw.js)
   Versão: v1
   ============================================================ */

const CACHE_NAME = 'vdb-app-v1';
const CACHE_OFFLINE = 'vdb-offline-v1';

// Arquivos essenciais do app (pré-cache na instalação)
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon512.png'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('[SW] Falhou pré-cache:', url, e);
        }
      }
      await self.skipWaiting();
    })()
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CACHE_OFFLINE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só intercepta GET
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Só intercepta o próprio domínio (não mexe em áudio do GitHub, fontes CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Navegação (HTML) → network-first com fallback pro cache
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          return resp;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Outros arquivos do mesmo domínio → cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});

/* ---------- MESSAGE (opcional) ---------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
