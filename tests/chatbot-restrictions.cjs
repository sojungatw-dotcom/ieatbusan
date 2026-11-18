'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={console};c.window=c;vm.createContext(c);
for(const f of ['js/data/foods.js','chatbot/locales.js','chatbot/busan-data.js','chatbot/db-rules.js','chatbot/db-bot.js','chatbot/visitor-input.js','chatbot/bot-localization.js','chatbot/visitor-locales.js','chatbot/concise-copy.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const b=c.FoodGuide,R=c.BusanRules; b.replaceCatalog(c.FOODS);
const failures=[],groups={};let total=0;
function check(group,name,fn){total++;groups[group]=(groups[group]||0)+1;try{fn();}catch(e){failures.push({group,name,error:e.message});}}
const animal=['meat','seafood','egg','dairy','honey'];
function safe(f,s){const all=[...f.ingredients,...f.possibleIngredients];return !all.some(k=>(s.diet==='vegan'&&animal.some(a=>R.belongs(k,a)))||(s.diet==='vegetarian'&&['meat','seafood'].some(a=>R.belongs(k,a)))||[...s.allergies,...s.excluded].some(a=>R.related(k,a)));}
for(const lang of ['ko','en','zh','ja']){b.setLanguage(lang);for(const diet of ['none','vegetarian','vegan'])for(const allergen of [null,...b.allergyKeys]){
 const s={...b.createState(),profileComplete:true,stage:'category',diet,reviewVegan:true,allergyStatus:allergen?'selected':'none',allergies:allergen?[allergen]:[],excluded:[]};
 check('allergyOptions',lang+'/'+diet+'/'+allergen,()=>{const form=b.view({...s,stage:'allergies'}).form;assert.deepEqual(Array.from(form.allergyKeys),Array.from(b.allergyKeys),'Allergy identification must retain every allergen, regardless of diet or existing allergies');});
 const eligible=b.foods.filter(f=>safe(f,s)&&f.hasIngredientInfo&&f.hasAllergenInfo&&(diet!=='vegan'||f.plantCandidate||f.veganVerified));
 const cats=b.view(s).choices.filter(x=>x.id.startsWith('category:')&&x.id!=='category:any');
 check('category',lang+'/'+diet+'/'+allergen,()=>{for(const choice of cats)assert.ok(eligible.some(f=>f.categories.includes(choice.id.slice(9))),'Unsafe/empty category '+choice.id);});
 for(const category of Object.keys(R.categories)){
  const r=b.view({...s,stage:'wanted',category,wanted:[]});
  check('ingredients',lang+'/'+diet+'/'+allergen+'/'+category,()=>{for(const key of r.form.wantedKeys){assert.ok(![...s.allergies,...s.excluded].some(a=>R.related(key,a)),'Restricted ingredient '+key);assert.ok(!(diet==='vegan'&&animal.some(a=>R.belongs(key,a))),'Animal choice '+key);assert.ok(eligible.some(f=>(category==='any'||f.categories.includes(category))&&f.preferences.some(p=>R.belongs(p,key))),'No eligible food for '+key);}});
  for(const spice of ['any','mild','hot'])check('recommendation',lang+'/'+diet+'/'+allergen+'/'+category+'/'+spice,()=>{let r=b.respond({action:'confirm'},{...s,stage:'confirm',category,spice});if(r.state.stage==='relax')r=b.respond({action:'alternatives:accept'},r.state);for(const food of r.foods)assert.ok(safe(food,s),'Restricted recommendation '+food.id);});
 }
}}
// Saved restrictions survive edits, requests, random alternatives and repeated recommendations.
for(const lang of ['ko','en','zh','ja']){b.setLanguage(lang);for(const excluded of [['pork'],['beef','pork'],['meat','seafood'],['wheat','egg','dairy']]){
 const s={...b.createState(),profileComplete:true,stage:'confirm',excluded,allergies:['peanut'],allergyStatus:'selected',wanted:['icecream'],category:'dessert',spice:'mild'};
 for(let repeat=0;repeat<20;repeat++)check('alternatives',lang+'/'+excluded+'/'+repeat,()=>{let r=b.respond({action:'confirm'},s);if(r.state.stage==='relax')r=b.respond({action:'alternatives:accept'},r.state);assert.deepEqual(Array.from(r.state.excluded),excluded);assert.deepEqual(Array.from(r.state.allergies),['peanut']);for(const f of r.foods){assert.ok(safe(f,s),f.id);assert.equal(f.spicy,false);}});
}}
for(const lang of ['ko','en','zh','ja']){b.setLanguage(lang);check('unresolved',lang,()=>{const s={...b.createState(),stage:'confirm',profileComplete:true,allergyStatus:'selected',allergies:[]};const r=b.respond({action:'confirm'},s);assert.equal(r.foods.length,0);assert.equal(r.state.stage,'allergies');assert.equal(b.eligibleFoods(s).length,0);});}
b.setLanguage('ko');check('response','Do not claim mild spice was selected when it was not',()=>{const r=b.view({...b.createState(),stage:'relax',spice:'any'});assert.ok(!r.text.includes('순한맛'));});
vm.runInContext(fs.readFileSync('chatbot/db-scenarios.js','utf8'),c);
const examples=[];for(const scenario of c.FoodScenarios){const availability=c.FoodScenarios.availability(scenario);examples.push({id:scenario.id,available:availability.available,blocked:availability.blocked});check('examples',scenario.id,()=>{if(!availability.available){assert.ok(availability.blocked,'Unavailable examples need an explicit blocked step');return;}const r=availability.result;assert.ok(['results','empty'].includes(r.state.stage));for(const f of r.foods)assert.ok(safe(f,r.state),f.id);});}
check('examples','Known valid and obsolete examples have different availability',()=>{assert.equal(c.FoodScenarios.availability(c.FoodScenarios.find(s=>s.id==='basic')).available,true);assert.equal(c.FoodScenarios.availability(c.FoodScenarios.find(s=>s.id==='vegan')).available,false);assert.equal(c.FoodScenarios.availability(c.FoodScenarios.find(s=>s.id==='wheat-noodle')).available,false);});
// Positive controls: safe preferences remain selectable while restriction identification stays complete.
b.replaceCatalog([
 {id:'beef',ko:{name:'소고기',ingredients:'소고기',allergens:[]}},
 {id:'chicken',ko:{name:'닭고기',ingredients:'닭고기',allergens:[]}},
 {id:'milk-icecream',ko:{name:'아이스크림',ingredients:'우유',category:'dessert',allergens:['우유']}},
 {id:'fruit',ko:{name:'과일',ingredients:'사과',category:'dessert',allergens:[]},classification:{ingredients:['fruit']},dietary:{veganVerified:true}},
 {id:'soysoup',ko:{name:'콩국',ingredients:'대두',allergens:['대두']},classification:{ingredients:['soy','soysoup']},dietary:{veganVerified:true}}
]);
for(const lang of ['ko','en','zh','ja']){b.setLanguage(lang);
 for(const [diet,allergies,required,forbidden] of [['vegan',['soy'],'fruit',['beef','chicken','icecream','soysoup']],['none',['dairy'],'beef',['icecream']],['none',['beef'],'chicken',['beef']]])check('separateQuestions',lang+'/'+diet+'/'+allergies,()=>{
  const s={...b.createState(),stage:'wanted',profileComplete:true,diet,allergyStatus:'selected',allergies,category:'any'};
  const wanted=b.view(s).form.wantedKeys;assert.ok(wanted.includes(required),'Safe preference should remain: '+required);for(const key of forbidden)assert.ok(!wanted.includes(key),'Forbidden preference: '+key);
  const allergy=b.view({...s,stage:'allergies'}).form.allergyKeys;for(const key of ['beef','chicken','dairy','soy'])assert.ok(allergy.includes(key),'Allergy identification must still offer '+key);
 });
}
// Contradictory candidate flags cannot permit a known possible animal ingredient.
b.replaceCatalog([{id:'unsafe',ko:{name:'Test rice',ingredients:'Rice',allergens:[]},classification:{ingredients:['rice'],possibleIngredients:['pork'],plantCandidate:true}}]);
check('candidate','possible pork is excluded in review mode',()=>{const r=b.respond({action:'confirm'},{...b.createState(),stage:'confirm',profileComplete:true,diet:'vegan',reviewVegan:true});assert.equal(r.foods.length,0);});
const report={total,passed:total-failures.length,failed:failures.length,groups,examples,failures};
if(process.argv.includes('--report')){const p=process.argv[process.argv.indexOf('--report')+1];fs.mkdirSync(require('node:path').dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(report,null,2));}
console.log(JSON.stringify({...report,examples:undefined,failures:failures.slice(0,12)},null,2));if(failures.length)process.exitCode=1;
