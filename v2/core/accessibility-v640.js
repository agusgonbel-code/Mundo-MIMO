(()=>{'use strict';
const VERSION=640;
const stage=document.getElementById('stage'),grid=document.getElementById('gameGrid'),ageBar=document.getElementById('ageBar'),close=document.getElementById('closeGame'),feedback=document.getElementById('feedback'),bar=document.getElementById('progressBar');
if(!stage||!grid||!ageBar||!close||!feedback||!bar)throw new Error('Mundo Mimo V640 accessibility DOM missing');
let launcherId=null;
const shell=document.querySelector('.shell'),brand=document.querySelector('.brand'),progress=bar.parentElement;
const focusStyle=document.createElement('style');focusStyle.dataset.accessibilityV640='';focusStyle.textContent=':focus-visible{outline:4px solid #202035!important;outline-offset:3px!important}.stage:focus-visible{outline-offset:6px!important}';document.head.appendChild(focusStyle);
if(shell){shell.setAttribute('role','main');shell.setAttribute('aria-label','Mundo Mimo 2');}
brand?.setAttribute('aria-hidden','true');
ageBar.setAttribute('role','group');ageBar.setAttribute('aria-label','Selecciona la edad');
grid.setAttribute('aria-label','Juegos disponibles');
stage.setAttribute('role','region');stage.setAttribute('aria-labelledby','gameTitle');stage.removeAttribute('aria-live');
feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.setAttribute('aria-atomic','true');
if(progress){progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Progreso de la sesión');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');}
function syncProgress(){if(!progress)return;const raw=bar.style.width||getComputedStyle(bar).width;let value=parseFloat(raw);if(raw&&!raw.includes('%')){const total=progress.getBoundingClientRect().width;value=total?bar.getBoundingClientRect().width/total*100:0;}value=Math.max(0,Math.min(100,Number.isFinite(value)?value:0));progress.setAttribute('aria-valuenow',String(Math.round(value)));}
new MutationObserver(syncProgress).observe(bar,{attributes:true,attributeFilter:['style']});syncProgress();
grid.addEventListener('click',e=>{const card=e.target.closest('[data-game]');if(!card||!grid.contains(card))return;launcherId=card.dataset.game;queueMicrotask(()=>{if(!stage.hidden)close.focus({preventScroll:true});});});
close.addEventListener('click',()=>queueMicrotask(()=>{if(!stage.hidden)return;const card=launcherId&&grid.querySelector(`[data-game="${CSS.escape(launcherId)}"]`);card?.focus({preventScroll:true});}),false);
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||stage.hidden)return;e.preventDefault();close.click();});
const API=Object.freeze({version:VERSION,syncProgress,launcher:()=>launcherId});
globalThis.MundoMimoV2AccessibilityV640=API;
})();