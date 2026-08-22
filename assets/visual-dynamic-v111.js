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
function normalizeAccessibility(root=document){
  const scope=root.querySelectorAll?root:document;
  scope.querySelectorAll('.choice img,.memory img').forEach(img=>{
    img.alt='';
    img.setAttribute('aria-hidden','true');
  });
  scope.querySelectorAll('button').forEach(button=>{
    if(button.getAttribute('aria-label')||button.textContent.trim())return;
    const labels=[...button.querySelectorAll('.mimo-vector')].map(v=>v.dataset.label).filter(Boolean);
    if(labels.length)button.setAttribute('aria-label',labels.join(', '));
  });
}
function boot(){
  const api=globalThis.MundoMimoVisualV110;if(!api?.convert)return;
  api.convert(document.body);normalizeAccessibility(document);
  new MutationObserver(records=>{
    for(const record of records){for(const node of record.addedNodes){convertNode(node);if(node.nodeType===Node.ELEMENT_NODE)normalizeAccessibility(node)}}
    requestAnimationFrame(()=>normalizeAccessibility(document));
  }).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
globalThis.MundoMimoVisualDynamicV111={version:111,normalizeAccessibility};
})();
