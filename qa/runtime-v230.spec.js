const {test,expect}=require('@playwright/test');

async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV230));}

test('v230 exposes thirty implemented games across thirty distinct mechanics',async({page})=>{
  await boot(page);
  const r=await page.evaluate(()=>({implemented:window.MundoMimoV2RuntimeV230.implemented,handlers:window.MundoMimoV2RuntimeV230.handlers,games:window.MundoMimoV2Seed.games.map(g=>({id:g.id,mechanic:g.mechanic}))}));
  expect(r.implemented).toHaveLength(30);expect(new Set(r.implemented).size).toBe(30);expect(new Set(r.handlers).size).toBe(30);
  const mechanics=r.implemented.map(id=>r.games.find(g=>g.id===id).mechanic);expect(new Set(mechanics).size).toBe(30);
});

test('v230 advanced games stay filtered out below their developmental range',async({page})=>{
  await boot(page);await page.locator('[data-age="3-4"]').click();
  for(const id of ['sombras-y-luz','flota-o-se-hunde','mapa-del-tesoro','sigue-tres-instrucciones','palabra-e-imagen','simetria-magica'])await expect(page.locator(`[data-game="${id}"]`)).toHaveCount(0);
  await page.locator('[data-age="5-6"]').click();
  for(const id of ['sombras-y-luz','flota-o-se-hunde','mapa-del-tesoro','sigue-tres-instrucciones','palabra-e-imagen','simetria-magica'])await expect(page.locator(`[data-game="${id}"]`)).toHaveCount(1);
});

test('shadow laboratory requires manipulating the light before success',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="sombras-y-luz"]').click();
  await page.locator('[data-check-shadow]').click();await expect(page.locator('#feedback')).toContainText('Acerca');
  await page.locator('[data-light]').fill('95');await page.locator('[data-check-shadow]').click();await expect(page.locator('#feedback')).toContainText('sombra');
});

test('float or sink records a prediction and then reveals the experiment result',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="flota-o-se-hunde"]').click();
  await expect(page.locator('[data-test-water]')).toBeDisabled();await page.locator('[data-predict="true"]').click();await expect(page.locator('[data-test-water]')).toBeEnabled();
  await page.locator('[data-test-water]').click();await expect(page.locator('[data-water]')).not.toHaveText('');await expect(page.locator('#feedback')).toContainText(/predicción|descubierto/i);
});

test('treasure map rejects an out-of-order move and accepts the exact route',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="mapa-del-tesoro"]').click();
  await page.locator('[data-dir="arriba"]').click();await expect(page.locator('#feedback')).toContainText('no coincide');
  for(const d of ['derecha','arriba','derecha'])await page.locator(`[data-dir="${d}"]`).click();
  await expect(page.locator('#feedback')).toContainText('tesoro');
});

test('three-step mission hides instructions and resets sequence after a wrong action',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="sigue-tres-instrucciones"]').click();
  await page.locator('[data-step="toca estrella"]').click();await expect(page.locator('#feedback')).toContainText('Primero');
  await page.locator('[data-hide-inst]').click();await page.locator('[data-step="toca luna"]').click();await expect(page.locator('#feedback')).toContainText('siguiente paso');
  for(const step of ['toca estrella','toca círculo','toca luna'])await page.locator(`[data-step="${step}"]`).click();
  await expect(page.locator('#feedback')).toContainText('tres instrucciones');
});

test('word builder enforces letter order rather than accepting any letter set',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="palabra-e-imagen"]').click();
  await page.locator('[data-letter="M"]').click();await expect(page.locator('#feedback')).toContainText('qué letra viene');
  for(const l of ['S','O','L'])await page.locator(`[data-letter="${l}"]`).click();
  await expect(page.locator('#feedback')).toContainText('palabra');
});

test('symmetry requires the exact mirrored cells',async({page})=>{
  await boot(page);await page.locator('[data-age="5-6"]').click();await page.locator('[data-game="simetria-magica"]').click();
  await page.locator('[data-cell="0,2"]').click();await page.locator('[data-check-sym]').click();await expect(page.locator('#feedback')).toContainText('Compara');
  await page.locator('[data-cell="0,2"]').click();
  for(const cell of ['0,3','1,3','2,2'])await page.locator(`[data-cell="${cell}"]`).click();
  await page.locator('[data-check-sym]').click();await expect(page.locator('#feedback')).toContainText('simétricas');
});
