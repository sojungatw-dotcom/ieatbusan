'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/mobile-intro.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({mobile=true,hash='',seen=false,reduced=false,storageBlocked=false,fail=false}={}){
 const timers=new Map(),listeners={},classes=new Set(),images=[],requests=[],revoked=[];let next=0,stored=seen?'seen':null;
 const element=()=>({attrs:{},className:'',classList:{add(name){this[name]=true;}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},removeAttribute(k){delete this.attrs[k];},append(child){this.child=child;},remove(){this.removed=true;},addEventListener(k,fn){this[k]=fn;}});
 const app=element();app.inert=false;
 const theme=element();theme.attrs.content='#F5F2EC';
 const media={matches:mobile,addEventListener(k,fn){this.change=fn;},removeEventListener(){}};
 const ctx=vm.createContext({AbortController,URL:{createObjectURL:()=> 'blob:local-animation',revokeObjectURL:value=>revoked.push(value)},
  location:{hash,replace(value){this.hash=value;}},sessionStorage:{getItem(){if(storageBlocked)throw Error('blocked');return stored;},setItem(k,v){if(storageBlocked)throw Error('blocked');stored=v;}},
  fetch:async url=>{requests.push(url);if(fail)throw Error('network');return {ok:true,blob:async()=>({})};},
  setTimeout(fn,ms){timers.set(++next,{fn,ms});return next;},clearTimeout(id){timers.delete(id);},
  document:{readyState:'complete',documentElement:{classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}},querySelector:()=>theme,getElementById:()=>app,createElement(tag){const el=element();if(tag==='img')images.push(el);return el;},body:element(),addEventListener(){},removeEventListener(){}},
  addEventListener(k,fn){listeners[k]=fn;},removeEventListener(k){delete listeners[k];},matchMedia:q=>q.includes('reduced-motion')?{matches:reduced}:media,
 });ctx.window=ctx;vm.runInContext(source,ctx);
 return {ctx,app,theme,classes,timers,images,requests,revoked,media,listeners,stored:()=>stored,run(ms){const entry=[...timers].find(([,t])=>t.ms===ms);assert.ok(entry,'Expected timer '+ms);timers.delete(entry[0]);entry[1].fn();}};
}
(async()=>{
 for(const options of [{mobile:false},...['#/admin','#/home/admin','#/login','#/food/milmyeon','#/place/milmyeon/0','#/map'].map(hash=>({hash}))]){
  const f=fixture(options);await tick();assert.equal(f.requests.length,0,'Excluded routes/devices must not download the GIF');assert.equal(f.classes.size,0);
 }
 const f=fixture();await tick();assert.ok(f.classes.has('mobile-intro-pending'));assert.equal(f.app.inert,true);assert.equal(f.images[0].src,'blob:local-animation');
 assert.ok(![...f.timers.values()].some(t=>t.ms===3920),'Playback begins only after image load');
 f.images[0].load();assert.equal(f.theme.attrs.content,'#C44934');f.run(3920);
 assert.equal(f.classes.size,0);assert.equal(f.app.inert,false);assert.equal(f.app.getAttribute('aria-hidden'),null);assert.equal(f.theme.attrs.content,'#F5F2EC');assert.equal(f.ctx.location.hash,'#/home');assert.equal(f.stored(),null);assert.deepEqual(f.revoked,['blob:local-animation']);assert.equal(f.timers.size,0);
 const reload=fixture({seen:true,hash:'#/home'});await tick();assert.equal(reload.requests.length,1,'A previous visit never suppresses a home refresh');reload.images[0].load();reload.run(3920);
 const reduced=fixture({reduced:true});await tick();assert.ok(reduced.requests[0].endsWith('.png'));reduced.images[0].load();reduced.run(2200);assert.equal(reduced.classes.size,0);
 const failed=fixture({fail:true});await tick();assert.ok(failed.images[0].src.startsWith('assets/brand/mobile-intro-9x16.gif?play='),'Network buffering failure falls back to native loading');failed.images[0].error();assert.equal(failed.classes.size,0);
 const decode=fixture();await tick();decode.images[0].error();assert.ok(decode.images[0].src.includes('?play='));decode.images[0].error();assert.equal(decode.classes.size,0);
 const timeout=fixture();await tick();timeout.run(12000);assert.equal(timeout.classes.size,0);
 const blocked=fixture({storageBlocked:true});await tick();blocked.images[0].load();blocked.run(3920);assert.equal(blocked.classes.size,0);
 const navigated=fixture();await tick();navigated.ctx.location.hash='#/login';navigated.listeners.hashchange();assert.equal(navigated.ctx.location.hash,'#/login','Never hijack a route changed during playback');assert.equal(navigated.classes.size,0);
 const resized=fixture();await tick();resized.media.matches=false;resized.media.change();assert.equal(resized.classes.size,0);
 console.log('PASS mobile home-only intro, no desktop downloads, every home refresh, native fallback, delayed playback, home transition, reduced motion, network/decode/timeout recovery, blocked storage, route changes and resize cleanup');
})().catch(error=>{console.error(error);process.exitCode=1;});
