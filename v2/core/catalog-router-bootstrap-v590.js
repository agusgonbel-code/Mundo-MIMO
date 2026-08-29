(()=>{'use strict';
// V590 is loaded before every historical runtime. That makes window/capture here the
// only stable place that cannot be pre-empted by listeners installed later on
// document, grids or cards. We observe the completed click intent without cancelling
// it, then finalize the canonical action in a microtask after every synchronous click
// side effect has finished. No pointerdown/up activation, preventDefault,
// stopPropagation, timers, retries or tolerance windows are used.
let lastIntent=null;
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function markScheduled(event){
  if(event.__mimoV590Scheduled)return false;
  try{Object.defineProperty(event,'__mimoV590Scheduled',{value:true,configurable:true})}
  catch{if(event.__mimoV590Scheduled)return false;event.__mimoV590Scheduled=true}
  return true;
}
function finalizeClick(event){
  const target=event.target;
  const game=target?.closest?.('[data-game]');
  if(game){
    const id=game.dataset.game;
    if(!id||!markScheduled(event))return;
    queueMicrotask(()=>globalThis.MundoMimoV2Performance?.startGame?.(id,{deferScroll:true}));
    return;
  }
  const parentSubmit=target?.closest?.('[data-parent-submit]');
  if(parentSubmit){
    if(!markScheduled(event))return;
    queueMicrotask(()=>globalThis.MundoMimoV2ParentV520?.submit?.());
  }
}
window.addEventListener('click',finalizeClick,true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:592,
  recordLaunch,
  get lastIntent(){return lastIntent;}
});
})();