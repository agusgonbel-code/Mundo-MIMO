const { test, expect } = require('@playwright/test');

async function boot(page, age=3) {
  await page.goto('/app-v70.html');
  await page.evaluate(a => {
    localStorage.setItem('mimo70', JSON.stringify({age:a,sessions:0,rounds:0,stars:0,daily:0,dailyDate:new Date().toISOString().slice(0,10),skills:{}}));
    localStorage.removeItem('mimo71');
  }, age);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.MundoMimoLearningV130));
}

test('v130 exposes five curricular age bands and valid activity metadata', async ({ page }) => {
  await boot(page,3);
  const audit = await page.evaluate(() => {
    const m=window.MundoMimoLearningV130;
    return {
      version:m.version,
      ageBands:m.ageBands.map(x=>x.id),
      activityCount:Object.keys(m.activities).length,
      errors:m.validate(),
      complete:Object.values(m.activities).every(a=>a.area&&a.skill&&a.subskill&&a.mechanic&&a.objective&&a.ages.length&&a.levels===5&&a.promptVariants===100)
    };
  });
  expect(audit.version).toBe(130);
  expect(audit.ageBands).toEqual(['0-2','2-3','3-4','4-5','5-6']);
  expect(audit.activityCount).toBe(24);
  expect(audit.errors).toEqual([]);
  expect(audit.complete).toBeTruthy();
});

test('catalog metrics distinguish mechanics activities progression levels and prompt variants', async ({ page }) => {
  await boot(page,5);
  const metrics=await page.evaluate(()=>window.MundoMimoLearningV130.metrics);
  expect(metrics.activities).toBe(24);
  expect(metrics.ageBands).toBe(5);
  expect(metrics.levels).toBe(120);
  expect(metrics.promptVariants).toBe(2400);
  expect(metrics.mechanics).toBeGreaterThanOrEqual(12);
  expect(metrics.mechanics).toBeLessThan(metrics.activities);
  expect(metrics.areas).toBeGreaterThanOrEqual(8);
  expect(metrics.skills).toBeGreaterThanOrEqual(12);
});

test('activity buttons receive pedagogical traceability and current adaptive level', async ({ page }) => {
  await boot(page,3);
  await page.locator('[data-world="forest"]').first().click();
  const animal=page.locator('#activityGrid [data-game="animals"]');
  await expect(animal).toHaveAttribute('data-learning-area','Conocimiento del entorno');
  await expect(animal).toHaveAttribute('data-learning-skill','Vocabulario');
  await expect(animal).toHaveAttribute('data-learning-mechanic','seleccion-visual');
  await expect(animal).toHaveAttribute('data-learning-level','1');
});

test('adaptive level rises only after enough demonstrated performance', async ({ page }) => {
  await boot(page,5);
  const result=await page.evaluate(()=>{
    const model=window.MundoMimoLearningV130;
    localStorage.setItem('mimo71',JSON.stringify({games:{count:{attempts:12,correct:11,wrong:1,streak:4}}}));
    return {level:model.levelFor('count'),recommended:model.recommendations(5)};
  });
  expect(result.level).toBe(5);
  expect(result.recommended.length).toBeGreaterThan(0);
  expect(result.recommended.every(x=>x.id&&x.area&&x.skill&&Number.isInteger(x.level))).toBeTruthy();
});

test('parent zone shows honest product depth instead of calling variants separate games', async ({ page }) => {
  await boot(page,3);
  const card=page.locator('.mimo-curriculum-v130');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('mecánicas');
  await expect(card).toContainText('24');
  await expect(card).toContainText('actividades');
  await expect(card).toContainText('120');
  await expect(card).toContainText('niveles de progresión');
  await expect(card).toContainText('2400');
  await expect(card).toContainText('variantes de contexto/pregunta');
});

test('learning model is included in offline core', async ({ page }) => {
  const sw=await (await page.request.get('/sw.js')).text();
  expect(sw).toContain('./assets/learning-model-v130.js');
});
