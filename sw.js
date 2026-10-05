/* ═══════════════════════════════════════════════════════════
   VAI DE BOA! MUSIC — SERVICE WORKER v61 (CORRIGIDO)
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'vdb-cache-v61';
const CACHE_MUSICAS = 'vdb-musicas-offline';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon30.png',
  './favicon192.png'
];

self.addEventListener('install', (event) => {
  console.log('🔧 SW: instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map(url =>
          cache.add(url).catch(err => console.warn(`⚠️ SW: falha ao cachear ${url}`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 SW: ativando...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CACHE_MUSICAS) {
            console.log('🗑️ SW: removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 1️⃣ HTML — network-first
  if (request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone)).catch(()=>{});
          return response;
        })
        .catch(async () => {
          return (await caches.match(request))
              || (await caches.match('./index.html'))
              || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // 2️⃣ JSON playlists — network-first
  if (url.hostname.includes('githubusercontent.com') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone)).catch(()=>{});
          return response;
        })
        .catch(async () => {
          return (await caches.match(request))
              || new Response('[]', { status: 200, headers: {'Content-Type': 'application/json'} });
        })
    );
    return;
  }

  // 3️⃣ Áudio/Vídeo — cache-first
  if (request.destination === 'audio' ||
      request.destination === 'video' ||
      url.pathname.match(/\.(mp3|mp4|m4a|ogg|wav|webm|opus)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_MUSICAS)
            .then(c => c.put(request, clone))
            .catch(()=>{});
          return response;
        });
      })
    );
    return;
  }

  // 4️⃣ Imagens/CSS/Fonts — cache-first + update bg
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|woff2?|ttf)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone())).catch(()=>{});
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 5️⃣ Resto
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => {
        return (await caches.match(request))
            || new Response('', { status: 504, statusText: 'Offline' });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
