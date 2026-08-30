const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV430&&window.MundoMimoV2DepthV500&&window.MundoMimoV2AccessibilityV640));
}
async function noHorizontalOverflow(page){
  const x=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,body:document.body.scrollWidth}));
  expect(x.scroll).toBeLessThanOrEqual(x.client+1);expect(x.body).toBeLessThanOrEqual(x.client+1);
}
async function openFirst(page){const card=page.locator('#gameGrid [data-game]').first();await expect(card).toBeVisible();const id=await card.getAttribute('data-game');await card.click();await expect(page.locator('#stage')).toBeVisible();return id;}

const devices=[
  {name:'iphone-se',portrait:{width:320,height:568},landscape:{width:568,height:320}},
  {name:'iphone-modern',portrait:{width:390,height:844},landscape:{width:844,height:390}},
  {name:'ipad',portrait:{width:768,height:1024},landscape:{width:1024,height:768}},
  {name:'ipad-pro',portrait:{width:1024,height:1366},landscape:{width:1366,height:1024}}
];

for(const d of devices){
  test(`V650 survives portrait-landscape-portrait on ${d.name} without overflow or losing game`,async({page})=>{
    await page.setViewportSize(d.portrait);await boot(page);await noHorizontalOverflow(page);
    const id=await openFirst(page);
    const before=await page.locator('#gameTitle').textContent();
    await page.setViewportSize(d.landscape);await noHorizontalOverflow(page);
    await expect(page.locator('#stage')).toBeVisible();await expect(page.locator('#gameTitle')).toHaveText(before);
    await expect(page.locator('#stage')).toHaveAttribute('data-adaptive-game',id);
    await page.setViewportSize(d.portrait);await noHorizontalOverflow(page);
    await expect(page.locator('#stage')).toBeVisible();await expect(page.locator('#gameTitle')).toHaveText(before);
  });
}

test('V650 preserves selected age and adaptive progress through orientation churn and reload',async({page})=>{
  await page.setViewportSize({width:390,height:844});await boot(page);
  const age=page.locator('[data-age="1-2"]');await age.click();await expect(age).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>window.MundoMimoV2DepthV500.reset('eco-de-gestos'));
  await page.evaluate(()=>{const D=window.MundoMimoV2DepthV500;D.recordOutcome('eco-de-gestos',true);D.recordOutcome('eco-de-gestos',true);D.recordOutcome('eco-de-gestos',true)});
  let p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));expect(p.level).toBe(2);
  for(const v of [{width:844,height:390},{width:390,height:844},{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(v);await noHorizontalOverflow(page)}
  await page.reload();await page.waitForFunction(()=>Boolean(window.MundoMimoV2DepthV500&&window.MundoMimoV2RuntimeV430));
  await expect(page.locator('[data-age="1-2"]')).toHaveAttribute('aria-pressed','true');
  p=await page.evaluate(()=>window.MundoMimoV2DepthV500.progress('eco-de-gestos'));expect(p.level).toBe(2);
});

test('V650 keeps all six age bands reachable in iPhone landscape and iPad split-like width',async({page})=>{
  for(const v of [{width:568,height:320},{width:744,height:1133}]){
    await page.setViewportSize(v);await boot(page);await noHorizontalOverflow(page);
    for(const age of ['0-1','1-2','2-3','3-4','4-5','5-6']){const b=page.locator(`[data-age="${age}"]`);await expect(b).toBeVisible();await b.click();await expect(b).toHaveAttribute('aria-pressed','true');await expect(page.locator('#gameGrid [data-game]').first()).toBeVisible();}
  }
});
