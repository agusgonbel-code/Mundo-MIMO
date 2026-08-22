const { test, expect } = require('@playwright/test');

async function setAge(page,age=5){
  await page.goto('/app-v70.html');
  await page.evaluate(a=>localStorage.setItem('mimo70',JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}})),age);
  await page.reload();
  await expect(page.locator('#home')).toHaveClass(/on/);
  await page.waitForFunction(()=>Boolean(window.MundoMimoVisualV110));
}

async function visibleEmoji(page,root='#app'){
  return page.locator(root).evaluate(el=>{
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    const rx=/\p{Extended_Pictographic}/u;const hits=[];
    while(walker.nextNode()){
      const p=walker.currentNode.parentElement;
      if(!p||p.closest('script,style,svg,[hidden],.screen:not(.on)'))continue;
      const t=walker.currentNode.nodeValue||'';
      if(rx.test(t))hits.push(t.trim());
    }
    return hits.filter(Boolean);
  });
}

test('home uses branded vectors instead of OS emoji',async({page})=>{
  await setAge(page,5);
  expect(await visibleEmoji(page)).toEqual([]);
  expect(await page.locator('#home .mimo-vector').count()).toBeGreaterThanOrEqual(5);
});

test('count game replaces fish emoji with vector fish without breaking answers',async({page})=>{
  await setAge(page,5);
  await page.locator('[data-world="lagoon"]').first().click();
  await page.locator('#activityGrid [data-game="count"]').click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('.sceneVisual .mimo-vector[data-kind="fish"]').first()).toBeVisible();
  expect(await visibleEmoji(page,'#game')).toEqual([]);
  const correct=page.locator('#playfield [data-ok="true"]').first();
  await expect(correct).toBeVisible();
  await correct.click();
  await expect(page.locator('#streakText')).toContainText('1');
});

test('classification choices remain semantically distinct after vector conversion',async({page})=>{
  await setAge(page,5);
  await page.locator('[data-world="lagoon"]').first().click();
  await page.locator('#activityGrid [data-game="sort"]').click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  expect(await visibleEmoji(page,'#game')).toEqual([]);
  const choices=page.locator('#playfield [data-ok]');
  expect(await choices.count()).toBeGreaterThan(1);
  const labels=await choices.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')||n.textContent.trim()));
  expect(new Set(labels).size).toBeGreaterThan(1);
  await page.locator('#playfield [data-ok="true"]').first().click();
});

test('visual system is included in offline core',async({page})=>{
  const sw=await (await page.request.get('/sw.js')).text();
  expect(sw).toContain("'./assets/visual-system-v110.css'");
  expect(sw).toContain("'./assets/visual-system-v110.js'");
});
