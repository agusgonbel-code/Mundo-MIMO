const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2WorldsV510&&window.MundoMimoV2DepthV500&&window.MundoMimoV2RuntimeV430));
}

test('v510 exposes six native worlds before the game library',async({page})=>{
  await boot(page);
  const data=await page.evaluate(()=>({worlds:window.MundoMimoV2WorldsV510.worlds.map(w=>w.id),worldTitleTop:document.getElementById('worldsTitle').getBoundingClientRect().top,gamesTitleTop:document.getElementById('gamesTitle').getBoundingClientRect().top,cards:document.querySelectorAll('[data-world-card]').length}));
  expect(data.worlds).toEqual(['pradera','bosque','laguna','villa','montana','laboratorio']);
  expect(data.cards).toBe(6);
  expect(data.worldTitleTop).toBeLessThan(data.gamesTitleTop);
});

test('world game pools respect both curricular area and selected developmental band',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const W=window.MundoMimoV2WorldsV510,R=window.MundoMimoV2RuntimeV430;
    return W.worlds.map(w=>({id:w.id,areas:w.areas,games:W.eligibleGames(w.id,'3-4').map(g=>({id:g.id,area:g.area,ages:g.ages}))}));
  });
  for(const w of result)for(const g of w.games){expect(w.areas).toContain(g.area);expect(g.ages).toContain('3-4');}
  expect(result.some(w=>w.games.length>0)).toBeTruthy();
});

test('world progression starts safely locked and unlocks from genuine completed-game evidence',async({page})=>{
  await boot(page);
  const initial=await page.evaluate(()=>{localStorage.removeItem('mimo-v2-runtime-200');window.MundoMimoV2WorldsV510.reset();return window.MundoMimoV2WorldsV510.worldState().map(w=>({id:w.id,unlocked:w.unlocked}));});
  expect(initial[0].unlocked).toBeTruthy();
  expect(initial.slice(1).every(w=>!w.unlocked)).toBeTruthy();
  const after=await page.evaluate(()=>{
    const games=window.MundoMimoV2RuntimeV430.implemented.slice(0,8),state={games:{}};
    for(const id of games)state.games[id]={plays:1,success:1,last:Date.now()};
    localStorage.setItem('mimo-v2-runtime-200',JSON.stringify(state));
    window.MundoMimoV2WorldsV510.render();
    return window.MundoMimoV2WorldsV510.worldState().map(w=>({id:w.id,unlocked:w.unlocked}));
  });
  expect(after.find(w=>w.id==='bosque').unlocked).toBeTruthy();
  expect(after.find(w=>w.id==='laguna').unlocked).toBeTruthy();
});

test('entering an unlocked world persists the visit and launches an age-eligible real game',async({page})=>{
  await boot(page);
  await page.evaluate(()=>{localStorage.removeItem('mimo-v2-runtime-200');window.MundoMimoV2WorldsV510.reset();});
  const target=await page.evaluate(()=>window.MundoMimoV2WorldsV510.representative('pradera'));
  expect(target).toBeTruthy();
  const entered=await page.evaluate(()=>window.MundoMimoV2WorldsV510.enter('pradera'));
  expect(entered).toBeTruthy();
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#gameTitle')).toHaveText(target.name);
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo-v2-worlds-v510')).visited.pradera);
  expect(Number(persisted)).toBeGreaterThan(0);
});

test('world UI remains within small iPhone width and touch targets stay usable',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await boot(page);
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth,buttons:[...document.querySelectorAll('.worldEnter')].map(b=>b.getBoundingClientRect().height)}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner+1);
  expect(Math.min(...metrics.buttons)).toBeGreaterThanOrEqual(44);
});

test('locked worlds cannot launch games programmatically',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{localStorage.removeItem('mimo-v2-runtime-200');window.MundoMimoV2WorldsV510.reset();return window.MundoMimoV2WorldsV510.enter('laboratorio');});
  expect(result).toBeFalsy();
  await expect(page.locator('#stage')).toBeHidden();
});
