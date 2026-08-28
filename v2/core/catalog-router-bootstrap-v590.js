(()=>{'use strict';
// V590 installs the catalog intent listener before any historical runtime can
// register capture-phase click handlers. The actual dispatcher is resolved only
// after all runtimes have loaded, so this bootstrap has no runtime dependency.
let lastIntent=null;
window.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-game]');
  if(!button||!document.getElementById('gameGrid')?.contains(button))return;
  const id=button.dataset.game;
  lastIntent={id,at:performance.now()};
  queueMicrotask(()=>{
    const dispatcher=globalThis.MundoMimoV2Performance;
    if(!dispatcher||dispatcher.lastStartedId===id)return;
    dispatcher.startGame(id);
  });
},{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
