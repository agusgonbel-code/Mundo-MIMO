const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/v2/app-v200.html';
const RECOVERY='mimo-v2-recovery-570';
const RUNTIME='mimo-v2-runtime-200';

async function openFresh(page){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(([recovery,runtime])=>{localStorage.removeItem(recovery);localStorage.removeItem(runtime)},[RECOVERY,RUNTIME]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toHaveText('Mundo Mimo 2');
}

async function openLateGame(page){
  await page.locator('[data-age="5-6"]').click();
  await expect(page.locator('[data-age="5-6"]')).toHaveAttribute('aria-pressed','true');
  const card=page.locator('[data-game="detective-de-evidencias"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#gameTitle')).toHaveText('Detective de evidencias');
}

test('V2 reabre el juego activo y la franja de edad tras una recarga',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openFresh(page);
  await openLateGame(page);
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RECOVERY);
  expect(before.activeGame).toBe('detective-de-evidencias');
  expect(before.age).toBe('5-6');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage')).toBeVisible();
  await expect(page.locator('#stage')).toHaveAttribute('data-recovered-session','true');
  await expect(page.locator('#stage')).toHaveAttribute('data-recovered-game','detective-de-evidencias');
  await expect(page.locator('#gameTitle')).toHaveText('Detective de evidencias');
  await expect(page.locator('[data-age="5-6"]')).toHaveAttribute('aria-pressed','true');
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RECOVERY);
  expect(after.resumeCount).toBe(1);
});

test('cerrar voluntariamente un juego impide que reaparezca al reiniciar',async({page})=>{
  await openFresh(page);
  await openLateGame(page);
  await page.locator('#closeGame').click();
  await expect(page.locator('#stage')).toBeHidden();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RECOVERY);
  expect(saved.activeGame).toBeUndefined();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage')).toBeHidden();
  await expect(page.locator('#stage')).not.toHaveAttribute('data-recovered-session','true');
});

test('recuperar contexto no altera métricas de progreso ya persistidas',async({page})=>{
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(([recovery,runtime])=>{
    localStorage.setItem(runtime,JSON.stringify({age:'5-6',games:{'detective-de-evidencias':{plays:7,success:5,last:12345}}}));
    localStorage.setItem(recovery,JSON.stringify({age:'5-6',activeGame:'detective-de-evidencias',startedAt:111,resumeCount:2}));
  },[RECOVERY,RUNTIME]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage')).toBeVisible();
  const progress=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RUNTIME);
  expect(progress.games['detective-de-evidencias']).toEqual({plays:7,success:5,last:12345});
  const recovery=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RECOVERY);
  expect(recovery.resumeCount).toBe(3);
});

test('un identificador corrupto se descarta sin abrir un juego incorrecto',async({page})=>{
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({age:'5-6',activeGame:'juego-que-no-existe'})),RECOVERY);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage')).toBeHidden();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),RECOVERY);
  expect(saved.activeGame).toBeUndefined();
});

test('una sesión recuperada sigue usable tras rotar iPhone e iPad',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openFresh(page);
  await openLateGame(page);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#stage')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBeTruthy();
  await page.setViewportSize({width:1024,height:768});
  await expect(page.locator('#stage')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBeTruthy();
});
