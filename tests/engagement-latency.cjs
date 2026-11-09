'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture() {
  const calls = [], events = [], waits = [];
  let payload = { user: { id:'test-user', nickname:'Tester',countryCode:'JP' }, preferences:{lang:'ko'}, posts:[{id:'p1',photos:[],likes:2}], comments:{},postLikes:{},foods:[{id:'food-one',likes:2}],foodLikes:{} };
  const ctx = vm.createContext({ location:{protocol:'http:'}, crypto:{randomUUID}, SEED:{posts:[]},
    localStorage:{getItem:()=>null,setItem:()=>{}}, CustomEvent:class { constructor(type, props) { this.type=type;this.detail=props?.detail; } },
    fetch:async (url, options) => {
      const action = new URL(url,'http://test').searchParams.get('action');
      calls.push({action, data:options.body && JSON.parse(options.body)});
      if(action==='bootstrap') return {ok:true,json:async()=>JSON.parse(JSON.stringify(payload))};
      const wait=deferred(); waits.push(wait);
      return wait.promise;
    } });
  ctx.window=ctx; ctx.dispatchEvent=event=>events.push(event.type);
  for(const file of ['js/cloud.js','js/store.js']) vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
  await ctx.Store.load(); calls.length=0;
  const settle = (index, data={}, ok=true) => waits[index].resolve({ok,json:async()=>data});
  return {ctx,calls,events,waits,settle,setPayload:value=>{payload=value;}};
}
(async()=>{
  const {ctx,calls,waits,settle,setPayload}=await fixture();
  const like=ctx.Cloud.like('p1',true);
  assert.equal(ctx.Store.get().postLikes.p1,true,'Like changes before any response');
  assert.equal(ctx.Cloud.like('p1',false),like,'Double clicks share a single pending request');
  await tick(); assert.equal(calls.length,1); assert.equal(calls[0].action,'like');
  settle(0); await like; assert.equal(calls.length,1,'No bootstrap after a like');
  const unlike=ctx.Cloud.like('p1',false); await tick(); settle(1,{error:'db.failure'},false);
  await assert.rejects(unlike); assert.equal(ctx.Store.get().postLikes.p1,true,'Failed unlike rolls back');
  const comment=ctx.Cloud.comment('p1','hello');
  assert.equal(ctx.Store.get().comments.p1[0].pending,true,'Comment is immediately visible');
  assert.equal(ctx.Store.get().comments.p1[0].countryCode,'JP','Optimistic comment keeps the member country badge');
  const duplicate=ctx.Cloud.comment('p1','hello'); assert.equal(duplicate,comment);
  await tick(); settle(2,{comment:{id:'canonical-id',text:'hello',createdAt:123}}); await comment;
  assert.equal(ctx.Store.get().comments.p1.length,1);
  assert.equal(ctx.Store.get().comments.p1[0].id,'canonical-id');
  assert.equal(ctx.Store.get().comments.p1[0].pending,false);
  const failedComment=ctx.Cloud.comment('p1','fail'); await tick(); settle(3,{error:'db.failure'},false);
  await assert.rejects(failedComment); assert.equal(ctx.Store.get().comments.p1.length,1);
  assert.ok(calls.every(call=>call.action!=='bootstrap'),'No full feed reload for engagement');
  ctx.Store.set({savedFoods:['a']}); await tick();
  ctx.Store.set({savedFoods:['a','b']}); ctx.Store.set({savedFoods:['a','b','c']});
  assert.equal(ctx.Store.get().savedFoods.length,3,'Bookmarks update without waiting');
  settle(4); await tick();
  assert.deepEqual(calls.at(-1).data.data.savedFoods,['a','b','c'],'Only the latest queued snapshot is sent');
  settle(5); await ctx.Store.flush();
  const before=calls.length;
  ctx.Store.set({savedFoods:['a','b','c']}); await ctx.Store.flush();
  assert.equal(calls.length,before,'Unchanged preferences do not write again on rerender');
  ctx.Store.set({savedFoods:[]}); await tick(); settle(6,{error:'db.failure'},false); await ctx.Store.flush();
  assert.equal(ctx.Store.get().savedFoods.length,3,'Failed preference save restores last confirmed state');
  const refresh=ctx.Store.load(), sameRefresh=ctx.Store.load();
  assert.equal(refresh,sameRefresh,'Concurrent refresh shares one bootstrap'); await refresh;
  assert.equal(calls.filter(call=>call.action==='bootstrap').length,1);

  // A response started before a click must never erase the optimistic edit.
  const originalCall=ctx.Cloud.call.bind(ctx.Cloud), stale=deferred(); let bootstrapCalls=0;
  ctx.Cloud.call=(action,data)=>action==='bootstrap' && ++bootstrapCalls===1 ? stale.promise : originalCall(action,data);
  const racingRefresh=ctx.Store.load(); await tick();
  const racingLike=ctx.Cloud.like('p1',true); await tick();
  stale.resolve({user:{id:'test-user'},preferences:{},posts:[],comments:{},postLikes:{}});
  await tick(); assert.equal(ctx.Store.get().postLikes.p1,true,'Stale bootstrap does not overwrite optimistic state');
  setPayload({user:{id:'test-user'},preferences:{},posts:[],comments:{},postLikes:{p1:true}});
  settle(7); await racingLike; await racingRefresh;
  assert.equal(ctx.Store.get().postLikes.p1,true,'Final refresh sees the saved mutation');
  assert.equal(bootstrapCalls,2,'Refresh retries once after an overlapping mutation');
  assert.equal(waits.length,8);

  const foodFixture=await fixture(), foodStore=foodFixture.ctx.Store;
  const saved=foodFixture.ctx.Cloud.foodLike('food-one',true);
  assert.equal(foodStore.get().foods[0].likes,3,'Food aggregate increases immediately exactly once');
  assert.equal(foodStore.get().foodLikes['food-one'],true);
  assert.equal(foodStore.get().savedFoods[0],'food-one','Saved page updates in the same optimistic edit');
  assert.equal(foodFixture.ctx.Cloud.foodLike('food-one',false),saved,'Food double click shares the pending mutation');
  await tick(); foodFixture.settle(0); await saved; await tick();
  foodFixture.settle(1); await foodStore.flush();
  assert.equal(foodFixture.calls.filter(call=>call.action==='preferences').length,1);
  const failedFood=foodFixture.ctx.Cloud.foodLike('food-one',false);
  assert.equal(foodStore.get().foods[0].likes,2);
  await tick();foodFixture.settle(2,{error:'db.failure'},false);await assert.rejects(failedFood);await foodStore.flush();
  assert.equal(foodStore.get().foods[0].likes,3,'Failed food unlike restores aggregate');
  assert.equal(foodStore.get().foodLikes['food-one'],true);
  assert.equal(foodStore.get().savedFoods[0],'food-one','Failed food unlike restores bookmark');
  assert.ok(foodFixture.calls.every(call=>call.action!=='bootstrap'),'Food like never reloads the entire catalog');

  const routing=vm.createContext({location:{hash:'#/write'},renderCount:0});
  routing.window=routing; routing.rerender=()=>routing.renderCount++;
  routing.addEventListener=(name,fn)=>{routing.listener=fn;};
  const app=fs.readFileSync('js/app.js','utf8'),start=app.indexOf("  window.addEventListener('ieb:change'");
  vm.runInContext(app.slice(start,app.indexOf('\n  app.innerHTML =',start)),routing);
  for(const hash of ['#/write','#/profile','#/search','#/login']) {
    routing.location.hash=hash;routing.listener({detail:'like:p1'});routing.listener({detail:'preferences'});
  }
  assert.equal(routing.renderCount,0,'Late writes cannot erase an unrelated editor/search form');
  routing.location.hash='#/post/p1';routing.listener({detail:'comment:p1'});
  assert.equal(routing.renderCount,1,'Relevant post still refreshes on acknowledgement');
  routing.location.hash='#/results/food';routing.listener({detail:'foodLike:food-one'});
  assert.equal(routing.renderCount,2,'Food hearts also refresh search results immediately');
  let historyWrites=0;
  const mounting=vm.createContext({V:{food:()=>{}},app:{querySelectorAll:()=>[]},Store:{update:()=>historyWrites++}});
  mounting.window=mounting;
  vm.runInContext(app.slice(app.indexOf('  V.food.mount ='),app.indexOf('  V.place =')),mounting);
  mounting.V.food.mount({id:'food-one',refreshing:true});
  assert.equal(historyWrites,0,'Failure rollback rerender must not retry a recent-food write forever');
  mounting.V.food.mount({id:'food-one'});
  assert.equal(historyWrites,1,'A real food navigation still records history');
  console.log('PASS immediate feedback, duplicate suppression, canonical comments, rollback, coalesced preferences, refresh deduplication and stale-response protection');
})().catch(error=>{console.error(error);process.exitCode=1;});
