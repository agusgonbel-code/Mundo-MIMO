const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2AdaptationV610&&window.MundoMimoV2DepthV500&&window.MundoMimoV2RuntimeV430));
}
async function chooseAge(page,age){await page.locator(`[data-age="${age}"]`).click();await expect(page.locator(`[data-age="${age}"]`)).toHaveAttribute('aria-pressed','true')}
async function openEcho(page){await chooseAge(page,'1-2');const card=page.locator('[data-game="eco-de-gestos"]');await expect(card).toBeVisible();await card.click();await expect(page.locator('#gameTitle')).toHaveText('Eco de gestos');await expect(page.locator('#stage')).toHaveAttribute('data-adaptive-game','eco-de-gestos')}

 test('V610 connects real first-attempt performance to adaptive progression and persistence',async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.MundoMimoV2DepthV500.reset('eco-de-gestos'));
  await openEcho(page);
  await expect(page.locator('#gameMeta')).toContainText('Nivel 1/36');

  await page.locator('[data-gesture="sentado"]').click();
  await expect(page.locator('#feedback')).not.toHaveText('');
  await page.locator('[data-gesture="manos-arriba"]').click();
  await page.waitForSelector('[data-gesture="saluda"]');
  let p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));
  expect(p).toMatchObject({level:1,attempts:1,correct:0,streak:-1});

  await page.locator('[data-gesture="saluda"]').click();
  await page.waitForSelector('[data-gesture="aplaude"]');
  await page.locator('[data-gesture="aplaude"]').click();
  await page.waitForSelector('[data-again-v430]');
  await page.locator('[data-again-v430]').click();
  await page.waitForSelector('[data-gesture="manos-arriba"]');
  await page.locator('[data-gesture="manos-arriba"]').click();
  await page.waitForSelector('[data-gesture="saluda"]');
  p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));
  expect(p.level).toBe(2);
  expect(p.attempts).toBe(4);
  expect(p.correct).toBe(3);
  await expect(page.locator('#gameMeta')).toContainText('Nivel 2/36');

  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2AdaptationV610));
  p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));
  expect(p.level).toBe(2);
  await openEcho(page);
  await expect(page.locator('#gameMeta')).toContainText('Nivel 2/36');

  await page.locator('[data-gesture="sentado"]').click();
  await page.locator('[data-gesture="manos-arriba"]').click();
  await page.waitForSelector('[data-gesture="saluda"]');
  await page.locator('[data-gesture="duerme"]').click();
  await page.locator('[data-gesture="saluda"]').click();
  await page.waitForSelector('[data-gesture="aplaude"]');
  p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));
  expect(p.level).toBe(1);
  expect(p.streak).toBe(0);
  await expect(page.locator('#gameMeta')).toContainText('Nivel 1/36');
});

test('V610 can create an age-valid adaptive session for every one of the 150 real games',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const A=window.MundoMimoV2AdaptationV610,R=window.MundoMimoV2RuntimeV430;
    return R.allGames().map(g=>{const s=A.begin(g.id);return{id:g.id,gameId:s?.gameId,age:s?.ageBand,ages:g.ages,level:s?.level?.number,challengeCount:s?.challenges?.length}});
  });
  expect(result).toHaveLength(150);
  for(const x of result){expect(x.gameId).toBe(x.id);expect(x.ages).toContain(x.age);expect(x.level).toBeGreaterThanOrEqual(1);expect(x.level).toBeLessThanOrEqual(36);expect(x.challengeCount).toBe(5)}
});
