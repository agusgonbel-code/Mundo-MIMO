const { test, expect } = require('@playwright/test');

async function setAge(page, age=3) {
  await page.goto('/app-v70.html');
  await page.evaluate(a => {
    localStorage.setItem('mimo70', JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}}));
    localStorage.removeItem('mimo71');
  }, age);
  await page.reload();
  await expect(page.locator('#home')).toHaveClass(/on/);
  await page.waitForFunction(() => Boolean(window.MundoMimoPremiumV71));
}

async function noOverflow(page) {
  const value=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(value.scroll,JSON.stringify(value)).toBeLessThanOrEqual(value.client+2);
}

test('v71 adds family co-play and adaptive parent intelligence', async ({ page }) => {
  await setAge(page,3);
  await expect(page.locator('.mimo-family-mission')).toBeVisible();
  await expect(page.locator('.mimo-adaptive-note[data-home]')).toBeVisible();
  await page.locator('[data-world="lagoon"]').first().click();
  await page.locator('[data-game="colors"]').first().click();
  const wrong=page.locator('#playfield [data-ok="false"]');
  await expect(wrong.first()).toBeVisible();
  await wrong.first().click();
  await wrong.first().click();
  await expect(page.locator('#playfield [data-ok="true"].mimo-hint').first()).toBeVisible();
  const learned=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo71')||'{}'));
  expect(learned.games?.colors?.wrong).toBeGreaterThanOrEqual(2);
  expect(learned.games?.colors?.attempts).toBeGreaterThanOrEqual(2);
});

test('rapid double tap on a correct choice counts only one adaptive attempt', async ({ page }) => {
  await setAge(page,3);
  await page.locator('[data-world="lagoon"]').first().click();
  await page.locator('[data-game="colors"]').first().click();
  const correct=page.locator('#playfield [data-ok="true"]').first();
  await expect(correct).toBeVisible();
  await correct.evaluate(el=>{el.click();el.click();});
  const learned=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo71')||'{}'));
  expect(learned.games?.colors?.correct).toBe(1);
  expect(learned.games?.colors?.attempts).toBe(1);
});

for(const width of [320,375,390,430]){
  test(`v71 has no horizontal overflow at ${width}px`, async ({ browser }) => {
    const context=await browser.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    await setAge(page,3);
    await noOverflow(page);
    await page.locator('[data-world="forest"]').first().click();
    await noOverflow(page);
    await page.locator('[data-game="memory"]').first().click();
    await noOverflow(page);
    await context.close();
  });
}

test('reduced motion preference is supported by premium stylesheet', async ({ page }) => {
  const css=await (await page.request.get('/assets/premium-v71.css')).text();
  expect(css).toContain('prefers-reduced-motion:reduce');
  expect(css).toContain('overflow-x:hidden');
});
