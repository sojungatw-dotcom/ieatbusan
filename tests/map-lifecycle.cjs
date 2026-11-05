'use strict';
const assert = require('node:assert/strict');
const ctx = require('./map-context.cjs')();
const data = ctx.IEBMapData.create(ctx.FOODS,()=> 'ko');
function harness() {
  const requests=[],maps=[],timers=new Map();let ready=false,next=0;
  const nodes={map:{},'mini-map':{},'map-warning':{hidden:true}};
  const picker={value:'suyeong',addEventListener(){},removeEventListener(){}};
  const provider={available:()=>ready,load:()=>new Promise((resolve,reject)=>requests.push({resolve(){ready=true;resolve();},reject})),
    create(element,options){const map={removed:0,places:[],addPlace(p){this.places.push(p);},fitPlaces(p){this.bounds=p;},resize(){},dispose(){this.removed++;}};maps.push(map);return map;}};
  const view=ctx.IEBMapView.create({data,provider,root:{querySelector:()=>picker},document:{getElementById:id=>nodes[id]},navigator:{},
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
  console.log('PASS late SDK completion, failed SDK/create fallback, mini-map disposal and active initialization');
})().catch(error=>{console.error(error);process.exitCode=1;});
