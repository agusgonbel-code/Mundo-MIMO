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

test('V590 catalog routing preserves the completed browser click and default action', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    globalThis.__mimoBubbleProbe = [];
    document.body.addEventListener('click', event => {
      if (event.target?.closest?.('[data-game="sigue-el-destello"]')) globalThis.__mimoBubbleProbe.push({ owner: 'body', defaultPrevented: event.defaultPrevented });
    }, { once: true });
    document.addEventListener('click', event => {
      if (event.target?.closest?.('[data-game="sigue-el-destello"]')) globalThis.__mimoBubbleProbe.push({ owner: 'document', defaultPrevented: event.defaultPrevented });
    }, { once: true });
  });
  await page.locator('[data-game="sigue-el-destello"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.__mimoBubbleProbe)).toEqual([
    { owner: 'body', defaultPrevented: false },
    { owner: 'document', defaultPrevented: false }
  ]);
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({
    id: 'sigue-el-destello', source: 'click'
  });
});

test('V590 keeps one catalog owner and emits one launch event per completed activation', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    globalThis.__mimoLaunchProbe = 0;
    document.addEventListener('mimo:game-started', event => {
      if (event.detail?.id === 'sigue-el-destello') globalThis.__mimoLaunchProbe += 1;
    });
  });
  await page.locator('[data-game="sigue-el-destello"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.__mimoLaunchProbe)).toBe(1);
  expect(await page.evaluate(() => globalThis.MundoMimoV2Performance.lastStartedId)).toBe('sigue-el-destello');
});

test('V590 capture owner survives a historical target listener that stops bubbling', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    card.addEventListener('click', event => event.stopPropagation(), { once: true });
  });
  await page.locator('[data-game="sigue-el-destello"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.MundoMimoV2Performance.lastStartedId)).toBe('sigue-el-destello');
});

test('V590 finalizes the canonical game after stale click side effects finish', async ({ page }) => {
  await page.goto('/v2/app-v200.html', { waitUntil: 'load' });
  await page.waitForFunction(() => globalThis.MundoMimoV2Performance?.version === 590);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    card.addEventListener('click', () => {
      document.getElementById('gameTitle').textContent = '';
      document.getElementById('stage').hidden = true;
    }, { once: true });
  });
  await page.locator('[data-game="sigue-el-destello"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('#stage')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.MundoMimoV2Performance.lastStartedId)).toBe('sigue-el-destello');
});