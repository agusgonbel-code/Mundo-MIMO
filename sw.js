const CACHE='mundo-mimo-v550-v2-offline';
const expansions=Array.from({length:20},(_,i)=>`./v2/catalog/expansion-v${240+i*10}.js`);
const runtimeExtensions=Array.from({length:23},(_,i)=>`./v2/runtime-v${210+i*10}-extension.js`);
const CORE=[
  './','./index.html','./v2/app-v200.html','./manifest.webmanifest','./privacy.html','./support.html','./credits.html','./assets/app-icon.svg',
  './v2/core/platform-v200.js','./v2/catalog/seed-games-v200.js','./v2/runtime-v200.js','./v2/core/content-depth-v500.js','./v2/core/worlds-v510.js','./v2/core/parent-zone-v520.js',
  ...expansions,...runtimeExtensions,
  './assets/audio/dog.ogg','./assets/audio/cat.ogg','./assets/audio/cow.ogg','./assets/audio/frog.oga','./assets/audio/voice-perro.wav','./assets/audio/voice-vamos.wav','./assets/audio/voice-uno.wav','./assets/audio/voice-dos.wav','./assets/audio/voice-tres.wav','./assets/audio/voice-estrella.wav','./assets/audio/voice-pez.wav','./assets/audio/voice-pequeno.wav','./assets/audio/voice-triste.wav'
];
const cachePut=(request,response)=>{if(response?.ok&&new URL(request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}return response;};
const networkFirst=request=>fetch(request,{cache:'no-store'}).then(response=>cachePut(request,response)).catch(()=>caches.match(request));
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request).then(response=>response||caches.match('./v2/app-v200.html')));
    return;
  }
  if(event.request.destination==='script'||event.request.destination==='style'){
    event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>cachePut(event.request,response))));
    return;
  }
  if(event.request.destination==='audio'){
    event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>cachePut(event.request,response)).catch(()=>new Response('',{status:503}))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>cachePut(event.request,response))));
});