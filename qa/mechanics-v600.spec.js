const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ExpansionV430)&&Boolean(window.MundoMimoV2RuntimeV430)&&typeof window.MundoMimoV2Performance?.startGame==='function'&&window.MundoMimoV2CatalogRouterBootstrap?.version===594);
  await page.addScriptTag({url:'/v2/core/mechanics-v600.js'});
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2MechanicsV600));
}

async function representatives(page){
  return page.evaluate(()=>{
    const a=window.MundoMimoV2MechanicsV600.audit();
    const games=window.MundoMimoV2ExpansionV430.merged;
    return a.representatives.map(r=>{const g=games.find(x=>x.id===r.gameId);return{...r,name:g.name,age:g.ages[0]};});
  });
}

test('V600 ties the final 150-game catalog to at least 40 declared mechanics and runtime owners',async({page})=>{
  await boot(page);
  const audit=await page.evaluate(()=>window.MundoMimoV2MechanicsV600.audit());
  expect(audit.errors).toEqual([]);
  expect(audit.games).toBe(150);
  expect(audit.mechanics).toBeGreaterThanOrEqual(40);
  expect(audit.families).toBeGreaterThanOrEqual(12);
  expect(audit.representatives).toHaveLength(audit.mechanics);
  for(const n of Object.values(audit.ageCoverage))expect(n).toBeGreaterThanOrEqual(4);
});

// Keep every physical launch under the normal 30 s Playwright budget instead of inflating a
// timeout for a 40+ mechanic marathon. Six deterministic shards still cover every representative.
for(let shard=0;shard<6;shard++){
  test(`every mechanic physically launches into real playable UI in WebKit [${shard+1}/6]`,async({page})=>{
    await boot(page);
    const reps=await representatives(page);
    expect(reps.length).toBeGreaterThanOrEqual(40);
    const subset=reps.filter((_,index)=>index%6===shard);
    expect(subset.length).toBeGreaterThan(0);
    for(const rep of subset){
      await page.locator(`[data-age="${rep.age}"]`).click();
      const card=page.locator(`[data-game="${rep.gameId}"]`);
      await expect(card,`missing physical card for ${rep.mechanic}/${rep.gameId}`).toBeVisible();
      await card.click();
      await expect(page.locator('#stage')).toBeVisible();
      await expect(page.locator('#gameTitle')).toHaveText(rep.name);
      const live=await page.locator('#play').evaluate(el=>({
        interactive:el.querySelectorAll('button,input,select,textarea,canvas,[role="button"],[draggable="true"],.draggable,.bigTarget,.hiddenObj,.pad,.block').length,
        text:(el.textContent||'').trim().length,
        html:el.innerHTML.length
      }));
      expect(live.html,`${rep.mechanic}/${rep.gameId} rendered no play content`).toBeGreaterThan(0);
      expect(live.interactive+live.text,`${rep.mechanic}/${rep.gameId} rendered no actionable or instructional UI`).toBeGreaterThan(0);

      // Exercise the real user back path before switching developmental band. Age controls are
      // intentionally hidden while a game is open, so this also certifies recovery to catalog UI.
      await page.locator('#closeGame').click();
      await expect(page.locator('#stage')).toBeHidden();
      await expect(page.locator('#gameGrid')).toBeVisible();
    }
  });
}

test('40+ mechanics are not aliases of one repeated interaction shell',async({page})=>{
  await boot(page);
  const reps=await representatives(page);
  const evidence=await page.evaluate(reps=>{
    const signatures=new Map();
    for(const rep of reps){
      window.MundoMimoV2Performance.startGame(rep.gameId);
      const el=document.querySelector('#play');
      const interactive=el.querySelectorAll('button,input,select,textarea,canvas,[role="button"],[draggable="true"],.draggable,.bigTarget,.hiddenObj,.pad,.block').length;
      const signature=[interactive,el.children.length,el.querySelectorAll('button').length,el.querySelectorAll('canvas').length,el.querySelectorAll('[draggable="true"],.draggable').length].join(':');
      if(!signatures.has(signature))signatures.set(signature,[]);
      signatures.get(signature).push(rep.mechanic);
    }
    return{signatureCount:signatures.size,signatures:[...signatures.entries()]};
  },reps);
  // This preserves the original global diversity bar while the physical coverage is sharded.
  expect(evidence.signatureCount,JSON.stringify(evidence.signatures)).toBeGreaterThanOrEqual(8);
});

test('mechanic coverage exists across every developmental band instead of being concentrated in older ages',async({page})=>{
  await boot(page);
  const coverage=await page.evaluate(()=>{
    const games=window.MundoMimoV2ExpansionV430.merged;
    return Object.fromEntries(window.MundoMimoV2.ageBands.map(b=>[b.id,{games:games.filter(g=>g.ages.includes(b.id)).length,mechanics:new Set(games.filter(g=>g.ages.includes(b.id)).map(g=>g.mechanic)).size}]));
  });
  for(const [age,data] of Object.entries(coverage)){
    expect(data.games,`${age} has no meaningful game coverage`).toBeGreaterThanOrEqual(4);
    expect(data.mechanics,`${age} has insufficient mechanic diversity`).toBeGreaterThanOrEqual(4);
  }
});