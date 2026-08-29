const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function waitForFullRuntime(page) {
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function' &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 594
  );
}

function expectLayoutPaintContainment(contain) {
  const tokens = new Set(String(contain).trim().split(/\s+/).filter(Boolean));
  const canonicalContent = tokens.has('content');
  expect(canonicalContent || tokens.has('layout')).toBeTruthy();
  expect(canonicalContent || tokens.has('paint')).toBeTruthy();
}

test('V590: full 150-game runtime boots within explicit iPhone/iPad budgets', async ({ page }) => {
  const started = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  const elapsed = Date.now() - started;
  expect(elapsed).toBeLessThan(5000);
  const state = await page.evaluate(() => ({
    total: globalThis.MundoMimoV2RuntimeV430?.implemented?.length,
    cards: document.querySelectorAll('#gameGrid .gameCard').length,
    unique: new Set([...document.querySelectorAll('#gameGrid .gameCard')].map(el => el.dataset.game)).size,
  }));
  expect(state.total).toBe(150);
  expect(state.cards).toBeGreaterThan(0);
  expect(state.unique).toBe(state.cards);
});

test('V590: 30 age changes stay within budget without duplicate card fan-out', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  const ages = ['0-1','1-2','2-3','3-4','4-5','5-6'];
  for (let i = 0; i < 30; i += 1) {
    const age = ages[i % ages.length];
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
    const started=dispatcher?.startGame(id);
    return {
      ownerVersion:owner?.version,
      inOwnerExtra,
      inOwnerCatalog,
      started,
      lastStarted:dispatcher?.lastStartedId,
      title:document.getElementById('gameTitle')?.textContent,
      stageHidden:document.getElementById('stage')?.hidden,
      hasInteraction:Boolean(document.querySelector('[data-light]')),
    };
  });
  expect(probe.ownerVersion).toBe(370);
  expect(probe.inOwnerExtra || probe.inOwnerCatalog).toBeTruthy();
  expect(probe.started).toBeTruthy();
  expect(probe.lastStarted).toBe('sigue-el-destello');
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

test('V590: completed browser activation launches once, settles as click, and keyboard activation still works', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);
  await page.locator('[data-age="1-2"]').click();
  const card = page.locator('[data-game="sigue-el-destello"]');
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent?.source)).toBe('click');
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

test('V595: interactive cards keep containment without content virtualization and remain clickable', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await waitForFullRuntime(page);

  const styles = await page.locator('#gameGrid .gameCard').first().evaluate(el => {
    const s = getComputedStyle(el);
    return { contentVisibility: s.contentVisibility, contain: s.contain };
  });
  expect(styles.contentVisibility).toBe('visible');
  expectLayoutPaintContainment(styles.contain);

  const last = page.locator('#gameGrid .gameCard').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeVisible();
  const id = await last.getAttribute('data-game');
  await last.click();
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2Performance?.lastStartedId)).toBe(id);
});

test('V590: 320px and iPad widths remain overflow-safe after age churn', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 1024, height: 1366 }]) {
    await page.setViewportSize(viewport);
    await page.goto(URL, { waitUntil: 'load' });
    await waitForFullRuntime(page);
    for (const age of ['0-1','5-6','2-3','4-5']) {
      await page.locator(`[data-age="${age}"]`).click();
    }
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
    }));
    expect(overflow.doc).toBeLessThanOrEqual(1);
    expect(overflow.body).toBeLessThanOrEqual(1);
  }
});
