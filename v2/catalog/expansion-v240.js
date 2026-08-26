(()=>{'use strict';
const P=globalThis.MundoMimoV2,S=globalThis.MundoMimoV2Seed;if(!P||!S)throw new Error('Mundo Mimo V2 catalog base missing');
const G=(id,name,ages,area,skill,subskill,mechanic,objective,interaction,win,progression)=>Object.freeze({id,name,ages,area,skill,subskill,mechanic,objective,rules:Object.freeze({interaction,win,progression}),levels:12,feedback:Object.freeze({correct:'descriptivo-breve',incorrect:'pista-gradual'}),hints:Object.freeze(['modelado','reduccion-distractores','repeticion-posterior']),accessibility:Object.freeze(['visual','audio','touch','reduced-motion'])});
const GAMES=Object.freeze([
S.games.find(g=>g.id==='musica-por-capas'),
S.games.find(g=>g.id==='ciudad-simbolica'),
G('mantiene-y-descubre','Mantén y descubre',['0-1','1-2'],'psicomotricidad','control-motor','presion-sostenida','hold-release','Explorar la relación entre mantener una acción y observar un cambio gradual.','mantener pulsado un elemento grande y soltar cuando alcanza el objetivo','alcanzar el rango objetivo sin sobrepasarlo','ampliar duración, introducir señales visuales y variar objetivo'),
G('une-las-parejas','Une las parejas',['2-3','3-4'],'lenguaje','relaciones-semanticas','objeto-funcion','connect-pairs','Relacionar elementos cotidianos que tienen una conexión funcional o semántica.','seleccionar un elemento de cada columna para formar conexiones','completar todas las conexiones válidas','más parejas y relaciones menos evidentes'),
G('pinta-la-forma','Pinta la forma',['2-3','3-4'],'creatividad','discriminacion-visual','color-y-forma','color-fill','Aplicar un color indicado a una forma objetivo y distinguir atributos visuales.','elegir color y tocar las formas que cumplen la consigna','colorear todas y solo las formas objetivo','más formas, distractores y consignas dobles'),
G('jardin-de-descubrimientos','Jardín de descubrimientos',['1-2','2-3'],'ciencia','exploracion-causal','seres-vivos','free-explore','Explorar libremente elementos de naturaleza y descubrir respuestas causa-efecto.','tocar y explorar elementos de una escena en cualquier orden','descubrir un conjunto mínimo de interacciones distintas','más elementos, relaciones y pequeñas misiones opcionales')
]);
if(GAMES.some(Boolean)===false)throw new Error('Mundo Mimo V2 v240 seed dependencies missing');
const errors=P.validateCatalog(GAMES),clones=P.cloneGroups([...S.games,...GAMES.filter(g=>!S.games.some(s=>s.id===g.id))]);
if(errors.length)console.error('Mundo Mimo V2 v240 catalog errors',errors);if(clones.length)console.error('Mundo Mimo V2 v240 clone groups',clones);
globalThis.MundoMimoV2ExpansionV240=Object.freeze({version:240,games:GAMES,errors,cloneGroups:clones});
})();
