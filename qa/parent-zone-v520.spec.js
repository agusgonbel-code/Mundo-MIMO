const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ParentV520&&window.MundoMimoV2WorldsV510&&window.MundoMimoV2DepthV500));
}

test.beforeEach(async({page})=>{
  await boot(page);
  await page.evaluate(()=>{localStorage.removeItem('mimo-v2-parent-v520');localStorage.removeItem('mimo-v2-runtime-200');localStorage.removeItem('mimo-v2-depth-v500');localStorage.removeItem('mimo-v2-worlds-v510');});
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ParentV520));
});

test('parent zone is native, closed by default and requires an adult verification',async({page})=>{
  await expect(page.locator('#parentEntry')).toBeVisible();
  await expect(page.locator('#parentPanel')).toBeHidden();
  await page.click('#parentEntry');
  await expect(page.locator('#parentGate')).toBeVisible();
  const answer=await page.evaluate(()=>{const q=document.getElementById('parentQuestion').textContent.split('+').map(Number);return q[0]+q[1]});
  await page.fill('#parentAnswer',String(answer+1));
  await page.click('[data-parent-submit]');
  await expect(page.locator('#parentPanel')).toBeHidden();
  await expect(page.locator('#parentGateError')).toContainText('incorrecta');
  await page.fill('#parentAnswer',String(answer));
  await page.click('[data-parent-submit]');
  await expect(page.locator('#parentPanel')).toBeVisible();
  await expect(page.locator('#parentPanel')).toContainText('Zona de familias');
});

test('summary derives only from local progress and reports truthful aggregate metrics',async({page})=>{
  const result=await page.evaluate(()=>{
    const ids=window.MundoMimoV2RuntimeV430.implemented.slice(0,4),games={};
    ids.forEach((id,i)=>games[id]={plays:i+1,success:i<3?1:0,last:1000+i});
    localStorage.setItem('mimo-v2-runtime-200',JSON.stringify({age:'3-4',games}));
    const s=window.MundoMimoV2ParentV520.summary();
    return {s,ids,stats:window.MundoMimoV2ParentV520.gameStats().filter(g=>ids.includes(g.id))};
  });
  expect(result.s.games).toBe(150);
  expect(result.s.played).toBe(4);
  expect(result.s.completed).toBe(3);
  expect(result.s.attempts).toBe(10);
  expect(result.s.success).toBe(3);
  expect(result.s.successRate).toBe(30);
  expect(result.s.ageBand).toBe('3-4');
  expect(result.stats).toHaveLength(4);
});

test('recommendations stay inside the selected developmental band',async({page})=>{
  const result=await page.evaluate(()=>{
    localStorage.setItem('mimo-v2-runtime-200',JSON.stringify({age:'1-2',games:{}}));
    const recs=window.MundoMimoV2ParentV520.recommendations(8);
    const byId=new Map(window.MundoMimoV2RuntimeV430.allGames().map(g=>[g.id,g]));
    return recs.map(r=>({id:r.id,ages:byId.get(r.id).ages}));
  });
  expect(result.length).toBeGreaterThan(0);
  for(const r of result)expect(r.ages).toContain('1-2');
});

test('family preferences persist locally and stay within safe bounds',async({page})=>{
  const result=await page.evaluate(()=>{
    const P=window.MundoMimoV2ParentV520;
    P.saveConfig({dailyMinutes:500,sound:false,reducedMotion:true});
    return {cfg:P.config(),raw:localStorage.getItem('mimo-v2-parent-v520')};
  });
  expect(result.cfg.dailyMinutes).toBe(60);
  expect(result.cfg.sound).toBeFalsy();
  expect(result.cfg.reducedMotion).toBeTruthy();
  expect(result.raw).toContain('dailyMinutes');
});

test('parent module makes no network requests for progress or family settings',async({page})=>{
  const requests=[];
  page.on('request',r=>{if(!r.url().includes('127.0.0.1')&&!r.url().includes('localhost'))requests.push(r.url())});
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ParentV520));
  await page.evaluate(()=>{window.MundoMimoV2ParentV520.summary();window.MundoMimoV2ParentV520.areaBreakdown();window.MundoMimoV2ParentV520.recommendations();window.MundoMimoV2ParentV520.saveConfig({dailyMinutes:15});});
  expect(requests).toEqual([]);
});

test('parent UI fits a 320px iPhone width with adult controls at least 44px high',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.click('#parentEntry');
  const answer=await page.evaluate(()=>document.getElementById('parentQuestion').textContent.split('+').map(Number).reduce((a,b)=>a+b,0));
  await page.fill('#parentAnswer',String(answer));
  await page.click('[data-parent-submit]');
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth,entry:document.getElementById('parentEntry').getBoundingClientRect().height,close:document.querySelector('.parentClose').getBoundingClientRect().height}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner+1);
  expect(metrics.entry).toBeGreaterThanOrEqual(44);
  expect(metrics.close).toBeGreaterThanOrEqual(44);
});
