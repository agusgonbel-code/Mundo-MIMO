const { test, expect } = require('@playwright/test');

const URL='/v2/app-v200.html';

async function ready(page){
  await page.goto(URL,{waitUntil:'load'});
  await page.waitForFunction(()=>
    globalThis.MundoMimoV2RuntimeV430?.implemented?.length===150 &&
    globalThis.MundoMimoV2CatalogRouterBootstrap?.version===590
  );
}

test('V590 browser activation leaves the first gameplay control responsive',async({page})=>{
  await ready(page);
  await page.locator('[data-age="3-4"]').click();
  await page.locator('[data-game="el-turno-es-de"]').click();
  await expect(page.locator('#gameTitle')).toHaveText('El turno es de…');
  await page.locator('[data-social="empujar"]').click();
  await expect(page.locator('#feedback')).toContainText('cuide');
});

test('V590 routing does not consume adult-gate validation controls',async({page})=>{
  await ready(page);
  await page.locator('#parentEntry').click();
  await expect(page.locator('#parentGate')).toBeVisible();
  const answer=await page.evaluate(()=>document.getElementById('parentQuestion').textContent.split('+').map(Number).reduce((a,b)=>a+b,0));
  await page.locator('#parentAnswer').fill(String(answer+1));
  await page.locator('[data-parent-submit]').click();
  await expect(page.locator('#parentAnswer')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#parentGateError')).toContainText('incorrecta');
});
