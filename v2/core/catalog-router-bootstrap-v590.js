(()=>{'use strict';
// V590 centralizes catalog activation on the browser's canonical click event.
// Pointer/mouse down/up are observed only to guard gesture continuity; they never
// mutate the game DOM. This lets WebKit complete its native activation sequence
// before a game replaces or scrolls UI, which also protects the child's first
// interaction after launch. Keyboard activation reaches the same click path.
let lastIntent=null;
let claimedGesture=null;
function cardFrom(event){
  const grid=document.getElementById('gameGrid');
  if(!grid)return null;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const button=path.find(node=>node?.nodeType===1&&node.matches?.('[data-game]'))||event.target?.closest?.('[data-game]');
  return button&&grid.contains(button)?button:null;
}
function launchId(id,source){
  if(!id)return false;
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher?.startGame)return false;
  const launched=dispatcher.startGame(id);
  if(!launched)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
function claim(event,pointerId){
  if(event.isPrimary===false||event.button>0)return false;
  const button=cardFrom(event);
  if(!button)return false;
  claimedGesture={id:button.dataset.game,pointerId};
  return true;
}
function matchesClaim(event,button){
  const claim=claimedGesture;
  if(!claim)return true;
  const samePointer=claim.pointerId==null||event.pointerId==null||claim.pointerId===event.pointerId;
  return samePointer&&claim.id===button.dataset.game;
}
window.addEventListener('pointerdown',event=>{
  claimedGesture=null;
  claim(event,event.pointerId);
},{capture:true});
window.addEventListener('mousedown',event=>{
  // Pointer-capable browsers emit mousedown after pointerdown; mouse-only paths
  // claim here. Neither event is cancelled and neither opens a game.
  if(!claimedGesture)claim(event,null);
},{capture:true});
window.addEventListener('pointercancel',()=>{claimedGesture=null},{capture:true});
window.addEventListener('click',event=>{
  const button=cardFrom(event);
  if(!button)return;
  // Keyboard/assistive activation (detail=0) is canonical even without a claim.
  // Physical clicks must either match the claimed card or arrive without a claim.
  if(event.detail!==0&&!matchesClaim(event,button)){
    claimedGesture=null;
    return;
  }
  const id=button.dataset.game;
  claimedGesture=null;
  if(launchId(id,'click')){
    // The centralized owner has launched exactly once; suppress historical
    // catalog click owners only after successful dispatch.
    event.preventDefault();
    event.stopImmediatePropagation();
  }
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();