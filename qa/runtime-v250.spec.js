const {test,expect}=require('@playwright/test');

async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV250));}

test('v250 exposes forty-two implemented games across forty-two distinct mechanics',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>{const x=window.MundoMimoV2RuntimeV250;return{implemented:x.implemented,handlers:x.handlers,games:x.allGames().map(g=>({id:g.id,mechanic:g.mechanic})),errors:window.MundoMimoV2ExpansionV250.errors,clones:window.MundoMimoV2ExpansionV250.cloneGroups}});
  expect(r.errors).toEqual([]);expect(r.clones).toEqual([]);expect(r.implemented).toHaveLength(42);expect(new Set(r.implemented).size).toBe(42);expect(new Set(r.handlers).size).toBe(42);
  const mechanics=r.implemented.map(id=>r.games.find(g=>g.id===id)?.mechanic);expect(mechanics.every(Boolean)).toBeTruthy();expect(new Set(mechanics).size).toBe(42);
});

test('v250 improves age coverage at both ends without leaking advanced games to toddlers',async({page})=>{
  await boot(page);await page.locator('[data-age="0-1"]').click();await expect(page.locator('[data-game="sigue-la-luz"]')).toHaveCount(1);await expect(page.locator('[data-game="cuadricula-logica"]')).toHaveCount(0);
  await page.locator('[data-age="1-2"]').click();await expect(page.locator('[data-game="lleva-a-casa"]')).toHaveCount(1);
  await page.locator('[data-age="5-6"]').click();await expect(page.locator('[data-game="cuadricula-logica"]')).toHaveCount(1);await expect(page.locator('[data-game="sigue-la-luz"]')).toHaveCount(0);
});

test('follow-light requires tracking three successive positions',async({page})=>{
  await boot(page);await page.locator('[data-age="0-1"]').click();await page.locator('[data-game="sigue-la-luz"]').click();const light=page.locator('[data-light]');
  await light.click();await expect(page.locator('#feedback')).toContainText('1/3');await light.click();await expect(page.locator('#feedback')).toContainText('2/3');await light.click();await expect(page.locator('#feedback')).toContainText('Seguiste la luz');
});

test('home sorting supports actual drag-and-drop and rejects the wrong destination',async({page})=>{
  await boot(page);await page.locator('[data-age="1-2"]').click();await page.locator('[data-game="lleva-a-casa"]').click();
  await page.locator('[data-object]').dragTo(page.locator('[data-home="false"]'));await expect(page.locator('#feedback')).toContainText('no es el lugar');
  await page.locator('[data-object]').dragTo(page.locator('[data-home="true"]'));await expect(page.locator('#feedback')).toContainText('arrastraste');
});

test('missing-object game uses a memory phase before answering',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="que-falta"]').click();await expect(page.locator('[data-answers]')).toBeHidden();await page.locator('[data-hide]').click();await expect(page.locator('[data-answers]')).toBeVisible();
  await page.locator('[data-missing="1"]').click();await expect(page.locator('#feedback')).toContainText('sigue en la escena');await page.locator('[data-missing="0"]').click();await expect(page.locator('#feedback')).toContainText('Recordaste');
});

test('emotion-context game interprets a situation instead of matching a decorative face',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="caras-y-situaciones"]').click();await page.locator('[data-emotion="😢"]').click();await expect(page.locator('#feedback')).toContainText('Piensa');await page.locator('[data-emotion="😊"]').click();await expect(page.locator('#feedback')).toContainText('situación');
});

test('sound recognition provides replay and distinguishes instrument identities',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="orquesta-de-sonidos"]').click();await expect(page.locator('[data-listen]')).toBeVisible();await page.locator('[data-sound="Tambor"]').click();await expect(page.locator('#feedback')).toContainText('diferente');await page.locator('[data-sound="Campana"]').click();await expect(page.locator('#feedback')).toContainText('fuente del sonido');
});

test('logic grid rejects a clue violation and accepts the unique valid combination',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="cuadricula-logica"]').click();await page.locator('[data-cell="cat-star"]').click();await expect(page.locator('#feedback')).toContainText('contradice');await page.locator('[data-cell="dog-circle"]').click();await expect(page.locator('#feedback')).toContainText('pistas');
});
