(()=>{'use strict';
// V590 owns catalog activation before historical handlers. Pointer activation is
// deliberately a two-phase gesture: pointerdown claims the card without opening the
// stage; pointerup launches exactly the card captured at gesture start. Some WebKit
// automation/native mouse bridges can finish the same physical gesture with mouseup
// when no usable pointerup reaches the page, so mouseup is an alternate completion
// event for the already-claimed gesture, never a retry: the first completion clears
// ownership and every later completion becomes a no-op. We do not cancel pointerdown's
// default action. After a successful completion we consume exactly the compatibility
// click from that gesture. Any new pointerdown clears both stale ownership and that
// marker before resolving its target, so a genuine child action can never be swallowed.
// Keyboard/AT remains on the native click path (detail===0).
let lastIntent=null;
let pointerGesture=null;
let pendingCompatibilityClick=false;
function cardFrom(event){
  const grid=document.getElementById('gameGrid');
  if(!grid)return null;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const button=path.find(node=>node?.nodeType===1&&node.matches?.('[data-game]'))||event.target?.closest?.('[data-game]');
  return button&&grid.contains(button)?button:null;
}
function routeId(id,event,source){
  if(!id)return false;
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher?.startGame)return false;
  lastIntent={id,source,at:performance.now()};
  const launched=dispatcher.startGame(id,{deferScroll:source==='pointerup'});
  if(launched)event.stopImmediatePropagation();
  return launched;
}
function route(event,source){
  const button=cardFrom(event);
  return button?routeId(button.dataset.game,event,source):false;
}
function matchingGesture(event){
  const gesture=pointerGesture;
  if(!gesture)return null;
  const samePointer=gesture.pointerId==null||event.pointerId==null||gesture.pointerId===event.pointerId;
  return samePointer?gesture:null;
}
function finishClaimedGesture(event){
  if(event.isPrimary===false||event.button>0)return false;
  const gesture=matchingGesture(event);
  if(!gesture)return false;
  pointerGesture=null;
  const launched=routeId(gesture.id,event,'pointerup');
  if(launched)pendingCompatibilityClick=true;
  return launched;
}
window.addEventListener('pointerdown',event=>{
  // A new physical action invalidates all state belonging to a previous action,
  // including a missing compatibility click from an already completed gesture.
  pointerGesture=null;
  pendingCompatibilityClick=false;
  if(event.isPrimary===false||event.button>0)return;
  const button=cardFrom(event);
  if(!button)return;
  pointerGesture={id:button.dataset.game,pointerId:event.pointerId};
  event.stopImmediatePropagation();
},{capture:true});
window.addEventListener('pointerup',event=>{finishClaimedGesture(event)},{capture:true});
window.addEventListener('mouseup',event=>{finishClaimedGesture(event)},{capture:true});
window.addEventListener('pointercancel',()=>{pointerGesture=null;pendingCompatibilityClick=false},{capture:true});
window.addEventListener('click',event=>{
  if(event.detail===0){route(event,'click');return;}
  if(pendingCompatibilityClick){
    pendingCompatibilityClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if(pointerGesture)return;
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();