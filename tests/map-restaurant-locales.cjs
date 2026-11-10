'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=require('./map-context.cjs')();
for(const file of ['js/data/restaurant-updates.js','js/data/food-detail-locales.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
let language='ko';
const data=ctx.IEBMapData.create(ctx.FOODS,()=>language),routes=ctx.IEBMapRoutes.create(data);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const renderer=ctx.IEBMapRenderer.create({data,routes,shapes:ctx.IEBDistrictShapes,messages:ctx.IEBMapText,getLanguage:()=>language,districtName:i=>ctx.DISTRICTS[language][i],t:key=>key,esc,fname:f=>(f[language]||f.ko).name,img:id=>'assets/food/'+id+'.jpg',icon:()=>'',appHeader:()=>'',tabbar:()=>'',mapAvailable:()=>false});
let originalLinks;
for(language of ['ko','en','zh','ja']){
  const html=renderer.render({valid:true,mode:'overview'});
  const rows=[...html.matchAll(/<a class="map-food-card map-restaurant-row"[\s\S]*?<\/a>/g)].map(m=>m[0]);
  const records=data.restaurantsForSelection();assert.equal(rows.length,records.length);
  const links=rows.map(row=>row.match(/href="([^"]+)"/)[1]);
  if(language==='ko')originalLinks=links;else assert.deepEqual(links,originalLinks,'Language changes preserve restaurant routes');
  for(const [i,row]of rows.entries()){
    const p=records[i],address=p.address||p.area||(p.food[language]||p.food.ko).name;
    assert.ok(row.includes('<b lang="'+language+'">'+esc(ctx.IEBFoodLocale.text(p.name,language))+'</b>'),'Name uses the same translator as the detail page');
    assert.ok(row.includes('<small lang="'+language+'">'+esc(ctx.IEBFoodLocale.text(address,language))+'</small>'),'Address uses the detail-page translator');
    if(language!=='ko')assert.ok(!/[가-힣]/.test(row.replace(/<[^>]*>/g,'')),'No untranslated Korean in restaurant name/address: '+p.name+' / '+language);
  }
}
console.log('PASS all catalog restaurant names/addresses in KO/EN/ZH/JA, detail-page translation parity, language attributes and unchanged routes');
