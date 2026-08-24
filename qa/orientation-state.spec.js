const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/app-v70.html';

async function ready(page,age=5){
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(a=>localStorage.setItem('mimo70',JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}})),age);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#home')).toHaveClass(/on/);
}

async function noHorizontalOverflow(page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2)).toBeTruthy();
}

test('rotar iPhone en Inicio conserva estado, edad y layout usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await ready(page,5);
  await expect(page.locator('#homeAge')).toContainText('5–6');
  await noHorizontalOverflow(page);
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#home')).toHaveClass(/on/);
  await expect(page.locator('#homeAge')).toContainText('5–6');
  await noHorizontalOverflow(page);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#home')).toHaveClass(/on/);
  await noHorizontalOverflow(page);
});

test('rotar iPhone durante una actividad no expulsa al niño ni rompe el juego',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await ready(page,5);
  await page.locator('[data-world="lagoon"]').first().click();
  await page.locator('#activityGrid [data-game="count"]').click();
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
  await noHorizontalOverflow(page);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#game')).toHaveClass(/on/);
  await expect(page.locator('#playfield')).toBeVisible();
  await noHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('cambio de tamaño tipo iPad mantiene navegación y targets accesibles',async({page})=>{
  await page.setViewportSize({width:768,height:1024});
  await ready(page,3);
  await page.locator('[data-world="forest"]').first().click();
  await expect(page.locator('#world')).toHaveClass(/on/);
  await page.setViewportSize({width:1024,height:768});
  await expect(page.locator('#world')).toHaveClass(/on/);
  await expect(page.locator('#activityGrid button')).toHaveCount(6);
  await noHorizontalOverflow(page);
  const undersized=await page.locator('#world button:visible,#bottomBar button:visible').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.width<44||r.height<44}).length);
  expect(undersized).toBe(0);
});
