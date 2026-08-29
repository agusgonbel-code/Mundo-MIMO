const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2Performance?.version === 590 &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 594
  );
}

test('V595 keeps interactive game cards hit-testable for trusted WebKit clicks', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const cards = page.locator('#gameGrid .gameCard');
  const count = await cards.count();
  expect(count).toBeGreaterThan(5);

  const style = await cards.first().evaluate(el => {
    const s = getComputedStyle(el);
    return { contentVisibility: s.contentVisibility, contain: s.contain };
  });
  expect(style.contentVisibility).toBe('visible');
  expect(style.contain).toContain('layout');
  expect(style.contain).toContain('paint');

  for (const index of [0, Math.floor(count / 2), count - 1]) {
    const card = cards.nth(index);
    const id = await card.getAttribute('data-game');
    expect(id).toBeTruthy();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2Performance.lastStartedId)).toBe(id);
    await expect(page.locator('#stage')).toBeVisible();
    await page.locator('#closeGame').click();
  }
});

test('V595 survives age churn before a trusted physical catalog activation', async ({ page }) => {
  await boot(page);
  for (const age of ['0-1', '5-6', '2-3', '4-5', '1-2']) {
    await page.locator(`[data-age="${age}"]`).click();
  }

  const target = page.locator('#gameGrid [data-game="sigue-el-destello"]');
  await expect(target).toBeVisible();
  const before = await page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap.launchCount);
  await target.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  const after = await page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap.launchCount);
  expect(after - before).toBe(1);
});
