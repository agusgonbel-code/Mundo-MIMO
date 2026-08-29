(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V520 is the single owner of adult-gate activation and already binds the target
// directly before exporting its public API. Do not replace that handler here: a
// second assignment creates a competing ownership layer with no product benefit and
// was correlated with trusted WebKit clicks losing the invalid-answer state.
// This guard fails loudly if the validated V520 ownership ever disappears.
if(typeof submit.onclick!=='function')throw new Error('Mundo Mimo V591 parent submit owner missing');

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-direct'});
})();
