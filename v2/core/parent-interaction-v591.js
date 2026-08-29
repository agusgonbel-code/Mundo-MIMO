(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// V520 is the single owner of adult verification and its accessible error state.
// The owner is an EventTarget listener instead of mutable DOM0 `onclick`, so physical
// WebKit clicks and programmatic activation use the same path without a second owner.
// V591 adds no listener, retry, timer, microtask or DOM repair: it only fails fast on drift.
if(!Parent.ownsSubmit?.(submit)||submit.onclick!==null)throw new Error('Mundo Mimo V591 parent submit ownership drift');

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591,owner:'v520-eventtarget',stabilization:'none'});
})();
