(()=>{'use strict';
const D=globalThis.MundoMimoV2DepthV500,R=globalThis.MundoMimoV2RuntimeV430;
if(!D||!R)throw new Error('Mundo Mimo V610 adaptation dependencies missing');
const VERSION=610,RUNTIME_KEY='mimo-v2-runtime-200';
const grid=document.getElementById('gameGrid'),stage=document.getElementById('stage'),play=document.getElementById('play'),meta=document.getElementById('gameMeta'),ageBar=document.getElementById('ageBar'),close=document.getElementById('closeGame');
if(!grid||!stage||!play||!meta||!ageBar)throw new Error('Mundo Mimo V610 adaptation DOM missing');
let currentGameId=null,roundHadError=false,lastSession=null;
function readRuntime(){try{const x=JSON.parse(localStorage.getItem(RUNTIME_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function stats(id){const g=readRuntime().games?.[id]||{};return{plays:Number.isInteger(g.plays)?g.plays:0,success:Number.isInteger(g.success)?g.success:0}}
function currentAge(){return ageBar.querySelector('[aria-pressed="true"]')?.dataset.age||null}
function session(id=currentGameId){if(!id)return null;const g=R.allGames().find(x=>x.id===id);if(!g)return null;const selected=currentAge(),age=selected&&g.ages.includes(selected)?selected:g.ages[0];return D.session(id,age)}
function syncMeta(){const s=session();if(!s)return null;const g=R.allGames().find(x=>x.id===s.gameId);if(!g)return null;meta.textContent=`${g.area} · ${g.skill} · ${s.activity.label} · Nivel ${s.level.number}/36`;stage.dataset.adaptiveGame=s.gameId;stage.dataset.adaptiveLevel=String(s.level.number);stage.dataset.adaptiveActivity=s.activity.mode;lastSession=s;return s}
function begin(id){if(!R.allGames().some(g=>g.id===id))return null;currentGameId=id;roundHadError=false;queueMicrotask(syncMeta);return session(id)}
function record(ok){if(!currentGameId)return null;const p=D.recordOutcome(currentGameId,Boolean(ok));syncMeta();return p}
// V430 owns the first bubble listener on the final grid and opens the game. V610 listens
// afterwards in the same phase, so its adaptive metadata is applied after V430 writes the
// base area/skill metadata. This keeps one deterministic event path with no retry or timer.
grid.addEventListener('click',e=>{const card=e.target.closest('[data-game]');if(card&&grid.contains(card))begin(card.dataset.game)});
stage.addEventListener('click',e=>{
  if(!currentGameId||!play.contains(e.target))return;
  // Observe gameplay in bubble phase. Native/DOM0 handlers on the actionable target run
  // before this ancestor listener, so both incorrect feedback and synchronous V430 persist()
  // are already visible here. Capture-phase observation ran too early in WebKit and silently
  // missed assisted rounds such as a wrong gesture followed by the correct gesture.
  const actionable=e.target.closest('button,[role="button"],input,select,[data-choice],[data-target],[data-answer],[data-gesture]');
  if(!actionable)return;
  const id=currentGameId,before=stats(id),feedback=document.getElementById('feedback'),beforeFeedback=feedback?.textContent||'';
  queueMicrotask(()=>{
    if(currentGameId!==id)return;
    const after=stats(id),finished=after.plays>before.plays;
    if(finished){const runtimeSuccess=after.success>before.success;record(runtimeSuccess&&!roundHadError);roundHadError=false;return}
    const afterFeedback=feedback?.textContent||'';
    if(afterFeedback&&afterFeedback!==beforeFeedback)roundHadError=true;
  });
});
close?.addEventListener('click',()=>queueMicrotask(()=>{if(stage.hidden){currentGameId=null;roundHadError=false;lastSession=null;delete stage.dataset.adaptiveGame;delete stage.dataset.adaptiveLevel;delete stage.dataset.adaptiveActivity}}),true);
const API=Object.freeze({version:VERSION,begin,session,record,current:()=>currentGameId,lastSession:()=>lastSession,syncMeta});
globalThis.MundoMimoV2AdaptationV610=API;
})();