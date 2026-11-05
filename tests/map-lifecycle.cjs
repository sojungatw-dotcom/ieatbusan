'use strict';
const assert = require('node:assert/strict');
const ctx = require('./map-context.cjs')();
const data = ctx.IEBMapData.create(ctx.FOODS,()=> 'ko');
function harness(mapData=data) {
  const requests=[],maps=[],timers=new Map();let ready=false,next=0;
  const nodes={map:{},'mini-map':{},'map-warning':{hidden:true}};
  const picker={value:'suyeong',addEventListener(){},removeEventListener(){}};
  const provider={available:()=>ready,load:()=>new Promise((resolve,reject)=>requests.push({resolve(){ready=true;resolve();},reject})),
    create(element,options){const map={removed:0,places:[],addPlace(p){this.places.push(p);},fitPlaces(p){this.bounds=p;},resize(){},dispose(){this.removed++;}};maps.push(map);return map;}};
  const view=ctx.IEBMapView.create({data:mapData,provider,root:{querySelector:()=>picker},document:{getElementById:id=>nodes[id]},navigator:{},
    getLanguage:()=> 'ko',districtName:i=>ctx.DISTRICTS.ko[i],
    t:key=>ctx.I18N.ko[key]||key,esc:String,fname:f=>f.ko.name,img:id=>id,icon:()=>'',appHeader:()=>'',tabbar:()=>'',toast(){},
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
  const mini=harness();const disposeMini=mini.view.mountMini({id:'jagalchi-hoe',i:'0'});
  disposeMini();mini.requests[0].resolve();await flush();assert.equal(mini.maps.length,0);
  const active=harness();const dispose=active.view.mount({district:'suyeong',mode:'detail'});
  active.requests[0].resolve();await flush();assert.equal(active.maps[0].places.length,data.placesForSelection({districtId:'suyeong'}).filter(data.hasCoordinates).length);
  dispose();dispose();assert.equal(active.maps[0].removed,1);assert.equal(active.timers.size,0);
  const broken=harness();broken.provider.available=()=>true;broken.provider.create=()=>{throw new Error('bad SDK');};
  const clean=broken.view.mount({mode:'detail'});
  assert.ok(broken.nodes.map.textContent.includes('지도를 불러오지 못했어요'));
  clean();
  const source={food:{id:'test'},i:0,name:'주소 식당',address:'부산 사하구 낙동대로450번길 12',lat:null,lng:null};
  const addressData={...data,placeOf:()=>source};
  const geocoded=harness(addressData);geocoded.provider.resolvePlace=async()=>({...source,lat:35.1,lng:128.9});
  const disposeAddress=geocoded.view.mountMini({id:'test',i:0});await flush();
  assert.equal(geocoded.requests.length,1,'A coordinate-less restaurant can load the Google mini-map after address lookup');
  geocoded.requests[0].resolve();await flush();assert.equal(geocoded.maps[0].places[0].lat,35.1);disposeAddress();
  const abandoned=harness(addressData);let finishAddress;
  abandoned.provider.resolvePlace=()=>new Promise(resolve=>{finishAddress=resolve;});
  const leave=abandoned.view.mountMini({id:'test',i:0});await flush();leave();finishAddress({...source,lat:35.1,lng:128.9});await flush();
  assert.equal(abandoned.requests.length,0,'Address responses cannot initialize a departed screen');
  const notFound=harness(addressData);notFound.provider.resolvePlace=async()=>null;
  notFound.view.mountMini({id:'test',i:0});await flush();assert.ok(notFound.nodes['mini-map'].textContent.includes('Google'));
  console.log('PASS late SDK completion, failed SDK/create fallback, mini-map disposal and active initialization');
})().catch(error=>{console.error(error);process.exitCode=1;});
