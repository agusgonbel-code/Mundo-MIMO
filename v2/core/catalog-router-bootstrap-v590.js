(()=>{'use strict';
// V590 owns catalog activation at the earliest capture point. Historical
// runtimes may still observe unrelated UI events, but they must never be able
// to mutate the stage before the canonical owner has handled a game card.
let lastIntent=null;
window.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button||!document.getElementById('gameGrid')?.contains(button))return;
  const id=button.dataset.game;
  lastIntent={id,at:performance.now()};
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher)return;
  if(dispatcher.lastStartedId===id){
    event.stopImmediatePropagation();
    return;
  }
  if(dispatcher.startGame(id))event.stopImmediatePropagation();
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
