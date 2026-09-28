import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined,headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const results=[];
 for(const theme of ['garden','noir-cafe','spice-kitchen','grand-hotel']){
  await page.goto(`http://127.0.0.1:4174/?theme=${theme}`);await page.locator('.menu-card').first().waitFor();
  await page.locator('.category-list button').filter({hasText:'Coffee & Beverages'}).click();
  for(const mode of ['light','dark']){
   if(mode==='dark')await page.getByRole('button',{name:'Toggle colour mode'}).click();
   const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   results.push({theme,mode,violations:audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
  }
  await page.getByRole('button',{name:'Toggle colour mode'}).click();
 }
 await page.goto('http://127.0.0.1:4174/');await page.setViewportSize({width:360,height:800});
 for(const lang of ['ml','hi','ar','en']){await page.locator('select').first().selectOption(lang);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${lang} overflow`);}
 await writeFile('qa/theme-accessibility.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({...r,violations:r.violations.map(v=>({id:v.id,count:v.nodes.length,example:v.nodes[0]}))})),null,2));
 assert.equal(results.reduce((n,r)=>n+r.violations.length,0),0);
 console.log('All four language layouts fit a 360px viewport.');
}finally{await browser.close();}
