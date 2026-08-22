(()=>{'use strict';
const convertNode=node=>{
  const api=globalThis.MundoMimoVisualV110;
  if(!api?.convert||!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const parent=node.parentElement;
    if(parent&&!parent.closest('script,style,svg,.mimo-vector'))api.convert(parent);
    return;
  }
  if(node.nodeType===Node.ELEMENT_NODE&&!node.closest?.('.mimo-vector'))api.convert(node);
};
function boot(){
  const api=globalThis.MundoMimoVisualV110;if(!api?.convert)return;
  api.convert(document.body);
  new MutationObserver(records=>{
    for(const record of records){for(const node of record.addedNodes)convertNode(node)}
  }).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
globalThis.MundoMimoVisualDynamicV111={version:111};
})();
