const {test,expect}=require('@playwright/test');

async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV240));}

test('v240 exposes thirty-six implemented games across thirty-six distinct mechanics',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>{const x=window.MundoMimoV2RuntimeV240;return{implemented:x.implemented,handlers:x.handlers,games:x.allGames().map(g=>({id:g.id,mechanic:g.mechanic})),errors:window.MundoMimoV2ExpansionV240.errors,clones:window.MundoMimoV2ExpansionV240.cloneGroups}});
  expect(r.errors).toEqual([]);expect(r.clones).toEqual([]);expect(r.implemented).toHaveLength(36);expect(new Set(r.implemented).size).toBe(36);expect(new Set(r.handlers).size).toBe(36);
  const mechanics=r.implemented.map(id=>r.games.find(g=>g.id===id)?.mechanic);expect(mechanics.every(Boolean)).toBeTruthy();expect(new Set(mechanics).size).toBe(36);
});

test('v240 adds meaningful play for early ages as well as older children',async({page})=>{
  await boot(page);await page.locator('[data-age="0-1"]').click();await expect(page.locator('[data-game="mantiene-y-descubre"]')).toHaveCount(1);await expect(page.locator('[data-game="musica-por-capas"]')).toHaveCount(0);
  await page.locator('[data-age="1-2"]').click();await expect(page.locator('[data-game="jardin-de-descubrimientos"]')).toHaveCount(1);
  await page.locator('[data-age="5-6"]').click();await expect(page.locator('[data-game="musica-por-capas"]')).toHaveCount(1);await expect(page.locator('[data-game="ciudad-simbolica"]')).toHaveCount(1);
});

test('music composition requires combining multiple independently selectable layers',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="musica-por-capas"]').click();
  await page.locator('[data-play-band]').click();await expect(page.locator('#feedback')).toContainText('dos capas');
  await page.locator('[data-layer="Ritmo"]').click();await page.locator('[data-layer="Melodía"]').click();await page.locator('[data-play-band]').click();await expect(page.locator('#feedback')).toContainText('combinación musical');
});

test('symbolic city keeps free decoration but requires the core mission elements',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="ciudad-simbolica"]').click();
  await page.locator('[data-city-item="🌳"]').click();await page.locator('[data-check-city]').click();await expect(page.locator('#feedback')).toContainText('elementos esenciales');
  await page.locator('[data-city-item="🚒"]').click();await page.locator('[data-city-item="🧑‍🚒"]').click();await page.locator('[data-check-city]').click();await expect(page.locator('#feedback')).toContainText('escena');
});

test('hold and release requires sustained motor control rather than a tap',async({page})=>{
  await boot(page);await page.locator('[data-age="0-1"]').click();await page.locator('[data-game="mantiene-y-descubre"]').click();const target=page.locator('[data-hold]');
  await target.dispatchEvent('pointerdown',{pointerId:1});await page.waitForTimeout(80);await target.dispatchEvent('pointerup',{pointerId:1});await expect(page.locator('#feedback')).toContainText('mantener');
  await target.dispatchEvent('pointerdown',{pointerId:2});await page.waitForTimeout(700);await target.dispatchEvent('pointerup',{pointerId:2});await expect(page.locator('#feedback')).toContainText('Controlaste');
});

test('semantic connection game rejects unrelated pairs and completes all valid pairs',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="une-las-parejas"]').click();
  await page.locator('[data-left="0"]').click();await page.locator('[data-right="✋"]').click();await expect(page.locator('#feedback')).toContainText('no encaja');
  for(const [i,right] of [['0','🦷'],['1','✋'],['2','🦶']]){await page.locator(`[data-left="${i}"]`).click();await page.locator(`[data-right="${right}"]`).click()}
  await expect(page.locator('#feedback')).toContainText('relaciones');
});

test('color-fill game validates both requested color and target shape',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="pinta-la-forma"]').click();await page.locator('[data-paint-color="#ff5a62"]').click();
  const circles=page.locator('[data-kind="●"]');for(let i=0;i<await circles.count();i++)await circles.nth(i).click();await page.locator('[data-check-paint]').click();await expect(page.locator('#feedback')).toContainText('color y la forma');
});

test('free exploration rewards three distinct discoveries without imposing an order',async({page})=>{
  await boot(page);await page.locator('[data-age="1-2"]').click();await page.locator('[data-game="jardin-de-descubrimientos"]').click();
  await page.locator('[data-garden="2"]').click();await page.locator('[data-garden="0"]').click();await page.locator('[data-garden="1"]').click();await expect(page.locator('#feedback')).toContainText('Exploraste');
});
