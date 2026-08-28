(()=>{'use strict';
// V590 owns catalog activation before historical handlers. Pointer activation is
// deliberately a claimed gesture: pointerdown captures the intended card without
// opening the stage, and the first terminal event that can successfully launch that
// captured id completes the gesture. Native/WebKit may expose pointerup, mouseup or
// the compatibility click as the usable terminal event. This is one gesture state
// machine, not a retry loop: successful completion clears ownership immediately and
// any later compatibility click is consumed exactly once. Keeping the captured id
// until success also makes launch immune to hit-test/scroll retargeting between down
// and click. A new pointerdown invalidates all stale state, so a genuine gameplay
// action can never be swallowed. Keyboard/AT remains on the native click path.
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
  const launched=dispatcher.startGame(id,{deferScroll:source!=='click'});
  if(!launched)return false;
  lastIntent={id,source,at:performance.now()};
  event.stopImmediatePropagation();
  return true;
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
function finishClaimedGesture(event,source){
  if(event.isPrimary===false||event.button>0)return false;
  const gesture=matchingGesture(event);
  if(!gesture)return false;
  const launched=routeId(gesture.id,event,source);
  if(!launched)return false;
  pointerGesture=null;
  pendingCompatibilityClick=source!=='click';
  return true;
}
window.addEventListener('pointerdown',event=>{
  // A new physical action invalidates every remnant of the previous action.
  pointerGesture=null;
  pendingCompatibilityClick=false;
  if(event.isPrimary===false||event.button>0)return;
  const button=cardFrom(event);
  if(!button)return;
  pointerGesture={id:button.dataset.game,pointerId:event.pointerId};
  event.stopImmediatePropagation();
},{capture:true});
window.addEventListener('pointerup',event=>{finishClaimedGesture(event,'pointerup')},{capture:true});
window.addEventListener('mouseup',event=>{finishClaimedGesture(event,'mouseup')},{capture:true});
window.addEventListener('pointercancel',()=>{pointerGesture=null;pendingCompatibilityClick=false},{capture:true});
window.addEventListener('click',event=>{
  if(event.detail===0){route(event,'click');return;}
  if(pendingCompatibilityClick){
    pendingCompatibilityClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  if(pointerGesture){
    finishClaimedGesture(event,'click');
    return;
  }
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();