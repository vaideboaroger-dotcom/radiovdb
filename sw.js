/* VDB MUSIC — Service Worker */
const VERSAO = 'vdb-shell-v62';
const CACHE_SHELL = 'vdb-shell-' + VERSAO;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon30.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Audiowide&family=Rajdhani:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando', VERSAO);
  event.waitUntil((async () => {
    try{
      const cache = await caches.open(CACHE_SHELL);
      for(const url of SHELL){
        try{ await cache.add(new Request(url, {cache:'reload'})); }
        catch(e){ console.warn('[SW] Falhou:', url); }
      }
    }catch(e){ console.error('[SW]', e); }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  console.log('[SW] Ativando', VERSAO);
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.map(n => {
      if(n.startsWith('vdb-shell-') && n !== CACHE_SHELL) return caches.delete(n);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(req.method !== 'GET') return;

  /* Áudio/vídeo — não mexe */
  if(req.destination === 'audio' || req.destination === 'video' ||
     url.href.includes('vdb-musicas-offline') ||
     /\.(mp3|m4a|aac|ogg|wav|mp4|webm)(\?|$)/i.test(url.pathname)){
    return;
  }

  /* JSONs — network-first */
  if(url.hostname === 'raw.githubusercontent.com' && url.pathname.endsWith('.json')){
    event.respondWith((async () => {
      try{ return await fetch(req); }
      catch(e){
        const cache = await caches.open(CACHE_SHELL);
        return (await cache.match(req)) || new Response('[]', {headers:{'Content-Type':'application/json'}});
      }
    })());
    return;
  }

  /* HTML — network-first */
  if(req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html')){
    event.respondWith((async () => {
      try{
        const r = await fetch(req);
        const cache = await caches.open(CACHE_SHELL);
        cache.put(req, r.clone());
        return r;
      }catch(e){
        const cache = await caches.open(CACHE_SHELL);
        return (await cache.match(req)) || cache.match('./index.html');
      }
    })());
    return;
  }

  /* Resto — cache-first */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_SHELL);
    const cached = await cache.match(req);
    if(cached) return cached;
    try{
      const r = await fetch(req);
      if(r.ok || r.type === 'opaque') cache.put(req, r.clone()).catch(()=>{});
      return r;
    }catch(e){ return cached || new Response('', {status:504}); }
  })());
});
