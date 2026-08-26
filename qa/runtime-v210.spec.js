const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV210));
}

test('v210 exposes eighteen implemented games across eighteen distinct mechanics',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>({implemented:window.MundoMimoV2RuntimeV210.implemented,handlers:window.MundoMimoV2RuntimeV210.handlers,games:window.MundoMimoV2Seed.games.map(g=>({id:g.id,mechanic:g.mechanic}))}));
  expect(result.implemented).toHaveLength(18);
  expect(new Set(result.implemented).size).toBe(18);
  expect(new Set(result.handlers).size).toBe(18);
  const mechanics=result.implemented.map(id=>result.games.find(g=>g.id===id).mechanic);
  expect(new Set(mechanics).size).toBe(18);
});

test('new games remain filtered by developmental age',async({page})=>{
  await boot(page);
  await page.locator('[data-age="2-3"]').click();
  await expect(page.locator('[data-game="sonido-inicial"]')).toHaveCount(0);
  await expect(page.locator('[data-game="continua-el-patron"]')).toHaveCount(0);
  await page.locator('[data-age="4-5"]').click();
  await expect(page.locator('[data-game="sonido-inicial"]')).toHaveCount(1);
  await expect(page.locator('[data-game="continua-el-patron"]')).toHaveCount(1);
  await expect(page.locator('[data-game="rimas-de-mimo"]')).toHaveCount(1);
});

test('pattern game rejects a distractor and accepts the rule answer',async({page})=>{
  await boot(page);await page.locator('[data-age="4-5"]').click();await page.locator('[data-game="continua-el-patron"]').click();
  const answers=page.locator('[data-pattern]');await expect(answers).toHaveCount(3);
  const correct=await answers.evaluateAll(xs=>xs.find(x=>x.dataset.pattern==='🔵')?.dataset.pattern);
  expect(correct).toBe('🔵');
  await page.locator('[data-pattern="🟢"]').click();await expect(page.locator('#feedback')).toContainText('repite');
  await page.locator('[data-pattern="🔵"]').click();await expect(page.locator('#feedback')).toContainText('regla');
});

test('odd-one-out uses semantic category rather than content-only variation',async({page})=>{
  await boot(page);await page.locator('[data-age="4-5"]').click();await page.locator('[data-game="encuentra-el-intruso"]').click();
  await page.locator('[data-odd="0"]').click();await expect(page.locator('#feedback')).toContainText('categoría');
  await page.locator('[data-odd="3"]').click();await expect(page.locator('#feedback')).toContainText('intruso');
});

test('story ordering enforces temporal sequence',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="historia-en-tres"]').click();
  await page.locator('[data-story="2"]').click();await expect(page.locator('#feedback')).toContainText('antes');
  for(const i of [0,1,2])await page.locator(`[data-story="${i}"]`).click();
  await expect(page.locator('#feedback')).toContainText('Historia bien ordenada');
});

test('initial-sound game validates phonological target',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="sonido-inicial"]').click();
  await page.locator('[data-word="Sol"]').click();await expect(page.locator('#feedback')).toContainText('primer sonido');
  await page.locator('[data-word="Mesa"]').click();await expect(page.locator('#feedback')).toContainText('sonido inicial');
});

test('rhyme game requires the correct pair',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="rimas-de-mimo"]').click();
  await page.locator('[data-rhyme="0"]').click();await page.locator('[data-rhyme="2"]').click();await expect(page.locator('#feedback')).toContainText('terminan');
  await page.locator('[data-rhyme="0"]').click();await page.locator('[data-rhyme="1"]').click();await expect(page.locator('#feedback')).toContainText('riman');
});

test('guided trace requires meaningful pointer movement before success',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="traza-la-letra"]').click();
  const box=page.locator('[data-trace-box]');await expect(box).toBeVisible();
  const r=await box.boundingBox();
  await page.mouse.move(r.x+20,r.y+80);await page.mouse.down();await page.mouse.move(r.x+140,r.y+80,{steps:5});await page.mouse.up();
  await expect(page.locator('#feedback')).toContainText('Buen trazo');
});
