const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2AccessibilityV640&&window.MundoMimoV2RuntimeV430));
}
async function firstGame(page){const card=page.locator('#gameGrid [data-game]').first();await expect(card).toBeVisible();return card}
async function assertTargets(page){
  const small=await page.locator('button:visible,[role="button"]:visible,[tabindex="0"]:visible').evaluateAll(nodes=>nodes.filter(el=>{const r=el.getBoundingClientRect();return r.width<44||r.height<44}).map(el=>({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,60),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})));
  expect(small).toEqual([]);
}

test('V640 exposes V2 landmarks, status and progress semantics',async({page})=>{
  await boot(page);
  await expect(page.locator('.shell')).toHaveAttribute('role','main');
  await expect(page.locator('#ageBar')).toHaveAttribute('role','group');
  await expect(page.locator('#ageBar')).toHaveAttribute('aria-label','Selecciona la edad');
  await expect(page.locator('#feedback')).toHaveAttribute('role','status');
  await expect(page.locator('#feedback')).toHaveAttribute('aria-live','polite');
  const progress=page.locator('.progress');
  await expect(progress).toHaveAttribute('role','progressbar');
  await expect(progress).toHaveAttribute('aria-valuemin','0');
  await expect(progress).toHaveAttribute('aria-valuemax','100');
  await expect(progress).toHaveAttribute('aria-valuenow','0');
});

test('V640 sends focus into a launched game and Escape returns it to the launcher',async({page})=>{
  await boot(page);
  const card=await firstGame(page);const id=await card.getAttribute('data-game');
  await card.click();
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#closeGame')).toBeFocused();
  await expect(page.locator('#stage')).toHaveAttribute('role','region');
  await expect(page.locator('#stage')).toHaveAttribute('aria-labelledby','gameTitle');
  await page.keyboard.press('Escape');
  await expect(page.locator('#stage')).toBeHidden();
  await expect(page.locator(`#gameGrid [data-game="${id}"]`)).toBeFocused();
});

test('V640 provides a visible focus indicator under keyboard navigation',async({page})=>{
  await boot(page);
  await page.keyboard.press('Tab');
  const focused=page.locator(':focus');
  await expect(focused).toBeVisible();
  const outline=await focused.evaluate(el=>{const s=getComputedStyle(el);return{style:s.outlineStyle,width:parseFloat(s.outlineWidth)||0,offset:parseFloat(s.outlineOffset)||0}});
  expect(outline.style).not.toBe('none');expect(outline.width).toBeGreaterThanOrEqual(3);expect(outline.offset).toBeGreaterThanOrEqual(2);
});

for(const viewport of [{name:'iphone-320',width:320,height:568},{name:'iphone-390',width:390,height:844},{name:'ipad',width:768,height:1024}]){
  test(`V640 keeps interactive targets >=44px on ${viewport.name}`,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});await boot(page);await assertTargets(page);
    const card=await firstGame(page);await card.click();await expect(page.locator('#stage')).toBeVisible();await assertTargets(page);
  });
}

test('V640 stays active after age churn and preserves one accessible owner',async({page})=>{
  await boot(page);
  for(const age of ['0-1','1-2','2-3','3-4','4-5','5-6']){const b=page.locator(`[data-age="${age}"]`);await b.click();await expect(b).toHaveAttribute('aria-pressed','true');}
  expect(await page.locator('style[data-accessibility-v640]').count()).toBe(1);
  await firstGame(page);
  await expect(page.locator('#feedback')).toHaveAttribute('aria-atomic','true');
});