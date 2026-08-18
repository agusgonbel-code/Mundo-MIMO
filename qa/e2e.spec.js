const { test, expect } = require('@playwright/test');

const worlds = {
  forest: ['animals','sounds','memory','habitat','size','tracks'],
  lagoon: ['count','more','colors','shapes','patterns','sort'],
  village: ['emotions','stories','paint','routines','match','discover'],
  mountain: ['letters','trace','initial','logic','sequence','odd'],
};
const allGames = Object.values(worlds).flat();

async function setAge(page, age) {
  await page.goto('/app-v70.html');
  await page.evaluate(a => {
    localStorage.setItem('mimo70', JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}}));
  }, age);
  await page.reload();
  await expect(page.locator('#home')).toHaveClass(/on/);
}

async function openGame(page, world, game) {
  await page.locator(`[data-world="${world}"]`).first().click();
  await expect(page.locator('#world')).toHaveClass(/on/);
  await page.locator(`[data-game="${game}"]`).first().click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
}

async function drawOnCanvas(page, selector) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Canvas ${selector} has no box`);
  await page.mouse.move(box.x + box.width*0.2, box.y + box.height*0.3);
  await page.mouse.down();
  for (let i=1;i<=24;i++) {
    await page.mouse.move(box.x + box.width*(0.2 + i*0.025), box.y + box.height*(0.3 + (i%5)*0.05));
  }
  await page.mouse.up();
}

async function solveMemory(page) {
  const cards = page.locator('[data-memory]');
  const n = await cards.count();
  const groups = {};
  for (let i=0;i<n;i++) {
    const id = await cards.nth(i).getAttribute('data-memory');
    (groups[id] ||= []).push(i);
  }
  for (const idxs of Object.values(groups)) {
    if (idxs.length < 2) continue;
    await cards.nth(idxs[0]).click();
    await cards.nth(idxs[1]).click();
    await page.waitForTimeout(650);
  }
}

async function solveRound(page, game) {
  if (game === 'memory') {
    await solveMemory(page);
    return;
  }
  if (game === 'trace') {
    await drawOnCanvas(page, '#traceCanvas');
    await page.locator('[data-action="trace-done"]').click();
    return;
  }
  if (game === 'paint') {
    await drawOnCanvas(page, '#paintCanvas');
    await page.locator('[data-action="finish-free"]').click();
    return;
  }
  if (game === 'music') {
    const tones = page.locator('[data-tone]');
    await expect(tones.first()).toBeVisible();
    await tones.first().click();
    await page.locator('[data-action="finish-free"]').click();
    return;
  }
  const correct = page.locator('[data-ok="true"]');
  await expect(correct.first(), `No valid answer in ${game}`).toBeVisible();
  await correct.first().click();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .filter(el => {
        const s = getComputedStyle(el);
        if (s.position === 'fixed') return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 2 || r.left < -2);
      })
      .slice(0,8)
      .map(el => ({tag:el.tagName, cls:el.className, text:(el.textContent||'').trim().slice(0,40), rect:el.getBoundingClientRect().toJSON?.() || {}}));
  });
  expect(overflow, `Horizontal overflow: ${JSON.stringify(overflow)}`).toEqual([]);
}

for (const age of [1,3,5]) {
  test.describe(`age-${age}`, () => {
    for (const [world, games] of Object.entries(worlds)) {
      for (const game of games) {
        test(`${world}/${game} completes all 6 rounds`, async ({ page }) => {
          const errors = [];
          page.on('pageerror', e => errors.push(String(e)));
          page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
          await setAge(page, age);
          await openGame(page, world, game);
          await assertNoOverflow(page);
          for (let round=1; round<=6; round++) {
            await expect(page.locator('#roundText')).toContainText(`${round} de 6`);
            await solveRound(page, game);
            if (round < 6) {
              await page.waitForFunction(r => document.querySelector('#roundText')?.textContent?.startsWith(String(r)), round+1, { timeout: 5000 });
            } else {
              await expect(page.locator('#sessionProgress')).toHaveAttribute('style', /100%/);
              await expect(page.locator('#nextBtn')).toHaveClass(/on/);
            }
            await assertNoOverflow(page);
          }
          expect(errors, `Runtime errors in ${world}/${game}: ${errors.join('\n')}`).toEqual([]);
        });
      }
    }
  });
}

test('parent gate blocks child and opens only with correct answer', async ({ page }) => {
  await setAge(page, 3);
  await page.locator('[data-action="parent"]').first().click();
  await expect(page.locator('#parentGate')).toHaveClass(/on/);
  const q = await page.locator('#gateQuestion').textContent();
  const nums = q.match(/\d+/g).map(Number);
  await page.locator('#gateAnswer').fill('999');
  await page.locator('[data-action="gate-check"]').click();
  await expect(page.locator('#parentGate')).toHaveClass(/on/);
  await page.locator('#gateAnswer').fill(String(nums[0]+nums[1]));
  await page.locator('[data-action="gate-check"]').click();
  await expect(page.locator('#parent')).toHaveClass(/on/);
});

test('production page has no synthetic speech or third-party runtime audio URLs', async ({ page }) => {
  await page.goto('/app-v70.html');
  const js = await (await page.request.get('/assets/app-v70.js')).text();
  const audio = await (await page.request.get('/assets/audio-bank-v70.js')).text();
  expect(js).not.toContain('speechSynthesis');
  expect(audio).not.toMatch(/https?:\/\//);
});
