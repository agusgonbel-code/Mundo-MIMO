const {test,expect}=require('@playwright/test');

async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV220));}

test('v220 exposes twenty-four implemented games across twenty-four distinct mechanics',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>({implemented:window.MundoMimoV2RuntimeV220.implemented,handlers:window.MundoMimoV2RuntimeV220.handlers,games:window.MundoMimoV2Seed.games.map(g=>({id:g.id,mechanic:g.mechanic}))}));
  expect(r.implemented).toHaveLength(24);expect(new Set(r.implemented).size).toBe(24);expect(new Set(r.handlers).size).toBe(24);
  const mechanics=r.implemented.map(id=>r.games.find(g=>g.id===id).mechanic);expect(new Set(mechanics).size).toBe(24);
});

test('v220 games remain developmentally filtered',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();
  for(const id of ['mercado-de-mimo','clasifica-dos-pistas','elige-la-solucion','cuento-con-decisiones'])await expect(page.locator(`[data-game="${id}"]`)).toHaveCount(0);
  await page.locator('[data-age="4-5"]').click();
  for(const id of ['mercado-de-mimo','clasifica-dos-pistas','elige-la-solucion','cuento-con-decisiones'])await expect(page.locator(`[data-game="${id}"]`)).toHaveCount(1);
});

test('geometry construction requires the correct component combination',async({page})=>{
  await boot(page);await page.locator('[data-age="4-5"]').click();await page.locator('[data-game="construye-la-figura"]').click();
  await page.locator('[data-piece="●"]').click();await page.locator('[data-piece="■"]').click();await expect(page.locator('#feedback')).toContainText('modelo');
  await page.locator('[data-piece="■"]').click();await page.locator('[data-piece="▲"]').click();await expect(page.locator('#feedback')).toContainText('construida');
});

test('market game checks arithmetic composition rather than a content variant',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="mercado-de-mimo"]').click();
  await page.locator('[data-total="2"]').click();await expect(page.locator('#feedback')).toContainText('Cuenta');
  await page.locator('[data-total="3"]').click();await expect(page.locator('#feedback')).toContainText('compra');
});

test('double classification requires both attributes',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="clasifica-dos-pistas"]').click();
  await page.locator('[data-cell="0"]').click();await expect(page.locator('#feedback')).toContainText('dos características');
  await page.locator('[data-cell="1"]').click();await expect(page.locator('#feedback')).toContainText('dos pistas');
});

test('sequence echo hides the model before accepting reproduction',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="eco-de-secuencias"]').click();
  await page.locator('[data-ready]').click();await expect(page.locator('[data-demo]')).toContainText('❓');
  for(const i of [0,1,0])await page.locator(`[data-echo="${i}"]`).click();
  await expect(page.locator('#feedback')).toContainText('secuencia');
});

test('social choice rejects harmful option and accepts prosocial strategy',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="elige-la-solucion"]').click();
  await page.locator('[data-social="false"]').first().click();await expect(page.locator('#feedback')).toContainText('cuide');
  await page.locator('[data-social="true"]').click();await expect(page.locator('#feedback')).toContainText('respetuosa');
});

test('interactive story requires a coherent consequence-bearing decision',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="cuento-con-decisiones"]').click();
  await page.locator('[data-story-choice="bad"]').click();await expect(page.locator('#feedback')).toContainText('después');
  await page.locator('[data-story-choice="good"]').click();await expect(page.locator('[data-story-result]')).not.toHaveText('');await expect(page.locator('#feedback')).toContainText('historia');
});
