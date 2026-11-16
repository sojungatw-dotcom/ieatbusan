'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const file of ['js/data/foods.js','chatbot/busan-data.js','chatbot/locales.js','chatbot/db-rules.js','chatbot/db-bot.js','chatbot/visitor-input.js','chatbot/bot-localization.js','chatbot/visitor-locales.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const bot=ctx.FoodGuide;
assert.equal(bot.createState().allergyStatus,'none','New conversations should preselect no allergies');
const cardFile=path.join(root,'chatbot/condition-card.js');
assert.ok(fs.existsSync(cardFile),'A reusable staff-facing condition card must be available');
vm.runInContext(fs.readFileSync(cardFile,'utf8'),ctx);
const card=ctx.ConditionCard;
assert.equal(card.model(bot.createState(),bot).ready,false,'Unconfirmed defaults cannot be exported as confirmed information');
let result=bot.respond({action:'profile:submit',diet:'vegetarian',allergyStatus:'selected',allergies:[],excluded:['pork']});
result=bot.respond({action:'allergies:submit',allergies:['peanut','dairy']},result.state);
const state={...result.state,wanted:['beef'],spice:'mild'};
bot.setLanguage('ja');
const model=card.model(state,bot);
assert.equal(model.ready,true);
assert.ok(model.rows.find(row=>row.key==='allergies').value.includes('땅콩'),'Staff card stays Korean when the chatbot language changes');
assert.ok(model.rows.find(row=>row.key==='allergies').value.includes('우유'));
assert.ok(model.rows.find(row=>row.key==='excluded').value.includes('돼지'));
assert.ok(model.rows.find(row=>row.key==='wanted').value.includes('소고기'));
assert.ok(!model.rows.find(row=>row.key==='allergies').value.includes('소고기'),'Preference must not be labeled an allergy');
assert.ok(model.warning.includes('교차 접촉'));
assert.ok(!JSON.stringify(model).includes('undefined'));
assert.ok(card.model({...state,allergyStatus:'unknown',allergies:[]},bot).rows.find(row=>row.key==='allergies').value.includes('미확인'),'Explicit unknown stays unknown');
assert.equal(card.model({...state,pendingAllergy:['shellfish']},bot).ready,false,'Unresolved allergen scope prevents exporting a misleading card');
assert.equal(card.model({...state,stage:'conflict'},bot).ready,false,'Resolve conflicting preferences before exporting a staff card');
for(const language of ['ko','en','zh','ja']){
 bot.setLanguage(language);
 const bilingual=card.model(state,bot);
 assert.equal(bilingual.rows[0].value,model.rows[0].value,'Korean allergen text must not change with the interface language');
 if(language==='ko')assert.equal(bilingual.translation,null,'Do not duplicate Korean');
 else{
  assert.equal(bilingual.translation.language,language);
  assert.ok(bilingual.translation.rows[0].value.includes(bot.labels.peanut),'Selected-language allergens must be included');
  assert.ok(bilingual.translation.rows.find(row=>row.key==='excluded').value.includes(bot.labels.pork));
  assert.ok(bilingual.translation.rows.find(row=>row.key==='wanted').value.includes(bot.labels.beef));
  assert.ok(bilingual.translation.warning.length>30,'Safety note must also be translated');
  const unknown=card.model({...state,allergyStatus:'unknown',allergies:[]},bot);
  assert.notEqual(unknown.translation.rows[0].value,card.model({...state,allergyStatus:'none',allergies:[]},bot).translation.rows[0].value,'Unknown and none remain distinct in both languages');
 }
}
const wide={...state,allergies:Object.keys(ctx.BusanRules.labels),excluded:Object.keys(ctx.BusanRules.labels)};
const calls=[];const context={font:'',measureText:text=>({width:Array.from(text).length*25}),fillRect(){},fillText(text,x,y){calls.push({text,x,y});}};
const canvas={width:0,height:0,getContext:()=>context};
card.draw(canvas,card.model(wide,bot));
assert.ok(canvas.height>900,'Long restrictions must increase the image height');
assert.ok(calls.every(call=>call.y<canvas.height),'No text may be clipped below the image');
assert.ok(calls.every(call=>Array.from(call.text).length*25<=canvas.width-80),'Long text wraps within the card');
assert.ok(calls.some(call=>call.text.includes('落花生')),'Translated text must be drawn into the PNG itself');
console.log('PASS default allergy choice, Korean staff card, unknown and preference separation, unresolved scope and long-card layout');

