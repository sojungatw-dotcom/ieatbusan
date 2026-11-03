'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
(async()=>{
 const view=vm.createContext({});view.window=view;vm.runInContext(read('js/i18n.js'),view);
 let language='ko';view.t=key=>view.I18N[language][key];view.esc=String;view.icon=()=>'';
 const source=read('js/app.js');vm.runInContext(source.slice(source.indexOf('  const V = {};'),source.indexOf('  V.lang =')),view);
 for(language of ['ko','en','zh','ja'])for(const screen of ['login','signup']){
   const html=vm.runInContext(`V.${screen}()`,view);assert.equal((html.match(/<input /g)||[]).length,2);assert.ok(!html.includes('undefined'));
 }
 const storage=new Map([['ieatbusan.v1',JSON.stringify({user:{nickname:'legacy'},accounts:[{id:'old-id',hash:'old-hash'}]})]]);
 const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 let loggedIn=false,prefs={savedFoods:['milmyeon']};const calls=[];
 const ctx=vm.createContext({localStorage,SEED:{posts:[]},CustomEvent:class{constructor(type,props){this.type=type;this.detail=props?.detail;}}});ctx.window=ctx;ctx.dispatchEvent=()=>{};
 ctx.Cloud={call:async(action,data)=>{
  calls.push({action,data});
  if(action==='signup')return {username:data.username};
  if(action==='login'){loggedIn=true;return {signedIn:true};}
  if(action==='logout'||action==='deleteAccount'){loggedIn=false;return {};}
  if(action==='preferences'){prefs=data.data;return {saved:true};}
  if(action==='bootstrap')return {user:loggedIn?{id:'uuid-one',username:'tester',nickname:'PrivateNickname'}:null,
    preferences:loggedIn?prefs:{},posts:[{id:'post-one',title:'PrivatePostTitle',photos:[],mine:loggedIn}],comments:{},postLikes:{}};
 }};
 vm.runInContext(read('js/store.js'),ctx);vm.runInContext(read('js/auth.js'),ctx);
 assert.equal(ctx.Store.get().user,null,'Legacy local accounts must not authorize a Supabase session');
 await ctx.Auth.register('tester','only-a-test-password');
 assert.equal(await ctx.Auth.verify('TESTER','only-a-test-password'),'tester');
 await ctx.Store.signIn();assert.equal(ctx.Store.get().user.id,'uuid-one');assert.equal(ctx.Store.get().savedFoods[0],'milmyeon');
 ctx.Store.update(s=>{s.savedFoods=['dwaeji-gukbap'];});await ctx.Store.flush();assert.equal(prefs.savedFoods[0],'dwaeji-gukbap');
 const written=storage.get('ieatbusan.ui.v2');
 for(const privateValue of ['PrivateNickname','PrivatePostTitle','only-a-test-password','uuid-one','dwaeji-gukbap'])assert.ok(!written.includes(privateValue));
 assert.ok(!Object.hasOwn(prefs,'user')&&!Object.hasOwn(prefs,'posts'));
 await ctx.Store.signOut();assert.equal(ctx.Store.get().user,null);assert.equal(ctx.Store.get().savedFoods.length,0);
 await ctx.Auth.verify('tester','only-a-test-password');await ctx.Store.signIn();assert.equal(ctx.Store.get().savedFoods[0],'dwaeji-gukbap');
 await ctx.Store.removeCurrentAccount();assert.equal(ctx.Store.get().user,null);
 assert.ok(storage.has('ieatbusan.v1'),'Keep non-account prototype data');
 const legacy=JSON.parse(storage.get('ieatbusan.v1'));
 assert.ok(!Object.hasOwn(legacy,'accounts')&&!Object.hasOwn(legacy,'user'),'Remove legacy local accounts and cached identity');
 console.log('PASS two-input auth screens, server auth calls, verified-session hydration, DB preference writes, no local account/post/token persistence, logout/relogin and legacy preservation');
})().catch(error=>{console.error(error);process.exitCode=1;});
