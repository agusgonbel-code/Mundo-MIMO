const { test, expect } = require('@playwright/test');

test('V590 live grid routes a historical game through its owning runtime', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  const card = page.locator('[data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  const result = await page.evaluate(() => ({
    owner: globalThis.MundoMimoV2Performance.ownerFor('sigue-el-destello')?.version,
    activeGame: JSON.parse(localStorage.getItem('mimo-v2-recovery-570') || '{}').activeGame
  }));
  expect(result.owner).toBe(370);
  expect(result.activeGame).toBe('sigue-el-destello');
});

test('V590 delegated owner survives replacement of the live grid node', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    const current = document.getElementById('gameGrid');
    const replacement = current.cloneNode(true);
    current.replaceWith(replacement);
  });
  const card = page.locator('#gameGrid [data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({
    id: 'sigue-el-destello', source: 'click'
  });
});