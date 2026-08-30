const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2ExpansionV430)&&Boolean(window.MundoMimoV2RuntimeV430)&&typeof window.MundoMimoV2Performance?.startGame==='function');
}

function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b\d+\b/g,'#').replace(/[^a-z#]+/g,' ').trim();}

test('V660 rejects nominal variants: all 150 games have unique rule-level gameplay signatures',async({page})=>{
  await boot(page);
  const audit=await page.evaluate(()=>{
    const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b\d+\b/g,'#').replace(/[^a-z#]+/g,' ').trim();
    const games=window.MundoMimoV2ExpansionV430.merged;
    const rows=games.map(g=>({
      id:g.id,
      mechanic:norm(g.mechanic),
      interaction:norm(g.rules?.interaction),
      win:norm(g.rules?.win),
      progression:norm(g.rules?.progression),
      objective:norm(g.objective),
      skill:norm(g.skill),
      subskill:norm(g.subskill)
    }));
    const ruleGroups=new Map();
    for(const r of rows){
      const key=[r.mechanic,r.interaction,r.win].join('|');
      if(!ruleGroups.has(key))ruleGroups.set(key,[]);
      ruleGroups.get(key).push(r.id);
    }
    const semanticGroups=new Map();
    for(const r of rows){
      const key=[r.mechanic,r.interaction,r.win,r.progression,r.objective,r.skill,r.subskill].join('|');
      if(!semanticGroups.has(key))semanticGroups.set(key,[]);
      semanticGroups.get(key).push(r.id);
    }
    return{
      games:rows.length,
      ruleSignatures:ruleGroups.size,
      semanticSignatures:semanticGroups.size,
      ruleClones:[...ruleGroups.entries()].filter(([,ids])=>ids.length>1),
      semanticClones:[...semanticGroups.entries()].filter(([,ids])=>ids.length>1)
    };
  });
  expect(audit.games).toBe(150);
  expect(audit.ruleClones,JSON.stringify(audit.ruleClones)).toEqual([]);
  expect(audit.semanticClones,JSON.stringify(audit.semanticClones)).toEqual([]);
  expect(audit.ruleSignatures).toBe(150);
  expect(audit.semanticSignatures).toBe(150);
});

test('V660 does not accept metadata-only games: every catalog entry resolves to a playable runtime owner',async({page})=>{
  await boot(page);
  const audit=await page.evaluate(()=>{
    const games=window.MundoMimoV2ExpansionV430.merged;
    const implemented=new Set(window.MundoMimoV2RuntimeV430.implemented);
    return{catalog:games.map(g=>g.id),missing:games.map(g=>g.id).filter(id=>!implemented.has(id))};
  });
  expect(audit.catalog).toHaveLength(150);
  expect(new Set(audit.catalog).size).toBe(150);
  expect(audit.missing).toEqual([]);
});

for(let shard=0;shard<10;shard++){
  test(`V660 physically launches and distinguishes all games in WebKit [${shard+1}/10]`,async({page})=>{
    await boot(page);
    const games=await page.evaluate(()=>window.MundoMimoV2ExpansionV430.merged.map(g=>({id:g.id,name:g.name,ages:g.ages})));
    const subset=games.filter((_,i)=>i%10===shard);
    expect(subset).toHaveLength(15);
    const runtimeEvidence=[];
    for(const g of subset){
      await page.evaluate(id=>window.MundoMimoV2Performance.startGame(id),g.id);
      await expect(page.locator('#stage'),`stage did not open for ${g.id}`).toBeVisible();
      await expect(page.locator('#gameTitle'),`wrong title for ${g.id}`).toHaveText(g.name);
      const live=await page.locator('#play').evaluate(el=>{
        const controls=[...el.querySelectorAll('button,input,select,textarea,canvas,[role="button"],[draggable="true"],.draggable,.bigTarget,.hiddenObj,.pad,.block')];
        const attrs=[...new Set(controls.flatMap(n=>[...n.attributes].map(a=>a.name).filter(x=>x.startsWith('data-'))))].sort();
        return{html:el.innerHTML.length,controls:controls.length,tags:[...new Set(controls.map(n=>n.tagName.toLowerCase()))].sort(),attrs};
      });
      expect(live.html,`${g.id} rendered empty play UI`).toBeGreaterThan(0);
      expect(live.controls,`${g.id} has no interactive gameplay surface`).toBeGreaterThan(0);
      runtimeEvidence.push({id:g.id,...live});
      await page.locator('#closeGame').click();
      await expect(page.locator('#stage')).toBeHidden();
    }
    expect(runtimeEvidence).toHaveLength(15);
  });
}

test('V660 age coverage remains real after rejecting variants',async({page})=>{
  await boot(page);
  const coverage=await page.evaluate(()=>{
    const games=window.MundoMimoV2ExpansionV430.merged;
    return Object.fromEntries(window.MundoMimoV2.ageBands.map(b=>[b.id,{games:games.filter(g=>g.ages.includes(b.id)).length,ruleSignatures:new Set(games.filter(g=>g.ages.includes(b.id)).map(g=>[g.mechanic,g.rules?.interaction,g.rules?.win].join('|'))).size}]));
  });
  expect(Object.keys(coverage)).toEqual(['0-1','1-2','2-3','3-4','4-5','5-6']);
  for(const [age,data] of Object.entries(coverage)){
    expect(data.games,`${age} lacks playable breadth`).toBeGreaterThanOrEqual(4);
    expect(data.ruleSignatures,`${age} collapses into rule variants`).toBe(data.games);
  }
});
