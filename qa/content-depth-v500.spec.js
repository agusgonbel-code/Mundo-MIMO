const {test,expect}=require('@playwright/test');

async function boot(page){
  await page.goto('/v2/app-v200.html');
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2DepthV500&&window.MundoMimoV2RuntimeV430));
}

test('v500 reaches honest depth targets without inflating game count',async({page})=>{
  await boot(page);
  const data=await page.evaluate(()=>({metrics:window.MundoMimoV2DepthV500.metrics,games:window.MundoMimoV2RuntimeV430.implemented.length}));
  expect(data.games).toBe(150);
  expect(data.metrics).toEqual({games:150,activities:600,levels:5400,challenges:27000,variants:0});
});

test('v500 validates all 600 activities, 5400 levels and 27000 challenges',async({page})=>{
  await boot(page);
  const audit=await page.evaluate(()=>window.MundoMimoV2DepthV500.audit());
  expect(audit.errors).toEqual([]);
  expect(audit.games).toBe(150);
  expect(audit.activities).toBe(600);
  expect(audit.levels).toBe(5400);
  expect(audit.challenges).toBe(27000);
  expect(audit.activitiesPerGame).toBe(4);
  expect(audit.levelsPerGame).toBe(36);
  expect(audit.challengesPerGame).toBe(180);
});

test('every game exposes four pedagogical activity modes and 36 progressive levels',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430;
    return R.implemented.map(id=>({id,activities:D.activities(id).map(a=>a.mode),levels:D.levels(id).map(l=>({n:l.number,within:l.levelInActivity,s:l.supportIntensity,t:l.tier}))}));
  });
  for(const g of result){
    expect(g.activities).toEqual(['descubre','practica','transfiere','repaso-mixto']);
    expect(g.levels).toHaveLength(36);
    for(let block=0;block<4;block++){
      const nine=g.levels.slice(block*9,block*9+9);
      expect(nine.map(x=>x.within)).toEqual([1,2,3,4,5,6,7,8,9]);
      expect(nine[0].s).toBeGreaterThanOrEqual(nine[8].s);
      expect(nine[0].t).toBe('guiado');
      expect(nine[8].t).toBe('independiente');
    }
  }
});

test('challenge generation is deterministic, unique and tied to the source game pedagogy',async({page})=>{
  await boot(page);
  const x=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430;
    const id=R.implemented[149],g=R.allGames().find(x=>x.id===id),a=D.challenge(id,36,5),b=D.challenge(id,36,5);
    return{id,game:g,a,b};
  });
  expect(x.a).toEqual(x.b);
  expect(x.a.gameId).toBe(x.id);
  expect(x.a.objective).toBe(x.game.objective);
  expect(x.a.mechanic).toBe(x.game.mechanic);
  expect(x.a.id).toMatch(/-l36-c5$/);
  expect(x.a.prompt.length).toBeGreaterThan(20);
});

test('adaptive depth progresses after mastery, backs off after repeated errors and persists',async({page})=>{
  await boot(page);
  const game=await page.evaluate(()=>window.MundoMimoV2RuntimeV430.implemented[20]);
  await page.evaluate(id=>window.MundoMimoV2DepthV500.reset(id),game);
  let p=await page.evaluate(id=>window.MundoMimoV2DepthV500.progress(id),game);
  expect(p.level).toBe(1);
  for(let i=0;i<3;i++)p=await page.evaluate(id=>window.MundoMimoV2DepthV500.recordOutcome(id,true),game);
  expect(p.level).toBe(2);
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.MundoMimoV2DepthV500));
  p=await page.evaluate(id=>window.MundoMimoV2DepthV500.progress(id),game);
  expect(p.level).toBe(2);
  p=await page.evaluate(id=>window.MundoMimoV2DepthV500.recordOutcome(id,false),game);
  p=await page.evaluate(id=>window.MundoMimoV2DepthV500.recordOutcome(id,false),game);
  expect(p.level).toBe(1);
});

test('sessions enforce developmental age bands and return five validated challenges',async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const D=window.MundoMimoV2DepthV500,R=window.MundoMimoV2RuntimeV430;
    const g=R.allGames().find(x=>x.ages.length===1)||R.allGames()[0];
    const valid=g.ages[0];let invalid=null;
    for(const b of window.MundoMimoV2.ageBands.map(x=>x.id))if(!g.ages.includes(b)){invalid=b;break}
    D.reset(g.id);const s=D.session(g.id,valid);let err='';if(invalid){try{D.session(g.id,invalid)}catch(e){err=e.message}}
    return{valid,invalid,ages:g.ages,session:s,error:err};
  });
  expect(result.session.ageBand).toBe(result.valid);
  expect(result.session.challenges).toHaveLength(5);
  expect(result.session.challenges.every(c=>c.ages.includes(result.valid))).toBeTruthy();
  if(result.invalid)expect(result.error).toBe('age-band-not-supported');
});
