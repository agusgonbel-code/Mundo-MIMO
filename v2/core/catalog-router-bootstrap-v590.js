(()=>{'use strict';
// V590 owns catalog activation before historical handlers. A physical gesture is
// claimed on down and completed once on the first matching terminal event. The
// compatibility click guard is target-scoped: it can only consume the synthetic
// click for the same catalog card, never a later gameplay or parent-zone action.
let lastIntent=null;
let pointerGesture=null;
let pendingCompatibilityId=null;
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
  // Pointer/mouse activation must not synchronously scroll the stage before the
  // browser has finished synthesising the corresponding click. That layout shift
  // can detach/move the card mid-activation in WebKit. The dispatcher already
  // supports deferred scrolling specifically for this case.
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
  pendingCompatibilityId=source==='click'?null:gesture.id;
  return true;
}
function claimFromDown(event,pointerId){
  if(event.isPrimary===false||event.button>0)return false;
  const button=cardFrom(event);
  if(!button)return false;
  pointerGesture={id:button.dataset.game,pointerId};
  pendingCompatibilityId=null;
  event.stopImmediatePropagation();
  return true;
}
window.addEventListener('pointerdown',event=>{
  pointerGesture=null;
  pendingCompatibilityId=null;
  claimFromDown(event,event.pointerId);
},{capture:true});
window.addEventListener('mousedown',event=>{
  // Pointer-capable browsers emit mousedown after pointerdown. Keep the existing
  // ownership; mouse-only WebKit paths claim here instead.
  if(pointerGesture){event.stopImmediatePropagation();return;}
  claimFromDown(event,null);
},{capture:true});
window.addEventListener('pointerup',event=>{finishClaimedGesture(event,'pointerup')},{capture:true});
window.addEventListener('mouseup',event=>{finishClaimedGesture(event,'mouseup')},{capture:true});
window.addEventListener('pointercancel',()=>{pointerGesture=null;pendingCompatibilityId=null},{capture:true});
window.addEventListener('click',event=>{
  if(event.detail===0){
    pendingCompatibilityId=null;
    route(event,'click');
    return;
  }
  if(pendingCompatibilityId){
    const button=cardFrom(event);
    const isCompatibilityClick=button?.dataset.game===pendingCompatibilityId;
    pendingCompatibilityId=null;
    if(isCompatibilityClick){
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
  if(pointerGesture){
    finishClaimedGesture(event,'click');
    return;
  }
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();