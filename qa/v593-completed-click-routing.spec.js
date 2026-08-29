const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 593 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function'
  );
}

test('V593: physical click completes once in the next task after browser dispatch', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const immediate = await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');
    let timeoutCalls = 0;
    let rafCalls = 0;
    let channelCalls = 0;
    const originalTimeout = window.setTimeout;
    const originalRaf = window.requestAnimationFrame;
    const OriginalChannel = window.MessageChannel;
    window.setTimeout = (...args) => { timeoutCalls += 1; return originalTimeout(...args); };
    window.requestAnimationFrame = (...args) => { rafCalls += 1; return originalRaf(...args); };
    if (OriginalChannel) {
      window.MessageChannel = class ProbeChannel extends OriginalChannel {
        constructor(...args) { channelCalls += 1; super(...args); }
      };
    }
    try {
      card.click();
      return {
        title: document.getElementById('gameTitle')?.textContent || '',
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId || null,
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        flushScheduled: globalThis.MundoMimoV2CatalogRouterBootstrap?.flushScheduled,
        timeoutCalls,
        rafCalls,
        channelCalls,
      };
    } finally {
      window.setTimeout = originalTimeout;
      window.requestAnimationFrame = originalRaf;
      if (OriginalChannel) window.MessageChannel = OriginalChannel;
    }
  });

  expect(immediate.title).toBe('');
  expect(immediate.lastStartedId).toBeNull();
  expect(immediate.pendingCount).toBe(1);
  expect(immediate.flushScheduled).toBeTruthy();
  expect(immediate.timeoutCalls).toBe(1);
  expect(immediate.rafCalls).toBe(0);
  expect(immediate.channelCalls).toBe(0);

  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
    flushScheduled: globalThis.MundoMimoV2CatalogRouterBootstrap?.flushScheduled,
    lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId,
  }))).toEqual({ pendingCount: 0, flushScheduled: false, lastStartedId: 'sigue-el-destello' });
});

test('V593: late synchronous click side effects finish before the canonical launch', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const immediateOrder = await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');
    globalThis.__v593Order = [];
    const listener = event => {
      if (event.target?.closest?.('[data-game="sigue-el-destello"]')) {
        globalThis.__v593Order.push('late-listener');
        document.getElementById('gameTitle').textContent = '';
        document.getElementById('stage').hidden = true;
      }
    };
    document.addEventListener('click', listener, { once: true });
    document.addEventListener('mimo:game-started', () => globalThis.__v593Order.push('canonical-launch'), { once: true });
    card.click();
    return [...globalThis.__v593Order];
  });

  expect(immediateOrder).toEqual(['late-listener']);
  await expect.poll(() => page.evaluate(() => globalThis.__v593Order)).toEqual(['late-listener', 'canonical-launch']);
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('#stage')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
});

test('V593: rapid activations share one scheduled flush and remain FIFO exactly once', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="4-5"]').click();

  const immediate = await page.evaluate(() => {
    const ids = ['que-cambia-si', 'vecinos-del-numero'];
    globalThis.__v593RapidStarted = [];
    document.addEventListener('mimo:game-started', event => globalThis.__v593RapidStarted.push(event.detail.id));
    for (const id of ids) {
      const card = document.querySelector(`[data-game="${id}"]`);
      if (!card) throw new Error(`card missing: ${id}`);
      card.click();
    }
    return {
      ids,
      started: [...globalThis.__v593RapidStarted],
      pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
      flushScheduled: globalThis.MundoMimoV2CatalogRouterBootstrap?.flushScheduled,
    };
  });

  expect(immediate.started).toEqual([]);
  expect(immediate.pendingCount).toBe(2);
  expect(immediate.flushScheduled).toBeTruthy();
  await expect.poll(() => page.evaluate(() => globalThis.__v593RapidStarted)).toEqual(immediate.ids);
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount)).toBe(0);
  expect(await page.evaluate(() => globalThis.MundoMimoV2Performance.lastStartedId)).toBe(immediate.ids[1]);
});

test('V593: physical catalog routing remains functional when MessageChannel is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'MessageChannel', {
      configurable: true,
      value: class DisabledMessageChannel {
        constructor() { throw new Error('MessageChannel intentionally unavailable in regression'); }
      }
    });
  });
  await boot(page);
  await page.locator('[data-age="1-2"]').click();
  await page.locator('[data-game="sigue-el-destello"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount)).toBe(0);
});
