/* ═══════════════════════════════════════════════════════════
   VAI DE BOA! MUSIC — SERVICE WORKER v20
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'vdb-cache-v20';
const CACHE_MUSICAS = 'vdb-musicas-offline';

// Arquivos essenciais do app (shell)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon30.png',
  './favicon192.png'
];

// ═══════════════════════════════════════════════════════════
// INSTALL — faz cache do app shell e ativa imediatamente
// ═══════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('🔧 SW: instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('⚠️ SW: falha ao cachear shell:', err);
      });
    }).then(() => self.skipWaiting()) // ⚡ ativa JÁ
  );
});

// ═══════════════════════════════════════════════════════════
// ACTIVATE — limpa caches antigos e assume controle
// ═══════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: ativando...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Remove cache antigo mas MANTÉM o cache de músicas offline
          if (key !== CACHE_NAME && key !== CACHE_MUSICAS) {
            console.log('🗑️ SW: removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // ⚡ assume controle já
  );
});

// ═══════════════════════════════════════════════════════════
// FETCH — estratégia inteligente por tipo de arquivo
// ═══════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não são GET
  if (request.method !== 'GET') return;

  // Ignora extensões de chrome, etc
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // ═══════════════════════════════════════════════════════════
  // 1️⃣ HTML — SEMPRE da rede (NUNCA do cache)
  //    → garante que correções cheguem aos clientes
  // ═══════════════════════════════════════════════════════════
  if (request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Atualiza o cache do HTML em background
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Se offline, tenta o cache
          return caches.match(request).then(cached => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ JSON de playlists (GitHub) — network-first com fallback
  // ═══════════════════════════════════════════════════════════
  if (url.hostname.includes('githubusercontent.com') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ ÁUDIOS/MP4 (músicas) — cache-first com salvar em background
  // ═══════════════════════════════════════════════════════════
  if (request.destination === 'audio' ||
      request.destination === 'video' ||
      url.pathname.match(/\.(mp3|mp4|m4a|ogg|wav|webm)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Salva em cache (mas não bloqueia a resposta)
          const clone = response.clone();
          caches.open(CACHE_MUSICAS).then(cache => {
            cache.put(request, clone).catch(() => {});
          });
          return response;
        });
      })
    );
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 4️⃣ Imagens/CSS/Fonts — cache-first com atualização em bg
  // ═══════════════════════════════════════════════════════════
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|woff2?|ttf)$/i)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 5️⃣ Resto — tenta rede, cai pra cache
  // ═══════════════════════════════════════════════════════════
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ═══════════════════════════════════════════════════════════
// MESSAGE — permite forçar atualização via postMessage
// ═══════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
