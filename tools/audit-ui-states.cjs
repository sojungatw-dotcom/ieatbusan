'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../docs/verification/spacing-audit');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const results=[],errors=[];
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/service**',async route=>{
   if(new URL(route.request().url()).searchParams.get('action')!=='bootstrap')return route.fulfill({json:{saved:true}});
   const response=await route.fetch(),data=await response.json();
   data.user={id:'ui-fixture',username:'ui-fixture',nickname:'테스트 여행자',countryCode:'KR',area:8,bio:'부산의 맛을 찾는 여행자',joined:'2026.11.13'};
   data.posts=[{id:'ui-post',title:'부산에서 맛있게 먹은 한 끼',body:'여행 중 발견한 부산의 맛을 나눠요.',author:'테스트 여행자',countryCode:'KR',cat:'review',area:'해운대구',createdAt:Date.now(),likes:3,photos:[],mine:true}];
   data.comments={'ui-post':[{id:'ui-comment',author:'여행자',text:'좋은 정보 감사합니다.',countryCode:'JP',createdAt:Date.now(),likes:0}]};
   return route.fulfill({json:data});
  });
  await page.addInitScript(()=>localStorage.setItem('ieatbusan.ui.v2',JSON.stringify({lang:'ko',langChosen:true})));
  for(const route of ['write','profile','settings/privacy','my/posts','my/comments','my/recent','post/ui-post','community','saved/foods','saved/places','chatbot','admin']){
   await page.goto('http://127.0.0.1:8783/#/'+route);await page.waitForTimeout(150);await page.evaluate(()=>document.fonts.ready);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);results.push({route,width,overflow});
   if(width===390&&['profile','write','post/ui-post'].includes(route))await page.screenshot({path:path.join(out,route.replaceAll('/','-')+'-member.png')});
  }
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8783/#/chatbot');const frame=page.frameLocator('iframe');await frame.locator('#menu-count').filter({hasText:'43'}).waitFor({state:'attached'});
 for(const tab of ['browse','conditions','chat']){const button=frame.locator('[data-tab="'+tab+'"]');if(await button.count()){await button.click();await page.screenshot({path:path.join(out,'chatbot-'+tab+'.png')});}}
 await page.goto('http://127.0.0.1:8783/#/home');await page.locator('#ieb-chat-launcher').click();const popup=page.frameLocator('.ieb-chat-frame');await popup.locator('#open-help').click();await page.waitForTimeout(100);
 assert(await page.locator('.ieb-chat-panel.has-dialog').count());
 assert.equal(await page.locator('.ieb-chat-panel > .ieb-chat-control').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await popup.locator('#help-dialog [data-close-dialog]').click();await page.waitForTimeout(100);assert.equal(await page.locator('.ieb-chat-panel.has-dialog').count(),0);
 await page.goto('http://127.0.0.1:8782/admin.html');await page.screenshot({path:path.join(out,'admin-login.png')});
 await browser.close();const report={cases:results.length,failures:results.filter(r=>r.overflow),errors,dialogControls:'hidden while dialog open; restored after close',results};fs.writeFileSync(path.join(out,'states-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.equal(report.failures.length+errors.length,0);
})().catch(e=>{console.error(e);process.exitCode=1});
