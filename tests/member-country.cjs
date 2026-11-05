'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = file => fs.readFileSync(path.join(root, file), 'utf8');
const countries = require('../js/countries.js');
assert.equal(countries.codes.length, 249);
assert.equal(new Set(countries.codes).size, 249);
assert.equal(countries.normalize(), 'KR');
assert.equal(countries.isValid('JP'), true);
assert.equal(countries.isValid('ZZ'), false);
assert.equal(countries.name('KR', 'ko'), '대한민국');
for (const lang of ['ko','en','zh','ja']) {
  assert.equal(countries.list(lang)[0].code, 'KR');
  assert.ok(countries.list(lang).every(item => item.name && item.name !== item.code));
}
let state = {lang:'ko',langChosen:true,user:null,guest:true,posts:[],comments:{},postLikes:{},recentFoods:[],savedFoods:[],savedPlaces:[],settings:{}};
const calls = [], element = {classList:{add(){}},addEventListener(){},querySelector(){return null;}};
const ctx = vm.createContext({console, URL, Promise, Intl,
  document:{getElementById:()=>element,documentElement:{lang:'ko'},addEventListener(){}},
  navigator:{language:'ko'},location:{hash:'#/signup',replace(value){this.hash=value;}},history:{back(){}},
  setTimeout:()=>1,clearTimeout(){},scrollTo(){},addEventListener(){},
  Store:{get:()=>state,set:patch=>Object.assign(state,patch),load:()=>new Promise(()=>{}),update:fn=>fn(state)},
});ctx.window=ctx;
for (const [, src] of read('index.html').matchAll(/<script src="([^"]+)"/g)) {
  const file=src.split('?')[0];
  if (['js/store.js','js/cloud.js','js/auth.js','js/app.js'].includes(file)) continue;
  vm.runInContext(read(file),ctx,{filename:file});
}
ctx.Auth={register:async(...args)=>calls.push(['register',...args])};
ctx.Cloud={country:async(code)=>calls.push(['country',code])};
vm.runInContext(read('js/app.js').replace(/\}\)\(\);\s*$/, 'window.memberTest={V,submitForm};})();'),ctx);
const {V,submitForm}=ctx.memberTest;
for (const lang of ['ko','en','zh','ja']) {
  state.lang=lang;
  const html=V.signup();
  assert.ok(html.includes('name="countryCode"'));
  assert.ok(html.includes('value="KR" selected'));
  assert.ok(!/undefined|NaN/.test(html));
  assert.ok(!V.login().includes('name="countryCode"'));
}
state.lang='ko';
assert.ok(V.signup().includes('>대한민국</option>'));
assert.ok(!V.my().includes('href="#/my/posts"'), 'Guests must not see activity links');
for (const view of ['myPosts','myComments','myRecent','accountPrivacy']) {
  assert.ok(V[view]().includes('data-form="login"'), 'Direct guest route must require login: '+view);
}
state.user={id:'u1',nickname:'회원',username:'member',countryCode:'JP',area:8,joined:'2026.11.05'};
assert.ok(V.my().includes('country-badge'));
assert.ok(V.my().includes('>JP</span>'));
assert.ok(V.my().includes('href="#/my/posts"'));
assert.ok(V.settings().includes('href="#/settings/privacy"'));
assert.ok(V.accountPrivacy().includes('value="JP" selected'));
state.posts=[
  {id:'kr',title:'한국 글',body:'내용',author:'작성자',countryCode:'KR',authorCountryCode:'KR',createdAt:30,likes:100,cat:'review',photos:[]},
  {id:'jp-new',title:'일본 새 글',body:'내용',author:'작성자',countryCode:'JP',authorCountryCode:'JP',createdAt:20,likes:1,cat:'review',photos:[]},
  {id:'jp-old',title:'일본 인기 글',body:'내용',author:'작성자',countryCode:'JP',authorCountryCode:'JP',createdAt:10,likes:2,cat:'free',photos:[]},
];
for (const tab of ['latest','popular','review']) {
  const html=V.community({tab});
  assert.ok(html.indexOf('#/post/jp-new')<html.indexOf('#/post/kr'), 'Matching country comes first in '+tab);
}
assert.ok(V.community({tab:'latest'}).indexOf('#/post/jp-new')<V.community({tab:'latest'}).indexOf('#/post/jp-old'));
assert.ok(V.community({tab:'popular'}).indexOf('#/post/jp-old')<V.community({tab:'popular'}).indexOf('#/post/jp-new'));
state.user=null;
assert.ok(V.community({tab:'latest'}).indexOf('#/post/kr')<V.community({tab:'latest'}).indexOf('#/post/jp-new'), 'Guest ordering must not assume nationality');
(async()=>{
  const error={hidden:true},button={};
  const form={dataset:{form:'signup'},elements:{username:{value:'tester'},password:{value:'test-password'},countryCode:{value:'JP'}},
    querySelector:selector=>selector==='.auth-error'?error:button,isConnected:false};
  await submitForm({target:form,preventDefault(){}});
  assert.deepEqual(calls[0],['register','tester','test-password','JP']);
  state.user={id:'u1',countryCode:'KR'};
  await submitForm({target:{dataset:{form:'country'},elements:{countryCode:{value:'US'}},isConnected:false},preventDefault(){}});
  assert.deepEqual(calls[1],['country','US']);
  console.log('PASS 249 countries, translated names/default KR, signup payload, badges, country settings, stable feed priority and guest activity guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
