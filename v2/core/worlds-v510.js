(()=>{'use strict';
const P=globalThis.MundoMimoV2,R=globalThis.MundoMimoV2RuntimeV430,D=globalThis.MundoMimoV2DepthV500;
if(!P||!R||!D)throw new Error('Mundo Mimo V510 world dependencies missing');
const VERSION=510,KEY='mimo-v2-worlds-v510';
const WORLD_DEFS=Object.freeze([
Object.freeze({id:'pradera',name:'Pradera de Mimo',emoji:'🌈',areas:['atencion','psicomotricidad','creatividad'],unlock:0,blurb:'Toca, observa, crea y muévete con Mimo.'}),
Object.freeze({id:'bosque',name:'Bosque de Lío',emoji:'🌳',areas:['memoria','logica','funciones-ejecutivas'],unlock:3,blurb:'Recuerda pistas y resuelve caminos misteriosos.'}),
Object.freeze({id:'laguna',name:'Laguna de Pipa',emoji:'💧',areas:['matematicas','geometria'],unlock:8,blurb:'Cuenta, compara y construye formas.'}),
Object.freeze({id:'villa',name:'Villa Mimo',emoji:'🏡',areas:['mundo-cotidiano','autonomia','habilidades-sociales','emociones'],unlock:14,blurb:'Practica rutinas, emociones y vida cotidiana.'}),
Object.freeze({id:'montana',name:'Monte Aventura',emoji:'⛰️',areas:['lenguaje','conciencia-fonologica','prelectura','lectoescritura'],unlock:22,blurb:'Escucha, juega con sonidos y descubre palabras.'}),
Object.freeze({id:'laboratorio',name:'Laboratorio Estelar',emoji:'🔭',areas:['ciencia','musica'],unlock:32,blurb:'Experimenta, escucha y descubre cómo funciona el mundo.'})
]);
const allGames=()=>R.allGames();
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
const write=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}};
const runtimeState=()=>{try{return JSON.parse(localStorage.getItem('mimo-v2-runtime-200')||'{}')}catch{return {}}};
function age(){return document.querySelector('#ageBar [aria-pressed="true"]')?.dataset.age||runtimeState().age||'2-3'}
function eligibleGames(worldId,band=age()){
 const w=WORLD_DEFS.find(x=>x.id===worldId);if(!w)return [];
 return allGames().filter(g=>w.areas.includes(g.area)&&g.ages.includes(band));
}
function completedCount(){const games=runtimeState().games||{};return Object.values(games).filter(g=>Number(g?.success)>0).length;}
function worldState(){const s=read(),completed=completedCount();return WORLD_DEFS.map((w,i)=>Object.freeze({...w,index:i,unlocked:i===0||completed>=w.unlock||Boolean(s.unlocked?.[w.id]),visited:Boolean(s.visited?.[w.id]),completedGames:eligibleGames(w.id).filter(g=>Number(runtimeState().games?.[g.id]?.success)>0).length,totalGames:eligibleGames(w.id).length}));}
function persistVisit(id){const s=read();s.visited??={};s.unlocked??={};s.visited[id]=Date.now();const worlds=worldState();const idx=WORLD_DEFS.findIndex(w=>w.id===id);if(idx>=0&&idx+1<WORLD_DEFS.length){const current=worlds[idx];if(current.completedGames>=Math.min(3,current.totalGames||3))s.unlocked[WORLD_DEFS[idx+1].id]=true;}write(s)}
function representative(worldId,band=age()){
 const games=eligibleGames(worldId,band);if(!games.length)return null;
 const unplayed=games.find(g=>!runtimeState().games?.[g.id]?.plays);
 if(unplayed)return unplayed;
 return [...games].sort((a,b)=>D.progress(a.id).level-D.progress(b.id).level)[0]||games[0];
}
function startGame(id){
 const dispatcher=globalThis.MundoMimoV2Performance;
 if(dispatcher?.startGame)return dispatcher.startGame(id);
 return Boolean(R.start?.(id));
}
function render(){
 const host=document.getElementById('worldMap');if(!host)return;
 const worlds=worldState();
 host.innerHTML=worlds.map(w=>`<article class="worldCard ${w.unlocked?'':'locked'}" data-world-card="${w.id}" aria-label="${w.name}${w.unlocked?'':' bloqueado'}"><div class="worldIcon" aria-hidden="true">${w.emoji}</div><div class="worldBody"><h3>${w.name}</h3><p>${w.blurb}</p><small>${w.totalGames} juegos para esta edad · ${w.completedGames} completados</small></div><button type="button" class="worldEnter" data-world="${w.id}" ${w.unlocked?'':'disabled'}>${w.unlocked?(w.visited?'Volver':'Explorar'):`🔒 ${w.unlock}`}</button></article>`).join('');
 host.querySelectorAll('[data-world]').forEach(btn=>btn.onclick=()=>enter(btn.dataset.world));
}
function enter(id){const w=worldState().find(x=>x.id===id);if(!w||!w.unlocked)return false;persistVisit(id);const g=representative(id);render();if(!g){const host=document.getElementById('worldStatus');if(host)host.textContent='Este mundo no tiene aún juegos adecuados para la edad seleccionada.';return false;}const status=document.getElementById('worldStatus');if(status)status.textContent=`${w.emoji} ${w.name}: siguiente misión, ${g.name}.`;return startGame(g.id);}
function reset(){localStorage.removeItem(KEY);render()}
function mount(){
 const gamesSection=document.getElementById('gamesTitle')?.closest('section');if(!gamesSection||document.getElementById('worldsTitle'))return;
 const style=document.createElement('style');style.textContent='.worldMap{display:grid;gap:12px}.worldCard{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:center;background:#fff;border-radius:24px;padding:14px;box-shadow:0 6px 20px #402f8d18}.worldCard.locked{opacity:.58}.worldIcon{width:58px;height:58px;border-radius:20px;background:#eee9ff;display:grid;place-items:center;font-size:32px}.worldBody{min-width:0}.worldBody h3,.worldBody p{margin:0}.worldBody p{margin-top:3px}.worldBody small{display:block;margin-top:5px;opacity:.7}.worldEnter{min-height:48px;border:0;border-radius:16px;padding:10px 14px;font:inherit;font-weight:850;background:#7057e8;color:white}.worldEnter:disabled{background:#d9d3ec;color:#635f70}@media(max-width:560px){.worldCard{grid-template-columns:52px minmax(0,1fr)}.worldIcon{width:48px;height:48px}.worldEnter{grid-column:1/-1;width:100%}}';document.head.appendChild(style);
 const section=document.createElement('section');section.setAttribute('aria-labelledby','worldsTitle');section.innerHTML='<h2 id="worldsTitle">Explora los mundos</h2><p id="worldStatus">Elige un territorio. Los caminos se abren a medida que completas juegos.</p><div id="worldMap" class="worldMap"></div>';gamesSection.parentNode.insertBefore(section,gamesSection);
 document.getElementById('ageBar')?.addEventListener('click',()=>setTimeout(render,0));render();
}
mount();
globalThis.MundoMimoV2WorldsV510=Object.freeze({version:VERSION,key:KEY,worlds:WORLD_DEFS,eligibleGames,completedCount,worldState,representative,enter,reset,render});
})();
