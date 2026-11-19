'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/service.js');
const uid='11111111-1111-4111-8111-111111111111',a='22222222-2222-4222-8222-222222222222',b='33333333-3333-4333-8333-333333333333';
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='test-key';
const calls=[],posts=Array.from({length:13},(_,i)=>({id:'post-'+i,title:'Review '+i,body:'Visit '+i,food:'dwaeji-gukbap',category:'review',restaurant_id:a,user_id:uid,photos:[],country_code:'KR',created_at:new Date(Date.UTC(2026,10,19,0,0,13-i)).toISOString(),ieb_profiles:{nickname:'Tester',area:8},liked_user_ids:[],like_count:0}));
posts.push({...posts[0],id:'other-restaurant',restaurant_id:b},{...posts[0],id:'other-food',food:'milmyeon'});
global.fetch=async(url,options={})=>{
 const u=new URL(url),body=typeof options.body==='string'?JSON.parse(options.body):options.body;
 calls.push({u,options,body});const reply=data=>new Response(JSON.stringify(data));
 if(u.pathname==='/auth/v1/user')return reply({id:uid});
 if(u.pathname==='/rest/v1/ieb_profiles')return reply([{id:uid,country_code:'KR'}]);
 if(u.pathname==='/rest/v1/ieb_restaurant')return reply([{id:a,food_ids:['dwaeji-gukbap']}]);
 if(u.pathname==='/rest/v1/ieb_posts'){
  if(options.method==='POST')return reply([]);
  let rows=posts;
  if(u.searchParams.has('food'))rows=rows.filter(p=>p.food===u.searchParams.get('food').slice(3));
  if(u.searchParams.has('restaurant_id'))rows=rows.filter(p=>p.restaurant_id===u.searchParams.get('restaurant_id').slice(3)&&p.category==='review');
  const offset=Number(u.searchParams.get('offset'));return reply(rows.slice(offset,offset+Number(u.searchParams.get('limit'))));
 }
 throw Error('Unexpected request '+u.pathname);
};
async function request(query,body,auth=false){
 const res={setHeader(){},end(value){this.data=JSON.parse(value);}};
 await handler({url:'/api/service?action='+query,method:body?'POST':'GET',body,headers:{host:'example.test',origin:'https://example.test','content-type':'application/json',cookie:auth?'ieb_access=access; ieb_refresh=refresh':''}},res);
 return {status:res.statusCode,...res.data};
}
(async()=>{
 const first=await request('detailPosts&food=dwaeji-gukbap&offset=0');assert.equal(first.status,200);assert.equal(first.posts.length,5);assert.ok(first.hasMore);assert.ok(first.posts.every(p=>p.food==='dwaeji-gukbap'));
 const one=await request('detailPosts&restaurantId='+a+'&offset=0'),two=await request('detailPosts&restaurantId='+a+'&offset=5'),three=await request('detailPosts&restaurantId='+a+'&offset=10');
 assert.equal(one.posts.length,5);assert.equal(two.posts.length,5);assert.equal(three.posts.length,4);assert.equal(three.hasMore,false);assert.equal(new Set([...one.posts,...two.posts,...three.posts].map(p=>p.id)).size,14);assert.ok([...one.posts,...two.posts,...three.posts].every(p=>p.restaurantId===a));
 assert.equal((await request('detailPosts&restaurantId=bad')).status,400);assert.equal((await request('detailPosts&food=dwaeji-gukbap&offset=-1')).status,400);assert.equal((await request('detailPosts&food=dwaeji-gukbap&offset=1.2')).status,400);
 assert.equal((await request('detailPosts&food=dwaeji-gukbap%26or=bad')).status,400);
 const draft={title:'A review',body:'Good food',cat:'review',food:'dwaeji-gukbap',restaurantId:a,photos:[],user_id:'forged-user'};
 assert.equal((await request('post',draft)).status,401);
 assert.equal((await request('post',{...draft,cat:'free'},true)).status,400);
 assert.equal((await request('post',{...draft,food:'milmyeon'},true)).status,400);
 assert.equal((await request('post',{...draft,restaurantId:'bad'},true)).status,400);
 assert.equal((await request('post',draft,true)).status,200);
 const saved=calls.findLast(c=>c.u.pathname==='/rest/v1/ieb_posts'&&c.options.method==='POST');assert.equal(saved.body.restaurant_id,a);assert.equal(saved.body.user_id,uid);assert.equal(saved.body.category,'review');assert.equal(saved.options.headers.Authorization,'Bearer access');
 assert.equal((await request('post',{...draft,restaurantId:null},true)).status,200);assert.equal(calls.findLast(c=>c.u.pathname==='/rest/v1/ieb_posts'&&c.options.method==='POST').body.restaurant_id,null);
 console.log('PASS guest reads; food/restaurant isolation; 5-row pagination and end; invalid selectors; member-only review writes; server author; restaurant-food validation; ordinary posts preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
