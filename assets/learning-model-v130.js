(()=>{'use strict';
if(globalThis.MundoMimoLearningV130)return;
const VERSION=130;
const AGE_BANDS=Object.freeze([
  {id:'0-2',min:0,max:2,label:'0–2 años',focus:['causa-efecto','lenguaje-receptivo','percepcion','coordinacion']},
  {id:'2-3',min:2,max:3,label:'2–3 años',focus:['vocabulario','clasificacion','conteo-inicial','emociones']},
  {id:'3-4',min:3,max:4,label:'3–4 años',focus:['conciencia-fonologica','cantidad','patrones','memoria']},
  {id:'4-5',min:4,max:5,label:'4–5 años',focus:['prelectura','numeracion','logica','secuencias']},
  {id:'5-6',min:5,max:6,label:'5–6 años',focus:['lectoescritura-inicial','resolucion-problemas','funciones-ejecutivas','creatividad']}
]);
const A=(id,area,skill,subskill,mechanic,ages,objective,prerequisites=[],accessibility=['visual','audio','touch'])=>Object.freeze({
  id,area,skill,subskill,mechanic,ages:Object.freeze(ages),objective,prerequisites:Object.freeze(prerequisites),levels:5,promptVariants:100,
  progression:Object.freeze({up:'>=80% de aciertos con al menos 5 intentos recientes',down:'<50% de aciertos con al menos 4 intentos recientes',hintAfter:2}),
  feedback:Object.freeze({correct:'refuerzo descriptivo y celebración breve',incorrect:'pista gradual sin castigo'}),
  accessibility:Object.freeze(accessibility)
});
const ACTIVITIES=Object.freeze({
  animals:A('animals','Conocimiento del entorno','Vocabulario','Animales','seleccion-visual',['0-2','2-3','3-4'],'Reconocer y nombrar animales comunes.'),
  sounds:A('sounds','Lenguaje y audicion','Discriminación auditiva','Sonidos de animales','escucha-y-eleccion',['0-2','2-3','3-4'],'Relacionar sonidos reales con su fuente.'),
  memory:A('memory','Funciones ejecutivas','Memoria de trabajo','Memoria visual','parejas',['2-3','3-4','4-5','5-6'],'Recordar localizaciones y emparejar estímulos.'),
  habitat:A('habitat','Ciencia temprana','Relaciones semánticas','Animal-hábitat','asociacion',['2-3','3-4','4-5'],'Relacionar seres vivos con entornos habituales.',['animals']),
  size:A('size','Matemáticas','Comparación','Magnitudes','comparacion',['2-3','3-4','4-5'],'Comparar tamaños usando relaciones mayor/menor.'),
  tracks:A('tracks','Atención y lógica','Inferencia','Pistas visuales','deduccion',['3-4','4-5','5-6'],'Inferir una respuesta a partir de señales visuales.',['animals']),
  count:A('count','Matemáticas','Conteo','Cardinalidad','conteo-y-eleccion',['2-3','3-4','4-5','5-6'],'Contar colecciones y asociarlas con una cantidad.'),
  more:A('more','Matemáticas','Comparación numérica','Más/menos','comparacion-cantidades',['3-4','4-5','5-6'],'Comparar dos colecciones y decidir cuál contiene más.',['count']),
  colors:A('colors','Percepción visual','Discriminación visual','Color','seleccion-visual',['0-2','2-3','3-4'],'Reconocer y diferenciar colores sin depender solo del nombre escrito.'),
  shapes:A('shapes','Matemáticas','Geometría temprana','Formas básicas','seleccion-visual',['2-3','3-4','4-5'],'Reconocer figuras por sus propiedades visuales.'),
  patterns:A('patterns','Matemáticas y lógica','Patrones','Series repetitivas','completar-patron',['3-4','4-5','5-6'],'Identificar una regla repetitiva y continuarla.'),
  sort:A('sort','Pensamiento lógico','Clasificación','Categorías','clasificacion',['2-3','3-4','4-5'],'Agrupar elementos por una propiedad semántica o perceptiva.'),
  emotions:A('emotions','Desarrollo socioemocional','Emociones','Reconocimiento emocional','seleccion-contextual',['2-3','3-4','4-5','5-6'],'Reconocer emociones básicas y relacionarlas con expresiones.'),
  stories:A('stories','Lenguaje','Comprensión oral','Narrativa','historia-interactiva',['3-4','4-5','5-6'],'Comprender información explícita en relatos breves.'),
  paint:A('paint','Creatividad','Expresión gráfica','Dibujo libre','creacion-abierta',['0-2','2-3','3-4','4-5','5-6'],'Explorar trazos, color y composición sin respuesta única.'),
  routines:A('routines','Autonomía','Secuencias cotidianas','Hábitos','decision-contextual',['2-3','3-4','4-5'],'Relacionar momentos cotidianos con acciones apropiadas.'),
  match:A('match','Pensamiento lógico','Asociación funcional','Objeto-uso','emparejamiento',['2-3','3-4','4-5'],'Relacionar objetos con funciones o parejas significativas.'),
  discover:A('discover','Atención','Exploración visual','Búsqueda','busqueda-visual',['0-2','2-3','3-4','4-5'],'Explorar escenas y localizar elementos relevantes.'),
  letters:A('letters','Lectoescritura','Conocimiento alfabético','Reconocimiento de letras','seleccion-simbolica',['4-5','5-6'],'Reconocer formas de letras y diferenciarlas visualmente.'),
  trace:A('trace','Psicomotricidad fina','Grafomotricidad','Trazos dirigidos','trazado',['3-4','4-5','5-6'],'Practicar control motor y direccionalidad de trazos.',[],['visual','touch','reduced-motion']),
  initial:A('initial','Lenguaje','Conciencia fonológica','Sonido inicial','fonologia-y-eleccion',['4-5','5-6'],'Identificar el sonido inicial de palabras familiares.',['sounds']),
  logic:A('logic','Pensamiento lógico','Razonamiento','Relaciones','resolucion-problemas',['4-5','5-6'],'Resolver relaciones sencillas usando información disponible.'),
  sequence:A('sequence','Funciones ejecutivas','Secuenciación','Orden temporal/lógico','ordenacion',['3-4','4-5','5-6'],'Identificar y continuar órdenes o secuencias.'),
  odd:A('odd','Atención','Control inhibitorio','Elemento diferente','discriminacion',['3-4','4-5','5-6'],'Detectar el elemento que no comparte la regla del grupo.')
});
const unique=x=>[...new Set(x)];
const mechanics=Object.freeze(unique(Object.values(ACTIVITIES).map(x=>x.mechanic)));
const areas=Object.freeze(unique(Object.values(ACTIVITIES).map(x=>x.area)));
const skills=Object.freeze(unique(Object.values(ACTIVITIES).map(x=>x.skill)));
const METRICS=Object.freeze({mechanics:mechanics.length,activities:Object.keys(ACTIVITIES).length,levels:Object.keys(ACTIVITIES).length*5,promptVariants:Object.keys(ACTIVITIES).length*100,areas:areas.length,skills:skills.length,ageBands:AGE_BANDS.length});
function bandForAge(age){const n=Number(age);if(n===1)return AGE_BANDS[0];if(n===3)return AGE_BANDS[2];if(n===5)return AGE_BANDS[4];return AGE_BANDS.find(b=>n>=b.min&&n<b.max)||AGE_BANDS[AGE_BANDS.length-1];}
function recentPerformance(id){try{const d=JSON.parse(localStorage.getItem('mimo71')||'{}'),g=d.games?.[id];if(!g?.attempts)return null;return{attempts:g.attempts,accuracy:g.correct/g.attempts}}catch{return null}}
function levelFor(id){const p=recentPerformance(id);if(!p||p.attempts<4)return 1;if(p.accuracy>=.9&&p.attempts>=12)return 5;if(p.accuracy>=.82&&p.attempts>=8)return 4;if(p.accuracy>=.7&&p.attempts>=6)return 3;if(p.accuracy>=.55)return 2;return 1;}
function recommendations(age){const band=bandForAge(age),eligible=Object.values(ACTIVITIES).filter(a=>a.ages.includes(band.id));return eligible.sort((a,b)=>levelFor(a.id)-levelFor(b.id)).slice(0,6).map(a=>({id:a.id,area:a.area,skill:a.skill,level:levelFor(a.id)}));}
function validate(){const errors=[];const ids=Object.keys(ACTIVITIES);if(new Set(ids).size!==ids.length)errors.push('duplicate-activity-id');for(const [id,a] of Object.entries(ACTIVITIES)){for(const key of ['area','skill','subskill','mechanic','objective'])if(!a[key])errors.push(`${id}:missing-${key}`);if(!a.ages.length||a.ages.some(x=>!AGE_BANDS.some(b=>b.id===x)))errors.push(`${id}:invalid-age-band`);if(a.levels!==5)errors.push(`${id}:invalid-level-count`);if(a.promptVariants!==100)errors.push(`${id}:invalid-variant-count`);}return errors;}
function enrichDom(){let age=3;try{age=JSON.parse(localStorage.getItem('mimo70')||'{}').age||3}catch{}const band=bandForAge(age);document.documentElement.dataset.mimoAgeBand=band.id;document.querySelectorAll('[data-game]').forEach(el=>{const a=ACTIVITIES[el.dataset.game];if(!a)return;el.dataset.learningArea=a.area;el.dataset.learningSkill=a.skill;el.dataset.learningMechanic=a.mechanic;el.dataset.learningLevel=String(levelFor(a.id));});const parent=document.getElementById('parent');if(parent&&!parent.querySelector('.mimo-curriculum-v130')){const card=document.createElement('div');card.className='parentCard mimo-curriculum-v130';card.innerHTML=`<h3>Mapa educativo</h3><p>Mundo Mimo separa actividades, niveles y variantes para mostrar el progreso sin inflar cifras.</p><div class="metrics"><div><b>${METRICS.mechanics}</b><small>mecánicas</small></div><div><b>${METRICS.activities}</b><small>actividades</small></div><div><b>${METRICS.levels}</b><small>niveles de progresión</small></div></div><p><b>${METRICS.promptVariants}</b> variantes de contexto/pregunta · ${METRICS.ageBands} franjas curriculares · ${METRICS.areas} áreas · ${METRICS.skills} habilidades.</p>`;parent.appendChild(card);}}
function boot(){enrichDom();new MutationObserver(enrichDom).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
globalThis.MundoMimoLearningV130=Object.freeze({version:VERSION,ageBands:AGE_BANDS,activities:ACTIVITIES,mechanics,areas,skills,metrics:METRICS,bandForAge,levelFor,recommendations,validate,enrichDom});
})();
