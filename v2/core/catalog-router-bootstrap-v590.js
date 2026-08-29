(()=>{'use strict';
// V593 is loaded before every historical runtime. Capture records only completed
// catalog-game click intents before any later listener can stop propagation.
// Finalization is scheduled once on the next animation frame so every synchronous
// click listener has finished before the canonical game mutates the stage. This also
// follows the same WebKit frame lifecycle as trusted iPhone/iPad pointer activation,
// avoiding the MessageChannel divergence observed in CI. No timers, retries,
// preventDefault or propagation suppression are used.
//
// Adult-gate controls are deliberately NOT routed here. V520 owns their submit
// target directly; routing the same click through this queue would create a second
// activation path and can overwrite the truthful invalid-answer state.
let lastIntent=null;
const pending=[];
let sequence=0;
let frameScheduled=false;
function flush(){
  frameScheduled=false;
  const batch=pending.splice(0,pending.length);
  for(const intent of batch){
    if(intent.kind==='game')globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:'click'});
  }
  if(pending.length)scheduleFlush();
}
function scheduleFlush(){
  if(frameScheduled)return;
  frameScheduled=true;
  requestAnimationFrame(flush);
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
  get frameScheduled(){return frameScheduled;}
});
})();
