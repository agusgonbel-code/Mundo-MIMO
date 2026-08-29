(()=>{'use strict';
// Routing bootstrap deliberately does not own DOM click events. The final V590 shell
// replaces the historical grid after every legacy runtime has loaded, so that live
// grid can safely be the single delegated owner of completed browser activation.
// Keeping the bootstrap event-free avoids duplicate/cross-phase launch races while
// preserving launch diagnostics for recovery and QA.
let lastIntent=null;
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:592,
  recordLaunch,
  get lastIntent(){return lastIntent;}
});
})();