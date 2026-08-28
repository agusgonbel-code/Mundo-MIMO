(()=>{'use strict';
const P=globalThis.MundoMimoV2;
const R=globalThis.MundoMimoV2RuntimeV430;
const Base=globalThis.MundoMimoV2Runtime;
if(!P||!R||!Base)throw new Error('Mundo Mimo V590 performance dependencies missing');

const oldAgeBar=document.getElementById('ageBar');
const gameGrid=document.getElementById('gameGrid');
if(!oldAgeBar||!gameGrid)throw new Error('Mundo Mimo V590 shell missing');

// V430 already replaces #gameGrid once and installs the final delegated owner on that
// live node. V590 must not clone it again: doing so drops the only listener that knows
// how to route all historical runtimes. Age navigation is still centralized here because
// the legacy age bar intentionally owns capture/stopImmediatePropagation.
const ageBar=oldAgeBar.cloneNode(false);
oldAgeBar.replaceWith(ageBar);
const canonicalGrid=gameGrid;

const STATE_KEY='mimo-v2-runtime-200';
const versions=[200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430];
const runtimes=versions.map(v=>v===200?Base:globalThis[`MundoMimoV2RuntimeV${v}`]).filter(Boolean);
const games=R.allGames();
const owners=new Map();
for(const id of Base.implemented||[])owners.set(id,Base);
for(const runtime of runtimes){for(const id of runtime.extra||[])owners.set(id,runtime)}
let age='2-3';
let lastStartedId=null;
try{const saved=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');if(P.ageBands.some(b=>b.id===saved.age))age=saved.age}catch{}

function persistAge(){try{const state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');state.age=age;localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{}}
function ownerFor(id){return owners.get(id)||null}
function finishLaunch(id,deferredScroll=false){
  const stage=document.getElementById('stage');
  const title=document.getElementById('gameTitle');
  const launched=Boolean(stage&&!stage.hidden&&title?.textContent?.trim());
  if(!launched)return false;
  lastStartedId=id;
  document.dispatchEvent(new CustomEvent('mimo:game-started',{detail:{id,age}}));
  globalThis.MundoMimoV2CatalogRouterBootstrap?.recordLaunch?.(id,'click');
  if(deferredScroll)setTimeout(()=>stage?.scrollIntoView?.({block:'start'}),0);
  return true;
}
function startGame(id,options={}){
  const owner=ownerFor(id);
  if(!owner||typeof owner.start!=='function')return false;
  const stage=document.getElementById('stage');
  let deferredScroll=false;
  let ownScroll;
  if(options.deferScroll&&stage&&typeof stage.scrollIntoView==='function'){
    ownScroll=Object.prototype.hasOwnProperty.call(stage,'scrollIntoView')?stage.scrollIntoView:undefined;
    try{stage.scrollIntoView=()=>{deferredScroll=true}}catch{}
  }
  try{owner.start(id)}finally{
    if(options.deferScroll&&stage){
      try{if(ownScroll===undefined)delete stage.scrollIntoView;else stage.scrollIntoView=ownScroll}catch{}
    }
  }
  const launched=finishLaunch(id,deferredScroll);
  return launched;
}
function syncLegacyAge(){
  oldAgeBar.querySelectorAll('[data-age]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.age===age)));
  if(typeof Base.setAge==='function')Base.setAge(age);
}
function renderAges(){ageBar.innerHTML=P.ageBands.map(b=>`<button type="button" data-age="${b.id}" aria-pressed="${b.id===age}">${b.label}</button>`).join('')}
function renderGames(){
  const eligible=games.filter(g=>g.ages.includes(age)&&ownerFor(g.id));
  gameGrid.innerHTML=eligible.length?eligible.map(g=>`<button class="gameCard" type="button" data-game="${g.id}"><b>${g.name}</b><small>${g.skill} · ${g.mechanic}</small></button>`).join(''):'<p>No hay todavía juegos jugables para esta franja.</p>';
}
function setAge(next){
  if(!P.ageBands.some(b=>b.id===next)||next===age)return;
  age=next;syncLegacyAge();persistAge();renderAges();renderGames();
  ageBar.dispatchEvent(new CustomEvent('mimo:agechange',{bubbles:true,detail:{age}}));
}
ageBar.addEventListener('click',event=>{const button=event.target.closest('[data-age]');if(button)setAge(button.dataset.age)});

// Preserve the V430 delegated click path. Capture is used only to defer its synchronous
// scrollIntoView without cancelling the event. The bubble listener runs after V430 and
// records the launch/recovery event exactly once. If some external code replaces the whole
// grid node later, a window fallback starts only that replacement grid because it no longer
// has V430's delegated listener.
const activationState=new WeakMap();
window.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button)return;
  const liveGrid=document.getElementById('gameGrid');
  if(!liveGrid||!liveGrid.contains(button))return;
  const id=button.dataset.game;
  if(liveGrid!==canonicalGrid){
    const launched=startGame(id,{deferScroll:true});
    activationState.set(event,{handled:launched});
    return;
  }
  const stage=document.getElementById('stage');
  if(!stage||typeof stage.scrollIntoView!=='function')return;
  const own=Object.prototype.hasOwnProperty.call(stage,'scrollIntoView')?stage.scrollIntoView:undefined;
  let deferred=false;
  try{stage.scrollIntoView=()=>{deferred=true};activationState.set(event,{stage,own,get deferred(){return deferred}})}catch{}
},{capture:true});

gameGrid.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button||!gameGrid.contains(button))return;
  const state=activationState.get(event);
  if(state?.stage){
    try{if(state.own===undefined)delete state.stage.scrollIntoView;else state.stage.scrollIntoView=state.own}catch{}
  }
  finishLaunch(button.dataset.game,Boolean(state?.deferred));
});

syncLegacyAge();persistAge();renderAges();renderGames();

globalThis.MundoMimoV2Performance=Object.freeze({version:590,setAge,startGame,ownerFor,get age(){return age;},get lastStartedId(){return lastStartedId;},gameCount:games.length,ownedGameCount:owners.size});
})();