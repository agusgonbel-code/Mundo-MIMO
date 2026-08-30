const { test, expect } = require('@playwright/test');

const APP = '/v2/app-v200.html';

test('V580 boots in explicit local-only child privacy mode without third-party requests', async ({ page }) => {
  const external = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') external.push(request.url());
  });
  await page.goto(APP);
  await expect(page.locator('h1')).toHaveText('Mundo Mimo 2');
  const privacy = await page.evaluate(() => ({
    version: globalThis.MundoMimoPrivacyV580?.version,
    mode: globalThis.MundoMimoPrivacyV580?.mode,
    tracking: globalThis.MundoMimoPrivacyV580?.tracking,
    collectedDataTypes: globalThis.MundoMimoPrivacyV580?.collectedDataTypes,
  }));
  expect(privacy).toEqual({ version: 580, mode: 'local-only-child-runtime', tracking: false, collectedDataTypes: 0 });
  expect(external).toEqual([]);
});

test('V580 blocks fetch, XHR and beacon attempts to third-party origins', async ({ page }) => {
  await page.goto(APP);
  const result = await page.evaluate(async () => {
    let fetchBlocked = false;
    try { await fetch('https://example.com/collect'); } catch { fetchBlocked = true; }
    let xhrBlocked = false;
    try { const xhr = new XMLHttpRequest(); xhr.open('GET', 'https://example.com/collect'); } catch (error) { xhrBlocked = error?.name === 'SecurityError'; }
    const beaconBlocked = navigator.sendBeacon ? navigator.sendBeacon('https://example.com/collect', 'x') === false : true;
    return { fetchBlocked, xhrBlocked, beaconBlocked };
  });
  expect(result).toEqual({ fetchBlocked: true, xhrBlocked: true, beaconBlocked: true });
});

test('V580 keeps same-origin app resources functional', async ({ page }) => {
  await page.goto(APP);
  const result = await page.evaluate(async () => {
    const response = await fetch('./core/platform-v200.js');
    return { ok: response.ok, allowed: globalThis.MundoMimoPrivacyV580.isAllowedUrl('./core/platform-v200.js') };
  });
  expect(result).toEqual({ ok: true, allowed: true });
  await expect(page.locator('.gameCard').first()).toBeVisible();
});

test('V580 prevents child-runtime external navigation while preserving current session', async ({ page }) => {
  await page.goto(APP);
  const before = page.url();
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = 'https://example.com/out';
    a.textContent = 'external';
    a.id = 'external-test-link';
    document.body.appendChild(a);
  });
  await page.locator('#external-test-link').click();
  await expect(page).toHaveURL(before);
  await expect(page.locator('h1')).toHaveText('Mundo Mimo 2');
});

test('Apple privacy manifest declares no tracking and no collected data types', async ({ request }) => {
  const response = await request.get('/PrivacyInfo.xcprivacy');
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).toContain('<key>NSPrivacyTracking</key>\n  <false/>');
  expect(text).toContain('<key>NSPrivacyTrackingDomains</key>\n  <array/>');
  expect(text).toContain('<key>NSPrivacyCollectedDataTypes</key>\n  <array/>');
});