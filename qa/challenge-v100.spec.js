const { test, expect } = require('@playwright/test');

async function boot(page, age=3) {
  await page.goto('/app-v70.html');
  await page.evaluate(a => {
    localStorage.setItem('mimo70', JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}}));
    localStorage.removeItem('mimo100');
  }, age);
  await page.reload();
  await expect(page.locator('#home')).toHaveClass(/on/);
  await page.waitForFunction(() => Boolean(window.MundoMimoChallengesV100));
}

test('v100 exposes 100 challenges for every one of the 24 guided games', async ({ page }) => {
  await boot(page,3);
  const audit = await page.evaluate(() => {
    const e=window.MundoMimoChallengesV100;
    return {
      version:e.version,
      games:e.gameIds.length,
      perGame:e.variantsPerGame,
      total:e.totalChallenges,
      counts:e.gameIds.map(id=>e.catalog[id]?.length||0),
      unique:e.gameIds.map(id=>new Set(e.catalog[id].map(x=>x.id)).size)
    };
  });
  expect(audit.version).toBe(100);
  expect(audit.games).toBe(24);
  expect(audit.perGame).toBe(100);
  expect(audit.total).toBe(2400);
  expect(audit.counts.every(n=>n===100)).toBeTruthy();
  expect(audit.unique.every(n=>n===100)).toBeTruthy();
});

test('each game cycles through all 100 challenges before repeating', async ({ page }) => {
  await boot(page,5);
  const result = await page.evaluate(() => {
    const e=window.MundoMimoChallengesV100;
    const failures=[];
    for(const id of e.gameIds){
      localStorage.removeItem('mimo100');
      const ids=Array.from({length:100},()=>e.nextChallenge(id,5).id);
      if(new Set(ids).size!==100) failures.push({id,unique:new Set(ids).size});
    }
    return failures;
  });
  expect(result).toEqual([]);
});

test('challenge cursor persists across reload and age copy is adapted', async ({ page }) => {
  await boot(page,1);
  const first=await page.evaluate(()=>window.MundoMimoChallengesV100.nextChallenge('animals',1));
  const second=await page.evaluate(()=>window.MundoMimoChallengesV100.nextChallenge('animals',1));
  expect(first.id).not.toBe(second.id);
  expect(first.copy.startsWith('Mira y toca.')).toBeTruthy();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.MundoMimoChallengesV100));
  const third=await page.evaluate(()=>window.MundoMimoChallengesV100.nextChallenge('animals',1));
  expect(third.id).not.toBe(first.id);
  expect(third.id).not.toBe(second.id);
});

test('live rounds receive a challenge id and advance without breaking answers', async ({ page }) => {
  await boot(page,3);
  await page.locator('[data-world="forest"]').first().click();
  await expect(page.locator('#world')).toHaveClass(/on/);
  await page.locator('#activityGrid [data-game="animals"]').click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield .mimo-challenge-kicker')).toBeVisible();
  const first=await page.locator('#playfield').getAttribute('data-challenge-id');
  expect(first).toMatch(/^animals-\d{3}$/);
  const correct=page.locator('#playfield [data-ok="true"]').first();
  await expect(correct).toBeVisible();
  await correct.click();
  await page.waitForFunction(old=>document.getElementById('playfield')?.dataset.challengeId && document.getElementById('playfield').dataset.challengeId!==old,first);
  const second=await page.locator('#playfield').getAttribute('data-challenge-id');
  expect(second).not.toBe(first);
});

test('v100 engine is part of the offline core and reset clears its state', async ({ page }) => {
  const sw=await (await page.request.get('/sw.js')).text();
  const audit=await (await page.request.get('/assets/app-v70-audit.js')).text();
  expect(sw).toContain('./assets/challenge-engine-v100.js');
  expect(audit).toContain("localStorage.removeItem('mimo100')");
});
