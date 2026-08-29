(()=>{'use strict';
const P=globalThis.MundoMimoV2,E=globalThis.MundoMimoV2ExpansionV430,R=globalThis.MundoMimoV2RuntimeV430;
if(!P||!E||!R)throw new Error('Mundo Mimo V600 mechanic dependencies missing');
const VERSION=600,MIN_MECHANICS=40;
const games=Object.freeze([...E.merged]);
const implemented=new Set(R.implemented||[]),declared=new Map(P.mechanics.map(m=>[m.id,m]));
function audit(){
  const errors=[],mechanics=new Map(),families=new Map(),ageCoverage=Object.fromEntries(P.ageBands.map(b=>[b.id,new Set()]));
  if(games.length<150)errors.push(`catalog:games:${games.length}`);
  for(const game of games){
    if(!implemented.has(game.id))errors.push(`${game.id}:missing-runtime-owner`);
    if(!declared.has(game.mechanic))errors.push(`${game.id}:undeclared-mechanic:${game.mechanic}`);
    const bucket=mechanics.get(game.mechanic)||[];bucket.push(game.id);mechanics.set(game.mechanic,bucket);
    const family=declared.get(game.mechanic)?.family;
    if(family){const fb=families.get(family)||new Set();fb.add(game.mechanic);families.set(family,fb);}
    for(const age of game.ages||[])ageCoverage[age]?.add(game.mechanic);
  }
  if(mechanics.size<MIN_MECHANICS)errors.push(`mechanics:count:${mechanics.size}`);
  if(families.size<12)errors.push(`mechanic-families:count:${families.size}`);
  for(const [age,set] of Object.entries(ageCoverage))if(set.size<4)errors.push(`age:${age}:mechanics:${set.size}`);
  const representatives=Object.freeze([...mechanics.entries()].map(([mechanic,ids])=>Object.freeze({mechanic,family:declared.get(mechanic)?.family||'unknown',gameId:ids[0],games:Object.freeze([...ids])})));
  return Object.freeze({version:VERSION,errors:Object.freeze(errors),games:games.length,mechanics:mechanics.size,families:families.size,representatives,ageCoverage:Object.freeze(Object.fromEntries(Object.entries(ageCoverage).map(([age,set])=>[age,set.size])))});
}
const result=audit();
globalThis.MundoMimoV2MechanicsV600=Object.freeze({version:VERSION,minMechanics:MIN_MECHANICS,audit,result});
})();