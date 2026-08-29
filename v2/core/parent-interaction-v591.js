(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// Keep V520 verification semantics unchanged; only move click ownership to the same
// stable capture boundary used by the catalog. The target onclick is removed so a
// successful or failed answer is evaluated exactly once. Propagation/default action
// remain untouched and keyboard Enter continues to use V520's input handler.
submit.onclick=null;
window.addEventListener('click',event=>{
  const target=event.target?.closest?.('[data-parent-submit]');
  if(target!==submit)return;
  Parent.submit();
},true);

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591});
})();
