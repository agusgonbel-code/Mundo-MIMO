const {test,expect}=require('@playwright/test');

test('web and PWA entries target Mundo Mimo 2 instead of legacy V70',async({page})=>{
  const index=await (await page.request.get('/index.html')).text();
  const manifest=await (await page.request.get('/manifest.webmanifest')).json();
  expect(index).toContain('./v2/app-v200.html');
  expect(index).not.toContain('app-v70.html');
  expect(manifest.start_url).toBe('./v2/app-v200.html');
  expect(manifest.orientation).toBe('any');
});

test('service worker precaches the complete V2 release core and falls back to V2',async({page})=>{
  const sw=await (await page.request.get('/sw.js')).text();
  for(const marker of ['./v2/app-v200.html','./v2/core/platform-v200.js','./v2/catalog/seed-games-v200.js','./v2/runtime-v200.js','./v2/core/content-depth-v500.js','./v2/core/worlds-v510.js','./v2/core/parent-zone-v520.js'])expect(sw).toContain(marker);
  expect(sw).toContain('expansion-v${240+i*10}.js');
  expect(sw).toContain('runtime-v${210+i*10}-extension.js');
  expect(sw).toContain("caches.match('./v2/app-v200.html')");
  expect(sw).not.toContain("caches.match('./app-v70.html')");
});

test('installed V2 reloads offline with the 150-game runtime available',async({page,context})=>{
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV430));
  await page.evaluate(async()=>{
    if(!('serviceWorker' in navigator))throw new Error('Service Worker unavailable');
    await navigator.serviceWorker.ready;
  });

  // A newly installed service worker can become active before the current
  // document is controlled. Perform the same first online navigation an
  // installed PWA/user would perform, then require controller ownership
  // before cutting the network. This keeps the offline assertion strict
  // without depending on an implementation-specific controller timing race.
  if(!await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))){
    await page.reload({waitUntil:'domcontentloaded'});
  }
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV430));

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2RuntimeV430));
  await expect(page.locator('h1')).toHaveText('Mundo Mimo 2');
  expect(await page.evaluate(()=>window.MundoMimoV2RuntimeV430.implemented.length)).toBe(150);
  await context.setOffline(false);
});