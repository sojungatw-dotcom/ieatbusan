'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const handler=require('../api/service.js'),oldFetch=global.fetch,oldEnv={...process.env};
Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'secret-test'});
let rows=structuredClone(require('../supabase/support-seed.json')).map(row=>({...row,updated_at:'2026-11-16T00:00:00.000Z'}));
let admin=false,spoof=false,race=false;const writes=[];
global.fetch=async(url,options={})=>{
 const u=new URL(url),reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
 if(u.pathname==='/auth/v1/user')return reply({id:'user',app_metadata:{ieatbusan_admin:admin},user_metadata:{ieatbusan_admin:spoof}});
 if(u.pathname==='/rest/v1/ieb_support_content'){
  let result=rows;
  for(const field of ['id','kind','published','updated_at'])if(u.searchParams.has(field)){const value=u.searchParams.get(field).slice(3);result=result.filter(row=>String(row[field])===value);}
  if(options.headers.apikey!=='secret-test')result=result.filter(row=>row.published);
  if(options.method==='POST'){const body=JSON.parse(options.body);writes.push(body);rows.push({...body,updated_at:'2026-11-16T01:00:00.000Z'});return reply([]);}
  if(options.method==='PATCH'){assert.equal(options.headers.apikey,'secret-test');if(race)return reply([]);const patch=JSON.parse(options.body);writes.push(patch);result.forEach(row=>Object.assign(row,patch,{updated_at:'2026-11-16T02:00:00.000Z'}));return reply(result.map(row=>({id:row.id})));}
  if(options.method==='DELETE'){rows=rows.filter(row=>!result.includes(row));return reply(result.map(row=>({id:row.id})));}
  return reply(structuredClone(result));
 }
 if(u.pathname==='/rest/v1/ieb_profiles'||u.pathname==='/rest/v1/ieb_preferences'||u.pathname==='/rest/v1/ieb_posts'||u.pathname==='/rest/v1/ieb_comments'||u.pathname==='/rest/v1/ieb_foods'||u.pathname==='/rest/v1/ieb_restaurant')return reply([]);
 throw Error('Unexpected endpoint '+url);
};
async function request(action,body,cookie='ieb_access=valid',origin='https://test.site'){
 const res={setHeader(){},end(text){this.data=JSON.parse(text);}};
 await handler({url:'/api/service?action='+action,method:body===undefined?'GET':'POST',body,headers:{host:'test.site',origin,cookie,'content-type':'application/json'}},res);return res;
}
const patch=extra=>({translations:{ko:{title:'새 질문',body:'새 답변'},en:{title:'New question',body:'New answer'}},published:true,display_order:2,notice_date:null,contact_email:'',...extra});
(async()=>{
 for(const action of ['adminList','adminGet','adminCreate','adminSave','adminDelete'])assert.equal((await request(action,{kind:'faq',id:'faq-seed-0',patch:patch()})).statusCode,403);
 spoof=true;assert.equal((await request('adminCreate',{kind:'faq',patch:patch()})).statusCode,403);spoof=false;
 assert.equal((await request('adminList',{kind:'faq'},'')).statusCode,401);
 admin=true;
 assert.equal((await request('adminCreate',{kind:'faq',patch:patch()},undefined,'https://evil.site')).statusCode,403);
 const created=await request('adminCreate',{kind:'faq',patch:patch({published:false})});assert.equal(created.statusCode,200);const id=created.data.id;
 let bootstrap=await request('bootstrap',undefined,'');assert.equal(bootstrap.statusCode,200);assert.ok(!bootstrap.data.support.faq.some(row=>row.id===id),'Drafts are not exposed');
 const fetched=await request('adminGet',{kind:'faq',id});assert.equal(fetched.statusCode,200);
 const version=fetched.data.row.updated_at;
 assert.equal((await request('adminSave',{kind:'faq',id,version:'stale',patch:patch()})).statusCode,409);
 race=true;assert.equal((await request('adminSave',{kind:'faq',id,version,patch:patch()})).statusCode,409);race=false;
 const saved=await request('adminSave',{kind:'faq',id,version,patch:patch()});assert.equal(saved.statusCode,200);
 bootstrap=await request('bootstrap',undefined,'');assert.ok(bootstrap.data.support.faq.some(row=>row.id===id&&row.translations.en.body==='New answer'));
 for(const bad of [patch({display_order:-1}),patch({translations:{ko:{title:'',body:'x'}}}),patch({translations:{ko:{title:'x',body:'x'},xx:{title:'x',body:'x'}}}),patch({is_admin:true})])assert.equal((await request('adminCreate',{kind:'faq',patch:bad})).statusCode,400);
 assert.equal((await request('adminCreate',{kind:'notices',patch:patch({notice_date:'2026-02-31'})})).statusCode,400);
 assert.equal((await request('adminCreate',{kind:'notices',patch:patch({notice_date:'2026-11-16'})})).statusCode,200);
 assert.equal((await request('adminCreate',{kind:'support',patch:{}})).statusCode,400);
 const settings=rows.find(row=>row.kind==='settings'),settingsPatch={translations:structuredClone(settings.translations),published:true,display_order:0,notice_date:null,contact_email:'team@example.com'};
 settingsPatch.translations.ko.faqLabel='질문과 답변';settingsPatch.translations.ko.contactDescription='문의사항은 이메일로 보내주세요.';
 assert.equal((await request('adminSave',{kind:'support',id:settings.id,version:settings.updated_at,patch:{...settingsPatch,contact_email:'x@example.com\r\nBcc:bad'}})).statusCode,400);
 assert.equal((await request('adminDelete',{kind:'support',id:settings.id,version:settings.updated_at})).statusCode,400);
 assert.equal((await request('adminSave',{kind:'support',id:settings.id,version:settings.updated_at,patch:settingsPatch})).statusCode,200);
 const published=(await request('bootstrap',undefined,'')).data.support;
 assert.equal(published.settings.contact_email,'team@example.com');assert.equal(published.settings.translations.ko.faqLabel,'질문과 답변');
 const latest=rows.find(row=>row.id===id);assert.equal((await request('adminDelete',{kind:'faq',id,version:latest.updated_at})).statusCode,200);
 assert.ok(!(await request('bootstrap',undefined,'')).data.support.faq.some(row=>row.id===id));
 // Render production views from the existing locale fixture, using live-shaped data.
 let harness=fs.readFileSync(path.join(__dirname,'i18n.cjs'),'utf8').split('const keys=Object.keys')[0];
 const viewTest=`\nstate.support=${JSON.stringify(published)};ctx.Store.isPending=()=>false;for(const language of ['ko','en','zh','ja']){state.lang=language;const settings=ctx.IEBSupport.localize(state.support.settings,language);assert.ok(V.contact().includes('mailto:team@example.com'));assert.ok(V.my().includes(settings.faqLabel));assert.ok(V.contact().includes(settings.contactDescription));for(const n of state.support.notices)assert.ok(V.notices().includes(ctx.localeTest.esc(ctx.IEBSupport.localize(n,language).body)));}state.lang='ko';state.support.notices=[];state.support.faq=[];assert.ok(V.notices().includes(t('support.emptyNotices')));assert.ok(V.faq().includes(t('support.emptyFaq')));state.support.notices=[{translations:{ko:{title:'<script>',body:'<img onerror=alert(1)>'}},notice_date:'2026-11-16'}];assert.ok(V.notices().includes('&lt;script&gt;'));assert.ok(!V.notices().includes('<img onerror'));`;
 const Module=require('node:module'),fixture=new Module(__filename,module);fixture.filename=__filename;fixture.paths=module.paths;fixture._compile(harness+viewTest,__filename);
 const formCtx={window:{}};vm.createContext(formCtx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/admin-support.js'),'utf8'),formCtx);
 const formHtml=formCtx.window.IEBAdminSupport.form(settings,'support');assert.ok(formHtml.includes('name="contact_email"'));assert.ok(formHtml.includes('support-ko-faqLabel'));assert.ok(!formHtml.includes('id="delete"'));
 console.log('PASS support CRUD, verified admin only, CSRF, unpublished isolation, email validation, setting singleton, conflict detection, KO/EN/ZH/JA public views, menu updates, no fallback resurrection and escaped text');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=oldFetch;for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']){if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];}});
