'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({ console }); ctx.window = ctx;
for (const file of ['map-catalog.js','map-data.js','map-routes.js']) {
  const filename = path.join(__dirname,'../js/map',file);
  assert.ok(fs.existsSync(filename), 'Missing map contract: ' + file);
  vm.runInContext(fs.readFileSync(filename,'utf8'),ctx);
}
const originalFood = { id:'milmyeon', ko:{name:'밀면',restaurants:[{area:'표시용 지역명 변경',signature:'메뉴'}]},
  places:[{name:'식당',lat:35.1,lng:129.1}] };
const data = ctx.IEBMapData.create([originalFood],()=> 'ko');
assert.equal(data.placeOf('milmyeon',0).districtId,'nam','Legacy binding must not depend on display area text');
originalFood.places[0].districtId='suyeong';
assert.equal(data.placesForSelection({districtId:'suyeong'}).length,1,'Explicit district ID overrides the legacy binding');
assert.equal(data.placesForSelection({districtId:'nam'}).length,0);
originalFood.places[0].districtId='invalid';
assert.equal(data.placeOf('milmyeon',0).districtId,null,'Invalid explicit district must not silently use the old region');
assert.equal(data.placesForSelection({districtId:'suyeong'}).length,0);
assert.equal(data.placesForSelection({districtId:'invalid'}).length,0);
assert.equal(data.placesForSelection({foodId:'unknown'}).length,0);
assert.equal(data.placeOf('constructor',0),null);
assert.equal(data.placeOf('milmyeon','1x'),null);
assert.equal(data.placeOf('milmyeon',-1),null);
delete originalFood.places[0].districtId;
const routes = ctx.IEBMapRoutes.create(data);
for(const [params,expected] of [
  [{},{mode:'overview',districtId:null,foodId:null,valid:true}],
  [{id:'milmyeon'},{mode:'detail',districtId:null,foodId:'milmyeon',valid:true}],
  [{district:'suyeong'},{mode:'overview',districtId:'suyeong',foodId:null,valid:true}],
  [{district:'suyeong',mode:'detail',id:'milmyeon'},{mode:'detail',districtId:'suyeong',foodId:'milmyeon',valid:true}],
]) assert.deepEqual(JSON.parse(JSON.stringify(routes.resolve(params))),expected);
for(const params of [{district:'wrong'},{id:'constructor'},{id:'wrong'},{mode:'wrong'}]) assert.equal(routes.resolve(params).valid,false);
assert.equal(routes.overview('suyeong'),'#/map/region/suyeong');
assert.equal(routes.detail('suyeong','milmyeon'),'#/map/region/suyeong/detail/milmyeon');
assert.equal(routes.detail(),'#/map/detail');
assert.equal(routes.detail('wrong'),null);
assert.equal(routes.detail(null,'wrong'),null);
assert.equal(routes.place(data.placeOf('milmyeon',0)),'#/place/milmyeon/0');
for(const [hash,expected] of [
  ['#/map',{}],['#/map/milmyeon',{id:'milmyeon'}],['#/map/detail',{mode:'detail'}],
  ['#/map/region/suyeong/detail/milmyeon',{district:'suyeong',mode:'detail',id:'milmyeon'}],
]) {
  const definition = ctx.IEBMapRoutes.definitions.find(([pattern])=>pattern.test(hash));
  assert.ok(definition,hash);
  const match=hash.match(definition[0]),params={};
  (definition[2]||[]).forEach((key,i)=>{if(match[i+1]!==undefined)params[key]=match[i+1];});
  assert.deepEqual(params,expected);
}
const missing = ctx.IEBMapData.create([{id:'new-food',ko:{name:'새 음식'},places:[{name:'신규 식당',districtId:'suyeong',lat:35,lng:129}]}],()=> 'en');
assert.equal(missing.placeOf('new-food',0).area,'');
assert.equal(missing.placesForSelection({districtId:'suyeong'}).length,1);
assert.equal(missing.hasCoordinates({lat:null,lng:129}),false);
assert.equal(missing.hasCoordinates({lat:NaN,lng:129}),false);
assert.equal(missing.hasCoordinates({lat:91,lng:129}),false);
assert.equal(missing.hasCoordinates({lat:0,lng:0}),true);
console.log('PASS stable district IDs, explicit overrides, invalid selections, real route matching/building, legacy IDs and missing/invalid data');
