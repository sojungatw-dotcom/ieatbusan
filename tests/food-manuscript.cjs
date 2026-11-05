/* node tests/food-manuscript.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(read('js/data/foods.js'),ctx);vm.runInContext(read('js/i18n.js'),ctx);
ctx.I18N=ctx.window.I18N; const foods=ctx.window.FOODS,items=foods.filter(f=>f.manuscript),app=read('js/app.js');
assert.equal(items.length,34);assert.equal(new Set(foods.map(f=>f.id)).size,foods.length);assert.ok(foods.every(f=>f.id));
assert.equal(items.reduce((n,f)=>n+f.places.length,0),100);
Object.assign(ctx,{FOOD:Object.fromEntries(foods.map(f=>[f.id,f])),V:{},S:()=>({savedFoods:[]}),language:'ko',lang:()=>ctx.language,esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),L:f=>f[ctx.language]||f.ko,t:k=>ctx.I18N[ctx.language][k]??ctx.I18N.ko[k]??k,img:id=>ctx.FOOD[id].photo||`assets/food/${id}.jpg`,icon:()=>'',foodLikes:f=>f.likes});
vm.runInContext(app.slice(app.indexOf('  function manuscriptFood('),app.indexOf('  V.food.mount =')),ctx);
for(const food of items){
 assert.ok(food.ko.name&&food.ko.summary);
 assert.equal(food.manuscript.names.length,3);
 assert.ok(food.places.every(p=>p.lat===null&&p.lng===null));
 assert.ok(fs.existsSync(path.join(root,food.photo)));
 assert.equal((food.manuscript.sections[1].match(/<li><span>/g)||[]).length,food.id === 'gorae-gogi' ? 0 : 4,food.id);
 assert.equal((food.manuscript.sections[3].match(/<h3>/g)||[]).length,food.places.length+(food.places.length?1:0)+(food.manuscript.sections[3].includes('유사 메뉴 게시 자료</h3>')?1:0),food.id+' restaurant headings');
 for(const lang of ['ko','en','zh','ja']){
  ctx.language=lang;const html=ctx.V.food({id:food.id});
  for(const id of ['info','how','allergy','places'])assert.ok(html.includes(`id="sec-${id}"`));
  assert.ok(!/undefined|NaN|<script|<iframe|javascript:/.test(html));
  assert.ok(html.includes('식당별 메뉴 가격 참고'));
  assert.ok(!html.includes('kcal')&&!html.includes('팀 내부 메모'));
  if(lang!=='ko')assert.ok(html.includes('class="muted"'));
 }
}
// A missing restaurant coordinate must never reach Leaflet.
const maps=require('./map-context.cjs')();
const data=maps.IEBMapData.create(foods,()=> 'ko');let pins=0;
const view=maps.IEBMapView.create({data,provider:{available:()=>true,create(){return {
 addPlace(p){assert.ok(data.hasCoordinates(p));pins++;},fitPlaces(){},resize(){},dispose(){}};}},
 root:{querySelector:()=>null},document:{getElementById:()=>({})},navigator:{},getLanguage:()=> 'ko',
 t:k=>ctx.I18N.ko[k]||k,esc:ctx.esc,fname:f=>f.ko.name,img:ctx.img,icon:()=>'',appHeader:()=>'',tabbar:()=>'',toast(){},setTimeout:()=>1,clearTimeout(){}});
view.mount({mode:'detail'})();assert.equal(pins,data.allPlaces().filter(data.hasCoordinates).length);
console.log('PASS 34 complete sourced food details in 4 language modes, 100 restaurant records, image fallbacks, and no invented map coordinates');
