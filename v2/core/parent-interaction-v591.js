(()=>{'use strict';
const Parent=globalThis.MundoMimoV2ParentV520;
const submit=document.querySelector('[data-parent-submit]');
if(!Parent||!submit)throw new Error('Mundo Mimo V591 parent interaction dependencies missing');

// The adult-gate control owns its activation directly. V520 already provides the
// validated submit semantics; wrapping that exact method on the target avoids the
// unstable global capture boundary that can be pre-empted by historical listeners.
// Default action/propagation remain untouched and Enter continues through V520.
submit.onclick=()=>Parent.submit();

globalThis.MundoMimoV2ParentInteractionV591=Object.freeze({version:591});
})();
