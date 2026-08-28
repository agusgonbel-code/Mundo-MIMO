const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';
const AGES = ['0-1','1-2','2-3','3-4','4-5','5-6'];

async function waitForFullRuntime(page) {
  await page.waitForFunction(() => {
    const r = globalThis.MundoMimoV2RuntimeV430;
    return r && Array.isArray(r.implemented) && r.implemented.length === 150;
  });
  await page.waitForSelector('#gameGrid .gameCard');
}

test('V590: full 150-game runtime becomes interactive inside the iPhone startup budget', async ({ page }) => {
  const wallStart = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  const wallMs = Date.now() - wallStart;

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.initiatorType === 'script');
    return {
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      loadMs: nav ? nav.loadEventEnd - nav.startTime : null,
      scriptCount: scripts.length,
      decodedScriptBytes: scripts.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0),
      cards: document.querySelectorAll('#gameGrid .gameCard').length,
      uniqueCards: new Set([...document.querySelectorAll('#gameGrid .gameCard')].map(el => el.dataset.game)).size,
    };
  });

  expect(wallMs).toBeLessThan(5000);
  if (metrics.domContentLoadedMs !== null) expect(metrics.domContentLoadedMs).toBeLessThan(3000);
  if (metrics.loadMs !== null) expect(metrics.loadMs).toBeLessThan(4000);
  expect(metrics.scriptCount).toBeLessThanOrEqual(60);
  expect(metrics.decodedScriptBytes).toBeLessThan(1_500_000);
  expect(metrics.cards).toBeGreaterThan(0);
  expect(metrics.uniqueCards).toBe(metrics.cards);
});

test('V590: repeated age switching settles quickly and never duplicates cards', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);

  for (let loop = 0; loop < 5; loop += 1) {
    for (const age of AGES) {
      const result = await page.evaluate(async targetAge => {
        const button = document.querySelector(`[data-age="${targetAge}"]`);
        const t0 = performance.now();
        button.click();
        const syncDuration = performance.now() - t0;
        await new Promise(resolve => setTimeout(resolve, 0));
        const settleDuration = performance.now() - t0;
        const cards = [...document.querySelectorAll('#gameGrid .gameCard')];
        return {
          syncDuration,
          settleDuration,
          count: cards.length,
          unique: new Set(cards.map(el => el.dataset.game)).size,
          pressed: document.querySelector('[data-age][aria-pressed="true"]')?.dataset.age,
        };
      }, age);
      expect(result.syncDuration).toBeLessThan(750);
      expect(result.settleDuration).toBeLessThan(750);
      expect(result.count).toBeGreaterThan(0);
      expect(result.unique).toBe(result.count);
      expect(result.pressed).toBe(age);
    }
  }
});

test('V590: centralized age navigation persists across reload without reviving observer fan-out', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2Performance?.version)).toBe(590);

  await page.locator('[data-age="5-6"]').click();
  const before = await page.evaluate(() => ({
    savedAge: JSON.parse(localStorage.getItem('mimo-v2-runtime-200') || '{}').age,
    cards: document.querySelectorAll('#gameGrid .gameCard').length,
    unique: new Set([...document.querySelectorAll('#gameGrid .gameCard')].map(el => el.dataset.game)).size,
  }));
  expect(before.savedAge).toBe('5-6');
  expect(before.cards).toBeGreaterThan(0);
  expect(before.unique).toBe(before.cards);

  await page.reload({ waitUntil: 'load' });
  await waitForFullRuntime(page);
  await expect(page.locator('[data-age="5-6"]')).toHaveAttribute('aria-pressed', 'true');
  const after = await page.evaluate(() => ({
    age: globalThis.MundoMimoV2Performance?.age,
    cards: document.querySelectorAll('#gameGrid .gameCard').length,
    unique: new Set([...document.querySelectorAll('#gameGrid .gameCard')].map(el => el.dataset.game)).size,
  }));
  expect(after.age).toBe('5-6');
  expect(after.unique).toBe(after.cards);
});

test('V590: dispatcher API reaches the exact historical owner before UI event routing', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  const probe = await page.evaluate(() => {
    const id='sigue-el-destello';
    const dispatcher=globalThis.MundoMimoV2Performance;
    const owner=dispatcher?.ownerFor(id);
    const inOwnerExtra=Boolean(owner?.extra?.includes(id));
    const inOwnerCatalog=Boolean(globalThis.MundoMimoV2ExpansionV370?.merged?.some(g=>g.id===id));
    const returned=dispatcher?.startGame(id);
    return {
      ownerVersion:owner?.version||null,
      inOwnerExtra,
      inOwnerCatalog,
      returned:Boolean(returned),
      title:document.getElementById('gameTitle')?.textContent||'',
      stageHidden:Boolean(document.getElementById('stage')?.hidden),
      hasInteraction:Boolean(document.querySelector('[data-light="izq"]')),
    };
  });
  expect(probe.ownerVersion).toBe(370);
  expect(probe.inOwnerExtra).toBeTruthy();
  expect(probe.inOwnerCatalog).toBeTruthy();
  expect(probe.returned).toBeTruthy();
  expect(probe.title).toBe('Sigue el destello');
  expect(probe.stageHidden).toBeFalsy();
  expect(probe.hasInteraction).toBeTruthy();
});

test('V590: unified dispatcher launches games owned by historical runtimes', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  await page.locator('[data-age="1-2"]').click();
  const card = page.locator('[data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  const owner = await page.evaluate(() => globalThis.MundoMimoV2Performance.ownerFor('sigue-el-destello')?.version);
  expect(owner).toBe(370);
});

test('V590: completed pointer activation launches once and keyboard activation still works', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  await page.locator('[data-age="1-2"]').click();
  const card = page.locator('[data-game="sigue-el-destello"]');
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent?.source)).toBe('pointerup');
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('mimo-v2-recovery-570') || '{}').activeGame || null);
  expect(active).toBe('sigue-el-destello');

  await page.locator('#closeGame').click();
  await page.locator('[data-game="sigue-el-destello"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent?.source)).toBe('click');
});

test('V590: historical game routing survives replacement of transient card nodes', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    const card=document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');
    card.replaceWith(card.cloneNode(true));
  });
  const rebuilt = page.locator('[data-game="sigue-el-destello"]');
  await expect(rebuilt).toBeVisible();
  await rebuilt.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
});

test('V590: offscreen cards use rendering containment without breaking interaction', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);

  const support = await page.evaluate(() => CSS.supports('content-visibility', 'auto'));
  if (support) {
    const styles = await page.locator('#gameGrid .gameCard').first().evaluate(el => {
      const s = getComputedStyle(el);
      return { contentVisibility: s.contentVisibility, containIntrinsicSize: s.containIntrinsicSize };
    });
    expect(styles.contentVisibility).toBe('auto');
    expect(styles.containIntrinsicSize).not.toBe('none');
  }

  await page.locator('#gameGrid .gameCard').first().click();
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#play')).not.toBeEmpty();
});

test('V590: iPhone 320 px and iPad viewport remain overflow-free after churn and game launch', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto(URL, { waitUntil: 'load' });
    await waitForFullRuntime(page);

    for (const age of AGES) {
      await page.locator(`[data-age="${age}"]`).click();
    }
    const card = page.locator('#gameGrid .gameCard').first();
    await card.click();
    await expect(page.locator('#stage')).toBeVisible();

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - innerWidth,
      html: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(1);
    expect(overflow.html).toBeLessThanOrEqual(1);
  }
});
