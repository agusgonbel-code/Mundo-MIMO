(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V520 is the single owner of adult verification and of its accessible error state.
// V591 deliberately adds no click listener, retry, timer, microtask or DOM repair.
// Its only responsibility is to fail fast if another layer replaces that owner.
if(submit.onclick!==Parent.submit)throw new Error('Mundo Mimo V591 parent submit ownership drift');

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-direct',stabilization:'none'});
})();
