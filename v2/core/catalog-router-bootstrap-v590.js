(()=>{'use strict';
// V593 is loaded before every historical runtime. Capture records only completed
// catalog-game click intents before any later listener can stop propagation.
// Finalization uses a same-window postMessage task. This is a single deterministic
// post-dispatch boundary, not a retry: it runs after the trusted click dispatch has
// finished without depending on timer scheduling, requestAnimationFrame or
// MessageChannel behavior in WebKit.
//
// Adult-gate controls are deliberately NOT routed here. V520 owns their submit
// target directly; routing the same click through this queue would create a second
// activation path and can overwrite the truthful invalid-answer state.
let lastIntent=null;
const pending=[];
let sequence=0;
let flushScheduled=false;
const FLUSH_SOURCE='mundo-mimo-v593-router';
const FLUSH_TOKEN=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  window.postMessage({source:FLUSH_SOURCE,token:FLUSH_TOKEN},location.origin);
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
window.addEventListener('message',event=>{
  if(event.source!==window||event.origin!==location.origin)return;
  const data=event.data;
  if(!data||data.source!==FLUSH_SOURCE||data.token!==FLUSH_TOKEN)return;
  flush();
});
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
