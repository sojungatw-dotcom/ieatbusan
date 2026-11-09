'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const handler=require('../api/service.js'),originalFetch=global.fetch,oldEnv={...process.env};
const uid='11111111-1111-4111-8111-111111111111';
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-key'});
let foreign=false,failRequest=false;
const calls=[];
global.fetch=async(url,options={})=>{
  const parsed=new URL(url),body=options.body&&JSON.parse(options.body);
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
  if(parsed.pathname==='/auth/v1/user')return reply({id:uid});
  if(parsed.pathname==='/rest/v1/ieb_comments'){
    calls.push({parsed,options,body});
    assert.equal(parsed.searchParams.get('user_id'),'eq.'+uid,'Server derives ownership from verified session');
    assert.equal(parsed.searchParams.get('post_id'),'eq.p1');
    assert.equal(options.headers.Authorization,'Bearer verified');
    assert.equal(options.headers.apikey,'test-key','User token, not admin privileges');
    if(failRequest)return reply({},500);
    if(foreign)return reply([]);
    return reply([{id:'c1',body:body?.body||'Original'}]);
  }
  throw new Error('Unexpected endpoint '+url);
};
async function request(action,body,cookie='ieb_access=verified'){
  const res={setHeader(){},end(text){this.data=JSON.parse(text);}};
  await handler({url:'/api/service?action='+action,method:'POST',body,headers:{host:'site.test',origin:'https://site.test',cookie,'content-type':'application/json'}},res);
  return res;
}
(async()=>{
  assert.equal((await request('editComment',{id:'c1',postId:'p1',text:'Edit'},'')).statusCode,401);
  for(const text of ['', '   ', 'x'.repeat(301)])assert.equal((await request('editComment',{id:'c1',postId:'p1',text})).statusCode,400);
  const edit=await request('editComment',{id:'c1',postId:'p1',text:' Updated ',user_id:'forged'});
  assert.equal(edit.statusCode,200);assert.equal(edit.data.text,'Updated');
  assert.deepEqual(calls.at(-1).body,{body:'Updated'});
  foreign=true;
  for(const action of ['editComment','deleteComment'])assert.equal((await request(action,{id:'c1',postId:'p1',text:'Edit'})).statusCode,403);
  foreign=false;
  assert.equal((await request('deleteComment',{id:'c1',postId:'p1'})).statusCode,200);
  const state={user:{id:uid},comments:{p1:[{id:'c1',text:'Original',mine:true},{id:'other',text:'Other',mine:false}]}};
  const ctx=vm.createContext({location:{protocol:'http:'},Store:{get:()=>state,mutate:async(key,apply,send,reconcile,rollback)=>{
    apply(state);try{const result=await send();reconcile?.(state,result);return result;}catch(error){rollback(state);throw error;}
  }},fetch:async(url,opts)=>{
    const res=await request(new URL(url,'https://site.test').searchParams.get('action'),JSON.parse(opts.body));
    return {ok:res.statusCode===200,json:async()=>res.data};
  }});ctx.window=ctx;
  vm.runInContext(fs.readFileSync('js/cloud.js','utf8'),ctx);
  await ctx.Cloud.editComment('p1','c1','Saved');assert.equal(state.comments.p1[0].text,'Saved');
  failRequest=true;await assert.rejects(ctx.Cloud.editComment('p1','c1','Failure'));assert.equal(state.comments.p1[0].text,'Saved','Failed edit rolls back');
  await assert.rejects(ctx.Cloud.deleteComment('p1','c1'));assert.equal(state.comments.p1[0].id,'c1','Failed delete restores comment');failRequest=false;
  let confirms=0,allow=false,deletes=0;
  Object.assign(ctx,{ownComment:(pid,id)=>state.comments[pid].find(c=>c.id===id&&c.mine),Store:{...ctx.Store,isPending:()=>false},confirm:()=>{confirms++;return allow;},t:key=>key,toast(){}});
  const cloudDelete=ctx.Cloud.deleteComment.bind(ctx.Cloud);ctx.Cloud.deleteComment=(...args)=>{deletes++;return cloudDelete(...args);};
  const app=fs.readFileSync('js/app.js','utf8');
  const action=app.slice(app.indexOf('    deleteComment: async el => {'),app.indexOf('    deletePost: async el => {'));
  vm.runInContext('window.actions={'+action+'};',ctx);
  await ctx.actions.deleteComment({dataset:{postId:'p1',id:'other'}});assert.equal(confirms,0);assert.equal(deletes,0);
  await ctx.actions.deleteComment({dataset:{postId:'p1',id:'c1'}});assert.equal(confirms,1);assert.equal(deletes,0,'Cancel never calls API');
  allow=true;await ctx.actions.deleteComment({dataset:{postId:'p1',id:'c1'}});assert.equal(confirms,2);assert.equal(deletes,1);assert.equal(state.comments.p1.length,1);
  // Render production views with existing locale fixture and owner/foreign comments.
  const harness=fs.readFileSync('tests/i18n.cjs','utf8').split('const keys=Object.keys')[0].replace('window.localeTest={V,t,appHeader,tabbar,syncFoodCatalog,homeFoodCard,foodRow,esc};','window.localeTest={V,t,appHeader,tabbar,syncFoodCatalog,homeFoodCard,foodRow,esc};');
  const renderTest=`\nctx.Store.isPending=()=>false;state.user={id:'member'};state.posts=[{id:'p1',title:'Test',body:'Body',author:'Author',createdAt:Date.now(),cat:'free',photos:[]}];state.comments.p1=[{id:'own',author:'Me',text:'<unsafe>',mine:true,createdAt:1},{id:'foreign',author:'Other',text:'Other',mine:false,createdAt:2}];state.lang='ko';let html=V.post({id:'p1'});assert.equal((html.match(/data-act="editComment"/g)||[]).length,1);assert.equal((html.match(/data-act="deleteComment"/g)||[]).length,1);assert.ok(html.includes('&lt;unsafe&gt;'));state.user=null;html=V.post({id:'p1'});assert.ok(!html.includes('data-act="editComment"'));`;
  // Compile the fixture as a test module so its relative paths keep pointing at tests/.
  const Module=require('node:module'),fixture=new Module(__filename,module);fixture.filename=__filename;fixture.paths=module.paths;fixture._compile(harness+renderTest,__filename);
  console.log('PASS comment validation, session ownership, restricted patch, edit/delete rollback, owner-only controls, escaped text, cancel/confirm deletion');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY']){if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];}});
