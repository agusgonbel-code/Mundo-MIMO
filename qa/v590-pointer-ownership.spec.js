const { test, expect } = require('@playwright/test');

const URL = '/v2/app-v200.html';

async function ready(page, age = '1-2') {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() =>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length === 150 &&
    typeof globalThis.MundoMimoV2Performance?.startGame === 'function' &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version === 590
  );
  await page.locator(`[data-age="${age}"]`).click();
}

async function pointerDownUp(page, locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
}

test('V590 down/up never mutates the game DOM before canonical click activation', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();

  // Synthetic down/up without click models an interrupted activation. The router
  // must not open, scroll or replace UI before the browser commits the click.
  await page.evaluate(() => {
    const card = document.querySelector('[data-game="sigue-el-destello"]');
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, cancelable:true, isPrimary:true, pointerId:41, pointerType:'touch', button:0 }));
    card.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, cancelable:true, isPrimary:true, pointerId:41, pointerType:'touch', button:0 }));
  });
  await expect(page.locator('#stage')).toBeHidden();
  await expect(page.locator('#gameTitle')).toHaveText('');

  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect(page.locator('[data-light="izq"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({
    id: 'sigue-el-destello', source: 'click'
  });
});

test('V590 physical browser click launches exactly once through the canonical owner', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-game="sigue-el-destello"]');
  await expect(card).toBeVisible();

  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  const first = await page.evaluate(() => ({
    started: globalThis.MundoMimoV2Performance?.lastStartedId,
    recovery: JSON.parse(localStorage.getItem('mimo-v2-recovery-570') || '{}').activeGame || null,
    intent: globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent,
  }));
  expect(first.started).toBe('sigue-el-destello');
  expect(first.recovery).toBe('sigue-el-destello');
  expect(first.intent).toMatchObject({ id:'sigue-el-destello', source:'click' });

  // A subsequent real catalog activation must not inherit stale ownership.
  const next = page.locator('#gameGrid .gameCard').nth(1);
  const nextId = await next.getAttribute('data-game');
  expect(nextId).toBeTruthy();
  expect(nextId).not.toBe('sigue-el-destello');
  await next.click();
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2Performance?.lastStartedId)).toBe(nextId);
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({ id:nextId, source:'click' });
});

test('V590 keyboard activation uses the same canonical click path', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-game="sigue-el-destello"]');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#gameTitle')).toHaveText('Sigue el destello');
  await expect.poll(() => page.evaluate(() => globalThis.MundoMimoV2CatalogRouterBootstrap?.lastIntent)).toMatchObject({
    id:'sigue-el-destello', source:'click'
  });
});

test('V590 catalog activation never swallows the first fast gameplay answer', async ({ page }) => {
  await ready(page, '4-5');
  const card = page.locator('[data-game="serie-de-numeros"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#gameTitle')).toHaveText('Serie de números');

  await page.locator('[data-number="5"]').click();
  await expect(page.locator('#feedback')).toContainText('aumenta');
  await page.locator('[data-number="3"]').click();
  await expect(page.locator('#feedback')).toContainText('continúa');
});
