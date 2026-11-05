'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
let state={user:null,guest:false},rendered=null;
const redirects=[];
const ctx=vm.createContext({
  S:()=>state,lang:()=> 'ko',loggedIn:()=>!!state.user,
  location:{hash:'',replace(href){redirects.push(href);}},
  app:{querySelector:()=>null},document:{documentElement:{}},
  V:new Proxy({}, {get:(_,name)=>()=>{rendered=name;return '<main></main>';}}),
  esc:String,t:key=>key,icon:()=>'',hasUnread:()=>true,
});ctx.window=ctx;ctx.scrollTo=()=>{};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/map/map-routes.js'),'utf8'),ctx);
vm.runInContext(source.slice(source.indexOf('  const ROUTES ='),source.indexOf('  function back(')),ctx);
vm.runInContext(source.slice(source.indexOf('  function appHeader()'),source.indexOf('  function pageHeader(')),ctx);
ctx.route();
assert.equal(rendered,'home','Fresh visitors must see home without opting into guest mode');
assert.equal(redirects.length,0);
for(const hash of ['#/map','#/community','#/my','#/food/milmyeon']){
  ctx.location.hash=hash;ctx.route();assert.equal(redirects.length,0,'Public page cannot require login: '+hash);
}
assert.ok(ctx.appHeader().includes('href="#/login"'));
state.guest=true;ctx.location.hash='#/login';ctx.route();
assert.equal(rendered,'login','A browsing visitor can open login directly');
assert.equal(redirects.length,0);
for(const hash of ['#/write','#/profile','#/settings/privacy','#/my/posts','#/my/comments','#/my/recent']){
  ctx.location.hash=hash;ctx.route();assert.equal(redirects.at(-1),'#/login','Member page stays protected: '+hash);
}
state.user={id:'u1'};
assert.ok(!ctx.appHeader().includes('href="#/login"'),'Signed-in header must not show login');
ctx.location.hash='#/write';ctx.route();assert.equal(rendered,'write');
state={user:null,guest:false};
ctx.Store={set:patch=>Object.assign(state,patch)};ctx.go=href=>redirects.push(href);
vm.runInContext('stack.length=0; const confirmLanguage='+source.match(/    confirmLang: (.+),\r?\n/)[1]+'; confirmLanguage();',ctx);
assert.equal(redirects.at(-1),'#/home','Language selection must not force anonymous visitors into login');
console.log('PASS home-first public entry, header login, explicit guest login and member-only route protection');
