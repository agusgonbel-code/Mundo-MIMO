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
  await expect(page.locator('#parentGate')).toBeVisible();
  await expect(page.locator('#parentAnswer')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#parentGateError')).toHaveAttribute('data-state','invalid');
  await expect(page.locator('#parentGateError')).toContainText('incorrecta');
  await page.fill('#parentAnswer',String(answer));
  await page.click('[data-parent-submit]');
  await expect(page.locator('#parentPanel')).toBeVisible();
  await expect(page.locator('#parentPanel')).toContainText('Zona de familias');
});

test('adult submit has one owner and never enters the catalog routing queue',async({page})=>{
  const state=await page.evaluate(()=>{
    document.getElementById('parentEntry').click();
    const q=document.getElementById('parentQuestion').textContent.split('+').map(Number);
    const input=document.getElementById('parentAnswer');
    input.value=String(q[0]+q[1]+1);
    document.querySelector('[data-parent-submit]').click();
    return {
      invalid:input.getAttribute('aria-invalid'),
      errorState:document.getElementById('parentGateError').dataset.state,
      pending:globalThis.MundoMimoV2CatalogRouterBootstrap?.pendingCount,
      panelHidden:document.getElementById('parentPanel').hidden,
      gateHidden:document.getElementById('parentGate').hidden,
    };
  });
  expect(state).toEqual({invalid:'true',errorState:'invalid',pending:0,panelHidden:true,gateHidden:false});
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
});

test('recommendations stay inside the selected developmental band',async({page})=>{
  const recs=await page.evaluate(()=>{
    localStorage.setItem('mimo-v2-runtime-200',JSON.stringify({age:'1-2',games:{}}));
    return window.MundoMimoV2ParentV520.recommendations(20).map(r=>({id:r.id,ages:window.MundoMimoV2RuntimeV430.allGames().find(g=>g.id===r.id)?.ages||[]}));
  });
  expect(recs.length).toBeGreaterThan(0);
  recs.forEach(r=>expect(r.ages).toContain('1-2'));
});

test('family preferences persist locally and stay within safe bounds',async({page})=>{
  const cfg=await page.evaluate(()=>{
    window.MundoMimoV2ParentV520.saveConfig({dailyMinutes:999,sound:false,reducedMotion:true});
    return window.MundoMimoV2ParentV520.config();
  });
  expect(cfg.dailyMinutes).toBe(60);
  expect(cfg.sound).toBeFalsy();
  expect(cfg.reducedMotion).toBeTruthy();
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ParentV520));
  const restored=await page.evaluate(()=>window.MundoMimoV2ParentV520.config());
  expect(restored.dailyMinutes).toBe(60);
  expect(restored.sound).toBeFalsy();
  expect(restored.reducedMotion).toBeTruthy();
});

test('parent module makes no network requests for progress or family settings',async({page})=>{
  const external=[];
  page.on('request',r=>{const u=new URL(r.url());if(u.origin!=='http://127.0.0.1:4173')external.push(r.url())});
  await page.evaluate(()=>{
    window.MundoMimoV2ParentV520.summary();
    window.MundoMimoV2ParentV520.recommendations();
    window.MundoMimoV2ParentV520.saveConfig({dailyMinutes:15});
  });
  expect(external).toEqual([]);
});

test('parent UI fits a 320px iPhone width with adult controls at least 44px high',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await page.click('#parentEntry');
  const gateOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(gateOverflow).toBeLessThanOrEqual(1);
  const heights=await page.locator('#parentGate button,#parentAnswer').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
  heights.forEach(h=>expect(h).toBeGreaterThanOrEqual(44));
});
