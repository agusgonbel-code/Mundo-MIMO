(()=>{'use strict';
// V590 is loaded before every historical runtime. Capture records only completed
// catalog-game click intents before any later listener can stop propagation.
// Finalization is posted through MessageChannel so it runs as a task after the whole
// synchronous click dispatch has finished; this avoids microtask interleaving between
// listeners without timers, retries, preventDefault or propagation suppression.
//
// Adult-gate controls are deliberately NOT routed here. V520/V591 own their submit
// target directly; routing the same click through this queue would create a second
// activation path and can overwrite the truthful invalid-answer state.
let lastIntent=null;
const pending=[];
let sequence=0;
const channel=new MessageChannel();
channel.port1.onmessage=()=>{
  const intent=pending.shift();
  if(!intent)return;
  if(intent.kind==='game')globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:'click'});
};
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function queueIntent(intent){
  pending.push({...intent,sequence:++sequence});
  channel.port2.postMessage(sequence);
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
  get pendingCount(){return pending.length;}
});
})();
