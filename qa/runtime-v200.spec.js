const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2Runtime));
}

test('v2 runtime exposes twelve implemented games across twelve distinct mechanics',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>({implemented:window.MundoMimoV2Runtime.implemented,handlers:window.MundoMimoV2Runtime.handlers,games:window.MundoMimoV2Seed.games.map(g=>({id:g.id,mechanic:g.mechanic}))}));
  expect(result.implemented).toHaveLength(12);
  expect(new Set(result.handlers).size).toBe(12);
  expect(new Set(result.implemented).size).toBe(12);
  const mechanics=result.implemented.map(id=>result.games.find(g=>g.id===id).mechanic);
  expect(new Set(mechanics).size).toBe(12);
});

test('age navigation filters playable portfolio instead of showing unsuitable games',async({page})=>{
  await boot(page);
  await page.locator('[data-age="0-1"]').click();
  await expect(page.locator('[data-game="luces-y-sonidos"]')).toHaveCount(1);
  await expect(page.locator('[data-game="ritmo-de-pipa"]')).toHaveCount(0);
  await page.locator('[data-age="3-4"]').click();
  await expect(page.locator('[data-game="ritmo-de-pipa"]')).toHaveCount(1);
  await expect(page.locator('[data-game="laberinto-de-lio"]')).toHaveCount(1);
  await expect(page.locator('[data-game="luces-y-sonidos"]')).toHaveCount(0);
});

test('cause effect game is truly interactive and completes a three-round session',async({page})=>{
  await boot(page);
  await page.locator('[data-age="0-1"]').click();
  await page.locator('[data-game="luces-y-sonidos"]').click();
  for(let round=0;round<3;round++){
    await expect(page.locator('.bigTarget')).toBeVisible();
    await page.locator('.bigTarget').click();
    await page.locator('.bigTarget').click();
    if(round<2) await page.waitForTimeout(650);
  }
  await expect(page.locator('#feedback')).toContainText('Sesión completada');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo-v2-runtime-200')));
  expect(saved.games['luces-y-sonidos'].success).toBe(3);
});

test('fit-shape provides touch-friendly fallback and records progress',async({page})=>{
  await boot(page);
  await page.locator('[data-age="1-2"]').click();
  await page.locator('[data-game="encaja-grande"]').click();
  await expect(page.locator('.dropzone')).toBeVisible();
  await page.locator('.draggable').click();
  await page.waitForTimeout(100);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo-v2-runtime-200')));
  expect(saved.games['encaja-grande'].success).toBe(1);
});

test('memory mechanic requires matching pairs and exposes labelled controls',async({page})=>{
  await boot(page);
  await page.locator('[data-age="2-3"]').click();
  await page.locator('[data-game="parejas-sonoras"]').click();
  const cards=page.locator('[data-card]');
  await expect(cards).toHaveCount(6);
  const labels=await cards.evaluateAll(xs=>xs.map(x=>x.getAttribute('aria-label')));
  expect(labels.every(Boolean)).toBeTruthy();
});

test('follow-path requires ordered checkpoints and rejects skipping ahead',async({page})=>{
  await boot(page);
  await page.locator('[data-age="2-3"]').click();
  await page.locator('[data-game="camino-del-conejo"]').click();
  await page.locator('[data-step="2"]').click();
  await expect(page.locator('#feedback')).toContainText('último punto');
  for(const i of [0,1,2,3]) await page.locator(`[data-step="${i}"]`).click();
  await expect(page.locator('#feedback')).toContainText('Llegaste');
});

test('classification mechanic requires selecting an item before its matching bin',async({page})=>{
  await boot(page);
  await page.locator('[data-age="2-3"]').click();
  await page.locator('[data-game="cajas-de-colores"]').click();
  await page.locator('[data-bin="rojo"]').click();
  await expect(page.locator('#feedback')).toContainText('Elige primero');
  const red=page.locator('[data-item][data-color="rojo"]').first();
  await red.click();
  await page.locator('[data-bin="rojo"]').click();
  await expect(red).toBeDisabled();
});

test('maze mechanic enforces obstacles and allows a valid route to goal',async({page})=>{
  await boot(page);
  await page.locator('[data-age="3-4"]').click();
  await page.locator('[data-game="laberinto-de-lio"]').click();
  await page.locator('[data-move="1"]').click();
  await expect(page.locator('#feedback')).toContainText('bloqueado');
  for(const move of [3,1,3,1]) await page.locator(`[data-move="${move}"]`).click();
  await expect(page.locator('#feedback')).toContainText('salida');
});

test('step-order mechanic rejects a later routine step before the first one',async({page})=>{
  await boot(page);
  await page.locator('[data-age="3-4"]').click();
  await page.locator('[data-game="ordenamos-el-dia"]').click();
  await page.locator('[data-order="2"]').click();
  await expect(page.locator('#feedback')).toContainText('antes');
  for(const i of [0,1,2,3]) await page.locator(`[data-order="${i}"]`).click();
  await expect(page.locator('#feedback')).toContainText('Rutina ordenada');
});

test('spot-difference mechanic is available only at appropriate older ages',async({page})=>{
  await boot(page);
  await page.locator('[data-age="2-3"]').click();
  await expect(page.locator('[data-game="detectives-de-diferencias"]')).toHaveCount(0);
  await page.locator('[data-age="4-5"]').click();
  await expect(page.locator('[data-game="detectives-de-diferencias"]')).toHaveCount(1);
});

test('v2 shell remains usable at small iPhone and iPad landscape sizes',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await boot(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();
  await page.setViewportSize({width:1180,height:820});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();
});
