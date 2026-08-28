(()=>{'use strict';
// V590 owns catalog activation before historical handlers. A physical gesture is
// claimed on down and completed exactly once on the first matching terminal event.
// Historical runtimes can still own the game implementation; only activation is
// centralized here so transient catalog nodes do not create duplicate launches.
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
  if(!gesture){
    // pointerup is followed by mouseup in pointer-capable browsers. Once the
    // pointer terminal event launched successfully, suppress only that alias.
    if(pendingCompatibilityId){event.stopImmediatePropagation();return true;}
    return false;
  }
  const id=gesture.id;
  pointerGesture=null;
  const launched=launchId(id,source,true);
  if(!launched){
    // Keep ownership for the browser compatibility click if the dispatcher is
    // not yet able to accept this game. This is event fallback, never a retry.
    pointerGesture={id,pointerId:null};
    return false;
  }
  pendingCompatibilityId=id;
  event.stopImmediatePropagation();
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
  // claim; mouse-only WebKit paths claim here instead.
  if(pointerGesture){event.stopImmediatePropagation();return;}
  claimFromDown(event,null);
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
      // The matching up already launched exactly once. The click merely closes
      // the browser activation transaction and records its settled source.
      if(lastIntent?.id===button.dataset.game){lastIntent={id:lastIntent.id,source:'click',at:performance.now()}}
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