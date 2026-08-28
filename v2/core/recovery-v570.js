(()=>{'use strict';
const KEY='mimo-v2-recovery-570';
const stage=document.getElementById('stage'),ageBar=document.getElementById('ageBar'),gameGrid=document.getElementById('gameGrid'),closeGame=document.getElementById('closeGame');
if(!stage||!ageBar||!gameGrid||!closeGame)return;
const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}};
const write=value=>{try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}};
const currentAge=()=>ageBar.querySelector('[data-age][aria-pressed="true"]')?.dataset.age||null;
const games=()=>globalThis.MundoMimoV2RuntimeV430?.allGames?.()||[];
const validGame=id=>typeof id==='string'&&games().some(game=>game.id===id);
function remember(partial){const prev=read();write({...prev,...partial,updatedAt:Date.now()})}
function clearActive(){const prev=read();delete prev.activeGame;delete prev.startedAt;write({...prev,updatedAt:Date.now()})}
ageBar.addEventListener('click',event=>{const button=event.target.closest('[data-age]');if(!button)return;remember({age:button.dataset.age})});
gameGrid.addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(!button)return;remember({age:currentAge(),activeGame:button.dataset.game,startedAt:Date.now()})},{capture:true});
closeGame.addEventListener('click',clearActive,{capture:true});
function startGame(id){
 const dispatcher=globalThis.MundoMimoV2Performance;
 if(dispatcher?.startGame)return dispatcher.startGame(id);
 const runtime=globalThis.MundoMimoV2RuntimeV430;
 return Boolean(runtime?.start?.(id));
}
function restore(){const saved=read();if(!saved.activeGame||!validGame(saved.activeGame)){if(saved.activeGame)clearActive();return false}
  if(saved.age){const ageButton=ageBar.querySelector(`[data-age="${CSS.escape(saved.age)}"]`);if(ageButton&&ageButton.getAttribute('aria-pressed')!=='true')ageButton.click()}
  if(!startGame(saved.activeGame))return false;
  stage.dataset.recoveredSession='true';stage.dataset.recoveredGame=saved.activeGame;remember({age:currentAge(),activeGame:saved.activeGame,resumeCount:Number(saved.resumeCount||0)+1,lastResumedAt:Date.now()});
  return true;
}
queueMicrotask(restore);
globalThis.MundoMimoV2Recovery=Object.freeze({version:570,key:KEY,read,restore,clearActive});
})();
