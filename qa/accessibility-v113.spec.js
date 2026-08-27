const { test, expect } = require('@playwright/test');
test.setTimeout(40000);
const worlds={forest:['animals','sounds','memory','habitat','size','tracks'],lagoon:['count','more','colors','shapes','patterns','sort'],village:['emotions','stories','paint','routines','match','discover'],mountain:['letters','trace','initial','logic','sequence','odd']};
async function setAge(page,age=5,{needsVisual=true}={}){
  await page.addInitScript(a=>localStorage.setItem('mimo70',JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}})),age);
  await page.goto('/app-v70.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('home')?.classList.contains('on'),null,{timeout:12000});
  await expect(page.locator('#home')).toHaveClass(/on/);
  if(needsVisual)await page.waitForFunction(()=>Boolean(window.MundoMimoVisualDynamicV111),null,{timeout:25000});
}
async function assertTargets(page,root){const small=await page.locator(`${root} button:visible`).evaluateAll(nodes=>nodes.filter(el=>{const r=el.getBoundingClientRect();return r.width<44||r.height<44}).map(el=>({text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,50),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));expect(small,`${root}: touch target below 44px`).toEqual([])}
async function assertNames(page,root){const unnamed=await page.locator(`${root} button:visible`).evaluateAll(nodes=>nodes.filter(el=>!(el.getAttribute('aria-label')||el.textContent.trim())).map(el=>el.outerHTML.slice(0,180)));expect(unnamed,`${root}: unnamed button`).toEqual([])}

test('home and parent gate meet child touch and labelling baseline',async({page})=>{await setAge(page,3,{needsVisual:false});await assertTargets(page,'#home');await assertNames(page,'#home');await page.locator('[data-action="parent"]').first().click();await expect(page.locator('#parentGate')).toHaveClass(/on/);await assertTargets(page,'#parentGate');await expect(page.locator('#gateAnswer')).toHaveAttribute('aria-label',/Respuesta/)});

for(const age of [1,3,5])for(const [world,games] of Object.entries(worlds))for(const game of games)test(`age-${age} ${world}/${game} has accessible artwork and controls`,async({page})=>{await setAge(page,age);await page.locator(`[data-world="${world}"]`).first().click();await page.locator(`#activityGrid [data-game="${game}"]`).click();await expect(page.locator('#game')).toHaveClass(/on/);await page.waitForTimeout(40);await assertTargets(page,'#game');await assertNames(page,'#game');const decorative=await page.locator('#game .choice img,#game .memory img').evaluateAll(nodes=>nodes.filter(img=>img.getAttribute('alt')!==''||img.getAttribute('aria-hidden')!=='true').map(img=>img.outerHTML.slice(0,160)));expect(decorative,`${game}: option artwork should not be announced twice`).toEqual([])});

test('Mundo Mimo supports reduced motion for animated UI',async({page})=>{const premium=await (await page.request.get('/assets/premium-v71.css')).text();const vector=await (await page.request.get('/assets/visual-system-v110.css')).text();expect(premium+vector).toMatch(/prefers-reduced-motion/)});
