(()=>{'use strict';
// V593 is loaded before every historical runtime. It records catalog activations
// in capture and completes them in one post-dispatch task. This boundary is
// deliberate: every synchronous historical click side effect and the browser's
// normal propagation/default-action phase finish before the canonical owner runs.
// Each activation is queued once, FIFO, with no retry or tolerance path.
const queue=[];
let scheduled=false;
let lastIntent=null;
let sequence=0;

function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}

function flush(){
  scheduled=false;
  while(queue.length){
    const intent=queue.shift();
    globalThis.MundoMimoV2Performance?.startGame?.(intent.id,{deferScroll:true,source:intent.source});
  }
}

function enqueue(id,source='click'){
  if(!id)return false;
  queue.push({kind:'game',id,source,sequence:++sequence});
  if(!scheduled){
    scheduled=true;
    setTimeout(flush,0);
  }
  return true;
}

window.addEventListener('click',event=>{
  const game=event.target?.closest?.('[data-game]');
  if(game?.dataset?.game)enqueue(game.dataset.game,'click');
},true);

globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:593,
  recordLaunch,
  get lastIntent(){return lastIntent;},
  get pendingCount(){return queue.length;},
  get flushScheduled(){return scheduled;}
});
})();
