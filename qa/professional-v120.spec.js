const {test,expect}=require('@playwright/test');
test('Mundo Mimo loads professional child-first polish without losing mobile safety',async({page})=>{
  await page.goto('/app-v70.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(document.querySelector('link[data-mimo-professional="v120"]')),{timeout:10000});
  const css=await (await page.request.get('/assets/professional-v120.css')).text();
  expect(css).toContain('prefers-reduced-motion');
  expect(css).toContain('min-height:52px');
  expect(css).toContain('.bottomBar');
  expect(css).toContain('.choice');
});
