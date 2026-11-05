'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/service.js');
const oldFetch=global.fetch,oldEnv={...process.env};
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public',SUPABASE_SECRET_KEY:'test-secret'});
const uid='11111111-1111-4111-8111-111111111111',calls=[];
let country='JP',migrationMissing=false;
global.fetch=async(url,options={})=>{
  const parsed=new URL(url),body=options.body?JSON.parse(options.body):undefined;
  calls.push({url:parsed,...options,body});
  const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
  if(parsed.pathname==='/auth/v1/user') return reply({id:uid});
  if(parsed.pathname==='/auth/v1/admin/users') return reply({id:uid});
  if(parsed.pathname==='/rest/v1/rpc/ieb_allow_signup') return reply(true);
  if(parsed.pathname==='/rest/v1/ieb_profiles') {
    if(migrationMissing&&parsed.searchParams.get('limit')==='0')return reply({code:'42703'},400);
    if(options.method==='PATCH'){country=body.country_code;return reply(null);}
    return reply([{id:uid,username:'tester',nickname:'작성자',area:8,bio:'',country_code:country,created_at:'2026-11-01T00:00:00Z'}]);
  }
  if(parsed.pathname==='/rest/v1/ieb_posts') {
    if(options.method==='POST')return reply(null);
    const base={user_id:uid,title:'글',body:'내용',category:'free',food:null,photos:[],created_at:'2026-11-01T00:00:00Z',seed_likes:99,liked_user_ids:[],like_count:0,
      ieb_profiles:{nickname:'작성자',area:8,country_code:country}};
    const rows=[{...base,id:'kr',country_code:'KR'},{...base,id:'jp',country_code:'JP',liked_user_ids:[uid,'another-user'],like_count:2}];
    const filter=parsed.searchParams.get('country_code');
    return reply(filter?.startsWith('eq.')?rows.filter(row=>row.country_code===filter.slice(3))
      :filter?.startsWith('neq.')?rows.filter(row=>row.country_code!==filter.slice(4)):rows);
  }
  if(parsed.pathname==='/rest/v1/ieb_comments')return reply([{id:'c1',post_id:'jp',user_id:uid,body:'댓글',seed_likes:99,created_at:'2026-11-01T00:00:00Z',ieb_profiles:{nickname:'작성자',country_code:country}}]);
  if(parsed.pathname==='/rest/v1/ieb_foods')return reply([]);
  if(parsed.pathname==='/rest/v1/ieb_preferences')return reply([]);
  throw new Error('Unexpected mock URL '+parsed.pathname);
};
async function request(action,body,cookie='') {
  const response={setHeader(){},end(value){this.body=JSON.parse(value);}};
  await handler({url:'/api/service?action='+action,method:body===undefined?'GET':'POST',body,
    headers:{host:'site.test',origin:'https://site.test',cookie,'content-type':'application/json'}},response);
  return {status:response.statusCode,data:response.body};
}
(async()=>{
  const credentials={username:'tester',password:'test-password'};
  const registration=await request('signup',{...credentials,countryCode:'JP'});
  assert.equal(registration.status,200);
  assert.equal(calls.find(call=>call.url.pathname==='/auth/v1/admin/users').body.user_metadata.country_code,'JP');
  calls.length=0;
  assert.equal((await request('signup',credentials)).status,200);
  assert.equal(calls.find(call=>call.url.pathname==='/auth/v1/admin/users').body.user_metadata.country_code,'KR');
  for(const bad of ['ZZ','<script>','',null,[],{}]) {
    const before=calls.length;
    assert.equal((await request('signup',{...credentials,countryCode:bad})).status,400);
    assert.equal(calls.length,before,'Invalid country must fail before creating an auth user');
  }
  migrationMissing=true;calls.length=0;
  assert.equal((await request('signup',{...credentials,countryCode:'JP'})).status,502);
  assert.ok(!calls.some(call=>call.url.pathname==='/auth/v1/admin/users'),'Missing migration cannot silently create an account with the wrong country');
  migrationMissing=false;
  assert.equal((await request('country',{countryCode:'US'})).status,401);
  const cookie='ieb_access=test-access';
  for(const bad of ['ZZ','<script>',undefined])assert.equal((await request('country',{countryCode:bad},cookie)).status,400);
  const result=await request('country',{countryCode:'US',user_id:'other-user',nickname:'forged'},cookie);
  assert.equal(result.status,200);
  const update=calls.findLast(call=>call.method==='PATCH');
  assert.equal(update.url.searchParams.get('id'),'eq.'+uid);
  assert.deepEqual(update.body,{country_code:'US'});
  assert.equal(update.headers.Authorization,'Bearer test-access');
  assert.equal(update.headers.apikey,'test-public');
  country='JP';calls.length=0;
  const bootstrap=await request('bootstrap',undefined,cookie);
  assert.equal(bootstrap.data.user.countryCode,'JP');
  assert.deepEqual(bootstrap.data.posts.map(post=>post.id),['jp','kr']);
  assert.equal(bootstrap.data.posts.find(post=>post.id==='kr').authorCountryCode,'JP');
  assert.equal(bootstrap.data.posts.find(post=>post.id==='kr').countryCode,'KR','Country at posting remains distinct from current author country');
  assert.equal(bootstrap.data.comments.jp[0].authorCountryCode,'JP');
  assert.equal(bootstrap.data.comments.jp[0].likes,0,'Ignore legacy example comment likes');
  assert.equal(bootstrap.data.posts.find(post=>post.id==='jp').likes,1,'Keep only other real user likes, excluding fabricated seed count');
  assert.equal(bootstrap.data.posts.find(post=>post.id==='kr').likes,0);
  assert.equal(bootstrap.data.postLikes.jp,true,'Own real like remains separately counted exactly once');
  const filters=calls.filter(call=>call.url.pathname==='/rest/v1/ieb_posts').map(call=>call.url.searchParams.get('country_code'));
  assert.ok(filters.includes('eq.JP')&&filters.includes('neq.JP'),'Apply country priority before feed limit');
  await request('post',{title:'제목',body:'내용',cat:'free',photos:[],countryCode:'KR',user_id:'other-user'},cookie);
  const post=calls.findLast(call=>call.method==='POST'&&call.url.pathname==='/rest/v1/ieb_posts');
  assert.equal(post.body.country_code,'JP','Post country comes from verified server-side profile');
  assert.equal(post.body.user_id,uid);
  assert.ok(!JSON.stringify(bootstrap.data).includes('test-secret'));
  console.log('PASS country signup/default/validation, own-only update, current-author badges, country-prioritized feed and server-assigned posting country');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  global.fetch=oldFetch;
  for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) {
    if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];
  }
});
