const CACHE='mundo-mimo-v74-vector-runtime';
const CORE=['./','./index.html','./app-v70.html','./manifest.webmanifest','./privacy.html','./support.html','./credits.html','./assets/app-icon.svg','./assets/app-v70.css','./assets/premium-v71.css','./assets/visual-system-v110.css','./assets/app-v70.js','./assets/app-v70-audit.js','./assets/premium-v71.js','./assets/challenge-engine-v100.js','./assets/visual-system-v110.js','./assets/visual-dynamic-v111.js','./assets/audio-bank-v70.js','./assets/mimo-bear.svg','./assets/lio-lion.svg','./assets/pipa-elephant.svg','./assets/dog-mimo.svg','./assets/cat-mimo.svg','./assets/cow-mimo.svg','./assets/frog-mimo.svg','./assets/audio/dog.ogg','./assets/audio/cat.ogg','./assets/audio/cow.ogg','./assets/audio/frog.oga','./assets/audio/voice-perro.wav','./assets/audio/voice-vamos.wav','./assets/audio/voice-uno.wav','./assets/audio/voice-dos.wav','./assets/audio/voice-tres.wav','./assets/audio/voice-estrella.wav','./assets/audio/voice-pez.wav','./assets/audio/voice-pequeno.wav','./assets/audio/voice-triste.wav'];
const cachePut=(request,response)=>{if(response?.ok&&new URL(request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}return response;};
const networkFirst=request=>fetch(request).then(response=>cachePut(request,response)).catch(()=>caches.match(request));
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(networkFirst(e.request).then(r=>r||caches.match('./app-v70.html')));
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
