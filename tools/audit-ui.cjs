/* Read-only, isolated browser layout audit. Run against preview-chatbot-fixture.cjs. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_AUDIT_URL||'http://127.0.0.1:8783';
const out=path.resolve(__dirname,'../docs/verification/spacing-audit');fs.mkdirSync(out,{recursive:true});
const routes=['home','category/all','category/soups','food/dwaeji-gukbap','place/dwaeji-gukbap/0','search','results/국밥/all','notifications','map','map/region/haeundae','map/detail','community','saved','my','settings','notices','faq','contact','terms','privacy','credits','login','signup','lang','missing'];
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[],errors=[];
for(const width of [320,390,768,1440]){const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push({width,message:e.message}));
for(const lang of ['ko','en','zh','ja']){await page.addInitScript(l=>localStorage.setItem('ieatbusan.ui.v2',JSON.stringify({lang:l,langChosen:true})),lang);
for(const route of routes){await page.goto(base+'/#/'+route,{waitUntil:'load'});await page.waitForTimeout(60);await page.evaluate(()=>document.fonts.ready);
const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,main:!!document.querySelector('main'),title:document.title,wide:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.right>innerWidth+2&&s.position!=='absolute'&&!e.closest('.home-track,.section-chips,.chip-row,.seg,.map-wrap')}).slice(0,6).map(e=>e.className)}));results.push({width,lang,route,...result});
if(lang==='ko'&&[390,1440].includes(width)&&['home','map','search','food/dwaeji-gukbap','community','settings'].includes(route))await page.screenshot({path:path.join(out,route.replaceAll('/','-')+'-'+width+'.png'),fullPage:route==='home'});
}}await page.close();}
const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(base+'/#/home');await page.locator('#ieb-chat-launcher').click();const frame=page.frameLocator('.ieb-chat-frame');await frame.locator('#menu-count').waitFor({state:'attached'}); await page.waitForFunction(()=>Store.get().foods?.length>0); await frame.locator('#menu-count').filter({hasText:'43'}).waitFor({state:'attached'}); await frame.locator('#open-help').click();await frame.locator('#help-dialog').waitFor({state:'visible'});
const help=await frame.locator('.action-stack').evaluate(e=>{const a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect();return{gap:b.top-a.bottom,width:e.clientWidth}});
await page.screenshot({path:path.join(out,'chatbot-help-desktop.png')});await frame.locator('#help-dialog [data-close-dialog]').click();
const tabs=await frame.locator('.app-tabs').evaluate(e=>({padding:getComputedStyle(e).padding,borderRadius:getComputedStyle(e.children[0]).borderRadius}));await page.screenshot({path:path.join(out,'chatbot-desktop.png')});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'chatbot-mobile.png')});await browser.close();
const report={generatedAt:new Date().toISOString(),cases:results.length,failures:results.filter(r=>r.overflow||!r.main),errors,help,tabs,results};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({cases:report.cases,failures:report.failures,errors,help,tabs},null,2));process.exitCode=report.failures.length||errors.length||Math.abs(help.gap-12)>1?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
