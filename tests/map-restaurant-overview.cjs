'use strict';
const assert=require('node:assert/strict');
const ctx=require('./map-context.cjs')();
const place=(name,id,address,extra={})=>({name,restaurantId:id,address,lat:null,lng:null,...extra});
const food=(id,places)=>({id,ko:{name:id,restaurants:places.map(p=>({area:p.address}))},places});
const catalog=[food('one',[
  place('같은 식당','shared','부산 사하구 낙동대로 1',{imageAsset:'storefront.jpg'}),
  place('이름이 같은 지점','branch-one','부산 사하구 낙동대로 2'),
  place('좌표 없는 식당',null,'부산 사하구 낙동대로 3'),
]),food('two',[
  place('같은 식당','shared','부산 사하구 낙동대로 1'),
  place('이름이 같은 지점','branch-two','부산 사하구 낙동대로 4'),
  place('좌표 없는 식당',null,'부산 사하구 낙동대로 3'),
  place('다른 지역 식당','other','부산 해운대구 달맞이길 1')
])];
const data=ctx.IEBMapData.create(catalog,()=> 'ko');
const rows=data.restaurantsForSelection({districtId:'saha'});
assert.equal(rows.length,4,'Same restaurant is counted once across food pages');
assert.equal(rows[0].restaurantId,'shared');assert.equal(rows[0].imageAsset,'storefront.jpg');
assert.equal(rows[0].food.id,'one');assert.equal(rows[0].i,0,'Keep existing food:index detail route');
assert.equal(rows.filter(row=>row.name==='이름이 같은 지점').length,2,'Different branches remain distinct');
assert.equal(rows.filter(row=>row.name==='좌표 없는 식당').length,1,'Coordinates are not required to appear');
assert.equal(data.restaurantsForSelection({districtId:'haeundae'}).length,1);
assert.equal(data.restaurantsForSelection({districtId:'invalid'}).length,0);
assert.equal(data.restaurantsForSelection().length,5);
const routes=ctx.IEBMapRoutes.create(data);
const renderer=ctx.IEBMapRenderer.create({data,routes,shapes:ctx.IEBDistrictShapes,messages:ctx.IEBMapText,getLanguage:()=> 'ko',districtName:()=> '사하구',t:key=>key,esc:value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),fname:f=>f.ko.name,img:id=>id+'.jpg',placeImg:p=>p.imageAsset||p.food.id+'.jpg',icon:()=>'',appHeader:()=>'',tabbar:()=>'',mapAvailable:()=>false});
const html=renderer.render({valid:true,mode:'overview',districtId:'saha'});
assert.ok(html.includes('>식당 4곳</h2>'));assert.ok(!html.includes('에서 만나는 음식'));
assert.equal((html.match(/class="map-food-card map-restaurant-row"/g)||[]).length,4);
assert.ok(html.includes('href="#/place/one/0"'));assert.ok(html.includes('src="storefront.jpg"'));
assert.ok(html.includes('부산 사하구 낙동대로 1'));
assert.ok(!html.includes('다른 지역 식당'));
assert.ok(renderer.render({valid:true,mode:'overview',districtId:'buk'}).includes('아직 등록된 식당이 없어요.'));
console.log('PASS restaurant deduplication, branch distinction, district counts, missing coordinates, storefront photos, stable detail links and empty states');
