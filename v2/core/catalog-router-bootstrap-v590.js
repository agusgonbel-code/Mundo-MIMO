(()=>{'use strict';
// V595 keeps the historical runtimes as game owners but makes canonical activation
// independent from the mutable DOM0 `onclick` slot used by historical runtimes.
// Every live card gets one target-side EventTarget listener, tracked by an internal
// symbol. This prevents later DOM0 assignment from replacing canonical ownership.
// A document observer rebinds cards created or cloned later; renderGames still binds
// canonical cards synchronously before yielding. No retry, preventDefault,
// stopPropagation, timer or scheduler is used to launch.
let lastIntent=null;
let sequence=0;
let launchCount=0;
const BOUND=Symbol('mimo-v595-bound');
const HANDLER=Symbol('mimo-v595-handler');

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
  const handler=()=>activate(card.dataset.game,'click');
  card.addEventListener('click',handler);
  card[HANDLER]=handler;
  card[BOUND]=true;
  card.dataset.v595Owner='canonical';
  return true;
}

function isBound(card){
  return Boolean(card?.[BOUND]&&typeof card?.[HANDLER]==='function');
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
  version:595,
  recordLaunch,
  activate,
  bind,
  isBound,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return 0;},
  get flushScheduled(){return false;},
  get launchCount(){return launchCount;}
});
})();
