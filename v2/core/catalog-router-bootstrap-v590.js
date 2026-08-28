(()=>{'use strict';
// V590 owns catalog activation before historical handlers. Pointer activation is
// deliberately a two-phase gesture: pointerdown claims the card without opening the
// stage; pointerup launches exactly the card captured at gesture start. Cancelling
// pointerdown suppresses browser compatibility mouse/click synthesis for that primary
// pointer, so no synthetic-click guard can consume the child's first gameplay action.
// Keyboard/AT activation remains on the native click path (detail===0).
let lastIntent=null;
let pointerGesture=null;
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
window.addEventListener('pointerdown',event=>{
  if(event.isPrimary===false||event.button>0)return;
  const button=cardFrom(event);
  if(!button)return;
  pointerGesture={id:button.dataset.game,pointerId:event.pointerId};
  // Prevent compatibility mouse/click synthesis for this pointer activation. This is
  // deterministic event ownership, not a timing guard or retry. The card is still
  // keyboard-focusable and keyboard/AT click activation is handled below.
  event.preventDefault();
  event.stopImmediatePropagation();
},{capture:true});
window.addEventListener('pointerup',event=>{
  if(event.isPrimary===false||event.button>0)return;
  const gesture=matchingGesture(event);
  if(!gesture)return;
  pointerGesture=null;
  event.preventDefault();
  routeId(gesture.id,event,'pointerup');
},{capture:true});
window.addEventListener('pointercancel',()=>{pointerGesture=null},{capture:true});
window.addEventListener('click',event=>{
  // A primary pointer activation is owned by pointerdown/pointerup above. Native
  // keyboard and assistive-technology activation produces detail===0 and keeps the
  // standard click path. A non-suppressed pointer click is routed only when no V590
  // pointer gesture is active, preserving compatibility without duplicate launch.
  if(event.detail===0){route(event,'click');return;}
  if(pointerGesture)return;
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
