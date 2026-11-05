'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const context=vm.createContext({URL,console,window:{}});
for(const file of ['js/map/google-loader.js','js/map/google-provider.js'])vm.runInContext(read(file),context);
function loaderHarness({missing=false,existing=false}={}) {
  const host={},nodes=[],timers=new Map();let sdk=existing?{Map(){},marker:{AdvancedMarkerElement(){}}}:null,requests=0,next=0;
  const loader=context.window.IEBGoogleMapSDK.create({host,getSDK:()=>sdk,
    document:{createElement:()=>({remove(){this.removed=true;}}),head:{appendChild:node=>nodes.push(node)}},
    fetchConfig:async()=>{requests++;return {ok:!missing,json:async()=>missing?{error:'map.keyMissing'}:{apiKey:'fake-browser-key',mapId:'test-map-id'}};},
    setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)});
  return {loader,host,nodes,timers,requests:()=>requests,success(){sdk={Map(){},marker:{AdvancedMarkerElement(){}}};host[new URL(nodes.at(-1).src).searchParams.get('callback')]();}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const h=loaderHarness();assert.equal(h.requests(),0,'SVG overview cannot load config or SDK');
  const first=h.loader.load();assert.equal(first,h.loader.load());await flush();assert.equal(h.nodes.length,1);
  const url=new URL(h.nodes[0].src);assert.equal(url.origin,'https://maps.googleapis.com');assert.equal(url.searchParams.get('libraries'),'marker');assert.equal(url.searchParams.get('loading'),'async');
  h.success();await first;assert.equal(h.loader.ready(),true);assert.equal(h.loader.mapId(),'test-map-id');assert.equal(h.timers.size,0);
  await h.loader.load();assert.equal(h.requests(),1);
  const missing=loaderHarness({missing:true});await assert.rejects(missing.loader.load(),/map.keyMissing/);assert.equal(missing.nodes.length,0);
  const network=loaderHarness();const attempt=network.loader.load();await flush();network.nodes[0].onerror();await assert.rejects(attempt);assert.ok(network.nodes[0].removed);
  const retry=network.loader.load();await flush();network.success();await retry;
  const slow=loaderHarness();const timeout=slow.loader.load();await flush();[...slow.timers.values()][0]();await assert.rejects(timeout);assert.ok(slow.nodes[0].removed);
  const auth=loaderHarness();const denied=auth.loader.load();await flush();auth.host.gm_authFailure();await assert.rejects(denied,/map.googleAuthError/);assert.equal(auth.timers.size,0);
  assert.equal(auth.loader.ready(),false);
  const existing=loaderHarness({existing:true});await existing.loader.load();assert.equal(existing.nodes.length,0);
  const records={maps:[],pins:[],circles:[],events:[],popups:[]};let notify,unsubscribed=0;
  class MapFake {constructor(el,options){this.options=options;this.zoom=options.zoom;records.maps.push(this);}setCenter(ll){this.center=ll;}setZoom(z){this.zoom=z;}getZoom(){return this.zoom;}panTo(ll){this.center=ll;}fitBounds(b,p){this.bounds=b;this.padding=p;}}
  class Pin {constructor(options){Object.assign(this,options);records.pins.push(this);}addListener(name,fn){this.click=fn;return {remove(){records.events.push('removed');}};}}
  class Info {constructor(){records.popups.push(this);}setContent(html){this.html=html;}open(options){this.options=options;}close(){this.closed=true;}}
  class Circle {constructor(options){Object.assign(this,options);records.circles.push(this);}setMap(map){this.map=map;}}
  const sdk={Map:MapFake,marker:{AdvancedMarkerElement:Pin},InfoWindow:Info,Circle,
    LatLngBounds:class {constructor(){this.points=[];}extend(p){this.points.push(p);}},
    event:{addListenerOnce(map,name,fn){map.idle=fn;return {remove(){records.events.push('idle removed');}};},clearInstanceListeners(map){map.cleared=true;},trigger(map,name){records.events.push(name);}}};
  const provider=context.window.IEBGoogleMapProvider.create({getSDK:()=>sdk,loader:{ready:()=>true,load:async()=>sdk,mapId:()=> 'TEST_MAP',onError(fn){notify=fn;return ()=>unsubscribed++;}},document:{createElement:()=>({})}});
  const element={replaceChildren(){this.cleared=true;}},statuses=[];
  const map=provider.create(element,{center:[35,129],onStatus:code=>statuses.push(code)});
  assert.equal(records.maps[0].options.mapId,'TEST_MAP');assert.equal(records.maps[0].options.center.lat,35);
  const place={food:{id:'milmyeon'},i:2,name:'식당',lat:35.2,lng:129.1};map.addPlace(place,'safe popup',true);map.fitPlaces([place]);assert.equal(records.maps[0].zoom,15);
  map.fitPlaces([place,{...place,lat:35.3}]);records.maps[0].zoom=19;records.maps[0].idle();assert.equal(records.maps[0].zoom,15);
  map.focusPlace('milmyeon:2');assert.equal(records.maps[0].zoom,16);assert.equal(records.popups[0].html,'safe popup');
  map.showLocation([35.1,129.2]);map.showLocation([35.2,129.3]);assert.equal(records.circles[0].map,null);assert.ok(records.circles[1].map);
  notify('authorization');assert.equal(statuses[0],'authorization');map.resize();assert.ok(records.events.includes('resize'));
  map.dispose();map.dispose();assert.equal(unsubscribed,1);assert.equal(records.pins[0].map,null);assert.equal(records.circles[1].map,null);assert.ok(element.cleared);assert.ok(records.maps[0].cleared);
  map.focusPlace('milmyeon:2');map.showLocation([0,0]);assert.equal(records.circles.length,2);
  const mini=provider.create({replaceChildren(){}},{interactive:false});assert.equal(records.maps[1].options.gestureHandling,'none');mini.dispose();
  const endpoint=require('../api/maps-config.js');
  function request(env,method='GET'){const headers={};const res={setHeader:(k,v)=>headers[k]=v,end(value){this.data=JSON.parse(value);}};endpoint({method},res,env);return {...res,headers};}
  assert.equal(request({}).statusCode,503);assert.equal(request({}).data.error,'map.keyMissing');
  const config=request({GOOGLE_MAPS_BROWSER_KEY:'browser-key',SUPABASE_SECRET_KEY:'must-not-leak'});assert.equal(config.statusCode,200);assert.deepEqual(config.data,{apiKey:'browser-key',mapId:'DEMO_MAP_ID'});assert.ok(!JSON.stringify(config).includes('must-not-leak'));assert.equal(config.headers['Cache-Control'],'no-store');assert.equal(request({},'POST').statusCode,405);
  console.log('PASS Google lazy/shared loading, missing key, retry, timeout, auth errors, advanced pins, bounds, popup, location replacement, mini-map, disposal and public-config allowlist');
})().catch(error=>{console.error(error);process.exitCode=1;});
