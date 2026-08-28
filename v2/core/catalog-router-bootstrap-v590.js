(()=>{'use strict';
// V590 owns catalog activation before historical handlers. A physical gesture is
// claimed on down and completed once on the first matching terminal event. The
// actual game start for pointer/mouse up is deferred to the microtask checkpoint:
// WebKit can reject/mis-settle synchronous DOM-moving launches while dispatching
// the up event itself. This is event-ordering, not a retry or timing tolerance.
let lastIntent=null;
let pointerGesture=null;
let pendingCompatibilityId=null;
let pendingLaunch=null;
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
function finishClaimedGesture(event,source){
  if(event.isPrimary===false||event.button>0)return false;
  const gesture=matchingGesture(event);
  if(!gesture)return false;
  // Consume the historical up handlers now, but start after this dispatch has
  // settled. A single token makes pointerup/mouseup aliases idempotent.
  const token={id:gesture.id,source};
  pointerGesture=null;
  pendingLaunch=token;
  pendingCompatibilityId=gesture.id;
  event.stopImmediatePropagation();
  queueMicrotask(()=>{
    if(pendingLaunch!==token)return;
    pendingLaunch=null;
    if(!launchId(token.id,token.source,true)){
      // Preserve the claimed id so the compatibility click can finish the same
      // physical gesture if the owner was not ready at the microtask checkpoint.
      pointerGesture={id:token.id,pointerId:null};
      pendingCompatibilityId=null;
    }
  });
  return true;
}
function claimFromDown(event,pointerId){
  if(event.isPrimary===false||event.button>0)return false;
  const button=cardFrom(event);
  if(!button)return false;
  pointerGesture={id:button.dataset.game,pointerId};
  pendingLaunch=null;
  pendingCompatibilityId=null;
  event.stopImmediatePropagation();
  return true;
}
window.addEventListener('pointerdown',event=>{
  pointerGesture=null;
  pendingLaunch=null;
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
window.addEventListener('pointercancel',()=>{pointerGesture=null;pendingLaunch=null;pendingCompatibilityId=null},{capture:true});
window.addEventListener('click',event=>{
  if(event.detail===0){
    pendingLaunch=null;
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
      // The matching up already launched. Complete the activation transaction
      // without launching twice; source=click denotes the fully settled browser
      // activation while the launch remains exactly-once.
      if(lastIntent?.id===button.dataset.game){lastIntent={id:lastIntent.id,source:'click',at:performance.now()}}
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
  if(pointerGesture){
    const id=pointerGesture.id;
    pointerGesture=null;
    pendingLaunch=null;
    if(routeId(id,event,'click'))return;
  }
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();