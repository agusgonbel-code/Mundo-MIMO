const { test, expect } = require('@playwright/test');

async function loadPlatform(page,withSeed=false){
  await page.goto('/app-v70.html');
  await page.addScriptTag({url:'/v2/core/platform-v200.js'});
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2));
  if(withSeed){
    await page.addScriptTag({url:'/v2/catalog/seed-games-v200.js'});
    await page.waitForFunction(()=>Boolean(window.MundoMimoV2Seed));
  }
}

test('Mundo Mimo 2 defines six distinct developmental age bands',async({page})=>{
  await loadPlatform(page);
  const bands=await page.evaluate(()=>window.MundoMimoV2.ageBands.map(x=>x.id));
  expect(bands).toEqual(['0-1','1-2','2-3','3-4','4-5','5-6']);
});

test('Mundo Mimo 2 exposes at least forty genuinely named interaction mechanics',async({page})=>{
  await loadPlatform(page);
  const data=await page.evaluate(()=>({count:window.MundoMimoV2.mechanics.length,ids:window.MundoMimoV2.mechanicIds,families:window.MundoMimoV2.mechanics.map(x=>x.family)}));
  expect(data.count).toBeGreaterThanOrEqual(40);
  expect(new Set(data.ids).size).toBe(data.count);
  expect(new Set(data.families).size).toBeGreaterThanOrEqual(12);
});

test('catalog validator rejects duplicate ids invalid ages and fake mechanics',async({page})=>{
  await loadPlatform(page);
  const errors=await page.evaluate(()=>window.MundoMimoV2.validateCatalog([
    {id:'demo',name:'A',ages:['0-1'],area:'lenguaje',skill:'x',subskill:'y',mechanic:'tap-target',objective:'o',rules:{interaction:'tap',win:'one',progression:'levels'},levels:3,feedback:{},hints:[],accessibility:[]},
    {id:'demo',name:'B',ages:['9-10'],area:'lenguaje',skill:'x2',subskill:'y2',mechanic:'invented',objective:'o2',rules:{interaction:'tap',win:'one',progression:'levels'},levels:3,feedback:{},hints:[],accessibility:[]}
  ]));
  expect(errors).toContain('catalog:duplicate-game-id');
  expect(errors.some(x=>x.includes('invalid:age-band'))).toBeTruthy();
  expect(errors.some(x=>x.includes('invalid:mechanic'))).toBeTruthy();
});

test('clone detector prevents content variants being counted as different games',async({page})=>{
  await loadPlatform(page);
  const clones=await page.evaluate(()=>window.MundoMimoV2.cloneGroups([
    {id:'animal-dog',mechanic:'tap-target',objective:'Reconocer animal',rules:{interaction:'tap',win:'correct',progression:'options'}},
    {id:'animal-cat',mechanic:'tap-target',objective:'Reconocer animal',rules:{interaction:'tap',win:'correct',progression:'options'}},
    {id:'maze-home',mechanic:'maze',objective:'Planificar recorrido',rules:{interaction:'navigate',win:'reach-goal',progression:'branches'}}
  ]));
  expect(clones).toEqual([['animal-dog','animal-cat']]);
});

test('metrics keep games levels challenges and variants separate',async({page})=>{
  await loadPlatform(page);
  const m=await page.evaluate(()=>window.MundoMimoV2.metrics([{id:'g1',skill:'s1',mechanic:'tap-target',objective:'o1',rules:{interaction:'tap',win:'x',progression:'y'}},{id:'g2',skill:'s2',mechanic:'maze',objective:'o2',rules:{interaction:'drag',win:'z',progression:'q'}}],12,80,900,3000));
  expect(m.games).toBe(2);
  expect(m.activities).toBe(12);
  expect(m.levels).toBe(80);
  expect(m.challenges).toBe(900);
  expect(m.variants).toBe(3000);
  expect(m.ageBands).toBe(6);
});

test('seed portfolio contains 36 differentiated game designs without schema errors or clone signatures',async({page})=>{
  await loadPlatform(page,true);
  const audit=await page.evaluate(()=>({
    games:window.MundoMimoV2Seed.games.length,
    errors:window.MundoMimoV2Seed.errors,
    cloneGroups:window.MundoMimoV2Seed.cloneGroups,
    mechanics:new Set(window.MundoMimoV2Seed.games.map(g=>g.mechanic)).size,
    areas:new Set(window.MundoMimoV2Seed.games.map(g=>g.area)).size,
    ageCoverage:Object.fromEntries(window.MundoMimoV2.ageBands.map(b=>[b.id,window.MundoMimoV2Seed.games.filter(g=>g.ages.includes(b.id)).length]))
  }));
  expect(audit.games).toBe(36);
  expect(audit.errors).toEqual([]);
  expect(audit.cloneGroups).toEqual([]);
  expect(audit.mechanics).toBeGreaterThanOrEqual(30);
  expect(audit.areas).toBeGreaterThanOrEqual(12);
  expect(Object.values(audit.ageCoverage).every(n=>n>0)).toBeTruthy();
});
