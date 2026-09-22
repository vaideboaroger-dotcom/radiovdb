const CACHE_NOME = 'vdb-music-v6';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon30.png',
  './favicon192.png'
];

self.addEventListener('install', event => {
  console.log('📦 SW instalando...');
  event.waitUntil(
    caches.open(CACHE_NOME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('⚠️ Alguns arquivos falharam:', err);
      });
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NOME).then(cache => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
