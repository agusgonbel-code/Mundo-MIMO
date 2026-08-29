(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V520 is the sole owner of adult verification. Earlier V591 revisions wrapped the
// DOM0 handler to restabilize aria-invalid after a physical click, but that created a
// second identity at the interaction boundary and conflicted with the validated V520
// contract. The V520 gate is green on the current candidate, so V591 now only asserts
// ownership instead of mutating behavior.
if(submit.onclick!==Parent.submit)throw new Error('Mundo Mimo V591 parent submit ownership drift');

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-direct'});
})();
