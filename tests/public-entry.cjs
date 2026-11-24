'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
let state={user:null,guest:false},rendered=null;
const redirects=[];
const ctx=vm.createContext({syncFoodCatalog:()=>{},postById:()=>null,
  writeHasUnsaved:()=>false,
  IEBWriteLeaveGuard:{create:()=>({intercept:()=>false,commit(){}})},
  S:()=>state,lang:()=> 'ko',loggedIn:()=>!!state.user,
  location:{hash:'',replace(href){redirects.push(href);}},
  app:{querySelector:()=>null},document:{documentElement:{}},
  V:new Proxy({}, {get:(_,name)=>()=>{rendered=name;return '<main></main>';}}),
  esc:String,t:key=>key,icon:()=>'',hasUnread:()=>true,toast(){},
});ctx.window=ctx;ctx.scrollTo=()=>{};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/map/map-routes.js'),'utf8'),ctx);
vm.runInContext(source.slice(source.indexOf('  const ROUTES ='),source.indexOf('  function back(')),ctx);
vm.runInContext(source.slice(source.indexOf('  function appHeader()'),source.indexOf('  function pageHeader(')),ctx);
ctx.route();
assert.equal(rendered,'home','Fresh visitors must see home without opting into guest mode');
assert.equal(redirects.length,0);
ctx.location.hash='#/chatbot';ctx.route();assert.equal(rendered,'chatbot','Chatbot has a public mobile page route');
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
ctx.Store={set:patch=>Object.assign(state,patch)};
ctx.go=href=>{redirects.push(href);ctx.location.hash=href;ctx.route();};
vm.runInContext(source.slice(source.indexOf('  function requireLogin()'),source.indexOf('  const go =')),ctx);
vm.runInContext('const browseActions = {\n'+source.slice(source.indexOf('    guest: () => {'),source.indexOf('    sort: () =>'))+'}; stack.length=0; browseActions.confirmLang();',ctx);
assert.equal(redirects.at(-1),'#/home','Language selection must not force anonymous visitors into login');
for(const [hash,view] of [['#/post/example-post','post'],['#/food/milmyeon','food'],['#/place/milmyeon/2','place'],['#/community/latest','community']]){
  for(const langChosen of [true,false]){
    state={user:null,guest:false,langChosen};
    ctx.go(hash);
    assert.equal(ctx.requireLogin(),false);
    assert.equal(rendered,'login');
    vm.runInContext('browseActions.guest()',ctx);
    if(!langChosen){
      assert.equal(rendered,'lang');
      vm.runInContext('browseActions.confirmLang()',ctx);
    }
    assert.equal(ctx.location.hash,hash);
    assert.equal(rendered,view);
    assert.equal(state.guest,true);
  }
}
ctx.go('#/post/example-post');
ctx.requireLogin();
ctx.go('#/map');
ctx.go('#/login');
vm.runInContext('browseActions.guest()',ctx);
assert.equal(ctx.location.hash,'#/home','An unrelated login must not reuse an abandoned return destination');
console.log('PASS public entry, protected routes, guest return to original page with and without language selection, and direct login fallback');
