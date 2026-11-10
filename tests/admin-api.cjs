'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/service.js');
const originalFetch=global.fetch,env={...process.env};
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'secret-test'});
let admin=false,spoof=false,conflict=false,requests=[];
const food={id:'food-one',name:'음식',summary:'설명',category:'국밥',image_asset:'food.jpg',updated_at:'2026-11-10T01:00:00Z',content:{ko:{name:'음식',summary:'설명'},en:{summary:'Description'},manuscript:{introduction:'음식 소개'},places:[],catalogStatus:'active'}};
global.fetch=async(url,options={})=>{
  const u=new URL(url);requests.push({u,options,body:options.body&&JSON.parse(options.body)});
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
  if(u.pathname==='/auth/v1/user')return reply({id:'11111111-1111-4111-8111-111111111111',email:'admin@accounts.ieatbusan.invalid',app_metadata:{ieatbusan_admin:admin},user_metadata:spoof?{ieatbusan_admin:true}:{}});
  if(u.pathname==='/rest/v1/ieb_foods'){
    assert.equal(options.headers.apikey,'secret-test');
    if(options.method==='PATCH')return reply(conflict?[]:[{id:food.id}]);
    return reply(u.searchParams.has('id')?[structuredClone(food)]:Array.from({length:51},(_,i)=>({id:'food-'+i,name:'음식 '+i})));
  }
  if(u.pathname==='/rest/v1/ieb_posts')return reply(options.method==='DELETE'?[{id:'p1'}]:[{id:'p1',title:'Title',body:'Post body',photos:[]}]);
  if(u.pathname==='/rest/v1/ieb_comments')return reply(options.method==='DELETE'?[{id:'c1'}]:[{id:'c1',body:'Comment'}]);
  if(u.pathname==='/rest/v1/ieb_restaurant')return reply([{id:'r1',name:'식당',updated_at:food.updated_at}]);
  throw Error('Unexpected request '+url);
};
async function request(action,body={},cookie='ieb_access=verified',origin='https://site.test'){
  const res={setHeader(){},end(value){this.body=JSON.parse(value);}};
  await handler({url:'/api/service?action='+action,method:'POST',body,headers:{host:'site.test',origin,cookie,'content-type':'application/json'}},res);
  return res;
}
(async()=>{
  assert.equal((await request('adminSession',{},'')).statusCode,401);
  for(const action of ['adminSession','adminList','adminGet','adminSave','adminDelete','adminRestore']){
    requests=[];assert.equal((await request(action,{kind:'foods',id:'food-one'})).statusCode,403);
    assert.equal(requests.filter(r=>r.u.pathname.startsWith('/rest/')).length,0,'Non-admin rejected before privileged DB calls');
  }
  spoof=true;assert.equal((await request('adminSession')).statusCode,403,'User metadata cannot grant administration');spoof=false;
  admin=true;assert.equal((await request('adminSession')).body.username,'admin');
  assert.equal((await request('adminSave',{},undefined,'https://evil.test')).statusCode,403,'CSRF protected');
  assert.equal((await request('adminList',{kind:'auth.users'})).statusCode,400);
  assert.equal((await request('adminList',{kind:'constructor'})).statusCode,400);
  const list=await request('adminList',{kind:'foods',page:0,search:'돼지,or=(id.neq.x)'});assert.equal(list.statusCode,200);assert.equal(list.body.rows.length,50);assert.equal(list.body.hasNext,true);
  assert.ok(!requests.at(-1).u.search.includes('or='),'Search cannot inject filters');
  assert.equal((await request('adminGet',{kind:'foods',id:'x&id=neq.other'})).statusCode,400);
  const base={kind:'foods',id:'food-one',version:food.updated_at};
  assert.equal((await request('adminSave',{...base,version:'old',patch:{name:'변경'}})).statusCode,409);
  assert.equal((await request('adminSave',{...base,patch:{liked_user_ids:[]}})).statusCode,400);
  assert.equal((await request('adminSave',{...base,patch:{image_asset:'../secret.svg'}})).statusCode,400);
  assert.equal((await request('adminSave',{...base,patch:{name:'변경'},contentChanges:[{path:['ko','__proto__','admin'],value:'yes'}]})).statusCode,400);
  assert.equal((await request('adminSave',{...base,patch:{name:'변경'},contentChanges:[{path:['ko','summary'],value:'<script>alert(1)</script>'}]})).statusCode,400);
  const saved=await request('adminSave',{...base,patch:{name:'변경',summary:'새 설명'},contentChanges:[{path:['manuscript','introduction'],value:'새 소개'},{path:['en','summary'],value:'Updated description'}]});
  assert.equal(saved.statusCode,200);let write=requests.at(-1);assert.equal(write.options.method,'PATCH');assert.equal(write.body.content.manuscript.introduction,'새 소개');assert.equal(write.body.content.editorSummaries.en,'Updated description');assert.deepEqual(write.body.content.places,[]);assert.equal(write.u.searchParams.get('updated_at'),'eq.'+food.updated_at);
  conflict=true;assert.equal((await request('adminSave',{...base,patch:{summary:'경쟁'}})).statusCode,409);conflict=false;
  assert.equal((await request('adminDelete',base)).statusCode,200);assert.equal(requests.at(-1).body.content.catalogStatus,'archived');assert.equal(requests.at(-1).options.method,'PATCH');
  assert.equal((await request('adminRestore',base)).statusCode,200);assert.equal(requests.at(-1).body.content.catalogStatus,'active');
  assert.equal((await request('adminDelete',{kind:'posts',id:'p1',originalBody:'Post body',originalTitle:'Title'})).statusCode,200);assert.equal(requests.at(-1).options.method,'DELETE');
  assert.equal((await request('adminDelete',{kind:'comments',id:'c1',originalBody:'Comment'})).statusCode,200);
  assert.equal((await request('adminDelete',{kind:'restaurants',id:'r1',version:food.updated_at})).statusCode,400,'Restaurant links cannot be orphaned by deletion');
  admin=false;assert.equal((await request('adminDelete',base)).statusCode,403,'Revoked roles are checked on every request');
  console.log('PASS admin authentication, user-metadata spoof denial, CSRF, table/column/path allowlists, pagination, text edits, concurrency conflicts, archive/restore, moderation deletes, role revocation');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}});
