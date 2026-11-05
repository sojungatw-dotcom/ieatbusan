'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const handler=require(path.join(root,'api/service.js')),originalFetch=global.fetch,oldEnv={...process.env};
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-key'});
const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
let likes=[],foodLikes=[],writes=0,renders=0;
const post={id:'real-post',user_id:other,title:'제목',body:'내용',category:'free',photos:[],country_code:'KR',seed_likes:99,created_at:'2026-11-05T00:00:00Z',ieb_profiles:{nickname:'다른 사용자',area:8,country_code:'KR'}};
global.fetch=async(url,opts={})=>{
 const u=new URL(url),body=opts.body&&JSON.parse(opts.body),reply=d=>new Response(JSON.stringify(d));
 if(u.pathname==='/auth/v1/user')return reply({id:uid});
 if(u.pathname==='/rest/v1/ieb_profiles')return reply([{id:uid,username:'tester',nickname:'Tester',area:8,bio:'',country_code:'KR',created_at:'2026-11-05T00:00:00Z'}]);
 if(u.pathname==='/rest/v1/ieb_preferences'||u.pathname==='/rest/v1/ieb_comments')return reply([]);
 if(u.pathname==='/rest/v1/ieb_posts')return reply(u.searchParams.get('country_code')==='neq.KR'?[]:[{...post,like_count:likes.length,liked_user_ids:likes.map(l=>l.user_id)}]);
 if(u.pathname==='/rest/v1/ieb_foods')return reply([{id:'dwaeji-gukbap',name:'DB 음식 이름',summary:'DB 소개',category:'국밥',image_asset:'dwaeji-gukbap.jpg',content:{ko:{name:'이전 이름'},places:[{name:'수변최고돼지국밥 민락본점',lat:35.1555,lng:129.1335}]},like_count:foodLikes.length,liked_user_ids:foodLikes}]);
 if(u.pathname==='/rest/v1/rpc/ieb_set_food_like'){
  assert.equal(body.target_id,'dwaeji-gukbap');assert.equal(Object.hasOwn(body,'user_id'),false);
  foodLikes=body.is_liked?[...new Set([...foodLikes,uid])]:foodLikes.filter(id=>id!==uid);return reply({like_count:foodLikes.length});
 }
 if(u.pathname==='/rest/v1/rpc/ieb_set_post_like'){
  writes++;assert.equal(Object.hasOwn(body,'user_id'),false,'Actor is derived inside authenticated RPC');
  if(body.is_liked){if(!likes.some(l=>l.user_id===uid&&l.post_id===body.target_id))likes.push({post_id:body.target_id,user_id:uid});}
  else likes=likes.filter(l=>l.user_id!==uid||l.post_id!==body.target_id);
  return reply({like_count:likes.length});
 }
 throw Error('Unexpected upstream '+u.pathname);
};
async function appFetch(url,opts={}){
 const res={setHeader(){},end(text){this.text=text;}};
 await handler({url,method:opts.method||'GET',body:opts.body,headers:{host:'site.vercel.app',origin:'https://site.vercel.app',cookie:'ieb_access=verified','content-type':'application/json'}},res);
 return new Response(res.text,{status:res.statusCode});
}
const ctx=vm.createContext({console,fetch:appFetch,location:{protocol:'https:'},localStorage:{getItem(){return null;},setItem(){}},SEED:{posts:[]}});ctx.window=ctx;
vm.runInContext(read('js/store.js'),ctx);vm.runInContext(read('js/cloud.js'),ctx);
const app=read('js/app.js'),action=app.match(/likePost: async el => \{([^\n]+)\},/);assert.ok(action,'Production like handler missing');
Object.assign(ctx,{S:()=>ctx.Store.get(),requireLogin:()=>!!ctx.Store.get().user,app:{contains:()=>true},rerender:()=>renders++});
vm.runInContext('var clickLike=async el=>{'+action[1]+'};',ctx);
const total=()=>{const s=ctx.Store.get(),p=s.posts.find(p=>p.id===post.id);return p.likes+(s.postLikes[p.id]?1:0);};
(async()=>{
 await ctx.Store.load();assert.equal(total(),0,'Ignore arbitrary seed likes');
 await ctx.clickLike({dataset:{id:post.id}});assert.equal(writes,1);assert.equal(likes.length,1);assert.equal(total(),1);assert.equal(ctx.Store.get().postLikes[post.id],true);assert.equal(renders,1);
 await ctx.Store.load();assert.equal(total(),1,'Like survives state reload');
 await ctx.clickLike({dataset:{id:post.id}});assert.equal(likes.length,0);assert.equal(total(),0);assert.equal(renders,2);
 likes.push({post_id:post.id,user_id:other});await ctx.Store.load();assert.equal(total(),1,'Other user like stays visible');
 await ctx.clickLike({dataset:{id:post.id}});assert.equal(total(),2,'Own like counts exactly once alongside another user');
 await ctx.clickLike({dataset:{id:post.id}});assert.equal(total(),1);assert.equal(likes[0].user_id,other,'Unlike preserves other users');
 await ctx.Cloud.foodLike('dwaeji-gukbap',true);assert.equal(ctx.Store.get().foods[0].likes,1);assert.equal(ctx.Store.get().foodLikes['dwaeji-gukbap'],true);
 await ctx.Store.load();assert.equal(ctx.Store.get().foods[0].likes,1,'Food likes survive refresh');
 await ctx.Cloud.foodLike('dwaeji-gukbap',false);assert.equal(ctx.Store.get().foods[0].likes,0);assert.equal(ctx.Store.get().foodLikes['dwaeji-gukbap'],undefined);
 ctx.FOODS=[{id:'dwaeji-gukbap',ko:{name:'Static old name'},likes:0,places:[{name:'수변최고돼지국밥 민락본점',naverUrl:'https://naver.me/GdymdeQF'}]}];ctx.FOOD={'dwaeji-gukbap':ctx.FOODS[0]};ctx.mapData={byId:{'dwaeji-gukbap':ctx.FOODS[0]}};
 vm.runInContext(app.slice(app.indexOf('  function syncFoodCatalog()'),app.indexOf('  const placeLikes')),ctx);
 ctx.syncFoodCatalog();assert.equal(ctx.FOOD['dwaeji-gukbap'].ko.name,'DB 음식 이름');assert.equal(ctx.FOOD['dwaeji-gukbap'].photo,'assets/food/dwaeji-gukbap.jpg');assert.equal(ctx.mapData.byId['dwaeji-gukbap'],ctx.FOODS[0]);
 assert.equal(ctx.FOOD['dwaeji-gukbap'].places[0].naverUrl,'https://naver.me/GdymdeQF','DB refresh preserves the explicit Naver destination');
 ctx.requireLogin=()=>false;const before=writes;await ctx.clickLike({dataset:{id:post.id}});assert.equal(writes,before,'Guests cannot submit likes');
 console.log('PASS consolidated post/food like RPCs, DB catalog and filename assets; production handler → Cloud → API → bootstrap → Store: add, reload, cancel, actual totals, no seed inflation, owner-only delete, guest guard');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;for(const k of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY']){if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}});
