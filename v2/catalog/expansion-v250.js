(()=>{'use strict';
const P=globalThis.MundoMimoV2,S=globalThis.MundoMimoV2Seed,E=globalThis.MundoMimoV2ExpansionV240;if(!P||!S||!E)throw new Error('Mundo Mimo V2 v250 catalog dependencies missing');
const G=(id,name,ages,area,skill,subskill,mechanic,objective,interaction,win,progression)=>Object.freeze({id,name,ages,area,skill,subskill,mechanic,objective,rules:Object.freeze({interaction,win,progression}),levels:12,feedback:Object.freeze({correct:'descriptivo-breve',incorrect:'pista-gradual'}),hints:Object.freeze(['modelado','reduccion-distractores','repeticion-posterior']),accessibility:Object.freeze(['visual','audio','touch','reduced-motion'])});
const GAMES=Object.freeze([
S.games.find(g=>g.id==='sigue-la-luz'),
S.games.find(g=>g.id==='lleva-a-casa'),
S.games.find(g=>g.id==='que-falta'),
S.games.find(g=>g.id==='caras-y-situaciones'),
G('orquesta-de-sonidos','Orquesta de sonidos',['2-3','3-4','4-5'],'musica','discriminacion-auditiva','fuente-sonora','sound-recognition','Reconocer sonidos cotidianos y musicales por sus propiedades auditivas.','escuchar una secuencia breve de tonos identificados por iconos y seleccionar la fuente solicitada','identificar correctamente el sonido objetivo','aumentar número de fuentes, similitud tonal y longitud de secuencia'),
G('cuadricula-logica','Cuadrícula lógica',['5-6'],'logica','deduccion','restricciones','logic-grid','Resolver una pequeña cuadrícula usando pistas de exclusión y correspondencia.','leer pistas visuales simples y marcar la combinación válida en una matriz','seleccionar la única combinación que satisface todas las pistas','añadir categorías, pistas negativas y relaciones encadenadas')
]);
if(GAMES.some(g=>!g))throw new Error('Mundo Mimo V2 v250 seed dependencies missing');
const merged=[...S.games,...E.games.filter(g=>!S.games.some(s=>s.id===g.id)),...GAMES.filter(g=>!S.games.some(s=>s.id===g.id)&&!E.games.some(e=>e.id===g.id))];
const errors=P.validateCatalog(GAMES),clones=P.cloneGroups(merged);
if(errors.length)console.error('Mundo Mimo V2 v250 catalog errors',errors);if(clones.length)console.error('Mundo Mimo V2 v250 clone groups',clones);
globalThis.MundoMimoV2ExpansionV250=Object.freeze({version:250,games:GAMES,errors,cloneGroups:clones,merged:Object.freeze(merged)});
})();
