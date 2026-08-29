const { test, expect } = require('@playwright/test');

test('V590 binds every newly rendered canonical card before renderGames returns', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 595 && globalThis.MundoMimoV2Performance?.version === 590);

  const snapshot = await page.evaluate(() => {
    globalThis.MundoMimoV2Performance.setAge('1-2');
    const cards = [...document.querySelectorAll('#gameGrid [data-game]')];
    const router = globalThis.MundoMimoV2CatalogRouterBootstrap;
    return {
      count: cards.length,
      unowned: cards.filter(card => !router.isBound(card)).map(card => card.dataset.game),
      titleBeforeClick: document.getElementById('gameTitle').textContent,
    };
  });

  expect(snapshot.count).toBeGreaterThan(0);
  expect(snapshot.unowned).toEqual([]);
  expect(snapshot.titleBeforeClick).toBe('');

  const result = await page.evaluate(() => {
    const card = document.querySelector('#gameGrid [data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical V370 card missing after synchronous render');
    card.click();
    return {
      title: document.getElementById('gameTitle').textContent,
      lastStartedId: globalThis.MundoMimoV2Performance.lastStartedId,
      pending: globalThis.MundoMimoV2CatalogRouterBootstrap.pendingCount,
    };
  });

  expect(result).toEqual({ title: 'Sigue el destello', lastStartedId: 'sigue-el-destello', pending: 0 });
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
});

test('V595 canonical ownership survives a later DOM0 onclick replacement', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 595 && globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  const result = await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical V370 card missing');
    let legacyCalls = 0;
    card.onclick = () => { legacyCalls += 1; };
    card.click();
    return {
      legacyCalls,
      title: document.getElementById('gameTitle').textContent,
      lastStartedId: globalThis.MundoMimoV2Performance.lastStartedId,
      launchCount: globalThis.MundoMimoV2CatalogRouterBootstrap.launchCount,
      bound: globalThis.MundoMimoV2CatalogRouterBootstrap.isBound(card),
    };
  });
  expect(result).toEqual({
    legacyCalls: 1,
    title: 'Sigue el destello',
    lastStartedId: 'sigue-el-destello',
    launchCount: 1,
    bound: true,
  });
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
});
