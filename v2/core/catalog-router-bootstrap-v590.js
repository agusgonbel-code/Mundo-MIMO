(()=>{'use strict';
// V593 is loaded before every historical runtime. It observes a catalog click in
// capture, then installs completion listeners on the *current event path*. Those
// listeners are appended after listeners that already exist on each node. The
// canonical launch therefore runs after stale historical side effects without a
// timer, microtask, requestAnimationFrame, MessageChannel or retry.
//
// If propagation is stopped, the completion listener on that same node still runs
// (stopPropagation does not suppress later listeners on the current node) and
// finalizes there. Otherwise document is the terminal completion boundary. Adult
// gate controls remain outside this router; V520 is their single owner.
let lastIntent=null;
let pendingCount=0;
let sequence=0;

function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}

function armCompletedClick(event,id){
  if(!id)return;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  const nodes=path.filter(node=>node&&typeof node.addEventListener==='function'&&node!==window);
  if(!nodes.includes(document))nodes.push(document);
  let finished=false;
  const listeners=[];
  pendingCount+=1;
  const intent={kind:'game',id,sequence:++sequence};

  const cleanup=()=>{
    for(const [node,listener] of listeners)node.removeEventListener('click',listener,false);
  };
  const finish=()=>{
    if(finished)return;
    finished=true;
    cleanup();
    pendingCount=Math.max(0,pendingCount-1);
    globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:'click'});
  };

  for(const node of nodes){
    const listener=current=>{
      if(current!==event||finished)return;
      if(current.cancelBubble||node===document)finish();
    };
    listeners.push([node,listener]);
    node.addEventListener('click',listener,false);
  }
}

window.addEventListener('click',event=>{
  const game=event.target?.closest?.('[data-game]');
  if(game?.dataset?.game)armCompletedClick(event,game.dataset.game);
},true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:593,
  recordLaunch,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return pendingCount;},
  get flushScheduled(){return false;}
});
})();
