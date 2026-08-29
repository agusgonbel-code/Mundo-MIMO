const CACHE='mundo-mimo-v640-accessibility';
const expansions=Array.from({length:20},(_,i)=>`./v2/catalog/expansion-v${240+i*10}.js`);
const runtimeExtensions=Array.from({length:23},(_,i)=>`./v2/runtime-v${210+i*10}-extension.js`);
const CORE=[
  './','./index.html','./v2/app-v200.html','./manifest.webmanifest','./privacy.html','./support.html','./credits.html','./assets/app-icon.svg',
  './v2/core/privacy-v580.js','./v2/core/platform-v200.js','./v2/catalog/seed-games-v200.js','./v2/core/catalog-router-bootstrap-v590.js','./v2/runtime-v200.js','./v2/core/performance-v590.js','./v2/core/content-depth-v500.js','./v2/core/adaptation-v610.js','./v2/core/worlds-v510.js','./v2/core/parent-zone-v520.js','./v2/core/parent-interaction-v591.js','./v2/core/recovery-v570.js','./v2/core/accessibility-v640.js',
  ...expansions,...runtimeExtensions,
  './assets/premium-v71.css','./assets/premium-v71.js',
  './assets/challenge-engine-v100.js','./assets/learning-model-v130.js','./assets/visual-system-v110.css','./assets/visual-system-v110.js','./assets/visual-dynamic-v111.js',
  './assets/audio/dog.ogg','./assets/audio/cat.ogg','./assets/audio/cow.ogg','./assets/audio/frog.oga','./assets/audio/voice-perro.wav','./assets/audio/voice-vamos.wav','./assets/audio/voice-uno.wav','./assets/audio/voice-dos.wav','./assets/audio/voice-tres.wav','./assets/audio/voice-estrella.wav','./assets/audio/voice-pez.wav','./assets/audio/voice-pequeno.wav','./assets/audio/voice-triste.wav'
];
const cachePut=(request,response)=>{if(response?.ok&&new URL(request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}return response;};
const networkFirst=request=>fetch(request,{cache:'no-store'}).then(response=>cachePut(request,response)).catch(()=>caches.match(request));
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(networkFirst(e.request).then(r=>r||caches.match('./v2/app-v200.html')));
    return;
  }
  if(e.request.destination==='script'||e.request.destination==='style'){
    e.respondWith(networkFirst(e.request));
    return;
  }
  if(e.request.destination==='audio'){
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>cachePut(e.request,r)).catch(()=>new Response('',{status:503}))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>cachePut(e.request,r))));
});