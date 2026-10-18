import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4176';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
async function open(id) { await page.goto(base+'/?games=1&game='+id); await page.getByRole('button',{name:'Start game',exact:true}).click(); await expect(page.locator('.game-play')).toBeVisible(); await expect(page.locator('.rewards-panel')).toHaveCount(0); }
async function result(score) {await expect(page.locator('.result-points')).toContainText(String(score));}
try {
 await page.goto(base+'/?games=1'); await page.getByLabel('First name',{exact:true}).fill('Demo guest'); await page.getByLabel('Phone number',{exact:true}).fill('+12025550123'); await page.getByRole('button',{name:'Start playing',exact:true}).click();await expect(page.locator('.game-choice')).toHaveCount(8);
 for(const width of [360,390,768,1440]) {
  await page.setViewportSize({width,height:844});
  for(const id of ['cinema','swap','coffee','echo']) {
   await open(id);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow');
   await page.screenshot({path:'qa/'+id+'-'+width+'.png',fullPage:true});
   if(width===390) {
    const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],id+' accessibility');
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 await open('cinema');
 for(const answer of ['Fazil','Ramu Kariat','A cable TV network','Nivin Pauly','Anjali Menon']) {
  await page.getByRole('button',{name:answer,exact:true}).click();
  await page.getByRole('button',{name:/Next question|See result/}).click();
 }
 await result(50);
 await open('coffee');
 for(const recipe of [['Espresso','Milk'],['Espresso','Chocolate','Milk'],['Espresso','Milk','Foam'],['Ice','Espresso','Milk'],['Caramel','Espresso','Milk','Foam']]) {
  for(const item of recipe) await page.getByRole('button',{name:item,exact:true}).click();
  await page.getByRole('button',{name:/Serve coffee/}).click();
 }
 await result(50);
 await open('swap');
 for(let n=0;n<15 && !await page.locator('.result-points').count();n++) {
  await page.getByRole('button',{name:'Show a hint'}).click();
  const hint=await page.locator('.game-play>p').innerText();const [,row,col]=hint.match(/row (\d), column (\d)/);
  await page.locator('.sweet-grid button').nth((Number(row)-1)*6+Number(col)-1).click();
  await expect(page.getByRole('button',{name:'Show a hint'})).toBeEnabled({timeout:15000}).catch(async e=>{if(!await page.locator('.result-points').count())throw e});
 }
 await expect(page.locator('.result-points')).toBeVisible();
 await open('echo');
 for(let round=1;round<=5;round++) {
  const sequence=[];let previous=-1;
  while(await page.locator('.echo-pad').first().isDisabled()) {
   const lit=await page.locator('.echo-pad').evaluateAll(nodes=>nodes.findIndex(n=>n.classList.contains('is-lit')));
   if(lit>=0&&lit!==previous)sequence.push(lit);previous=lit;
   await page.waitForTimeout(50);
  }
  assert.equal(sequence.length,round);
  for(const index of sequence) await page.locator('.echo-pad').nth(index).click();
 }
 await result(50);
 await open('catch');for(let n=0;n<10;n++)await page.getByRole('button',{name:/Catch leaf/}).click();await result(50);
 await open('memory');await expect(page.locator('.memory-tile')).toHaveCount(12);
 await open('pour');for(let n=0;n<5;n++)await page.getByRole('button',{name:/Stop the pour/}).click();await expect(page.locator('.result-points')).toBeVisible();
 await open('quiz');await expect(page.locator('.quiz-options button')).toHaveCount(3);
 await page.getByRole('button',{name:'Restart',exact:true}).click();await expect(page.getByRole('button',{name:'Start game',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Arcade',exact:true}).click();await expect(page.locator('.score-ticket')).toContainText('/ 400');
 await expect(page.getByRole('button',{name:'Start claim steps'})).toHaveCount(2);
 await page.reload();await expect(page.locator('.game-choice').filter({hasText:'Malayalam Cinema'})).toContainText('BEST 50');
 assert.deepEqual(errors,[]);console.log('PASS: eight routes, new game completions, scores, rewards, restart, responsive screenshots and axe.');
} finally {await browser.close();}
