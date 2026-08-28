const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function ready(page, age = '1-2') {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function' &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 590
  );
  await page.locator(`[data-age="${age}"]`).click();
}

async function pointerActivate(page, locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { x, y };
}

test('V590 claims pointerdown without opening a legacy game and launches the captured card on pointerup', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();
  await pointerActivate(page, card);
  await expect(page.locator('#stage')).toBeHidden();
  await expect(page.locator('#gameTitle')).toHaveText('');

  await page.mouse.up();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({
    id: 'sigue-el-destello',
    source: 'pointerup',
  });

  const state = await page.evaluate(() => ({
    started: globalThis.MundoMimoV2Performance?.lastStartedId,
    recovery: JSON.parse(localStorage.getItem('mimo-v2-recovery-570') || '{}').activeGame || null,
  }));
  expect(state.started).toBe('sigue-el-destello');
  expect(state.recovery).toBe('sigue-el-destello');
});

test('V590 synthetic-click guard never swallows the first fast gameplay answer', async ({ page }) => {
  await ready(page, '4-5');
  const card = page.locator('[data-game="serie-de-numeros"]');
  await expect(card).toBeVisible();
  await pointerActivate(page, card);
  await page.mouse.up();
  await expect(page.locator('#gameTitle')).toHaveText('Serie de números');

  // A distinct action immediately after launch must reach the game's own handler.
  await page.locator('[data-number="5"]').click();
  await expect(page.locator('#feedback')).toContainText('aumenta');
  await page.locator('[data-number="3"]').click();
  await expect(page.locator('#feedback')).toContainText('continúa');
});
