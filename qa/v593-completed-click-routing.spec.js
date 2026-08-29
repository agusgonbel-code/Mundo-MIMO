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

const nextTask = page => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));

test('V593: completed historical click waits until a real post-dispatch task and never uses requestAnimationFrame', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const result = await page.evaluate(async () => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');

    let rafCalls = 0;
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = () => { rafCalls += 1; return 0; };
    try {
      card.click();
      const immediate = document.getElementById('gameTitle')?.textContent || '';
      await Promise.resolve();
      const afterMicrotask = document.getElementById('gameTitle')?.textContent || '';
      await new Promise(resolve => setTimeout(resolve, 0));
      return {
        immediate,
        afterMicrotask,
        afterPostedTask: document.getElementById('gameTitle')?.textContent || '',
        hasInteraction: Boolean(document.querySelector('[data-light="izq"]')),
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId || null,
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        rafCalls,
      };
    } finally {
      window.requestAnimationFrame = originalRaf;
    }
  });

  expect(result.immediate).toBe('');
  expect(result.afterMicrotask).toBe('');
  expect(result.afterPostedTask).toBe('Sigue el destello');
  expect(result.hasInteraction).toBeTruthy();
  expect(result.lastStartedId).toBe('sigue-el-destello');
  expect(result.pendingCount).toBe(0);
  expect(result.rafCalls).toBe(0);
});

test('V593: later click listeners finish before the canonical historical launch', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const result = await page.evaluate(async () => {
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
      await new Promise(resolve => setTimeout(resolve, 0));
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

test('V593: FIFO still preserves two completed activations before the posted-task checkpoint', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="4-5"]').click();

  const result = await page.evaluate(async () => {
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
      const pendingBefore = globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount;
      await new Promise(resolve => setTimeout(resolve, 0));
      return {
        pendingBefore,
        pendingAfter: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        started,
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId,
      };
    } finally {
      document.removeEventListener('mimo:game-started', listener);
    }
  });

  expect(result.pendingBefore).toBe(2);
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
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount)).toBe(0);
});
