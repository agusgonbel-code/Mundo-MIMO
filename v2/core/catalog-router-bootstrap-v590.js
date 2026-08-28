(()=>{'use strict';
// V590 owns catalog activation before historical click handlers. Physical input
// is claimed on down and may launch on up, but non-cancelled down/up propagation
// is preserved so WebKit can complete its native activation sequence reliably.
// The matching compatibility click is the only event suppressed, preventing the
// historical onclick owner from launching the same game twice.
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
function launchId(id,source,deferScroll){
  if(!id)return false;
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher?.startGame)return false;
  const launched=dispatcher.startGame(id,{deferScroll});
  if(!launched)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function routeId(id,event,source){
  const launched=launchId(id,source,source!=='click');
  if(launched&&source==='click')event.stopImmediatePropagation();
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
function finishClaimedGesture(event,source){
  if(event.isPrimary===false||event.button>0)return false;
  const gesture=matchingGesture(event);
  if(!gesture)return false;
  const id=gesture.id;
  pointerGesture=null;
  const launched=launchId(id,source,true);
  if(!launched){
    // Ownership remains available for the browser's compatibility click if the
    // dispatcher could not yet accept the game. This is an event fallback only.
    pointerGesture={id,pointerId:null};
    return false;
  }
  pendingCompatibilityId=id;
  return true;
}
function claimFromDown(event,pointerId){
  if(event.isPrimary===false||event.button>0)return false;
  const button=cardFrom(event);
  if(!button)return false;
  pointerGesture={id:button.dataset.game,pointerId};
  pendingCompatibilityId=null;
  return true;
}
window.addEventListener('pointerdown',event=>{
  pointerGesture=null;
  pendingCompatibilityId=null;
  claimFromDown(event,event.pointerId);
},{capture:true});
window.addEventListener('mousedown',event=>{
  // Pointer-capable browsers emit mousedown after pointerdown. Keep that claim;
  // mouse-only WebKit paths claim here instead. Do not cancel either event.
  if(!pointerGesture)claimFromDown(event,null);
},{capture:true});
window.addEventListener('pointerup',event=>{finishClaimedGesture(event,'pointerup')},{capture:true});
window.addEventListener('mouseup',event=>{finishClaimedGesture(event,'mouseup')},{capture:true});
window.addEventListener('pointercancel',()=>{pointerGesture=null;pendingCompatibilityId=null},{capture:true});
window.addEventListener('click',event=>{
  if(event.detail===0){
    pendingCompatibilityId=null;
    pointerGesture=null;
    route(event,'click');
    return;
  }
  if(pendingCompatibilityId){
    const button=cardFrom(event);
    const isCompatibilityClick=button?.dataset.game===pendingCompatibilityId;
    pendingCompatibilityId=null;
    if(isCompatibilityClick){
      // The matching up already launched exactly once. Suppress only this click
      // so historical onclick handlers cannot relaunch the same card.
      if(lastIntent?.id===button.dataset.game)lastIntent={id:lastIntent.id,source:'click',at:performance.now()};
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
  if(pointerGesture){
    const id=pointerGesture.id;
    pointerGesture=null;
    if(routeId(id,event,'click'))return;
  }
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();