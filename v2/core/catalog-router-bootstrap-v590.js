(()=>{'use strict';
// V590 owns catalog activation before historical handlers. Pointer activation is
// routed on pointerup, but the stage scroll is deferred until after the synthetic
// click so WebKit cannot retarget that click onto a different card. Keyboard/AT
// activation keeps the click path. composedPath keeps nested/cloned cards routable.
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
  const launched=dispatcher.startGame(id,{deferScroll:source==='pointerup'});
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
  // A completed pointer launch owns its immediately following synthetic click.
  // Consume it before resolving its target: defensive against engines that still
  // retarget after layout changes. Keyboard/AT clicks have detail===0.
  if(pointerLaunch&&event.detail>0&&performance.now()-pointerLaunch.at<1200){
    pointerLaunch=null;
    event.stopImmediatePropagation();
    return;
  }
  const button=cardFrom(event);
  if(!button)return;
  route(event,'click');
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
