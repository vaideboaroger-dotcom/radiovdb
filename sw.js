'use strict';
const CACHE_VERSION='vdb-v003';
const CACHE_STATIC=CACHE_VERSION+'-static';
const CACHE_JSON=CACHE_VERSION+'-json';
const CACHE_AUDIO='vdb-offline-'+CACHE_VERSION;

self.addEventListener('install',()=>self.skipWaiting());

self.addEventListener('activate',(e)=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys.filter(k=>k.startsWith('vdb-')&&!k.startsWith('vdb-offline'))
        .filter(k=>k!==CACHE_STATIC&&k!==CACHE_JSON)
        .map(k=>caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',(event)=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=req.url;
  const isAudio=/\.(mp3|m4a|ogg|wav|aac|mp4|webm)(\?|$)/i.test(url);
  const isJSON=/\.json(\?|$)/i.test(url);

  if(isAudio){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_AUDIO);
      const limpa=url.split('?')[0];
      const hit=await cache.match(limpa);
      if(hit)return hit;
      try{
        const r=await fetch(req);
        if(r.ok)cache.put(limpa,r.clone()).catch(()=>{});
        return r;
      }catch(_){
        return new Response('',{status:504});
      }
    })());
    return;
  }

  if(isJSON){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_JSON);
      const hit=await cache.match(req);
      const fp=fetch(req).then(r=>{
        if(r.ok)cache.put(req,r.clone()).catch(()=>{});
        return r;
      }).catch(()=>hit);
      return hit||fp;
    })());
    return;
  }
});
