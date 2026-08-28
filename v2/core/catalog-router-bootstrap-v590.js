(()=>{'use strict';
// V590 keeps catalog activation on the live game grid created by performance-v590.
// Historical runtimes attach handlers to the pre-V590 grid; performance-v590 replaces
// that node, so a second window-level activation owner is both unnecessary and unsafe.
// This bootstrap now records confirmed launches only. It never cancels pointer/mouse/
// click events and therefore cannot prevent the live grid owner from receiving them.
let lastIntent=null;
function recordLaunch(id,source='click'){
  if(!id)return false;
  lastIntent={id,source,at:performance.now()};
  return true;
}
globalThis.MundoMimoV2CatalogRouterBootstrap=Object.freeze({
  version:590,
  recordLaunch,
  get lastIntent(){return lastIntent;}
});
})();