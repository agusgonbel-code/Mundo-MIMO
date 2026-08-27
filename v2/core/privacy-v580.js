(()=>{'use strict';
if(globalThis.MundoMimoPrivacyV580)return;
const VERSION=580;
const pageOrigin=location.origin;
function resolved(value){try{return new URL(String(value),location.href);}catch{return null;}}
function isAllowedUrl(value){const url=resolved(value);if(!url)return false;if(['data:','blob:','about:'].includes(url.protocol))return true;if(url.protocol==='http:'||url.protocol==='https:')return url.origin===pageOrigin;return false;}
function deny(kind,value){const url=resolved(value);throw new DOMException(`Mundo Mimo bloqueó ${kind} externo: ${url?.origin||'destino no válido'}`,'SecurityError');}
const nativeFetch=globalThis.fetch?.bind(globalThis);
if(nativeFetch){globalThis.fetch=(input,init)=>{const value=input instanceof Request?input.url:input;if(!isAllowedUrl(value))return Promise.reject(new TypeError('External network is disabled in child runtime'));return nativeFetch(input,init);};}
const XHR=globalThis.XMLHttpRequest;
if(XHR){const nativeOpen=XHR.prototype.open;XHR.prototype.open=function(method,url,...rest){if(!isAllowedUrl(url))deny('XMLHttpRequest',url);return nativeOpen.call(this,method,url,...rest);};}
if(navigator.sendBeacon){const nativeBeacon=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=(url,data)=>isAllowedUrl(url)?nativeBeacon(url,data):false;}
const nativeOpenWindow=globalThis.open?.bind(globalThis);
if(nativeOpenWindow){globalThis.open=(url,...rest)=>{if(url!=null&&url!==''&&!isAllowedUrl(url))return null;return nativeOpenWindow(url,...rest);};}
for(const name of ['WebSocket','EventSource']){const Native=globalThis[name];if(!Native)continue;globalThis[name]=function(url,...rest){if(!isAllowedUrl(url))deny(name,url);return new Native(url,...rest);};globalThis[name].prototype=Native.prototype;}
function blockExternalNavigation(event){const anchor=event.target?.closest?.('a[href]');if(anchor&&!isAllowedUrl(anchor.href)){event.preventDefault();event.stopImmediatePropagation();}}
document.addEventListener('click',blockExternalNavigation,true);
function sanitizeNode(node){if(!(node instanceof Element))return;const candidates=[node,...node.querySelectorAll?.('[src],[href]')||[]];for(const el of candidates){const tag=el.tagName;const attr=el.hasAttribute('src')?'src':el.hasAttribute('href')?'href':null;if(!attr)continue;if(!['SCRIPT','IMG','AUDIO','VIDEO','SOURCE','IFRAME','LINK'].includes(tag))continue;const value=el.getAttribute(attr);if(value&&!isAllowedUrl(value)){el.removeAttribute(attr);el.setAttribute('data-mimo-blocked-external','true');}}}
const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='childList')for(const node of record.addedNodes)sanitizeNode(node);else if(record.type==='attributes')sanitizeNode(record.target);}});
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','href']});
globalThis.MundoMimoPrivacyV580=Object.freeze({version:VERSION,mode:'local-only-child-runtime',tracking:false,collectedDataTypes:0,isAllowedUrl});
})();