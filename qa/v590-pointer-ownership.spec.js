const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function ready(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function' &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 590
  );
  await page.locator('[data-age="1-2"]').click();
  await expect(page.locator('[data-game="sigue-el-destello"]')).toBeVisible();
}

test('V590 claims pointerdown without opening a legacy game and launches the captured card on pointerup', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-game="sigue-el-destello"]');
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
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
