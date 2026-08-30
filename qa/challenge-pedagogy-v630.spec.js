const {test,expect}=require('@playwright/test');
async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2DepthV500&&window.MundoMimoV2RuntimeV430));}

test('V630 certifies 27,000 semantic challenge payloads instead of identifier-only uniqueness',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>window.MundoMimoV2DepthV500.audit());
  expect(r.errors).toEqual([]);
  expect(r.games).toBe(150);
  expect(r.activities).toBe(600);
  expect(r.levels).toBe(5400);
  expect(r.challenges).toBe(27000);
  expect(r.semanticChallenges).toBe(27000);
});

test('every level exposes five distinct pedagogical roles and explicit context, representation and demand',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430;
    return R.implemented.map(id=>({id,levels:Array.from({length:36},(_,i)=>D.challengesForLevel(id,i+1).map(c=>({role:c.role,demand:c.cognitiveDemand,context:c.context,representation:c.representation,prompt:c.prompt,key:c.semanticKey})))}));
  });
  expect(result).toHaveLength(150);
  for(const g of result)for(const level of g.levels){
    expect(new Set(level.map(c=>c.role)).size).toBe(5);
    expect(new Set(level.map(c=>c.key)).size).toBe(5);
    for(const c of level){expect(c.prompt).toContain(c.context);expect(c.prompt).toContain(c.representation);expect(c.prompt).toContain(c.demand);expect(c.key.length).toBeGreaterThan(80);}
  }
});

test('difficulty carries the complete ordered nine-step cognitive demand progression inside every activity',async({page})=>{
  await boot(page);
  const data=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430;
    return {
      expected:[...D.difficultyDemands],
      games:R.implemented.map(id=>Array.from({length:4},(_,a)=>Array.from({length:9},(_,i)=>D.challenge(id,a*9+i+1,1).cognitiveDemand)))
    };
  });
  expect(data.expected).toHaveLength(9);
  expect(new Set(data.expected).size).toBe(9);
  for(const game of data.games)for(const activity of game){
    expect(activity).toEqual(data.expected);
    expect(new Set(activity).size).toBe(9);
  }
});

test('semantic uniqueness survives after stripping all challenge identity fields',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430,keys=[];
    for(const id of R.implemented)for(let l=1;l<=36;l++)for(const c of D.challengesForLevel(id,l))keys.push(c.semanticKey);
    return{count:keys.length,unique:new Set(keys).size};
  });
  expect(r.count).toBe(27000);
  expect(r.unique).toBe(27000);
});
