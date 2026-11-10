/* node tests/food-manuscript.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={console};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('js/data/foods.js'),ctx);vm.runInContext(read('js/i18n.js'),ctx);vm.runInContext(read('js/data/food-info-translations.js'),ctx);vm.runInContext(read('js/data/food-detail-locales.js'),ctx);
ctx.I18N=ctx.window.I18N; const foods=ctx.window.FOODS,items=foods.filter(f=>f.manuscript),app=read('js/app.js');
assert.equal(items.length,32);assert.equal(new Set(foods.map(f=>f.id)).size,foods.length);assert.ok(foods.every(f=>f.id));
assert.equal(items.reduce((n,f)=>n+f.manuscript.restaurants.length,0),103);
Object.assign(ctx,{FOODS:foods,FOOD:Object.fromEntries(foods.map(f=>[f.id,f])),V:{},S:()=>({savedFoods:[],savedPlaces:[]}),language:'ko',lang:()=>ctx.language,esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),L:f=>f[ctx.language]||f.ko,t:k=>ctx.I18N[ctx.language][k]??ctx.I18N.ko[k]??k,img:id=>ctx.FOOD[id].photo||`assets/food/${id}.jpg`,placeImg:p=>ctx.img(p.food.id),icon:()=>'',foodLikes:f=>f.likes});
const maps=require('./map-context.cjs')();
const data=maps.IEBMapData.create(foods,()=>ctx.language);
Object.assign(ctx,{placeKey:data.placeKey,placeOf:data.placeOf,allPlaces:data.allPlaces});
vm.runInContext(app.slice(app.indexOf('  function placeRow'),app.indexOf('  function postCard')),ctx);
ctx.hasCoordinates=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng);ctx.allPosts=()=>[];ctx.foodRow=()=>'<div>food</div>';ctx.placeLikes=()=>0;
vm.runInContext(app.slice(app.indexOf('  function foodDetailContent('),app.indexOf('  V.food.mount =')),ctx);
vm.runInContext(app.slice(app.indexOf('  V.place ='),app.indexOf('  V.place.mount =')),ctx);
const baseline={window:{}};vm.runInNewContext(read('js/data/foods.js').split('/* Imported food-detail manuscript')[0],baseline);
for(const before of baseline.window.FOODS){const after=foods.find(f=>f.id===before.id);before.places.forEach((p,i)=>assert.equal(after.places[i].name,p.name,'Stable saved-place index'));}

for(const food of items){
 assert.ok(food.ko.name&&food.ko.summary);
 assert.equal(food.manuscript.names.length,3);
 assert.ok(food.places.filter(p=>p.research&&!Number.isFinite(p.lat)).every(p=>p.lat===null&&p.lng===null));
 assert.ok(fs.existsSync(path.join(root,food.photo)));
 assert.equal((food.manuscript.sections[1].match(/<li><span>/g)||[]).length,food.id === 'gorae-gogi' ? 0 : 4,food.id);
 assert.equal((food.manuscript.sections[3].match(/<h3>/g)||[]).length,food.manuscript.restaurants.length+(food.manuscript.restaurants.length?1:0)+(food.manuscript.sections[3].includes('유사 메뉴 게시 자료</h3>')?1:0),food.id+' restaurant headings');
 for(const lang of ['ko','en','zh','ja']){
  ctx.language=lang;const html=ctx.V.food({id:food.id});
  for(const id of ['info','how','allergy','places'])assert.ok(html.includes(`id="sec-${id}"`));
  assert.ok(!/undefined|NaN|<script|<iframe|javascript:/.test(html));
  assert.ok(html.includes(ctx.esc(ctx.window.IEBFoodInfo.rows(food,lang)[7])));
  assert.ok(!html.includes('kcal')&&!html.includes('팀 내부 메모'));
  const section=html.slice(html.indexOf('id="sec-places"'));
  assert.equal((section.match(/class="list-item"/g)||[]).length,food.places.length);
  assert.ok(!section.includes('실제 메뉴 / 게시 가격:')&&!section.includes('게시 영업시간:'));
  for(const [i,place] of food.places.entries()){
   assert.ok(section.includes('#/place/'+food.id+'/'+i));
   const detail=ctx.V.place({id:food.id,i});
   for(const part of ['class="hero"','class="actions-row"','class="rows place-info"'])assert.ok(detail.includes(part));
   assert.ok(detail.includes('이 식당 이야기')||lang!=='ko');
   const projected=data.placeOf(food.id,i);
   const info=detail.slice(detail.indexOf('class="rows place-info"'),detail.indexOf('<div class="mini-map'));
   assert.equal((info.match(/class="row"/g)||[]).length,2,'Address and schedule rows only');
   assert.ok(info.includes(ctx.esc(ctx.window.IEBFoodLocale.text(projected.address||projected.area||ctx.I18N[lang]['food.unconfirmed'],lang))));
   assert.ok(info.includes(ctx.esc(ctx.window.IEBFoodLocale.text(projected.hours||ctx.I18N[lang]['food.unconfirmed'],lang))));
   assert.ok(info.includes(ctx.esc(ctx.window.IEBFoodLocale.text(projected.holiday||ctx.I18N[lang]['food.unconfirmed'],lang))));
   assert.ok(!/destination=null|null,null|undefined|NaN/.test(detail));
   if(place.research){
    for(const value of [place.research.area,place.research.hours,place.research.holiday,place.research.date])assert.ok(detail.includes(ctx.esc(ctx.window.IEBFoodLocale.text(value,lang))));
    assert.ok(!detail.includes('출처:')&&!detail.includes('SRC-'));
    assert.ok(detail.includes('<h2>'+ctx.esc(ctx.I18N[lang]['place.menu'])+'</h2>'));
    const mapBlock=detail.includes('id="mini-map"');
    assert.equal(mapBlock,true,'Manuscript restaurants mount the Google mini-map for coordinates or address lookup');
   }
  }
  if(lang!=='ko')assert.ok(!html.includes(ctx.I18N[lang]['food.translationPending']));
 }
}
// Both legacy and manuscript foods use exactly the same detail shell.
const signatures=new Set();
for(const food of foods){
 for(const language of ['ko','en','zh','ja']){
  ctx.language=language;
  const html=ctx.V.food({id:food.id});
  assert.equal((html.match(/class="info-row"/g)||[]).length,8,food.id);
  assert.ok(html.includes('class="how-card manuscript"'),food.id);
  assert.ok(html.includes('class="allergen-card manuscript"'),food.id);
  const allergyBox=html.slice(html.indexOf('id="sec-allergy"'),html.indexOf('id="sec-places"'));
  assert.ok(allergyBox.includes('class="pills"') && allergyBox.includes('class="pill"'),food.id);
  assert.ok(!allergyBox.includes('<ul>'),food.id+' allergy uses pills and paragraphs only');
  assert.equal((html.match(/data-act="jump"/g)||[]).length,4);
  assert.ok(!/로컬 팁|비슷한 음식과 다른 점|주문 예문|먹는 방법 근거|상세 정보 근거|성분 판단 근거|이 음식의 유래|class="tip-card"/.test(html),food.id);
  const how=html.slice(html.indexOf('id="sec-how"'),html.indexOf('id="sec-allergy"'));
  assert.ok(how.includes('class="steps"')||food.id==='gorae-gogi');
  assert.ok(!/소스·양념|곁들이는 음식|주문 전에 확인|최소 주문·혼밥·맵기 조절|먹을 때 주의|먹는 단계는/.test(how),food.id+' eating extras removed');
  const signature=[...html.matchAll(/<section class="detail-section" id="([^"]+)"/g)].map(m=>m[1]).join(',');
  signatures.add(signature);
 }
}
assert.equal(signatures.size,1);
console.log('PASS all 43 foods use one template with 8 info rows, combined introduction, white eating-method card, allergen card, and restaurant banners');
// A missing restaurant coordinate must never reach the map provider.
let pins=0;
const view=maps.IEBMapView.create({data,provider:{available:()=>true,create(){return {
 addPlace(p){assert.ok(data.hasCoordinates(p));pins++;},fitPlaces(){},resize(){},dispose(){}};}},
 root:{querySelector:()=>null},document:{getElementById:()=>({})},navigator:{},getLanguage:()=> 'ko',
 t:k=>ctx.I18N.ko[k]||k,esc:ctx.esc,fname:f=>f.ko.name,img:ctx.img,icon:()=>'',appHeader:()=>'',tabbar:()=>'',toast(){},setTimeout:()=>1,clearTimeout(){}});
view.mount({mode:'detail'})();assert.equal(pins,data.allPlaces().filter(data.hasCoordinates).length);
console.log('PASS 32 complete sourced food details in 4 language modes, 103 restaurant records, image fallbacks, and no invented map coordinates');
