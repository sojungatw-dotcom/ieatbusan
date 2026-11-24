'use strict';
const assert = require('node:assert/strict');
const ctx = require('./map-context.cjs')();
const data = ctx.IEBMapData.create(ctx.FOODS,()=> 'ko');
function harness(mapData=data) {
  const requests=[],maps=[],timers=new Map();let ready=false,next=0;
  const nodes={map:{},'mini-map':{},'map-warning':{hidden:true}};
  const picker={value:'suyeong',addEventListener(){},removeEventListener(){}};
  const provider={available:()=>ready,load:()=>new Promise((resolve,reject)=>requests.push({resolve(){ready=true;resolve();},reject})),
    create(element,options){const map={options,removed:0,places:[],addPlace(p){this.places.push(p);},fitPlaces(p){this.bounds=p;},resize(){},dispose(){this.removed++;}};maps.push(map);return map;}};
  const view=ctx.IEBMapView.create({data:mapData,provider,root:{querySelector:()=>picker},document:{getElementById:id=>nodes[id]},navigator:{},
    getLanguage:()=> 'ko',districtName:i=>ctx.DISTRICTS.ko[i],
    t:(key,vars)=>ctx.I18N.ko[key]?.replace('{n}',vars?.n)||key,esc:String,fname:f=>f.ko.name,img:id=>id,icon:()=>'',appHeader:()=>'',tabbar:()=>'',toast(){},
    setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),
  });
  return {view,provider,nodes,maps,requests,timers};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const h=harness();const first=h.view.mount({mode:'detail'});
  assert.equal(h.requests.length,1);assert.equal(h.maps.length,0);
  first();h.requests[0].resolve();await flush();
  assert.equal(h.maps.length,0,'SDK cannot initialize an abandoned screen');
  assert.equal(h.timers.size,0);
  const failed=harness();failed.view.mount({mode:'detail'});
  failed.requests[0].reject(new Error('sdk unavailable'));await flush();
  assert.ok(failed.nodes.map.textContent.includes('지도를 불러오지 못했어요'));
  assert.equal(failed.maps.length,0);
  const interactiveMini=harness();const closeMini=interactiveMini.view.mountMini({id:'jagalchi-hoe',i:0});
  interactiveMini.requests[0].resolve();await flush();
  assert.equal(interactiveMini.maps[0].options.interactive,true,'Coordinate-backed restaurant map permits interaction');
  assert.equal(interactiveMini.maps[0].options.zoom,15,'Keep the restaurant starting zoom');
  assert.equal(interactiveMini.maps[0].places.length,1,'Keep the restaurant marker');
  closeMini();assert.equal(interactiveMini.maps[0].removed,1);
  const mini=harness();const disposeMini=mini.view.mountMini({id:'jagalchi-hoe',i:'0'});
  disposeMini();mini.requests[0].resolve();await flush();assert.equal(mini.maps.length,0);
  const active=harness();const dispose=active.view.mount({district:'suyeong',mode:'detail'});
  active.requests[0].resolve();await flush();assert.equal(active.maps[0].places.length,data.restaurantsForSelection({districtId:'suyeong'}).filter(data.hasCoordinates).length);
  dispose();dispose();assert.equal(active.maps[0].removed,1);assert.equal(active.timers.size,0);
  // Match the live catalog shape: 156 restaurant IDs represented by 163 food links.
  const stores=Array.from({length:156},(_,i)=>({restaurantId:'restaurant-'+i,name:'식당 '+i,address:'부산 사하구 낙동대로 '+i,lat:35.1,lng:129}));
  const food=(id,places)=>({id,ko:{name:id,restaurants:[]},places});
  const sharedData=ctx.IEBMapData.create([food('one',[...stores,{...stores[0],name:'같은 ID의 다른 표기'}]),food('two',stores.slice(0,6))],()=> 'ko');
  assert.equal(sharedData.allPlaces().length,163);
  const shared=harness(sharedData);
  shared.view.mount({mode:'detail'});shared.requests[0].resolve();await flush();
  assert.equal(shared.maps[0].places.length,156,'Detailed map creates one marker per restaurant ID');
  assert.equal(shared.maps[0].bounds.length,156,'Map bounds use the same deduplicated restaurants');
  for(const params of [{},{district:'saha'},{id:'one',district:'saha'},{id:'two',district:'saha'},{district:'buk'}]) {
    const expected=params.district==='buk'?0:params.id==='two'?6:156;
    const overview=shared.view.render({district:params.district});
    const detail=shared.view.render({...params,mode:'detail'});
    if(!params.id && expected) assert.ok(overview.includes('식당 '+expected+'곳</h2>'));
    assert.equal((detail.match(/class="list-item"/g)||[]).length,expected,'Filtered detailed list deduplicates restaurant IDs');
    assert.ok(detail.includes(ctx.I18N.ko['map.nearby'].replace('{n}',expected)),'Sheet count matches its unique restaurant list');
  }
  shared.view.mount({mode:'detail',id:'two',district:'saha'});
  assert.equal(shared.maps[1].places.length,6,'Food and district filters also deduplicate markers');
  const broken=harness();broken.provider.available=()=>true;broken.provider.create=()=>{throw new Error('bad SDK');};
  const clean=broken.view.mount({mode:'detail'});
  assert.ok(broken.nodes.map.textContent.includes('지도를 불러오지 못했어요'));
  clean();
  const source={food:{id:'test'},i:0,name:'주소 식당',address:'부산 사하구 낙동대로450번길 12',lat:null,lng:null};
  const addressData={...data,placeOf:()=>source};
  const geocoded=harness(addressData);geocoded.provider.resolvePlace=async()=>({...source,lat:35.1,lng:128.9});
  const disposeAddress=geocoded.view.mountMini({id:'test',i:0});await flush();
  assert.equal(geocoded.requests.length,1,'A coordinate-less restaurant can load the Google mini-map after address lookup');
  geocoded.requests[0].resolve();await flush();assert.equal(geocoded.maps[0].places[0].lat,35.1);
  assert.equal(geocoded.maps[0].options.interactive,true,'Address-resolved restaurant map permits interaction too');
  disposeAddress();
  const abandoned=harness(addressData);let finishAddress;
  abandoned.provider.resolvePlace=()=>new Promise(resolve=>{finishAddress=resolve;});
  const leave=abandoned.view.mountMini({id:'test',i:0});await flush();leave();finishAddress({...source,lat:35.1,lng:128.9});await flush();
  assert.equal(abandoned.requests.length,0,'Address responses cannot initialize a departed screen');
  const notFound=harness(addressData);notFound.provider.resolvePlace=async()=>null;
  notFound.view.mountMini({id:'test',i:0});await flush();assert.ok(notFound.nodes['mini-map'].textContent.includes('Google'));
  console.log('PASS late SDK completion, failed SDK/create fallback, mini-map disposal and active initialization');
})().catch(error=>{console.error(error);process.exitCode=1;});
