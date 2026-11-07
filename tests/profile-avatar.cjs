'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
async function imageTests(){
 let revoked=0,draw=null,canvas=null,failImage=false;
 class Image {constructor(){this.naturalWidth=800;this.naturalHeight=600;}set src(v){queueMicrotask(()=>failImage?this.onerror():this.onload());}}
 const ctx=vm.createContext({Image,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},document:{createElement(){canvas={getContext:()=>({fillRect(){},drawImage(...args){draw=args;}}),toDataURL:(mime)=>{assert.equal(mime,'image/jpeg');return 'data:image/jpeg;base64,/9j/4P/Z';}};return canvas;}}});ctx.window=ctx;
 vm.runInContext(read('js/profile-image.js'),ctx);
 const file={type:'image/png',size:1024};
 assert.equal(await ctx.IEBProfileImage.prepare(file),'data:image/jpeg;base64,/9j/4P/Z');assert.equal(canvas.width,256);assert.equal(canvas.height,256);assert.deepEqual(draw.slice(1),[100,0,600,600,0,0,256,256]);assert.equal(revoked,1);
 await assert.rejects(ctx.IEBProfileImage.prepare({type:'text/plain',size:10}),/photoInvalid/);
 await assert.rejects(ctx.IEBProfileImage.prepare({type:'image/svg\+xml',size:10}),/photoInvalid/);
 await assert.rejects(ctx.IEBProfileImage.prepare({type:'image/jpeg',size:11*1024*1024}),/photoTooLarge/);
 failImage=true;await assert.rejects(ctx.IEBProfileImage.prepare(file),/photoInvalid/);assert.equal(revoked,2);
}
async function mountTests(){
 const elements=Object.fromEntries(['profile-form','p-photo','p-bio','bio-count','p-photo-choose','p-photo-remove','p-photo-preview','profile-save'].map(id=>[id,{events:{},dataset:{},value:'',isConnected:true,addEventListener(k,fn){this.events[k]=fn;},click(){this.clicked=true;}}]));
 const tasks=[],errors=[],cleanup=[],form=elements['profile-form'],input=elements['p-photo'];
 const ctx=vm.createContext({V:{profile:{}},document:{getElementById:id=>elements[id]},cleanup,S:()=>({user:{nickname:'Tester'}}),profileAvatar:u=>u.avatarUrl||'default',toast:x=>errors.push(x),t:x=>x,IEBProfileImage:{prepare:()=>new Promise((resolve,reject)=>tasks.push({resolve,reject}))}});ctx.window=ctx;
 const app=read('js/app.js');vm.runInContext(app.slice(app.indexOf('  V.profile.mount ='),app.indexOf('  V.settings =')),ctx);ctx.V.profile.mount();
 elements['p-photo-choose'].events.click();assert.equal(input.clicked,true);
 input.files=[{}];const first=input.events.change();const second=input.events.change();tasks[0].resolve('first');await first;assert.equal(form.avatarChange,undefined,'Stale file decode cannot overwrite latest choice');tasks[1].resolve('second');await second;assert.equal(form.avatarChange,'second');assert.equal(elements['p-photo-preview'].innerHTML,'second');assert.equal(elements['profile-save'].disabled,false);
 elements['p-photo-remove'].events.click();assert.equal(form.avatarChange,null);assert.equal(elements['p-photo-preview'].innerHTML,'default');
 const failed=input.events.change();tasks[2].reject(new Error('profile.photoInvalid'));await failed;assert.equal(form.avatarChange,null);assert.equal(errors[0],'profile.photoInvalid');assert.equal(elements['profile-save'].disabled,false);
 const pending=input.events.change();cleanup.forEach(fn=>fn());tasks[3].resolve('after-navigation');await pending;assert.equal(form.avatarChange,null,'Leaving edit screen ignores late decode');
}
async function apiTests(){
 const handler=require('../api/service.js'),originalFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',SUPABASE_SECRET_KEY:'secret-test'});
 const uid='11111111-1111-4111-8111-111111111111',profile={id:uid,nickname:'Tester',username:'tester',bio:'',country_code:'KR',area:8,created_at:'2026-11-06T00:00:00Z',avatar_path:null};
 const objects=new Map(),calls=[];let failPatch=false,failUpload=false;
 global.fetch=async(url,opts={})=>{
  const u=new URL(url),raw=Buffer.isBuffer(opts.body),body=opts.body&&!raw?JSON.parse(opts.body):opts.body;calls.push({path:u.pathname,method:opts.method,body,headers:opts.headers});const reply=(d,status=200)=>new Response(JSON.stringify(d),{status});
  if(u.pathname==='/auth/v1/user')return opts.headers.Authorization?reply({id:uid}):reply({},401);
  if(u.pathname==='/auth/v1/logout'||u.pathname==='/auth/v1/admin/users/'+uid)return reply({});
  if(u.pathname==='/rest/v1/ieb_profiles'){if(opts.method==='PATCH'){if(failPatch)return reply({code:'42501'},403);assert.equal(u.searchParams.get('id'),'eq.'+uid);Object.assign(profile,body);return reply(null);}return reply([profile]);}
  if(['/rest/v1/ieb_posts','/rest/v1/ieb_comments','/rest/v1/ieb_foods','/rest/v1/ieb_restaurant','/rest/v1/ieb_preferences'].includes(u.pathname))return reply([]);
  if(u.pathname==='/storage/v1/object/ieb-avatars'&&opts.method==='DELETE'){body.prefixes.forEach(key=>objects.delete(key));return reply({});}
  if(u.pathname.startsWith('/storage/v1/object/ieb-avatars/')&&opts.method==='POST'){const key=u.pathname.split('/ieb-avatars/')[1];assert.ok(key.startsWith(uid+'/'));assert.equal(opts.headers.apikey,'public-test');assert.equal(opts.headers.Authorization,'Bearer verified');assert.equal(opts.headers['x-upsert'],'false');assert.equal(opts.headers['Content-Type'],'image/jpeg');objects.set(key,body);return failUpload?reply({code:'storage_unavailable'},500):reply({Key:key});}
  if(u.pathname.startsWith('/storage/v1/object/sign/ieb-avatars/'))return reply({signedURL:'/object/sign/ieb-avatars/'+profile.avatar_path+'?token=signed-fixture'});
  if(u.pathname.startsWith('/storage/v1/object/list/'))return reply(u.pathname.endsWith('/ieb-avatars')?[...objects.keys()].map(key=>({name:key.split('/')[1]})):[]);
  throw Error('Unexpected path '+u.pathname);
 };
 async function request(action,body,cookie='ieb_access=verified'){const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.data=JSON.parse(v);}};await handler({url:'/api/service?action='+action,method:body===undefined?'GET':'POST',body,headers:{host:'test.local',origin:'https://test.local',cookie,'content-type':'application/json'}},res);return{status:res.statusCode,data:res.data,headers:res.headers};}
 const base={nickname:'Tester',bio:'소개',countryCode:'JP'},jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,255,217]).toString('base64');
 try{
  assert.equal((await request('profile',{...base,avatar:jpeg},'')).status,401);
  for(const invalid of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,AAAA',123,'x'.repeat(350001)])assert.equal((await request('profile',{...base,avatar:invalid})).status,400);
  assert.equal(objects.size,0);
  assert.equal((await request('profile',{...base,user_id:'forged',avatar:jpeg})).status,200);const first=profile.avatar_path;assert.match(first,new RegExp('^'+uid+'/[a-f0-9-]{36}\\.jpg$'));assert.equal(objects.size,1);
  const saved=await request('bootstrap');assert.equal(saved.status,200);assert.ok(saved.data.user.avatarUrl.includes(first));assert.ok(!Object.hasOwn(saved.data.user,'avatar_path'));assert.equal(saved.data.user.countryCode,'JP');
  assert.equal((await request('profile',{...base,avatar_path:'forged/path.jpg'})).status,200);assert.equal(profile.avatar_path,first,'Omitted avatar preserves existing photo; client path injection ignored');
  assert.equal((await request('profile',{...base,avatar:jpeg})).status,200);assert.notEqual(profile.avatar_path,first);assert.equal(objects.has(first),false);assert.equal(objects.size,1);
  const second=profile.avatar_path;failUpload=true;assert.equal((await request('profile',{...base,avatar:jpeg})).status,502);assert.equal(profile.avatar_path,second);assert.equal(objects.size,1,'Unacknowledged upload cleaned after upstream failure');failUpload=false;failPatch=true;assert.equal((await request('profile',{...base,avatar:jpeg})).status,403);assert.equal(profile.avatar_path,second);assert.equal(objects.size,1,'New upload cleaned after failed profile save');failPatch=false;
  assert.equal((await request('profile',{...base,avatar:null})).status,200);assert.equal(profile.avatar_path,null);assert.equal(objects.size,0);assert.equal((await request('bootstrap')).data.user.avatarUrl,'');
  await request('profile',{...base,avatar:jpeg});assert.equal(objects.size,1);assert.equal((await request('deleteAccount',{})).status,200);assert.equal(objects.size,0,'Account removal cleans avatar bucket');
  assert.ok(!JSON.stringify(saved.data).includes('secret-test'));
 }finally{global.fetch=originalFetch;for(const k of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']){if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}}
}
(async()=>{await imageTests();await mountTests();await apiTests();console.log('PASS local square preview/compression, file validation, stale decode guards, authenticated avatar upload, signed reload, replace/remove, failed-save cleanup, path spoof rejection and account cleanup');})().catch(e=>{console.error(e);process.exitCode=1;});
