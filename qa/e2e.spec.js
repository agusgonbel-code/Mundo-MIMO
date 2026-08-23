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
  for (let i=1;i<=30;i++) await page.mouse.move(box.x + box.width*(0.18 + i*0.021), box.y + box.height*(0.28 + (i%6)*0.055));
  await page.mouse.up();
}

async function solveMemory(page) {
  const snapshot = await page.locator('[data-memory]').evaluateAll(nodes => nodes.map((el,index)=>({index,id:el.dataset.memory})));
  expect(snapshot.length).toBeGreaterThanOrEqual(4);
  const groups = {};
  for (const card of snapshot) (groups[card.id] ||= []).push(card.index);
  const pairs = Object.entries(groups);
  for (const [,idxs] of pairs) expect(idxs.length).toBe(2);
  const roundBefore = await page.locator('#roundText').textContent();
  for (let pairIndex=0; pairIndex<pairs.length; pairIndex++) {
    const [id] = pairs[pairIndex];
    const pair = page.locator(`[data-memory="${id}"]`);
    await expect(pair).toHaveCount(2);
    await expect(pair.nth(0)).toBeVisible();
    await expect(pair.nth(1)).toBeVisible();
    const doneBefore = await page.locator('[data-memory].done').count();
    await pair.nth(0).click();
    await expect(pair.nth(0)).toHaveClass(/open/);
    await pair.nth(1).click();
    const isLast = pairIndex === pairs.length - 1;
    if (!isLast) {
      await page.waitForFunction(expected => document.querySelectorAll('[data-memory].done').length >= expected, doneBefore + 2, {timeout:3500});
      await expect(page.locator(`[data-memory="${id}"].done`)).toHaveCount(2);
    } else {
      await page.waitForFunction(before => {
        const round=document.querySelector('#roundText')?.textContent||'';
        const finished=document.querySelector('#sessionProgress')?.getAttribute('style')?.includes('100%');
        return round!==before || finished;
      }, roundBefore, {timeout:8000});
    }
  }
}

async function solveRound(page, game) {
  if (game === 'memory') return solveMemory(page);
  if (game === 'trace') { const done=page.locator('[data-action="trace-done"]'); await expect(done).toBeDisabled(); await drawOnCanvas(page,'#traceCanvas'); await expect(done).toBeEnabled(); await done.click(); return; }
  if (game === 'paint') { const done=page.locator('[data-action="finish-free"]'); await expect(done).toBeDisabled(); await drawOnCanvas(page,'#paintCanvas'); await expect(done).toBeEnabled(); await done.click(); return; }
  if (game === 'music') { const tones=page.locator('[data-tone]'); expect(await tones.count()).toBeGreaterThanOrEqual(4); await tones.nth(0).click(); await tones.nth(1).click(); await page.locator('[data-action="finish-free"]').click(); return; }
  const correct = page.locator('[data-ok="true"]');
  const total = await page.locator('[data-ok]').count();
  expect(total, `No answer buttons in ${game}`).toBeGreaterThan(0);
  expect(await correct.count(), `No valid answer in ${game}`).toBeGreaterThan(0);
  await correct.first().click();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].filter(el => {
      const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 2 || r.left < -2);
    }).slice(0,8).map(el => ({tag:el.tagName, cls:String(el.className||''), text:(el.textContent||'').trim().slice(0,40), left:el.getBoundingClientRect().left, right:el.getBoundingClientRect().right, vw}));
  });
  expect(overflow, `Horizontal overflow: ${JSON.stringify(overflow)}`).toEqual([]);
}

async function completeSixRounds(page, game) {
  for (let round=1; round<=6; round++) {
    await expect(page.locator('#roundText')).toContainText(`${round} de 6`);
    const roundsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('mimo70')||'{}').rounds || 0);
    await solveRound(page, game);
    await page.waitForFunction(before => (JSON.parse(localStorage.getItem('mimo70')||'{}').rounds || 0) > before, roundsBefore, { timeout: 10000 });
    if (round < 6) await page.waitForFunction(r => document.querySelector('#roundText')?.textContent?.startsWith(String(r)), round+1, { timeout: 10000 });
    else { await expect(page.locator('#sessionProgress')).toHaveAttribute('style', /100%/); await expect(page.locator('#nextBtn')).toHaveClass(/on/); const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo70'))); expect(state.sessions).toBeGreaterThanOrEqual(1); expect(state.rounds).toBeGreaterThanOrEqual(6); }
    await assertNoOverflow(page);
  }
}

for (const age of [1,3,5]) test.describe(`age-${age}`, () => { for (const [world,games] of Object.entries(worlds)) for (const game of games) test(`${world}/${game} completes all 6 rounds`, async ({ page }) => { await setAge(page, age); await openGame(page, world, game); await completeSixRounds(page, game); }); test(`free/music works for age ${age}`, async ({ page }) => { await setAge(page, age); await openFreeGame(page, 'music'); await solveRound(page, 'music'); await expect(page.locator('#nextBtn')).toHaveClass(/on/); }); });

test('daily path advances only after completing its full session', async ({ page }) => { await setAge(page,5); await page.locator('[data-action="today"]').click(); await completeSixRounds(page,'letters'); const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('mimo70'))); expect(state.daily).toBe(1); });

test('parent gate blocks child and opens only with correct answer', async ({ page }) => { await setAge(page,5); await page.locator('[data-action="parent"]').first().click(); await expect(page.locator('#parentGate')).toHaveClass(/on/); const answer=await page.locator('#gateQuestion').textContent(); const nums=(answer.match(/\d+/g)||[]).map(Number); await page.locator('#gateAnswer').fill(String(nums.reduce((a,b)=>a+b,0)-1)); await page.locator('[data-action="gate-check"]').click(); await expect(page.locator('#parentGate')).toHaveClass(/on/); await page.locator('#gateAnswer').fill(String(nums.reduce((a,b)=>a+b,0))); await page.locator('[data-action="gate-check"]').click(); await expect(page.locator('#parentGate')).not.toHaveClass(/on/); await expect(page.locator('#parent')).toHaveClass(/on/); });

test('privacy and packaged-audio release checks', async ({ page }) => {
  const privacy=await (await page.request.get('/privacy.html')).text();
  const support=await (await page.request.get('/support.html')).text();
  const credits=await (await page.request.get('/credits.html')).text();
  expect(privacy).toContain('Privacidad de Mundo Mimo'); expect(privacy).toContain('almacenamiento local'); expect(privacy).toContain('no contiene anuncios'); expect(privacy).toContain('no solicita nombre, correo electrónico, teléfono, ubicación, contactos, cámara ni micrófono');
  expect(support).toContain('Soporte'); expect(credits).toContain('Sonidos reales de animales'); expect(credits).toContain('Locuciones humanas');
  const audio=await (await page.request.get('/assets/audio-bank-v70.js')).text();
  expect(audio).not.toContain('speechSynthesis');
  expect(audio).toContain("'./assets/audio/dog.ogg'");
  expect(audio).toContain("'./assets/audio/voice-perro.wav'");
  expect(audio).toContain("'./assets/audio/voice-vamos.wav'");
});

test('small-phone layout has no horizontal overflow', async ({ page }) => { await page.setViewportSize({width:320,height:700}); await setAge(page,3); await assertNoOverflow(page); await openGame(page,'lagoon','count'); await assertNoOverflow(page); });
for(const device of [{name:'iPhone landscape',width:844,height:390},{name:'iPad portrait',width:768,height:1024},{name:'iPad landscape',width:1024,height:768}]) test(`${device.name} stays usable on home and in game`,async({browser})=>{const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.width<700,hasTouch:true});const page=await context.newPage();await setAge(page,5);await assertNoOverflow(page);await openGame(page,'lagoon','count');await assertNoOverflow(page);await context.close()});