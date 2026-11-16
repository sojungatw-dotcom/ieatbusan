'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const entry=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dependencies=[...entry.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]).filter(file=>['chatbot/locales.js','js/chatbot-catalog.js','js/chatbot-widget.js'].includes(file));

function host({language='en',withoutLocale=false,mobile=false}={}){
 const nodes=[],messages=[],events={},state={lang:language,foods:[{id:'db-food',name:'DB food',content:{ko:{name:'DB 음식',ingredients:'쌀'}}}]};
 function node(tag){const listeners={};const n={tag,hidden:false,isConnected:true,classList:{toggle(){}},setAttribute(key,value){this[key]=String(value);},addEventListener(key,fn){listeners[key]=fn;},append(...items){nodes.push(...items);},focus(){},click(){listeners.click?.({currentTarget:this});},fire(type){listeners[type]?.();},contentWindow:{postMessage(payload,origin){messages.push({payload,origin});}}};nodes.push(n);return n;}
 const document={documentElement:{lang:'ko'},body:node('body'),createElement:node,getElementById:id=>id==='app'?{inert:false}:nodes.find(n=>n.id===id),addEventListener(){}};
 const context={document,Store:{get:()=>state},location:{origin:'http://localhost',hash:''},history:{back(){}},matchMedia:()=>({matches:mobile,addEventListener(){}}),addEventListener:(key,fn)=>{events[key]=fn;}};context.window=context;vm.createContext(context);
 for(const file of dependencies){if(withoutLocale&&file==='chatbot/locales.js')continue;vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});}
 return {context,state,nodes,messages,launcher:nodes.find(n=>n.id==='ieb-chat-launcher'),frame:()=>nodes.find(n=>n.tag==='iframe')};
}

test('Actual main-page script order initializes localized launcher and iframe context',()=>{
 for(const mobile of [false,true])for(const [language,label]of [['ko','나에게 맞는 부산의 맛 챗봇 열기'],['en','Open your Busan food guide'],['zh','打开釜山美食助手'],['ja','釜山の料理ガイドを開く']]){
  const h=host({language,mobile});assert.equal(h.launcher['aria-label'],label,language+' launcher label');h.launcher.click();assert.equal(new URL(h.frame().src,'http://localhost').searchParams.get('lang'),language);h.frame().fire('load');const message=h.messages.filter(m=>m.payload.type==='ieb-chatbot:context').at(-1);assert.equal(message.payload.language,language);assert.equal(message.payload.catalog.available,true);assert.deepEqual(Array.from(message.payload.catalog.foods,f=>f.id),['db-food']);assert.equal(message.origin,'http://localhost');
 }
});

test('Changing parent language reuses the conversation frame and sends all four languages',()=>{
 const h=host();h.launcher.click();const frame=h.frame();frame.fire('load');
 for(const language of ['zh','ja','ko','en']){h.state.lang=language;h.context.IEBChatbot.sync();assert.equal(h.frame(),frame);assert.equal(h.messages.filter(m=>m.payload.type==='ieb-chatbot:context').at(-1).payload.language,language);}
});

test('A missing optional label dictionary cannot force the iframe language to Korean',()=>{
 const h=host({language:'ja',withoutLocale:true});h.launcher.click();assert.equal(new URL(h.frame().src,'http://localhost').searchParams.get('lang'),'ja');h.state.lang='zh';h.context.IEBChatbot.sync();assert.equal(h.messages.filter(m=>m.payload.type==='ieb-chatbot:context').at(-1).payload.language,'zh');
});
