const { test, expect } = require('@playwright/test');

const worlds={
  forest:['animals','sounds','memory','habitat','size','tracks'],
  lagoon:['count','more','colors','shapes','patterns','sort'],
  village:['emotions','stories','paint','routines','match','discover'],
  mountain:['letters','trace','initial','logic','sequence','odd'],
};

async function setAge(page,age){
  await page.goto('/app-v70.html');
  await page.evaluate(a=>localStorage.setItem('mimo70',JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}})),age);
  await page.reload();
  await expect(page.locator('#home')).toHaveClass(/on/);
  await page.waitForFunction(()=>Boolean(window.MundoMimoVisualV110));
  await expect(page.locator('body')).toHaveClass(/mimo-vector-ready/);
}

async function visiblePictographs(page,root='#game'){
  return page.locator(root).evaluate(el=>{
    const rx=/\p{Extended_Pictographic}/u,hits=[];
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const p=walker.currentNode.parentElement;
      if(!p||p.closest('script,style,svg,[hidden],.screen:not(.on)'))continue;
      const value=(walker.currentNode.nodeValue||'').trim();
      if(value&&rx.test(value))hits.push(value);
    }
    return hits;
  });
}

async function assertProfessionalVisuals(page,label){
  await page.waitForTimeout(40);
  expect(await visiblePictographs(page),`${label}: native pictographs remain visible`).toEqual([]);
  const generic=page.locator('#game .mimo-vector[data-kind="generic"]:visible');
  expect(await generic.count(),`${label}: generic fallback vector is visible`).toBe(0);
  const broken=await page.locator('#game img:visible').evaluateAll(nodes=>nodes.filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src));
  expect(broken,`${label}: broken artwork`).toEqual([]);
}

for(const age of [1,3,5]){
  for(const [world,games] of Object.entries(worlds)){
    for(const game of games){
      test(`age-${age} ${world}/${game} has complete branded visual coverage`,async({page})=>{
        await setAge(page,age);
        await page.locator(`[data-world="${world}"]`).first().click();
        await page.locator(`#activityGrid [data-game="${game}"]`).click();
        await expect(page.locator('#game')).toHaveClass(/on/);
        await assertProfessionalVisuals(page,`age-${age} ${world}/${game}`);
      });
    }
  }
}

test('free activities have branded visuals without OS emoji',async({page})=>{
  await setAge(page,5);
  for(const game of ['paint','music','discover']){
    await page.locator('#game [data-action="back-world"]').click().catch(()=>{});
    await page.locator('#world [data-action="home"]').click().catch(()=>{});
    if(!(await page.locator('#home').evaluate(el=>el.classList.contains('on')))){
      await page.evaluate(()=>document.querySelectorAll('.screen').forEach(s=>s.id==='home'?s.classList.add('on'):s.classList.remove('on')));
    }
    await page.locator(`.freeGrid [data-game="${game}"]`).click();
    await expect(page.locator('#game')).toHaveClass(/on/);
    await assertProfessionalVisuals(page,`free/${game}`);
  }
});
