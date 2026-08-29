(()=>{'use strict';
const P=globalThis.MundoMimoV2,E=globalThis.MundoMimoV2ExpansionV430,R=globalThis.MundoMimoV2RuntimeV430,D=globalThis.MundoMimoV2DepthV500;
if(!P||!E||!R||!D)throw new Error('Mundo Mimo V620 semantic dependencies missing');
const VERSION=620,MIN_GAMES=150,MIN_MECHANICS=40,MIN_SKILLS=30,MIN_CHALLENGES=25000;
const games=Object.freeze([...E.merged]);
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(/\s+/).filter(x=>x.length>2));
const jac=(a,b)=>{const A=tokens(a),B=tokens(b);if(!A.size&&!B.size)return 1;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i)};
const signature=g=>[g.area,g.skill,g.subskill,g.mechanic,g.objective,g.rules?.interaction,g.rules?.win,g.rules?.progression].map(normalize).join('|');
function challengeContract(c){return [c.gameId,c.activityId,c.levelId,c.slot,c.mechanic,c.difficulty,c.tier,c.supportIntensity,c.distractorBand,c.context,c.representation,c.variationKey].join('|')}
function audit(){
 const errors=[],ids=new Set(),names=new Set(),signatures=new Map(),skills=new Set(),mechanics=new Set(),ages=Object.fromEntries(P.ageBands.map(x=>[x.id,0]));
 if(games.length<MIN_GAMES)errors.push(`catalog:games:${games.length}`);
 for(const g of games){
  if(ids.has(g.id))errors.push(`${g.id}:duplicate-id`);ids.add(g.id);
  const name=normalize(g.name);if(names.has(name))errors.push(`${g.id}:duplicate-name:${name}`);names.add(name);
  if(!(R.implemented||[]).includes(g.id))errors.push(`${g.id}:not-playable`);
  for(const key of ['area','skill','subskill','mechanic','objective'])if(!normalize(g[key]))errors.push(`${g.id}:missing-${key}`);
  for(const key of ['interaction','win','progression'])if(!normalize(g.rules?.[key]))errors.push(`${g.id}:missing-rule-${key}`);
  const sig=signature(g);if(signatures.has(sig))errors.push(`${g.id}:semantic-clone-of:${signatures.get(sig)}`);else signatures.set(sig,g.id);
  skills.add(g.skill);mechanics.add(g.mechanic);for(const a of g.ages||[])if(a in ages)ages[a]++;
 }
 if(skills.size<MIN_SKILLS)errors.push(`skills:count:${skills.size}`);if(mechanics.size<MIN_MECHANICS)errors.push(`mechanics:count:${mechanics.size}`);
 for(const [a,n] of Object.entries(ages))if(!n)errors.push(`age:${a}:empty`);
 const near=[];for(let i=0;i<games.length;i++)for(let j=i+1;j<games.length;j++){const a=games[i],b=games[j];if(a.mechanic!==b.mechanic&&a.skill!==b.skill)continue;const score=jac(`${a.objective} ${a.rules.interaction} ${a.rules.win} ${a.rules.progression}`,`${b.objective} ${b.rules.interaction} ${b.rules.win} ${b.rules.progression}`);if(score>=.88)near.push({a:a.id,b:b.id,score:Number(score.toFixed(3))});}
 for(const x of near)errors.push(`${x.a}:near-clone:${x.b}:${x.score}`);
 let challengeCount=0;const challengeIds=new Set(),contracts=new Set();
 for(const g of games)for(let l=1;l<=36;l++)for(let s=1;s<=5;s++){
  const c=D.challenge(g.id,l,s);challengeCount++;
  for(const e of D.validateChallenge(c))errors.push(`${c.id}:${e}`);
  if(challengeIds.has(c.id))errors.push(`${c.id}:duplicate-challenge-id`);challengeIds.add(c.id);
  const contract=challengeContract(c);if(contracts.has(contract))errors.push(`${c.id}:duplicate-challenge-contract`);contracts.add(contract);
  if(c.difficulty!==((l-1)%9)+1)errors.push(`${c.id}:difficulty-mismatch`);
 }
 if(challengeCount<MIN_CHALLENGES)errors.push(`challenges:count:${challengeCount}`);
 return Object.freeze({version:VERSION,errors:Object.freeze(errors),games:games.length,skills:skills.size,mechanics:mechanics.size,ageCoverage:Object.freeze({...ages}),challenges:challengeCount,uniqueChallengeContracts:contracts.size,nearClones:Object.freeze(near)});
}
const result=audit();globalThis.MundoMimoV2SemanticV620=Object.freeze({version:VERSION,audit,result,signature});
})();