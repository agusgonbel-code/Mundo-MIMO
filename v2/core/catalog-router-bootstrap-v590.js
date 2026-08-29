(()=>{'use strict';
// V593 is loaded before every historical runtime. Historical runtimes keep their
// game implementations, but V590 replaces the visible catalog nodes. The router
// owns exactly one capture-phase activation on the live document path.
//
// WebKit can become unstable when a historical owner calls scrollIntoView() while
// the physical click is still being dispatched. Activation therefore remains
// synchronous and exactly-once, while only the viewport scroll is deferred by the
// V590 dispatcher. No retry, preventDefault or propagation suppression is used.
let lastIntent=null;
let sequence=0;
let launchCount=0;

function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,sequence:++sequence,at:performance.now()};
  launchCount++;
  return true;
}

function activate(id,source='click'){
  if(!id)return false;
  const dispatcher=globalThis.MundoMimoV2Performance;
  if(!dispatcher||typeof dispatcher.startGame!=='function')return false;
  return Boolean(dispatcher.startGame(id,{source,deferScroll:true}));
}

window.addEventListener('click',event=>{
  const game=event.target?.closest?.('[data-game]');
  if(game?.dataset?.game)activate(game.dataset.game,'click');
},true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:593,
  recordLaunch,
  activate,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return 0;},
  get flushScheduled(){return false;},
  get launchCount(){return launchCount;}
});
})();
