'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = require('./map-context.cjs')();
let language = 'ko';
const data = ctx.window.IEBMapData.create(ctx.window.FOODS, () => language);
assert.equal(data.districts.length, 16);
assert.equal(new Set(data.districts.map(d => d.id)).size, 16);
assert.equal(ctx.window.IEBDistrictShapes.districts.length, 16);
for (const district of data.districts) {
  const shape = ctx.window.IEBDistrictShapes.districts.find(s => s.name === district.name);
  assert.ok(shape?.path.startsWith('M'), district.name + ' polygon missing');
  assert.ok(shape.label.every(Number.isFinite));
}
assert.equal(data.placesForSelection({districtId:'haeundae'}).length, 19);
assert.equal(data.placesForSelection({districtId:'haeundae',foodId:'bokguk'}).length, 3);
assert.equal(data.placesForSelection({districtId:'haeundae',foodId:'jagalchi-hoe'}).length, 0);
assert.equal(data.placesForSelection({districtId:'buk'}).length, 0);
assert.equal(data.foodCounts('haeundae').length, 12);
assert.equal(data.placesForSelection({districtId:'haeundae',foodId:'daegu-kongguk'})[0].name, '대한콩국 센텀점');
assert.equal(data.foodCounts('haeundae').find(item => item.food.id === 'bokguk').count, 3);
assert.equal(data.placesForSelection({foodId:'milmyeon'})[2].i, 2, 'Filtering must preserve legacy indices');
let creates = 0;
const created = [];
const navigations = [], pickerEvents = {};
const regionPicker = { value:'haeundae', addEventListener(name,fn){pickerEvents[name]=fn;},removeEventListener(name){delete pickerEvents[name];} };
const view = ctx.window.IEBMapView.create({ data,
  shapes:ctx.window.IEBDistrictShapes, messages:ctx.window.IEBMapText,
  getLanguage:()=>language, districtName:index=>ctx.window.DISTRICTS[language][index],
  provider:{available:()=>true, create(element, options){ creates++; const map={places:[],addPlace(p){this.places.push(p);},fitPlaces(){},dispose(){},resize(){}};created.push(map);return map;}},
  navigate:href=>navigations.push(href),
  root:{querySelector:selector=>selector==='[data-map-region]'?regionPicker:null}, document:{getElementById:()=>({})},navigator:{},
  t:(key,vars)=>ctx.window.I18N[language][key]?.replace('{n}',vars?.n)||key,
  esc:s=>String(s).replaceAll('<','&lt;').replaceAll('"','&quot;'),fname:f=>(f[language]||f.ko).name,
  img:id=>'assets/food/'+id+'.jpg',icon:()=>'',appHeader:()=>'',tabbar:()=>'',toast:()=>{},setTimeout:()=>1,clearTimeout:()=>{},
});
for(language of ['ko','en','zh','ja']){
  const initial=view.render({});
  assert.ok(initial.includes('<svg'));
  assert.equal((initial.match(/class="district-region/g)||[]).length,16);
  assert.ok(initial.includes('href="#/map/region/haeundae"'));
  assert.ok(!initial.includes('id="map"'), 'Initial view must not render the detailed tile map');
  assert.ok(!initial.includes('undefined'));
  view.mount({})();
  assert.equal(creates,0,'Overview must not initialize an external map');
  const selected=view.render({district:'haeundae'});
  assert.ok(selected.includes('href="#/map/region/haeundae/detail/bokguk"'));
  assert.ok(!selected.includes('href="#/map/region/haeundae/detail/jagalchi-hoe"'));
  assert.ok(selected.includes('aria-current="true"'));
  assert.ok(!selected.includes('undefined'));
  const detail=view.render({district:'haeundae',mode:'detail',id:'bokguk'});
  const picker = detail.match(/<select[^>]*data-map-region[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(picker, 'Detail map must have a district selector');
  assert.equal((picker[1].match(/<option /g)||[]).length,17,'All Busan plus 16 districts');
  assert.ok(picker[1].includes('value="haeundae" selected'));
  assert.equal((detail.match(/data-act="flyTo"/g)||[]).length,3);
  assert.ok(detail.includes('href="#/map/region/haeundae"'));
  assert.ok(detail.includes('href="#/map/detail"'), 'Regional detail must offer an unfiltered Busan detail map');
  const allMapLabels = {ko:'부산 전체 지도',en:'All Busan map',zh:'釜山全域地图',ja:'釜山全域地図'};
  assert.ok(detail.includes(allMapLabels[language]), 'Whole-city map button must be translated');
  assert.ok(detail.includes('href="#/place/bokguk/0"'));
  const empty=view.render({district:'buk'});
  assert.equal((empty.match(/class="map-food-card"/g)||[]).length,0);
  assert.ok(!empty.includes('undefined'));
}
language='ko';
const dispose=view.mount({district:'haeundae',mode:'detail',id:'bokguk'});
assert.equal(created[0].places.length,3);
assert.ok(created[0].places.every(p=>p.food.id==='bokguk'&&p.areaKo.startsWith('해운대구 ')));
regionPicker.value='suyeong'; pickerEvents.change();
assert.equal(navigations.at(-1),'#/map/region/suyeong/detail','Changing region shows all foods in the new region');
regionPicker.value=''; pickerEvents.change();
assert.equal(navigations.at(-1),'#/map/detail');
regionPicker.value='invalid'; pickerEvents.change();
assert.equal(navigations.length,2,'Invalid region cannot navigate');
dispose();
assert.equal(pickerEvents.change,undefined,'Region listener is removed with the map screen');
assert.equal((view.render({id:'milmyeon'}).match(/data-act="flyTo"/g)||[]).length,data.placesFor('milmyeon').length,'Legacy food map route still opens detail with the current source data');
console.log('PASS 16 district shapes, local-only overview, four languages, region/food filters, empty regions, state links and legacy detail routes');
