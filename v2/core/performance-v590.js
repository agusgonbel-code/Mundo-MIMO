(()=>{'use strict';
const P=globalThis.MundoMimoV2;
const R=globalThis.MundoMimoV2RuntimeV430;
const Base=globalThis.MundoMimoV2Runtime;
if(!P||!R||!Base)throw new Error('Mundo Mimo V590 performance dependencies missing');

const oldAgeBar=document.getElementById('ageBar');
const inheritedGrid=document.getElementById('gameGrid');
if(!oldAgeBar||!inheritedGrid)throw new Error('Mundo Mimo V590 shell missing');

// V590 is the final catalog shell. Replace the inherited nodes exactly once so legacy
// incremental listeners/observers cannot compete with the canonical catalog owner.
const ageBar=oldAgeBar.cloneNode(false);
oldAgeBar.replaceWith(ageBar);
const gameGrid=inheritedGrid.cloneNode(false);
inheritedGrid.replaceWith(gameGrid);

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
  return finishLaunch(id,deferredScroll);
}
function syncLegacyAge(){
  oldAgeBar.querySelectorAll('[data-age]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.age===age)));
  if(typeof Base.setAge==='function')Base.setAge(age);
}
function renderAges(){ageBar.innerHTML=P.ageBands.map(b=>`<button type="button" data-age="${b.id}" aria-pressed="${b.id===age}">${b.label}</button>`).join('')}
function renderGames(){
  const eligible=games.filter(g=>g.ages.includes(age)&&ownerFor(g.id));
  gameGrid.innerHTML=eligible.length?eligible.map(g=>`<button class="gameCard" type="button" data-game="${g.id}" data-v590-owner="canonical"><b>${g.name}</b><small>${g.skill} · ${g.mechanic}</small></button>`).join(''):'<p>No hay todavía juegos jugables para esta franja.</p>';
}
function setAge(next){
  if(!P.ageBands.some(b=>b.id===next)||next===age)return;
  age=next;syncLegacyAge();persistAge();renderAges();renderGames();
  ageBar.dispatchEvent(new CustomEvent('mimo:agechange',{bubbles:true,detail:{age}}));
}
ageBar.addEventListener('click',event=>{const button=event.target.closest('[data-age]');if(button)setAge(button.dataset.age)});

// The live V590 grid owns only the completed browser click. Listen in capture phase so a
// historical target/bubble listener cannot make a valid card activation disappear before it
// reaches the canonical owner. We deliberately do not preventDefault/stopPropagation and do
// not launch from pointerdown/up, so the same completed click continues normally to body and
// document and the first gameplay interaction remains independent from catalog activation.
const handledActivations=new WeakSet();
gameGrid.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button||!gameGrid.contains(button))return;
  handledActivations.add(event);
  startGame(button.dataset.game,{deferScroll:true});
},true);

// Defensive fallback only for an externally replaced/cloned #gameGrid. DOM cloning does not
// copy listeners, so such a grid intentionally has no local owner. The same completed click
// is routed here without preventDefault/stopPropagation/retries/timers.
document.addEventListener('click',event=>{
  if(handledActivations.has(event))return;
  const button=event.target?.closest?.('[data-game]');
  if(!button)return;
  const liveGrid=document.getElementById('gameGrid');
  if(!liveGrid||!liveGrid.contains(button))return;
  startGame(button.dataset.game,{deferScroll:true});
});

syncLegacyAge();persistAge();renderAges();renderGames();

globalThis.MundoMimoV2Performance=Object.freeze({version:590,setAge,startGame,ownerFor,get age(){return age;},get lastStartedId(){return lastStartedId;},gameCount:games.length,ownedGameCount:owners.size});
})();