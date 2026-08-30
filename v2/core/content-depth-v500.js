(()=>{'use strict';
const P=globalThis.MundoMimoV2,E=globalThis.MundoMimoV2ExpansionV430;
if(!P||!E)throw new Error('Mundo Mimo V500 depth dependencies missing');
const VERSION=500,KEY='mimo-v2-depth-v500';
const ACTIVITIES_PER_GAME=4,LEVELS_PER_ACTIVITY=9,CHALLENGES_PER_LEVEL=5;
const MODES=Object.freeze([
Object.freeze({id:'descubre',label:'Descubre',intent:'introducir la habilidad con modelado y apoyo máximo',support:3}),
Object.freeze({id:'practica',label:'Practica',intent:'repetir la habilidad con variación controlada',support:2}),
Object.freeze({id:'transfiere',label:'Transfiere',intent:'aplicar la habilidad en un contexto distinto',support:1}),
Object.freeze({id:'repaso-mixto',label:'Repaso mixto',intent:'combinar la habilidad con aprendizajes cercanos',support:1})
]);
const CONTEXTS=Object.freeze(['casa','parque','naturaleza','ciudad','aventura']);
const REPRESENTATIONS=Object.freeze(['objeto-realista','ilustracion-simple','escena-contextual','simbolo','audio-visual']);
const CHALLENGE_ROLES=Object.freeze([
Object.freeze({id:'observa-modelo',instruction:'observa el modelo y localiza la pista esencial'}),
Object.freeze({id:'elige-y-discrimina',instruction:'elige la respuesta correcta distinguiéndola de distractores cercanos'}),
Object.freeze({id:'aplica-regla',instruction:'aplica la regla de la habilidad sin copiar el ejemplo'}),
Object.freeze({id:'verifica-y-corrige',instruction:'comprueba la solución y corrige una opción plausible pero incorrecta'}),
Object.freeze({id:'transfiere-contexto',instruction:'usa la misma habilidad en una situación nueva'})
]);
const DIFFICULTY_DEMANDS=Object.freeze([
'reconoce una sola pista con modelado visible',
'reconoce la pista entre dos alternativas claramente distintas',
'selecciona usando una pista y un distractor cercano',
'aplica la regla con apoyo parcial y tres alternativas',
'mantén dos rasgos relevantes antes de responder',
'aplica la regla con menos apoyo y distractores similares',
'combina dos pistas sin modelado previo',
'resuelve una situación nueva con apoyo solo a demanda',
'generaliza la habilidad de forma independiente y justifica la elección'
]);
const games=Object.freeze([...E.merged]);
const byId=new Map(games.map(g=>[g.id,g]));
const pad=n=>String(n).padStart(2,'0');
const copy=x=>JSON.parse(JSON.stringify(x));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function requireGame(id){const g=byId.get(id);if(!g)throw new Error(`unknown-game:${id}`);return g;}
function activity(gameId,index){const g=requireGame(gameId);if(!Number.isInteger(index)||index<1||index>ACTIVITIES_PER_GAME)throw new Error('invalid-activity-index');const mode=MODES[index-1];return Object.freeze({id:`${g.id}-a${pad(index)}`,gameId:g.id,index,mode:mode.id,label:`${g.name} · ${mode.label}`,ages:Object.freeze([...g.ages]),area:g.area,skill:g.skill,subskill:g.subskill,mechanic:g.mechanic,objective:g.objective,intent:mode.intent,baseInteraction:g.rules.interaction,baseWin:g.rules.win,baseProgression:g.rules.progression});}
function activities(gameId){return Object.freeze(Array.from({length:ACTIVITIES_PER_GAME},(_,i)=>activity(gameId,i+1)));}
function tier(levelInActivity){return levelInActivity<=3?'guiado':levelInActivity<=6?'apoyo-reducido':'independiente';}
function support(levelInActivity,mode){const base=levelInActivity<=3?3:levelInActivity<=6?2:1;return Math.min(base,MODES[mode-1].support);}
function level(gameId,number){const g=requireGame(gameId);if(!Number.isInteger(number)||number<1||number>ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY)throw new Error('invalid-level-number');const activityIndex=Math.ceil(number/LEVELS_PER_ACTIVITY),levelInActivity=((number-1)%LEVELS_PER_ACTIVITY)+1,a=activity(gameId,activityIndex);const intensity=support(levelInActivity,activityIndex);return Object.freeze({id:`${g.id}-l${pad(number)}`,gameId:g.id,activityId:a.id,number,activityIndex,levelInActivity,tier:tier(levelInActivity),difficulty:levelInActivity,supportIntensity:intensity,hintPolicy:intensity===3?'modelado-y-pista':intensity===2?'pista-gradual':'pista-a-demanda',distractorBand:Math.min(4,1+Math.floor((levelInActivity-1)/2)),objective:g.objective,mechanic:g.mechanic,ages:Object.freeze([...g.ages])});}
function levels(gameId){return Object.freeze(Array.from({length:ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY},(_,i)=>level(gameId,i+1)));}
function semanticKey(g,l,mode,role,context,representation){return [g.area,g.skill,g.subskill,g.mechanic,g.objective,g.rules.interaction,g.rules.win,mode.id,role.id,DIFFICULTY_DEMANDS[l.levelInActivity-1],l.tier,l.supportIntensity,l.distractorBand,context,representation].map(norm).join('|')}
function challenge(gameId,levelNumber,slot){const g=requireGame(gameId),l=level(gameId,levelNumber);if(!Number.isInteger(slot)||slot<1||slot>CHALLENGES_PER_LEVEL)throw new Error('invalid-challenge-slot');const context=CONTEXTS[(levelNumber+slot-2)%CONTEXTS.length],representation=REPRESENTATIONS[(levelNumber*2+slot-3)%REPRESENTATIONS.length],mode=MODES[l.activityIndex-1],role=CHALLENGE_ROLES[slot-1],demand=DIFFICULTY_DEMANDS[l.levelInActivity-1],key=semanticKey(g,l,mode,role,context,representation);return Object.freeze({id:`${g.id}-l${pad(levelNumber)}-c${slot}`,gameId:g.id,activityId:l.activityId,levelId:l.id,slot,ages:Object.freeze([...g.ages]),area:g.area,skill:g.skill,subskill:g.subskill,mechanic:g.mechanic,difficulty:l.difficulty,tier:l.tier,supportIntensity:l.supportIntensity,hintPolicy:l.hintPolicy,distractorBand:l.distractorBand,context,representation,role:role.id,cognitiveDemand:demand,objective:g.objective,prompt:`${mode.label}. ${role.instruction}. ${g.rules.interaction}. Contexto: ${context}. Representación: ${representation}. Demanda: ${demand}.`,success:g.rules.win,progression:g.rules.progression,variationKey:`${mode.id}:${l.levelInActivity}:${role.id}:${context}:${representation}`,semanticKey:key});}
function challengesForLevel(gameId,levelNumber){return Object.freeze(Array.from({length:CHALLENGES_PER_LEVEL},(_,i)=>challenge(gameId,levelNumber,i+1)));}
function validateActivity(a){const e=[];if(!a?.id||!a?.gameId)e.push('activity:identity');if(!byId.has(a?.gameId))e.push('activity:unknown-game');if(!MODES.some(m=>m.id===a?.mode))e.push('activity:mode');if(!Array.isArray(a?.ages)||!a.ages.length)e.push('activity:ages');return e;}
function validateLevel(l){const e=[];if(!l?.id||!l?.activityId)e.push('level:identity');if(!Number.isInteger(l?.number)||l.number<1||l.number>36)e.push('level:number');if(!['guiado','apoyo-reducido','independiente'].includes(l?.tier))e.push('level:tier');if(!Number.isInteger(l?.supportIntensity)||l.supportIntensity<1||l.supportIntensity>3)e.push('level:support');return e;}
function validateChallenge(c){const e=[];if(!c?.id||!c?.gameId||!c?.activityId||!c?.levelId)e.push('challenge:identity');if(!byId.has(c?.gameId))e.push('challenge:unknown-game');if(!Number.isInteger(c?.slot)||c.slot<1||c.slot>CHALLENGES_PER_LEVEL)e.push('challenge:slot');if(!Number.isInteger(c?.difficulty)||c.difficulty<1||c.difficulty>9)e.push('challenge:difficulty');if(!CONTEXTS.includes(c?.context))e.push('challenge:context');if(!REPRESENTATIONS.includes(c?.representation))e.push('challenge:representation');if(!CHALLENGE_ROLES.some(r=>r.id===c?.role))e.push('challenge:role');if(!DIFFICULTY_DEMANDS.includes(c?.cognitiveDemand))e.push('challenge:cognitive-demand');if(!c?.prompt||!c?.success||!c?.variationKey||!c?.semanticKey)e.push('challenge:content');if(!c.prompt.includes(c.context)||!c.prompt.includes(c.representation)||!c.prompt.includes(c.cognitiveDemand))e.push('challenge:prompt-contract');return e;}
function audit(){const errors=[],activityIds=new Set(),levelIds=new Set(),challengeIds=new Set(),semanticKeys=new Set();for(const g of games){for(let ai=1;ai<=ACTIVITIES_PER_GAME;ai++){const a=activity(g.id,ai);for(const e of validateActivity(a))errors.push(`${a.id}:${e}`);if(activityIds.has(a.id))errors.push(`${a.id}:duplicate`);activityIds.add(a.id);}let previousSupport=4;for(let li=1;li<=ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY;li++){const l=level(g.id,li);for(const e of validateLevel(l))errors.push(`${l.id}:${e}`);if(levelIds.has(l.id))errors.push(`${l.id}:duplicate`);levelIds.add(l.id);if(l.levelInActivity===1)previousSupport=4;if(l.supportIntensity>previousSupport)errors.push(`${l.id}:support-regression`);previousSupport=l.supportIntensity;for(let s=1;s<=CHALLENGES_PER_LEVEL;s++){const c=challenge(g.id,li,s);for(const e of validateChallenge(c))errors.push(`${c.id}:${e}`);if(challengeIds.has(c.id))errors.push(`${c.id}:duplicate`);challengeIds.add(c.id);if(semanticKeys.has(c.semanticKey))errors.push(`${c.id}:duplicate-semantic-content`);semanticKeys.add(c.semanticKey);}}}
return Object.freeze({errors:Object.freeze(errors),games:games.length,activities:activityIds.size,levels:levelIds.size,challenges:challengeIds.size,semanticChallenges:semanticKeys.size,activitiesPerGame:ACTIVITIES_PER_GAME,levelsPerGame:ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY,challengesPerGame:ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY*CHALLENGES_PER_LEVEL});}
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function write(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
function progress(gameId){requireGame(gameId);const s=read(),g=s[gameId]||{};return Object.freeze({level:Number.isInteger(g.level)?Math.min(36,Math.max(1,g.level)):1,streak:Number.isInteger(g.streak)?g.streak:0,attempts:Number.isInteger(g.attempts)?g.attempts:0,correct:Number.isInteger(g.correct)?g.correct:0});}
function recordOutcome(gameId,ok){const current=copy(progress(gameId));current.attempts++;if(ok){current.correct++;current.streak=current.streak<0?1:current.streak+1;if(current.streak>=3&&current.level<36){current.level++;current.streak=0;}}else{current.streak=Math.min(0,current.streak)-1;if(current.streak<=-2&&current.level>1){current.level--;current.streak=0;}}const s=read();s[gameId]=current;write(s);return progress(gameId);}
function session(gameId,ageBand){const g=requireGame(gameId);if(ageBand&&!g.ages.includes(ageBand))throw new Error('age-band-not-supported');const p=progress(gameId),l=level(gameId,p.level),a=activity(gameId,l.activityIndex);return Object.freeze({gameId,ageBand:ageBand||g.ages[0],activity:a,level:l,challenges:challengesForLevel(gameId,l.number),progress:p});}
function reset(gameId){if(gameId)requireGame(gameId);const s=read();if(gameId)delete s[gameId];else for(const k of Object.keys(s))delete s[k];write(s);}
const metrics=Object.freeze({games:games.length,activities:games.length*ACTIVITIES_PER_GAME,levels:games.length*ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY,challenges:games.length*ACTIVITIES_PER_GAME*LEVELS_PER_ACTIVITY*CHALLENGES_PER_LEVEL,variants:0});
globalThis.MundoMimoV2DepthV500=Object.freeze({version:VERSION,metrics,modes:MODES,contexts:CONTEXTS,representations:REPRESENTATIONS,challengeRoles:CHALLENGE_ROLES,difficultyDemands:DIFFICULTY_DEMANDS,activity,activities,level,levels,challenge,challengesForLevel,validateActivity,validateLevel,validateChallenge,audit,progress,recordOutcome,session,reset});
})();