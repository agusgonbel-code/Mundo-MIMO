(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V591 keeps exactly one adult-gate activation path. V520 remains the owner of the
// verification logic; this wrapper invokes that owner once and only stabilizes the
// accessibility/error state after the completed trusted click. WebKit can run later
// click-dispatch work after the DOM0 handler; a failed adult answer must not lose its
// aria-invalid/error feedback at that boundary.
const owner=submit.onclick;
if(typeof owner!=='function')throw new Error('Mundo Mimo V591 parent submit owner missing');
submit.onclick=function(event){
  const accepted=owner.call(this,event);
  if(accepted===false){
    queueMicrotask(()=>{
      const gate=document.getElementById('parentGate');
      const panel=document.getElementById('parentPanel');
      const input=document.getElementById('parentAnswer');
      const error=document.getElementById('parentGateError');
      if(!gate||gate.hidden||!panel||!panel.hidden||!input||!error)return;
      input.setAttribute('aria-invalid','true');
      error.dataset.state='invalid';
      if(!error.textContent)error.replaceChildren(document.createTextNode('Respuesta incorrecta. Pide ayuda a una persona adulta.'));
    });
  }
  return accepted;
};

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-single-wrapper'});
})();
