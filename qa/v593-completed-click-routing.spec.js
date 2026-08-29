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

test('V593: completed historical click launches by microtask and never waits for requestAnimationFrame', async ({ page }) => {
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
      return {
        immediate,
        afterMicrotask: document.getElementById('gameTitle')?.textContent || '',
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
  expect(result.afterMicrotask).toBe('Sigue el destello');
  expect(result.hasInteraction).toBeTruthy();
  expect(result.lastStartedId).toBe('sigue-el-destello');
  expect(result.pendingCount).toBe(0);
  expect(result.rafCalls).toBe(0);
});

test('V593: FIFO still preserves two completed activations before the microtask checkpoint', async ({ page }) => {
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
      await Promise.resolve();
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
