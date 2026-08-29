(()=>{'use strict';
// V593 is loaded before every historical runtime. Capture records only completed
// catalog-game click intents before any later listener can stop propagation.
// Finalization is queued as a microtask: it runs only after the synchronous click
// dispatch has completed, but does not depend on a future animation frame. V590
// already replaces ageBar/gameGrid with listener-free canonical nodes, so there is
// no reason to postpone a completed activation to the next rendering frame.
// No timers, retries, preventDefault or propagation suppression are used here.
//
// Adult-gate controls are deliberately NOT routed here. V520 owns their submit
// target directly; routing the same click through this queue would create a second
// activation path and can overwrite the truthful invalid-answer state.
let lastIntent=null;
const pending=[];
let sequence=0;
let flushScheduled=false;
function flush(){
  flushScheduled=false;
  const batch=pending.splice(0,pending.length);
  for(const intent of batch){
    if(intent.kind==='game')globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:'click'});
  }
  if(pending.length)scheduleFlush();
}
function scheduleFlush(){
  if(flushScheduled)return;
  flushScheduled=true;
  queueMicrotask(flush);
}
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function queueIntent(intent){
  pending.push({...intent,sequence:++sequence});
  scheduleFlush();
}
window.addEventListener('click',event=>{
  const target=event.target;
  const game=target?.closest?.('[data-game]');
  if(game?.dataset?.game)queueIntent({kind:'game',id:game.dataset.game});
},true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:593,
  recordLaunch,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return pending.length;},
  get flushScheduled(){return flushScheduled;}
});
})();
