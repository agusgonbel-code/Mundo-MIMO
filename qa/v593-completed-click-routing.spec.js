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

test('V593: completed historical click finalizes in the same dispatch without async schedulers', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const result = await page.evaluate(() => {
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
        hasInteraction: Boolean(document.querySelector('[data-light="izq"]')),
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId || null,
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
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

  expect(result.title).toBe('Sigue el destello');
  expect(result.hasInteraction).toBeTruthy();
  expect(result.lastStartedId).toBe('sigue-el-destello');
  expect(result.pendingCount).toBe(0);
  expect(result.timeoutCalls).toBe(0);
  expect(result.rafCalls).toBe(0);
  expect(result.channelCalls).toBe(0);
});

test('V593: later document click listeners finish before the canonical historical launch', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const result = await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');
    const order = [];
    const listener = event => {
      if (event.target?.closest?.('[data-game="sigue-el-destello"]')) {
        order.push('late-listener');
        document.getElementById('gameTitle').textContent = '';
      }
    };
    document.addEventListener('click', listener);
    document.addEventListener('mimo:game-started', () => order.push('canonical-launch'), { once:true });
    try {
      card.click();
      return {
        order,
        title: document.getElementById('gameTitle')?.textContent || '',
        hasInteraction: Boolean(document.querySelector('[data-light="izq"]')),
      };
    } finally {
      document.removeEventListener('click', listener);
    }
  });

  expect(result.order).toEqual(['late-listener', 'canonical-launch']);
  expect(result.title).toBe('Sigue el destello');
  expect(result.hasInteraction).toBeTruthy();
});

test('V593: rapid completed activations remain ordered and exactly once', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="4-5"]').click();

  const result = await page.evaluate(() => {
    const ids = ['que-cambia-si', 'vecinos-del-numero'];
    const started = [];
    const listener = event => started.push(event.detail.id);
    document.addEventListener('mimo:game-started', listener);
    try {
      for (const id of ids) {
        const card = document.querySelector(`[data-game="${id}"]`);
        if (!card) throw new Error(`card missing: ${id}`);
        card.click();
      }
      return {
        pendingAfter: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        started,
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId,
      };
    } finally {
      document.removeEventListener('mimo:game-started', listener);
    }
  });

  expect(result.pendingAfter).toBe(0);
  expect(result.started).toEqual(['que-cambia-si', 'vecinos-del-numero']);
  expect(result.lastStartedId).toBe('vecinos-del-numero');
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
