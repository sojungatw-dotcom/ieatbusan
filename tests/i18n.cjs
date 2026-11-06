'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = file => fs.readFileSync(path.join(root, file), 'utf8');
const state = {lang:'ko',langChosen:true,user:null,guest:true,posts:[],comments:{},postLikes:{},foodLikes:{},recentFoods:[],recentSearches:[],savedFoods:[],savedPlaces:[],settings:{},sort:'popular',seededAt:Date.now(),notiReadAt:0};
const element = {classList:{add(){}},addEventListener(){},querySelector(){return null;}};
const ctx = vm.createContext({console,URL,Promise,Intl,
  document:{getElementById:()=>element,documentElement:{lang:'ko'},addEventListener(){}},
  navigator:{language:'ko'},location:{hash:'#/lang',replace(value){this.hash=value;}},history:{back(){}},
  setTimeout:()=>1,clearTimeout(){},scrollTo(){},addEventListener(){},
  Store:{get:()=>state,set:patch=>Object.assign(state,patch),load:()=>new Promise(()=>{}),update:fn=>fn(state)},
});ctx.window=ctx;
for (const [,src] of read('index.html').matchAll(/<script src="([^"]+)"/g)) {
  const file=src.split('?')[0];
  if (['js/store.js','js/cloud.js','js/auth.js','js/app.js'].includes(file)) continue;
  vm.runInContext(read(file),ctx,{filename:file});
}
ctx.Auth={};ctx.Cloud={};
vm.runInContext(read('js/app.js').replace(/\}\)\(\);\s*$/, 'window.localeTest={V,t,appHeader,tabbar,syncFoodCatalog,homeFoodCard,foodRow,esc};})();'),ctx);
const {V,t,appHeader,tabbar}=ctx.localeTest;
const keys=Object.keys(ctx.I18N.ko).sort();
const placeholders=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
const baseline=JSON.stringify(ctx.FOODS);
let pages=0;
for (const language of ['ko','en','zh','ja']) {
  state.lang=language;
  assert.deepEqual(Object.keys(ctx.I18N[language]).sort(),keys,'Dictionary completeness: '+language);
  assert.deepEqual(Object.keys(ctx.IEBMapText[language]).sort(),Object.keys(ctx.IEBMapText.ko).sort(),'Map dictionary completeness');
  for(const key of Object.keys(ctx.IEBMapText.ko))assert.deepEqual(placeholders(ctx.IEBMapText[language][key]),placeholders(ctx.IEBMapText.ko[key]),'Map interpolation: '+key);
  for (const key of keys) {
    const text=ctx.I18N[language][key];
    assert.ok(typeof text==='string' && text.trim(),language+': '+key);
    assert.deepEqual(placeholders(text),placeholders(ctx.I18N.ko[key]),'Interpolation: '+language+' '+key);
    if(language!=='ko')assert.ok(!/[가-힣]/.test(text),'Unintended Korean UI: '+language+' '+key);
  }
  for (const file of ['js/app.js','js/map/map-renderer.js','js/map/map-view.js']) {
    for (const [,key] of read(file).matchAll(/\bt\('([^']+)'/g)) {
      if (!key.endsWith('.')) assert.ok(Object.hasOwn(ctx.I18N[language],key),'Missing UI key: '+key);
    }
  }
  assert.ok(appHeader().includes('aria-label="'+t('brand.home')+'"'));
  assert.ok(tabbar('home').includes('aria-label="'+t('nav.main')+'"'));
  assert.ok(V.contact().includes('>'+t('common.copy')+'</button>'),'Localized copy control');
  assert.ok(V.notFound().includes(t('common.notFound')));
  assert.ok(V.lang().includes('role="group" aria-label="'+t('lang.title')+'"'));
  assert.equal((V.lang().match(/aria-pressed="true"/g)||[]).length,1,'Exactly one selected language');
  assert.ok(!V.lang().includes('role="radio"'),'Native buttons must not claim incomplete radio keyboard semantics');
  assert.ok(V.notifications().includes(t('noti.example')));
  for (const member of [false,true]) {
    state.user=member?{id:'member',username:'long_member_username',nickname:'ABCDEFGHIJ',countryCode:'US',area:8,joined:'2026.11.06',bio:'A long profile biography'}:null;
    assert.equal(V.settings().includes('data-act="withdraw"'),member,'Account deletion is available only to members');
    for (const name of ['home','login','signup','lang','search','notifications','community','saved','my','myPosts','myComments','myRecent','profile','settings','notices','faq','contact','terms','privacy','credits','notFound','write','results','map']) {
      const html=V[name]({q:'no-match',tab:undefined});pages++;
      assert.ok(html.includes('<main'),name);
      assert.ok(!/undefined|NaN|\{(?:n|q|country|area|date)\}/.test(html),language+' '+name);
      assert.ok(!html.includes('aria-label="♥"'),name+' accessible heart label');
    }
  }
  state.user=null;
  for(const food of ctx.FOODS){
    const html=V.food({id:food.id});pages++;
    assert.ok(html.includes('aria-label="'+t('food.sections')+'"'));
    const table=html.match(/<dl class="info-card">([\s\S]*?)<\/dl>/)[1];
    const cells=[...table.matchAll(/<dd lang="([^"]+)">([^<]*)<\/dd>/g)];
    assert.equal(cells.length,8,'Eight information rows: '+food.id);
    for(const cell of cells){assert.equal(cell[1],language);if(language!=='ko')assert.ok(!/[가-힣]/.test(cell[2]),'Untranslated info cell: '+language+' '+food.id+' '+cell[2]);}
    if(food.manuscript){const values=ctx.IEBFoodInfo.rows(food,language);assert.equal(values.length,8);if(language==='ko')assert.deepEqual(Array.from(values),Array.from(food.manuscript.infoRows,row=>row[1]));}
    const summary = (language === 'ko' ? food.ko : food[language]).summary;
    assert.ok(summary && (language === 'ko' || !/[가-힣]/.test(summary)), 'Translated summary: '+language+' '+food.id);
    assert.ok(html.includes('<p class="summary" lang="'+language+'">'+ctx.localeTest.esc(summary)+'</p>'), 'Detail summary uses chosen language');
    const card=ctx.localeTest.homeFoodCard(food),row=ctx.localeTest.foodRow(food);
    assert.ok(card.includes(ctx.localeTest.esc(summary)) && row.includes(ctx.localeTest.esc(summary)), 'Home and list descriptions are translated');
    if(language!=='ko')assert.ok(card.includes('<div class="orig" lang="ko">'+food.ko.name+'</div>'), 'Keep original Korean food name');
    assert.ok(!html.includes('aria-label="♥"'));
    if(food.manuscript){
      assert.ok(html.includes('<dt>'+t('food.row.region')+'</dt><dd lang="'+language+'">'),'Information row values use selected language');
      if(language!=='ko')assert.ok(html.includes(t('food.translationPending')));
    }
    food.places.forEach((place,i)=>{
      const html=V.place({id:food.id,i});pages++;
      assert.ok(!/undefined|NaN/.test(html));
      if(place.research){
        assert.ok(html.includes('<h2>'+t('place.menu')+'</h2>'));
        assert.ok(html.includes('<h2>'+t('place.beforeVisit')+'</h2>'));
        assert.ok(html.includes(t('place.researched')));
      }
    });
  }
  if(language!=='en')assert.ok(!V.terms().includes('Community posts, comments'),'No English legal fallback');
  assert.ok(V.privacy().includes('Supabase Auth'));
  assert.ok(V.privacy().includes('Google Analytics'),'Preserve analytics disclosure in every language');
  assert.equal((V.privacy().match(/<li>/g)||[]).length,6,'Translate all privacy points');
  assert.ok(!/only in (?:this|your current) browser|ブラウザにのみ保存|只保存在当前浏览器|브라우저에만 저장/.test(V.faq()+V.terms()+V.privacy()));
}
assert.equal(JSON.stringify(ctx.FOODS),baseline,'Rendering must preserve catalog facts, order and archive state');
console.log(`PASS ${keys.length} keys in four locales, interpolation, accessible controls, legal/support copy, source-language separation and ${pages} view renders`);

// A DB bootstrap can contain the old Korean text in all locales. Reapply translations after hydration.
const sourceFood=ctx.FOODS.find(f=>f.id==='masan-bokguk');
const oldContent=JSON.parse(JSON.stringify(sourceFood));
for(const l of ['en','zh','ja'])oldContent[l].summary=oldContent.ko.summary;
state.foods=ctx.FOODS.map(f=>({id:f.id,name:f.ko.name,summary:f.ko.summary,category:f.ko.category,imageAsset:f.id+'.jpg',content:f.id===sourceFood.id?oldContent:f,likes:f.likes}));
ctx.localeTest.syncFoodCatalog();
for(const l of ['en','zh','ja'])assert.ok(!/[가-힣]/.test(sourceFood[l].summary),'Preserve translated descriptions after DB hydration');
for(const language of ['en','zh','ja']){
 state.lang=language;
 const table=V.food({id:sourceFood.id}).match(/<dl class="info-card">([\s\S]*?)<\/dl>/)[1];
 assert.ok(!/[가-힣]/.test(table),'Information values stay translated after DB hydration');
}
console.log('PASS all 43 food summaries and eight information rows in four languages, original Korean names and source facts, and DB hydration');
