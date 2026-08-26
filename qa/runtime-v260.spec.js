const {test,expect}=require('@playwright/test');

async function boot(page){await page.goto('/v2/app-v200.html');await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV260));}

test('v260 exposes forty-eight implemented games across forty-eight distinct mechanics',async({page})=>{
  await boot(page);const r=await page.evaluate(()=>{const x=window.MundoMimoV2RuntimeV260;return{implemented:x.implemented,handlers:x.handlers,games:x.allGames().map(g=>({id:g.id,mechanic:g.mechanic})),errors:window.MundoMimoV2ExpansionV260.errors,clones:window.MundoMimoV2ExpansionV260.cloneGroups}});
  expect(r.errors).toEqual([]);expect(r.clones).toEqual([]);expect(r.implemented).toHaveLength(48);expect(new Set(r.implemented).size).toBe(48);expect(new Set(r.handlers).size).toBe(48);const mechanics=r.implemented.map(id=>r.games.find(g=>g.id===id)?.mechanic);expect(mechanics.every(Boolean)).toBeTruthy();expect(new Set(mechanics).size).toBe(48);
});

test('tap-target follows a receptive-language instruction instead of generic tapping',async({page})=>{await boot(page);await page.locator('[data-age="1-2"]').click();await page.locator('[data-game="toca-lo-que-escuchas"]').click();await page.locator('[data-tap="🐶"]').click();await expect(page.locator('#feedback')).toContainText('Escucha de nuevo');await page.locator('[data-tap="🚗"]').click();await expect(page.locator('#feedback')).toContainText('consigna');});

test('memory cards require remembering locations and completing both pairs',async({page})=>{await boot(page);await page.locator('[data-age="2-3"]').click();await page.locator('[data-game="memoria-de-cartas"]').click();const cards=page.locator('[data-card]');await cards.nth(0).click();await cards.nth(2).click();await expect(page.locator('#feedback')).toContainText('Pareja');await cards.nth(1).click();await cards.nth(3).click();await expect(page.locator('#feedback')).toContainText('posiciones');});

test('sequence completion rejects an unrelated next step',async({page})=>{await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="completa-la-secuencia"]').click();await page.locator('[data-seq="🚗"]').click();await expect(page.locator('#feedback')).toContainText('no continúa');await page.locator('[data-seq="🧻"]').click();await expect(page.locator('#feedback')).toContainText('orden lógico');});

test('visual recognition uses exact visual equivalence',async({page})=>{await boot(page);await page.locator('[data-age="2-3"]').click();await page.locator('[data-game="detective-visual"]').click();await page.locator('[data-visual="🔵"]').click();await expect(page.locator('#feedback')).toContainText('forma y color');await page.locator('[data-visual="🔴"]').click();await expect(page.locator('#feedback')).toContainText('rasgos visuales');});

test('semantic association evaluates function or context',async({page})=>{await boot(page);await page.locator('[data-age="3-4"]').click();await page.locator('[data-game="parejas-con-sentido"]').click();await page.locator('[data-sem="🚲"]').click();await expect(page.locator('#feedback')).toContainText('para qué sirve');await page.locator('[data-sem="🦷"]').click();await expect(page.locator('#feedback')).toContainText('relación con sentido');});

test('multi-select requires the exact valid set and rejects distractors',async({page})=>{await boot(page);await page.locator('[data-age="4-5"]').click();await page.locator('[data-game="elige-todos"]').click();await page.locator('[data-multi="🐶"]').click();await page.locator('[data-multi="🍎"]').click();await page.locator('[data-confirm]').click();await expect(page.locator('#feedback')).toContainText('distractor');await page.locator('[data-multi="🍎"]').click();await page.locator('[data-multi="🐱"]').click();await page.locator('[data-confirm]').click();await expect(page.locator('#feedback')).toContainText('conjunto exacto');});

test('advanced multi-select is absent from toddler bands',async({page})=>{await boot(page);await page.locator('[data-age="1-2"]').click();await expect(page.locator('[data-game="elige-todos"]')).toHaveCount(0);await expect(page.locator('[data-game="toca-lo-que-escuchas"]')).toHaveCount(1);});
