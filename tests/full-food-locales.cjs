'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {ctx,state}=require('./i18n.cjs');const {V}=ctx.localeTest;
if(process.env.IEB_DB_CATALOG_FIXTURE){
 const snapshot=JSON.parse(fs.readFileSync(process.env.IEB_DB_CATALOG_FIXTURE,'utf8'));
 state.foods=snapshot.map(row=>({id:row.id,name:row.name,summary:row.summary,category:row.category,content:row.content,imageAsset:'food-placeholder.svg',likes:0}));
 ctx.localeTest.syncFoodCatalog();
}

function visibleText(html,keepOriginal){
 if(keepOriginal)html=html.replace(/<span class="orig-line" lang="ko">[^<]*<\/span>/g,'');
 return html.replace(/<[^>]*>/g,' ');
}
const failures=[],sources=new Set();let rendered=0;
for(const language of ['en','zh','ja']){
 state.lang=language;
 for(const food of ctx.FOODS){
  const html=V.food({id:food.id});rendered++;
  assert.ok(html.includes('<span class="orig-line" lang="ko">'+ctx.localeTest.esc(food.ko.name)+'</span>'),'Keep small Korean name: '+food.id);
  const nodes=visibleText(html,true).split(/\n/).filter(t=>/[가-힣]/.test(t));
  if(nodes.length)failures.push({language,food:food.id,nodes});
  for(const raw of html.replace(/<span class="orig-line" lang="ko">[^<]*<\/span>/g,'').split(/<[^>]*>/))if(/[가-힣]/.test(raw))sources.add(raw.trim());
  assert.ok(!html.includes('translationPending'));
  food.places.forEach((place,i)=>{
   const detail=V.place({id:food.id,i});rendered++;
   if(/[가-힣]/.test(visibleText(detail,false)))failures.push({language,place:food.id+':'+i,nodes:[visibleText(detail,false).trim()]});
   for(const raw of detail.split(/<[^>]*>/))if(/[가-힣]/.test(raw))sources.add(raw.trim());
   assert.ok(detail.includes('#/food/'+food.id)||detail.includes('data-fallback="#/food/'+food.id+'"'),'Preserve routes');
  });
 }
}
const sourceFile=process.env.IEB_TRANSLATION_AUDIT_SOURCES;if(sourceFile)fs.writeFileSync(sourceFile,JSON.stringify([...sources],null,2));
if(failures.length){console.error(JSON.stringify(failures.slice(0,8),null,2));}
assert.equal(failures.length,0,'All visible food/restaurant detail text must use the chosen language; only the small Korean food name remains');
// Localize text only: no HTML injection, URL mutation or translation-service network calls.
assert.equal(ctx.IEBFoodLocale.html('<a href="https://example.com/부산" data-key="부산"><span>부산</span></a>','en'),'<a href="https://example.com/부산" data-key="부산"><span>Busan</span></a>');
assert.equal(ctx.IEBFoodLocale.html('<p>부산 &lt;script&gt;</p>','en'),'<p>Busan &lt;script&gt;</p>');
assert.equal(ctx.IEBFoodLocale.html('<p>부산</p>','ko'),'<p>부산</p>');
console.log('PASS '+rendered+' full food/restaurant pages: no Korean outside original food-name line, safe HTML, unchanged links and identifiers');
