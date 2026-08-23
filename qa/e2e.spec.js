const { test, expect } = require('@playwright/test');

const worlds = {
  forest: ['animals','sounds','memory','habitat','size','tracks'],
  lagoon: ['count','more','colors','shapes','patterns','sort'],
  village: ['emotions','stories','paint','routines','match','discover'],
  mountain: ['letters','trace','initial','logic','sequence','odd'],
};

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
  await page.locator(`#activityGrid [data-game="${game}"]`).click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
}

async function openFreeGame(page, game) {
  await page.locator(`.freeGrid [data-game="${game}"]`).click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
}

async function drawOnCanvas(page, selector) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Canvas ${selector} has no box`);
  await page.mouse.move(box.x + box.width*0.18, box.y + box.height*0.28);
  await page.mouse.down();
  for (let i=1;i<=30;i++) {
    await page.mouse.move(box.x + box.width*(0.18 + i*0.021), box.y + box.height*(0.28 + (i%6)*0.055));
  }
  await page.mouse.up();
}

async function solveMemory(page) {
  const cards = page.locator('[data-memory]');
  const n = await cards.count();
  expect(n).toBeGreaterThanOrEqual(4);
  const groups = {};
  for (let i=0;i<n;i++) {
    const id = await cards.nth(i).getAttribute('data-memory');
    (groups[id] ||= []).push(i);
  }
  for (const idxs of Object.values(groups)) {
    expect(idxs.length).toBe(2);
    const first=cards.nth(idxs[0]), second=cards.nth(idxs[1]);
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await first.click();
    await second.click();
    await expect(first).toHaveClass(/done/, {timeout:2000});
    await expect(second).toHaveClass(/done/, {timeout:2000});
    await expect(page.locator('#guide')).toHaveAttribute('class','guide',{timeout:1800});
  }
}

async function solveRound(page, game) {
  if (game === 'memory') return solveMemory(page);
  if (game === 'trace') {
    const done = page.locator('[data-action="trace-done"]');
    await expect(done).toBeDisabled();
    await drawOnCanvas(page, '#traceCanvas');
    await expect(done).toBeEnabled();
    await done.click();
    return;
  }
  if (game === 'paint') {
    const done = page.locator('[data-action="finish-free"]');
    await expect(done).toBeDisabled();
    await drawOnCanvas(page, '#paintCanvas');
    await expect(done).toBeEnabled();
    await done.click();
    return;
  }
  if (game === 'music') {
    const tones = page.locator('[data-tone]');
    expect(await tones.count()).toBeGreaterThanOrEqual(4);
    await tones.nth(0).click();
    await tones.nth(1).click();
    await page.locator('[data-action="finish-free"]').click();
    return;
  }
  const correct = page.locator('[data-ok="true"]');
  const total = await page.locator('[data-ok]').count();
  expect(total, `No answer buttons in ${game}`).toBeGreaterThan(0);
  expect(await correct.count(), `No valid answer in ${game}`).toBeGreaterThan(0);
  await correct.first().click();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .filter(el => {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 2 || r.left < -2);
      })
      .slice(0,8)
      .map(el => ({tag:el.tagName, cls:String(el.className||''), text:(el.textContent||'').trim().slice(0,40), left:el.getBoundingClientRect().left, right:el.getBoundingClientRect().right, vw}));
  });
  expect(overflow, `Horizontal overflow: ${JSON.stringify(overflow)}`).toEqual([]);
}

async function completeSixRounds(page, game) {
  for (let round=1; round<=6; round++) {
    await expect(page.locator('#roundText')).toContainText(`${round} de 6`);
    await solveRound(page, game);
    if (round < 6) {
      await page.waitForFunction(r => document.querySelector('#roundText')?.textContent?.startsWith(String(r)), round+1, { timeout: 6000 });
    } else {
      await expect(page.locator('#sessionProgress')).toHaveAttribute('style', /100%/);
      await expect(page.locator('#nextBtn')).toHaveClass(/on/);
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('mimo70')));
      expect(state.sessions).toBeGreaterThanOrEqual(1);
      expect(state.rounds).toBeGreaterThanOrEqual(6);
    }
    await assertNoOverflow(page);
  }
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
          await completeSixRounds(page, game);
          expect(errors, `Runtime errors in ${world}/${game}: ${errors.join('\n')}`).toEqual([]);
        });
      }
    }
    test(`free/music works for age ${age}`, async ({ page }) => {
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await setAge(page, age);
      await openFreeGame(page,'music');
      await completeSixRounds(page,'music');
      expect(errors).toEqual([]);
    });
  });
}

test('daily path advances only after completing its full session', async ({ page }) => {
  await setAge(page, 3);
  await page.locator('[data-action="today"]').click();
  await completeSixRounds(page, 'animals');
  await page.locator('[data-action="back-world"]').click();
  await page.locator('#world [data-action="home"]').click();
  await expect(page.locator('#dailyCount')).toHaveText('1/3');
});

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

test('privacy, audio and synthetic-voice release checks', async ({ page }) => {
  const privacy = await page.request.get('/privacy.html');
  expect(privacy.ok()).toBeTruthy();
  const js = await (await page.request.get('/assets/app-v70.js')).text();
  const audio = await (await page.request.get('/assets/audio-bank-v70.js')).text();
  expect(js).not.toContain('speechSynthesis');
  expect(audio).not.toMatch(/https?:\/\//);
  for (const path of ['/assets/audio/dog.ogg','/assets/audio/cat.ogg','/assets/audio/cow.ogg','/assets/audio/frog.oga','/assets/audio/voice-perro.wav']) {
    const response = await page.request.get(path);
    expect(response.ok(), `Missing local audio ${path}`).toBeTruthy();
    expect(Number(response.headers()['content-length']||0)).toBeGreaterThan(100);
  }
});

test('small-phone layout has no horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await setAge(page, 3);
  await assertNoOverflow(page);
  await openGame(page,'lagoon','count');
  await assertNoOverflow(page);
  await context.close();
});

for (const [name,width,height] of [['iPhone landscape',844,390],['iPad portrait',768,1024],['iPad landscape',1024,768]]) {
  test(`${name} keeps Mundo Mimo home and gameplay inside the viewport`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await setAge(page, 3);
    await assertNoOverflow(page);
    await openGame(page,'lagoon','count');
    await assertNoOverflow(page);
    await expect(page.locator('#playfield')).toBeVisible();
    await context.close();
  });
}
