(()=>{'use strict';
const tractorSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h3l2-5h5l2 5h3v4H4v-4Zm6-5V5h4v4M7 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm11 .5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" class="mimo-icon-stroke"/></svg>';
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
function repairKnownFallbacks(root=document){
  const scope=root.querySelectorAll?root:document;
  scope.querySelectorAll('.mimo-vector[data-kind="generic"]').forEach(v=>{
    const scene=v.closest('.sceneVisual');
    const game=v.closest('#game');
    const prompt=game?.querySelector('.prompt')?.textContent||'';
    if(scene&&prompt.includes('¿Quién vive aquí?')&&scene.textContent.includes('Granja')){
      v.dataset.kind='tractor';v.dataset.label='granja';v.innerHTML=tractorSvg;
    }
  });
}
function normalizeAccessibility(root=document){
  const scope=root.querySelectorAll?root:document;
  repairKnownFallbacks(scope);
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
globalThis.MundoMimoVisualDynamicV111={version:111,normalizeAccessibility,repairKnownFallbacks};
})();
