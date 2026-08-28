(()=>{'use strict';
const P=globalThis.MundoMimoV2;
const R=globalThis.MundoMimoV2RuntimeV430;
const Base=globalThis.MundoMimoV2Runtime;
if(!P||!R||!Base)throw new Error('Mundo Mimo V590 performance dependencies missing');

const oldAgeBar=document.getElementById('ageBar');
const oldGrid=document.getElementById('gameGrid');
if(!oldAgeBar||!oldGrid)throw new Error('Mundo Mimo V590 shell missing');

// The expansion runtimes up to V430 attach one MutationObserver each to the
// original grid. Keeping those observers attached during every age change made
// one user action fan out into many redundant augment passes. Replace only the
// navigation surfaces after all expansion runtimes are registered: game
// handlers/stage/progress remain untouched, while the legacy observer graph is
// detached from the live document.
const ageBar=oldAgeBar.cloneNode(false);
const gameGrid=oldGrid.cloneNode(false);
oldAgeBar.replaceWith(ageBar);
oldGrid.replaceWith(gameGrid);

const STATE_KEY='mimo-v2-runtime-200';
const versions=[200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430];
const runtimes=versions.map(v=>v===200?Base:globalThis[`MundoMimoV2RuntimeV${v}`]).filter(Boolean);
const games=R.allGames();
const owners=new Map();
for(const id of Base.implemented||[])owners.set(id,Base);
for(const runtime of runtimes){
  for(const id of runtime.extra||[])owners.set(id,runtime);
}
let age='2-3';
try{
  const saved=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');
  if(P.ageBands.some(b=>b.id===saved.age))age=saved.age;
}catch{}

function persistAge(){
  try{
    const state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');
    state.age=age;
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
  }catch{}
}
function ownerFor(id){return owners.get(id)||null}
function startGame(id){
  const owner=ownerFor(id);
  if(!owner||typeof owner.start!=='function')return false;
  owner.start(id);
  const stage=document.getElementById('stage');
  const title=document.getElementById('gameTitle');
  const launched=Boolean(stage&&!stage.hidden&&title?.textContent?.trim());
  if(launched){
    document.dispatchEvent(new CustomEvent('mimo:game-started',{detail:{id,age}}));
  }
  return launched;
}
function syncLegacyAge(){
  // Detached nodes are still read by older handlers when persisting a result.
  oldAgeBar.querySelectorAll('[data-age]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.age===age)));
  if(typeof Base.setAge==='function')Base.setAge(age);
}
function renderAges(){
  ageBar.innerHTML=P.ageBands.map(b=>`<button type="button" data-age="${b.id}" aria-pressed="${b.id===age}">${b.label}</button>`).join('');
}
function renderGames(){
  const eligible=games.filter(g=>g.ages.includes(age)&&ownerFor(g.id));
  gameGrid.innerHTML=eligible.length?eligible.map(g=>`<button class="gameCard" type="button" data-game="${g.id}"><b>${g.name}</b><small>${g.skill} · ${g.mechanic}</small></button>`).join(''):'<p>No hay todavía juegos jugables para esta franja.</p>';
}
function setAge(next){
  if(!P.ageBands.some(b=>b.id===next)||next===age)return;
  age=next;
  syncLegacyAge();
  persistAge();
  renderAges();
  renderGames();
  ageBar.dispatchEvent(new CustomEvent('mimo:agechange',{bubbles:true,detail:{age}}));
}
ageBar.addEventListener('click',event=>{
  const button=event.target.closest('[data-age]');
  if(button)setAge(button.dataset.age);
});

// V590 owns the live catalog grid after detaching every legacy expansion grid.
// Route from that stable surface, synchronously and in capture phase, so the
// exact historical owner has opened the stage before any later observer (for
// example Recovery V570) records the same user activation. Delegation on the
// grid also survives innerHTML renders and replacement/cloning of card nodes.
gameGrid.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button||!gameGrid.contains(button))return;
  startGame(button.dataset.game);
},{capture:true});

syncLegacyAge();
persistAge();
renderAges();
renderGames();

globalThis.MundoMimoV2Performance=Object.freeze({version:590,setAge,startGame,ownerFor,get age(){return age;},gameCount:games.length,ownedGameCount:owners.size});
})();
