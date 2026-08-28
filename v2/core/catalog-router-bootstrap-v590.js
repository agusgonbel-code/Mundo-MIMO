(()=>{'use strict';
// V590 owns catalog activation before historical handlers. Pointer activation is
// routed on pointerup: the gesture has completed, so opening the stage cannot
// intercept the remaining pointer sequence (the pointerdown regression), while
// we still beat all legacy click handlers. Keyboard/assistive activation keeps
// the click fallback. composedPath keeps nested/cloned cards routable.
let lastIntent=null;
let pointerLaunch=null;
function cardFrom(event){
  const grid=document.getElementById('gameGrid');
  if(!grid)return null;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const button=path.find(node=>node?.nodeType===1&&node.matches?.('[data-game]'))||event.target?.closest?.('[data-game]');
  return button&&grid.contains(button)?button:null;
}
function route(event,source){
  const button=cardFrom(event);
  if(!button)return false;
  const id=button.dataset.game;
  lastIntent={id,source,at:performance.now()};
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher?.startGame)return false;
  const launched=dispatcher.startGame(id);
  if(launched)event.stopImmediatePropagation();
  return launched;
}
window.addEventListener('pointerup',event=>{
  if(event.isPrimary===false||event.button>0)return;
  const button=cardFrom(event);
  if(!button)return;
  const id=button.dataset.game;
  if(route(event,'pointerup'))pointerLaunch={id,at:performance.now()};
},{capture:true});
window.addEventListener('click',event=>{
  const button=cardFrom(event);
  if(!button)return;
  const id=button.dataset.game;
  // A successful pointerup already launched this card. Consume the follow-up
  // click so historical click listeners cannot undo/replace the active stage.
  if(pointerLaunch&&pointerLaunch.id===id&&performance.now()-pointerLaunch.at<1200){
    pointerLaunch=null;
    event.stopImmediatePropagation();
    return;
  }
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
