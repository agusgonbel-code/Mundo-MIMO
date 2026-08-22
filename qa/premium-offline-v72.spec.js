const { test, expect } = require('@playwright/test');

test('premium experience is part of the offline core cache', async ({ page }) => {
  const sw=await (await page.request.get('/sw.js')).text();
  expect(sw).toContain("'./assets/premium-v71.css'");
  expect(sw).toContain("'./assets/premium-v71.js'");
  expect(sw).toContain("'./support.html'");
});

test('parent progress labels distinguish evidence depth', async ({ page }) => {
  await page.goto('/app-v70.html');
  await page.waitForFunction(() => Boolean(window.MundoMimoPremiumV71));
  const confidence=await page.evaluate(()=>[
    window.MundoMimoPremiumV71.confidenceFor(1),
    window.MundoMimoPremiumV71.confidenceFor(5),
    window.MundoMimoPremiumV71.confidenceFor(10)
  ]);
  expect(confidence).toEqual(['inicial','media','alta']);
});

test('music premium layer exposes reusable tone player', async ({ page }) => {
  await page.goto('/app-v70.html');
  await page.waitForFunction(() => Boolean(window.MundoMimoPremiumV71));
  expect(await page.evaluate(()=>typeof window.MundoMimoPremiumV71.playToneStable)).toBe('function');
});
