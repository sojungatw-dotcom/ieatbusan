/* node tests/food-manuscript.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(read('js/data/foods.js'),ctx);vm.runInContext(read('js/i18n.js'),ctx);
ctx.I18N=ctx.window.I18N; const foods=ctx.window.FOODS,items=foods.filter(f=>f.manuscript),app=read('js/app.js');
assert.equal(items.length,34);assert.equal(new Set(foods.map(f=>f.id)).size,foods.length);assert.ok(foods.every(f=>f.id));
assert.equal(items.reduce((n,f)=>n+f.manuscript.restaurants.length,0),100);
Object.assign(ctx,{FOODS:foods,FOOD:Object.fromEntries(foods.map(f=>[f.id,f])),V:{},S:()=>({savedFoods:[],savedPlaces:[]}),language:'ko',lang:()=>ctx.language,esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),L:f=>f[ctx.language]||f.ko,t:k=>ctx.I18N[ctx.language][k]??ctx.I18N.ko[k]??k,img:id=>ctx.FOOD[id].photo||`assets/food/${id}.jpg`,icon:()=>'',foodLikes:f=>f.likes});
vm.runInContext(app.slice(app.indexOf('  const placeKey'),app.indexOf('  const foodLikes')),ctx);
vm.runInContext(app.slice(app.indexOf('  function placeRow'),app.indexOf('  function postCard')),ctx);
ctx.hasCoordinates=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng);ctx.allPosts=()=>[];ctx.foodRow=()=>'<div>food</div>';ctx.placeLikes=()=>0;
vm.runInContext(app.slice(app.indexOf('  function manuscriptFood('),app.indexOf('  V.food.mount =')),ctx);
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
  assert.ok(html.includes('식당별 메뉴 가격 참고'));
  assert.ok(!html.includes('kcal')&&!html.includes('팀 내부 메모'));
  const section=html.slice(html.indexOf('id="sec-places"'));
  assert.equal((section.match(/class="list-item"/g)||[]).length,food.places.length);
  assert.ok(!section.includes('실제 메뉴 / 게시 가격:')&&!section.includes('게시 영업시간:'));
  for(const [i,place] of food.places.entries()){
   assert.ok(section.includes('#/place/'+food.id+'/'+i));
   const detail=ctx.V.place({id:food.id,i});
   for(const part of ['class="hero"','class="actions-row"','class="rows"'])assert.ok(detail.includes(part));
   assert.ok(detail.includes('이 식당 이야기')||lang!=='ko');
   assert.ok(!/destination=null|null,null|undefined|NaN/.test(detail));
   if(place.research){
    for(const value of [place.research.area,place.research.hours,place.research.holiday,place.research.date])assert.ok(detail.includes(ctx.esc(value)));
    assert.ok(detail.includes(place.research.sourcesHtml));
    assert.ok(detail.includes('<h2>대표 메뉴</h2>'));
    const mapBlock=detail.includes('id="mini-map"');
    assert.equal(mapBlock,Number.isFinite(place.lat)&&Number.isFinite(place.lng));
   }
  }
  if(lang!=='ko')assert.ok(html.includes('class="muted"'));
 }
}
// A missing restaurant coordinate must never reach Leaflet.
const all=foods.flatMap(food=>food.places.map(p=>({...p,food})));
let pins=0;const map={setView(){return this},fitBounds(){return this},invalidateSize(){},remove(){}};
ctx.document={getElementById:()=>({})};ctx.tiles=()=>({addTo(){}});ctx.pinIcon=()=>'';ctx.hasCoordinates=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng);ctx.cleanup=[];ctx.setTimeout=()=>1;ctx.clearTimeout=()=>{};
ctx.window.L={map:()=>map,control:{zoom:()=>({addTo(){}})},marker(ll){assert.ok(ll.every(Number.isFinite));pins++;return {addTo(){return this},bindPopup(){return this}}},latLngBounds:()=>({pad(){return this}})};
ctx.V.map={}; vm.runInContext('let mapRef, markers, locationMarker;'+app.slice(app.indexOf('  V.map.mount ='),app.indexOf('  /* ---------- community ---------- */')),ctx);
ctx.placeKey=(id,i)=>id+":"+i; ctx.fname=f=>f.ko.name;ctx.V.map.mount({});assert.equal(pins,all.filter(ctx.hasCoordinates).length);
console.log('PASS 34 complete sourced food details in 4 language modes, 100 manuscript restaurant records, stable original banners, shared detail UI, image fallbacks, and no invented map coordinates');
