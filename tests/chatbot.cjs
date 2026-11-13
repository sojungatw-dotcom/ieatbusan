'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),entry=path.join(root,'chatbot/index.html');
assert.ok(fs.existsSync(entry),'The integrated chatbot entry must be available in the app');
const context={console};context.window=context;context.globalThis=context;vm.createContext(context);
const html=fs.readFileSync(entry,'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 const ref=match[1];if(/^(?:https?:|data:|#)/.test(ref))continue;
 const target=path.resolve(path.dirname(entry),ref.split(/[?#]/)[0]);
 assert.ok(target.startsWith(root+path.sep)&&fs.existsSync(target),'Integrated asset missing: '+ref);
}
for(const file of ['js/data/foods.js','chatbot/busan-data.js','chatbot/locales.js','chatbot/db-rules.js','chatbot/db-bot.js','chatbot/visitor-input.js','chatbot/bot-localization.js','chatbot/visitor-locales.js','chatbot/concise-copy.js','chatbot/db-scenarios.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const bot=context.FoodGuide;assert.equal(bot.foods.length,0,'No local fallback before DB catalog');bot.replaceCatalog(context.FOODS.map(f=>({...f,photo:'../'+(f.photo||'assets/food/'+f.id+'.jpg')})),{source:'DB test fixture',available:true});
assert.equal(bot.foods.length,43);assert.equal(bot.source.foods.length,context.FOODS.length);
for(const food of bot.foods){assert.ok(context.FOODS.some(f=>f.id===food.id));assert.ok(fs.existsSync(path.resolve(path.dirname(entry),food.photo)),food.id+' shared photo');}
for(const scenario of context.FoodScenarios){let r=bot.respond(scenario.initial);for(const step of scenario.steps){const input=typeof step==='string'?{action:step}:step;assert.ok(r.choices.some(c=>c.id===input.action),scenario.id+' / '+input.action);r=bot.respond(input,r.state);}assert.ok(['results','empty'].includes(r.state.stage));if(scenario.expectAlternatives)assert.equal(r.alternatives,true);if(scenario.expectStage)assert.equal(r.state.stage,scenario.expectStage);}
console.log('PASS integrated shared food catalog, local assets and all '+context.FoodScenarios.length+' chatbot scenarios');

// Exercise host controls without depending on cross-frame UI events.
const events={},nodes=[],app={inert:false};
function node(tag){const listeners={},classes=new Set();return {tag,hidden:false,isConnected:true,contentWindow:{postMessage(){}},classList:{toggle(key,value){if(value===undefined)value=!classes.has(key);if(value)classes.add(key);else classes.delete(key);return value;}},setAttribute(key,value){this[key]=String(value);},addEventListener(key,fn){listeners[key]=fn;},append(...items){nodes.push(...items);},focus(){},click(){listeners.click?.({currentTarget:this});}};}
const doc={createElement:node,getElementById:id=>id==='app'?app:nodes.find(n=>n.id===id),body:node('body'),addEventListener:(key,fn)=>events['document:'+key]=fn};
const host={document:doc,location:{origin:'http://localhost',hash:''},history:{back(){}},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(key,fn)=>events[key]=fn};host.window=host;vm.createContext(host);vm.runInContext(fs.readFileSync(path.join(root,'js/chatbot-widget.js'),'utf8'),host);
const launcher=nodes.find(n=>n.id==='ieb-chat-launcher');launcher.click();
const panel=nodes.find(n=>n.id==='ieb-chat-panel');assert.equal(panel.hidden,false);
const closer=nodes.find(n=>n['aria-label']==='챗봇 닫기');assert.ok(closer,'The parent app must own its close control');closer.click();assert.equal(panel.hidden,true);
launcher.click();assert.equal(panel.hidden,false);assert.equal(nodes.filter(n=>n.tag==='iframe').length,1,'Reopening retains the existing conversation frame');
const mainEntry=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(mainEntry.indexOf('js/chatbot-catalog.js')>=0 && mainEntry.indexOf('js/chatbot-catalog.js')<mainEntry.indexOf('js/chatbot-widget.js'),'Load DB projection before the host widget');
console.log('PASS host-owned close control, retained conversation frame and catalog script integration');
