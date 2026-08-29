(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V520 remains the sole owner of adult verification. V591 must never replace or
// re-run that handler: it only preserves the accessible error state after the same
// physical click has completed its target listeners. This fixes the WebKit path where
// a later interaction listener could leave the visible gate open while dropping
// aria-invalid from the answer control. No retry, timer, microtask or verification is
// introduced; the V520 result is authoritative.
if(submit.onclick!==Parent.submit)throw new Error('Mundo Mimo V591 parent submit ownership drift');

submit.addEventListener('click',()=>{
  const gate=document.getElementById('parentGate');
  const input=document.getElementById('parentAnswer');
  const error=document.getElementById('parentGateError');
  if(!gate||gate.hidden||!input||!error)return;
  if(error.dataset.state==='invalid'){
    input.setAttribute('aria-invalid','true');
    if(!error.textContent)error.replaceChildren(document.createTextNode('Respuesta incorrecta. Pide ayuda a una persona adulta.'));
  }
});

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-direct',stabilization:'same-dispatch-a11y'});
})();
