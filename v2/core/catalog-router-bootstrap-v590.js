(()=>{'use strict';
// V594 keeps the historical runtimes as game owners but moves canonical activation
// to the actual game-card target. Mutating the stage from a window capture listener
// proved unreliable in WebKit because it changed the live UI before the physical
// click had reached its target. Each live card now owns one DOM0 click handler that
// delegates to V590. A document observer rebinds cards created or cloned later.
// No retry, preventDefault, stopPropagation, timer or scheduler is used to launch.
let lastIntent=null;
let sequence=0;
let launchCount=0;
const BOUND=Symbol('mimo-v594-bound');

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

function bindCard(card){
  if(!card?.dataset?.game||card[BOUND])return false;
  card[BOUND]=true;
  card.onclick=()=>activate(card.dataset.game,'click');
  return true;
}

function bind(root=document){
  if(root?.matches?.('[data-game]'))bindCard(root);
  root?.querySelectorAll?.('[data-game]').forEach(bindCard);
}

const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)bind(node);
});
observer.observe(document.documentElement,{subtree:true,childList:true});
bind(document);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:594,
  recordLaunch,
  activate,
  bind,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return 0;},
  get flushScheduled(){return false;},
  get launchCount(){return launchCount;}
});
})();
