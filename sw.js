// ═══════════════════════════════════════════════════════════════
// VAI DE BOA! MUSIC - SERVICE WORKER
// Permite instalar como app e funcionar offline
// ═══════════════════════════════════════════════════════════════

const CACHE_NOME = 'vdb-music-v6';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon30.png',
  './favicon192.png'
];

// Instala e faz cache do essencial
self.addEventListener('install', event => {
  console.log('📦 SW instalando...');
  event.waitUntil(
    caches.open(CACHE_NOME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('⚠️ Alguns arquivos falharam no cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  console.log('✅ SW ativado!');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NOME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First (tenta rede, cai pro cache se falhar)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Não interceptar APIs externas ou métodos não-GET
  if (request.method !== 'GET') return;

  // Deixa passar requisições para outros domínios (GitHub, APIs, etc)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Guarda uma cópia atualizada no cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NOME).then(cache => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // Sem internet: usa o cache
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Se não tem no cache e é navegação, tenta o index
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Mensagens do app (pra limpar cache, etc)
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'LIMPAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
