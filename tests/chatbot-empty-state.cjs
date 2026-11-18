'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),c={};c.window=c;vm.createContext(c);
for(const file of ['chatbot/locales.js','chatbot/busan-data.js','chatbot/db-rules.js','chatbot/db-bot.js','chatbot/visitor-input.js','chatbot/bot-localization.js','chatbot/visitor-locales.js','chatbot/concise-copy.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const b=c.FoodGuide,beef={id:'test-beef',ko:{name:'소고기',ingredients:'소고기',allergens:[]}};
for(const language of ['ko','en','zh','ja']){
 b.setLanguage(language);b.replaceCatalog([beef]);
 let r=b.respond({action:'profile:submit',diet:'vegan',allergyStatus:'none',allergies:[],excluded:[]});
 assert.equal(r.state.stage,'empty');assert.ok(!r.choices.some(c=>c.id==='result:again'),'No retry when no compatible food exists');
 assert.ok(!b.view(r.state).choices.some(c=>c.id==='result:again'),'Redraw must not reintroduce retry');
 assert.ok(r.choices.some(c=>c.id==='profile:open'),'Vegan no-match should offer an explicit diet selection');
 assert.ok(r.text.includes({ko:'음식점에 직접 문의',en:'ask the restaurant',zh:'向餐厅',ja:'店舗に直接'}[language]),'Vegan no-match should explain restaurant confirmation');
 assert.ok(r.text.includes(b.summary(r.state)),'No-match response must show its applied conditions');
 const detailed={...r.state,allergyStatus:'selected',allergies:['dairy'],excluded:['pork'],wanted:['fruit'],category:'dessert',spice:'mild'};
 const detail=b.view(detailed);for(const key of ['dairy','pork','fruit'])assert.ok(detail.text.includes(b.labels[key]),'Missing applied condition '+key);
 const reopened=b.respond({action:'profile:open'},detail.state);assert.equal(reopened.state.stage,'profile');assert.equal(reopened.state.diet,'vegan');assert.deepEqual(Array.from(reopened.state.allergies),['dairy']);assert.deepEqual(Array.from(reopened.state.excluded),['pork']);assert.equal(reopened.foods.length,0,'Opening diet choices must not automatically relax restrictions');
 let state={...b.createState(),profileComplete:true,stage:'confirm',category:'meat'};
 r=b.respond({action:'confirm'},state);assert.equal(r.foods.length,1);
 r=b.respond({action:'result:more'},r.state);assert.equal(r.state.stage,'empty');assert.equal(r.exhausted,true);assert.ok(r.choices.some(c=>c.id==='result:again'));
 assert.ok(b.view(r.state).choices.some(c=>c.id==='result:again'),'Retry survives language redraw and action validation');
 if(language==='ko')assert.ok(!r.text.includes('맞는 음식이 없어요'),'Exhausted is not no matches');
 r=b.respond({action:'result:again'},r.state);assert.equal(r.foods[0].id,beef.id);
 state={...b.createState(),profileComplete:true,stage:'confirm',category:'dessert',wanted:['icecream']};
 r=b.respond({action:'confirm'},state);assert.equal(r.state.stage,'relax');r=b.respond({action:'alternatives:accept'},r.state);assert.equal(r.foods.length,1);
 r=b.respond({action:'result:more'},r.state);assert.equal(r.exhausted,true);assert.ok(r.choices.some(c=>c.id==='result:again'),'Previously approved alternatives can be revisited');
 r=b.respond({action:'result:again'},r.state);assert.equal(r.foods[0].id,beef.id);
 b.replaceCatalog([]);r=b.respond({action:'result:more'},r.state);assert.ok(!r.choices.some(c=>c.id==='result:again'),'Catalog removal invalidates retry');
 assert.ok(!r.text.includes(b.labels.icecream),'Consented alternatives must show the actual applied restrictions, not a waived preference');
}
console.log('PASS four-language no-match, exhausted, consented alternatives, replay and removed-catalog states');
