'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_AUDIT_URL||'http://127.0.0.1:8783';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),errors=[],results=[];
for(const width of [390,1440])for(const lang of ['ko','en','ja','zh']){
 const p=await b.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(l=>localStorage.setItem('ieatbusan.ui.v2',JSON.stringify({lang:l,langChosen:true})),lang);await p.goto(base+'/#/home');await p.locator('#ieb-chat-launcher').waitFor();assert.equal(await p.locator('.home-explore').count(),0);
 await p.locator('#ieb-chat-launcher').click();const f=p.frameLocator('.ieb-chat-frame');await f.locator('html[lang="'+lang+'"]').waitFor({state:'attached'});await f.locator('#catalog-status').waitFor({state:'hidden'});
 const check=async expected=>{await f.locator('html[lang="'+expected+'"]').waitFor({state:'attached'});const title=await f.locator('#app-title').textContent();const want=await p.evaluate(l=>ChatLocale.ui('나에게 맞는 부산의 맛',l),expected);assert.equal(title,want);await f.locator('#open-help').click();if(expected!=='ko')assert(!/[가-힣]/.test((await f.locator('#messages').innerText()).replace(/^무$/gm,'')),'Conversation must use '+expected+': '+await f.locator('#messages').innerText());const help=await f.locator('#help-title').textContent();assert.equal(help,await p.evaluate(l=>ChatLocale.ui('음식 도우미 이용 안내',l),expected));await f.locator('#help-dialog [data-close-dialog]').click();results.push({width,initialLanguage:lang,language:expected,title,help});};
 await check(lang);await p.evaluate(()=>document.querySelector('.ieb-chat-frame').dataset.retained='yes');
 if(lang==='ko')for(const next of ['en','ja','zh','ko']){await p.locator('.ieb-chat-close').click();await p.evaluate(()=>location.hash='#/lang');await p.locator('[data-act="pickLang"][data-code="'+next+'"]').click();await p.locator('[data-act="confirmLang"]').click();await p.locator('#ieb-chat-launcher').click();await check(next);assert.equal(await p.locator('.ieb-chat-frame').getAttribute('data-retained'),'yes');}
 await p.close();
}await b.close();assert.deepEqual(errors,[]);console.log(JSON.stringify({cases:results.length,errors,results},null,2));})().catch(e=>{console.error(e);process.exitCode=1});
