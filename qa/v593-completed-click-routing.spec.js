const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function boot(page) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 594 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function'
  );
}

test('V594: physical click launches at the card target exactly once; only viewport scroll is deferred', async ({ page }) => {
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
    globalThis.__v594Launches = [];
    const onStart = event => globalThis.__v594Launches.push(event.detail.id);
    document.addEventListener('mimo:game-started', onStart);
    try {
      card.click();
      return {
        title: document.getElementById('gameTitle')?.textContent || '',
        firstControl: Boolean(document.querySelector('[data-light="izq"]')),
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId || null,
        lastIntent: globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent || null,
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        flushScheduled: globalThis.MundoMimoV2CatalogRouterBootstrap?.flushScheduled,
        launches: [...globalThis.__v594Launches],
        launchCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.launchCount,
        timeoutCalls,
        rafCalls,
        channelCalls,
      };
    } finally {
      document.removeEventListener('mimo:game-started', onStart);
      window.setTimeout = originalTimeout;
      window.requestAnimationFrame = originalRaf;
      if (OriginalChannel) window.MessageChannel = OriginalChannel;
    }
  });

  expect(result.title).toBe('Sigue el destello');
  expect(result.firstControl).toBeTruthy();
  expect(result.lastStartedId).toBe('sigue-el-destello');
  expect(result.lastIntent).toMatchObject({ id: 'sigue-el-destello', source: 'click' });
  expect(result.pendingCount).toBe(0);
  expect(result.flushScheduled).toBeFalsy();
  expect(result.launches).toEqual(['sigue-el-destello']);
  expect(result.launchCount).toBe(1);
  // The single timer belongs only to the post-launch scroll. Launch, title,
  // first interaction and start event are already complete at target phase.
  expect(result.timeoutCalls).toBe(1);
  expect(result.rafCalls).toBe(0);
  expect(result.channelCalls).toBe(0);
});

test('V594: target owner launches before a later target listener can stop bubbling', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();

  const order = await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    if (!card) throw new Error('historical card missing');
    globalThis.__v594Order = [];
    document.addEventListener('mimo:game-started', () => globalThis.__v594Order.push('canonical-launch'), { once: true });
    card.addEventListener('click', event => {
      globalThis.__v594Order.push('target-listener');
      event.stopPropagation();
    }, { once: true });
    card.click();
    return [...globalThis.__v594Order];
  });

  expect(order).toEqual(['canonical-launch', 'target-listener']);
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap.pendingCount)).toBe(0);
});

test('V594: rapid activations preserve invocation order and execute once each', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="4-5"]').click();

  const result = await page.evaluate(() => {
    const ids = ['que-cambia-si', 'vecinos-del-numero'];
    globalThis.__v594RapidStarted = [];
    const listener = event => globalThis.__v594RapidStarted.push(event.detail.id);
    document.addEventListener('mimo:game-started', listener);
    try {
      for (const id of ids) {
        const card = document.querySelector(`[data-game="${id}"]`);
        if (!card) throw new Error(`card missing: ${id}`);
        card.click();
      }
      return {
        ids,
        started: [...globalThis.__v594RapidStarted],
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
        flushScheduled: globalThis.MundoMimoV2CatalogRouterBootstrap?.flushScheduled,
        lastStartedId: globalThis.MundoMimoV2Performance?.lastStartedId,
      };
    } finally {
      document.removeEventListener('mimo:game-started', listener);
    }
  });

  expect(result.started).toEqual(result.ids);
  expect(result.pendingCount).toBe(0);
  expect(result.flushScheduled).toBeFalsy();
  expect(result.lastStartedId).toBe(result.ids[1]);
});

test('V594: cloned live grid is rebound before the next physical click', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();
  await page.evaluate(() => {
    const current = document.getElementById('gameGrid');
    current.replaceWith(current.cloneNode(true));
  });
  const card = page.locator('#gameGrid [data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  expect(await page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap.launchCount)).toBe(1);
});

test('V594: catalog activation does not depend on MessageChannel', async ({ page }) => {
  await boot(page);
  await page.locator('[data-age="1-2"]').click();
  const result = await page.evaluate(() => {
    const OriginalChannel = window.MessageChannel;
    let channelCalls = 0;
    if (OriginalChannel) {
      window.MessageChannel = class ProbeChannel extends OriginalChannel {
        constructor(...args) { channelCalls += 1; super(...args); }
      };
    }
    try {
      document.querySelector('[data-game="sigue-el-destello"]').click();
      return {
        channelCalls,
        title: document.getElementById('gameTitle')?.textContent || '',
        pendingCount: globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
      };
    } finally {
      if (OriginalChannel) window.MessageChannel = OriginalChannel;
    }
  });
  expect(result.channelCalls).toBe(0);
  expect(result.title).toBe('Sigue el destello');
  expect(result.pendingCount).toBe(0);
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
});
