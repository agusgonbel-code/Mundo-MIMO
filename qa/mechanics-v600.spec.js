const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ExpansionV430)&&Boolean(window.MundoMimoV2RuntimeV430)&&typeof window.MundoMimoV2Performance?.startGame==='function'&&window.MundoMimoV2CatalogRouterBootstrap?.version===594);
  await page.addScriptTag({url:'/v2/core/mechanics-v600.js'});
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2MechanicsV600));
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

test('every mechanic has a representative that physically launches into real playable UI in WebKit',async({page})=>{
  await boot(page);
  const reps=await page.evaluate(()=>{
    const a=window.MundoMimoV2MechanicsV600.audit();
    const games=window.MundoMimoV2ExpansionV430.merged;
    return a.representatives.map(r=>{const g=games.find(x=>x.id===r.gameId);return{...r,name:g.name,age:g.ages[0]};});
  });
  expect(reps.length).toBeGreaterThanOrEqual(40);
  const signatures=new Map();
  for(const rep of reps){
    await page.locator(`[data-age="${rep.age}"]`).click();
    const card=page.locator(`[data-game="${rep.gameId}"]`);
    await expect(card,`missing physical card for ${rep.mechanic}/${rep.gameId}`).toBeVisible();
    await card.click();
    await expect(page.locator('#stage')).toBeVisible();
    await expect(page.locator('#gameTitle')).toHaveText(rep.name);
    const live=await page.locator('#play').evaluate(el=>{
      const interactive=el.querySelectorAll('button,input,select,textarea,canvas,[role="button"],[draggable="true"],.draggable,.bigTarget,.hiddenObj,.pad,.block').length;
      const text=(el.textContent||'').trim().length;
      return{interactive,text,html:el.innerHTML.length,signature:[interactive,el.children.length,el.querySelectorAll('button').length,el.querySelectorAll('canvas').length,el.querySelectorAll('[draggable="true"],.draggable').length].join(':')};
    });
    expect(live.html,`${rep.mechanic}/${rep.gameId} rendered no play content`).toBeGreaterThan(0);
    expect(live.interactive+live.text,`${rep.mechanic}/${rep.gameId} rendered no actionable or instructional UI`).toBeGreaterThan(0);
    const list=signatures.get(live.signature)||[];list.push(rep.mechanic);signatures.set(live.signature,list);
  }
  // DOM shape alone is not a mechanic definition, but a portfolio in which every representative
  // renders the exact same interaction shell is not acceptable evidence of 40 real mechanics.
  expect(signatures.size).toBeGreaterThanOrEqual(8);
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