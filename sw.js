/* ═══════════════════════════════════════════════════════════════
   VDB MUSIC — Service Worker
   - Cacheia o SHELL do app (HTML/CSS/JS/ícones)
   - NÃO cacheia músicas (isso é feito no código principal)
   - Estratégia: Network-first para o HTML, Cache-first pro resto
   ═══════════════════════════════════════════════════════════════ */

const VERSAO = 'vdb-shell-v61';
const CACHE_SHELL = 'vdb-shell-' + VERSAO;

/* Arquivos essenciais pra abrir offline */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon192.png',
  './favicon30.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Audiowide&family=Rajdhani:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap'
];

/* ─── INSTALL: pré-cacheia o shell ─── */
self.addEventListener('install', event => {
  console.log('[SW] Instalando', VERSAO);
  event.waitUntil(
    (async () => {
      try{
        const cache = await caches.open(CACHE_SHELL);
        /* addAll falha se 1 só falhar — fazemos 1 por 1 */
        for(const url of SHELL){
          try{
            await cache.add(new Request(url, {cache:'reload'}));
          }catch(e){
            console.warn('[SW] Falhou cachear:', url, e.message);
          }
        }
      }catch(e){
        console.error('[SW] Erro install:', e);
      }
      self.skipWaiting();
    })()
  );
});

/* ─── ACTIVATE: limpa caches antigos do shell ─── */
self.addEventListener('activate', event => {
  console.log('[SW] Ativando', VERSAO);
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes.map(n => {
          /* Mantém só o shell atual. Não mexe no vdb-musicas-offline-v2! */
          if(n.startsWith('vdb-shell-') && n !== CACHE_SHELL){
            console.log('[SW] Deletando cache antigo:', n);
            return caches.delete(n);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

/* ─── FETCH: estratégia por tipo de request ─── */
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  /* Ignora métodos que não são GET */
  if(req.method !== 'GET') return;

  /* ─── 1) NUNCA mexer em áudio/música (deixa o app cuidar) ─── */
  if(
    req.destination === 'audio' ||
    req.destination === 'video' ||
    url.href.includes('vdb-musicas-offline') ||
    /\.(mp3|m4a|aac|ogg|wav|mp4|webm)(\?|$)/i.test(url.pathname)
  ){
    return; /* deixa o browser + Cache API do app cuidarem */
  }

  /* ─── 2) JSONs dos gêneros: network-first, cache fallback ─── */
  if(url.hostname === 'raw.githubusercontent.com' && url.pathname.endsWith('.json')){
    event.respondWith(
      (async () => {
        try{
          const r = await fetch(req);
          return r;
        }catch(e){
          const cache = await caches.open(CACHE_SHELL);
          const c = await cache.match(req);
          return c || new Response('[]', {headers:{'Content-Type':'application/json'}});
        }
      })()
    );
    return;
  }

  /* ─── 3) HTML: network-first (pega atualizações) ─── */
  if(req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html')){
    event.respondWith(
      (async () => {
        try{
          const r = await fetch(req);
          const cache = await caches.open(CACHE_SHELL);
          cache.put(req, r.clone());
          return r;
        }catch(e){
          const cache = await caches.open(CACHE_SHELL);
          const c = await cache.match(req);
          return c || cache.match('./index.html');
        }
      })()
    );
    return;
  }

  /* ─── 4) Demais (CSS, JS, ícones, fontes): cache-first ─── */
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_SHELL);
      const cached = await cache.match(req);
      if(cached) return cached;

      try{
        const r = await fetch(req);
        /* Só cacheia se for OK (evita cachear erro 404) */
        if(r.ok && r.type !== 'opaque'){
          cache.put(req, r.clone()).catch(() => {});
        } else if(r.type === 'opaque'){
          /* CORS anônimo (fonts, CDN) — cacheia mesmo opaco */
          cache.put(req, r.clone()).catch(() => {});
        }
        return r;
      }catch(e){
        return cached || new Response('', {status: 504});
      }
    })()
  );
});

/* ─── MESSAGE: força atualização quando o app pedir ─── */
self.addEventListener('message', event => {
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
  if(event.data === 'LIMPAR_TUDO'){
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.map(n => caches.delete(n)));
      console.log('[SW] Todos os caches limpos');
    })();
  }
});
