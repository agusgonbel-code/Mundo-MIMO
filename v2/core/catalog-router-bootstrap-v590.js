(()=>{'use strict';
// V590 is loaded before every historical runtime. Capture records the browser's
// completed click intent before any later listener can stop propagation. Finalization
// is posted through MessageChannel so it runs as a task after the whole synchronous
// click dispatch has finished; this avoids microtask interleaving between listeners
// without timers, retries, preventDefault or propagation suppression.
let lastIntent=null;
let pending=null;
let sequence=0;
const channel=new MessageChannel();
channel.port1.onmessage=()=>{
  const intent=pending;
  pending=null;
  if(!intent)return;
  if(intent.kind==='game')globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:'click'});
  else if(intent.kind==='parent')globalThis.MundoMimoV2ParentV520?.submit?.();
};
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function queueIntent(intent){
  pending={...intent,sequence:++sequence};
  channel.port2.postMessage(sequence);
}
window.addEventListener('click',event=>{
  const target=event.target;
  const game=target?.closest?.('[data-game]');
  if(game?.dataset?.game){queueIntent({kind:'game',id:game.dataset.game});return;}
  if(target?.closest?.('[data-parent-submit]'))queueIntent({kind:'parent'});
},true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:592,
  recordLaunch,
  get lastIntent(){return lastIntent;}
});
})();