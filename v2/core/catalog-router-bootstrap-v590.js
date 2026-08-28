(()=>{'use strict';
// V590 owns catalog activation at the earliest input point. Pointer activation
// launches before historical click handlers can mutate the stage; click remains
// the keyboard/assistive fallback. A confirmed pointer launch consumes the
// following click so a game can never start twice from one user action.
let lastIntent=null;
let pointerLaunch=null;
function cardFrom(event){
  const grid=document.getElementById('gameGrid');
  if(!grid)return null;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const button=path.find(node=>node?.nodeType===1&&node.matches?.('[data-game]'))||event.target?.closest?.('[data-game]');
  return button&&grid.contains(button)?button:null;
}
function launch(event,source){
  const button=cardFrom(event);
  if(!button)return false;
  const id=button.dataset.game;
  lastIntent={id,source,at:performance.now()};
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher)return false;
  if(source==='click'&&pointerLaunch?.id===id){
    const age=pointerLaunch.age;
    pointerLaunch=null;
    if(age===dispatcher.age&&dispatcher.lastStartedId===id){
      event.stopImmediatePropagation();
      return true;
    }
  }
  if(dispatcher.startGame(id)){
    if(source==='pointer')pointerLaunch={id,age:dispatcher.age};
    event.stopImmediatePropagation();
    return true;
  }
  return false;
}
window.addEventListener('pointerdown',event=>{if(event.isPrimary!==false)launch(event,'pointer')},{capture:true});
window.addEventListener('click',event=>launch(event,'click'),{capture:true});
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({version:590,get lastIntent(){return lastIntent;}});
})();
