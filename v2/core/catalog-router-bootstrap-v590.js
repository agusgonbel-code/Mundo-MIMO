(()=>{'use strict';
// V590 owns catalog activation at the earliest click capture point. We wait for
// the complete activation gesture (instead of mutating the DOM on pointerdown),
// then route synchronously before historical document/grid click handlers can
// change the stage. composedPath keeps routing stable for nested/cloned cards.
let lastIntent=null;
function cardFrom(event){
  const grid=document.getElementById('gameGrid');
  if(!grid)return null;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const button=path.find(node=>node?.nodeType===1&&node.matches?.('[data-game]'))||event.target?.closest?.('[data-game]');
  return button&&grid.contains(button)?button:null;
}
window.addEventListener('click',event=>{
  const button=cardFrom(event);
  if(!button)return;
  const id=button.dataset.game;
  lastIntent={id,source:'click',at:performance.now()};
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher)return;
  if(dispatcher.startGame(id))event.stopImmediatePropagation();
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
