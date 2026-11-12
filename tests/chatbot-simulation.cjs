'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),c={console};c.window=c;vm.createContext(c);
const refIndex=process.argv.indexOf('--baseline-ref'),ref=refIndex>=0?process.argv[refIndex+1]:null,sourceHashes={};
for(const p of ['js/data/foods.js','js/data/food-detail-locales.js','js/data/food-info-translations.js','js/data/food-safety-locales.js','chatbot/busan-data.js','chatbot/locales.js','chatbot/db-rules.js','chatbot/db-bot.js','chatbot/visitor-input.js','chatbot/bot-localization.js','chatbot/visitor-locales.js','chatbot/concise-copy.js','chatbot/db-scenarios.js','chatbot/scenario-locales.js']){if(ref&&p==='chatbot/concise-copy.js')continue;const source=ref?require('node:child_process').execFileSync('git',['show',ref+':'+p],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,p),'utf8');sourceHashes[p]=require('node:crypto').createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');vm.runInContext(source,c);}
const b=c.FoodGuide,failures=[],groups={};let count=0;
function check(group,name,fn){count++;groups[group]=(groups[group]||0)+1;try{fn();}catch(error){failures.push({group,name,error:error.message});}}
const ingredients=[
 ['beef','beef','소고기','牛肉','牛肉'],['pork','pork','돼지고기','猪肉','豚肉'],['chicken','chicken','닭고기','鸡肉','鶏肉'],
 ['shrimp','shrimp','새우','虾','えび'],['crab','crab','게','蟹','かに'],['finfish','fish','생선','鱼','魚'],
 ['shellfish','clams','조개','贝','貝'],['squid','squid','오징어','鱿鱼','イカ'],['egg','egg','달걀','鸡蛋','卵'],
 ['dairy','milk','우유','牛奶','牛乳'],['tofu','tofu','두부','豆腐','豆腐'],['peanut','peanuts','땅콩','花生','落花生'],
 ['wheat','wheat','밀가루','小麦','小麦'],['buckwheat','buckwheat','메밀','荞麦','そば'],['soy','soy','대두','大豆','大豆'],
 ['walnut','walnuts','호두','核桃','くるみ'],['pine','pine nuts','잣','松子','松の実'],['sesame','sesame','참깨','芝麻','ごま'],
 ['mustard','mustard','겨자','芥末','からし'],['mackerel','mackerel','고등어','鲭鱼','さば'],['whale','whale meat','고래고기','鲸肉','鯨肉'],
 ['jellyfish','jellyfish','해파리','海蜇','くらげ'],['seasquirt','sea squirt','멍게','海鞘','ホヤ'],
 ['crustacean','crustaceans','갑각류','甲壳类','甲殻類'],['mollusc','molluscs','연체동물','软体动物','軟体動物'],
 ['meat','meat','고기','肉类','肉類'],['seafood','seafood','해산물','海鲜','魚介'],
 ['honey','honey','꿀','蜂蜜','はちみつ'],['mushroom','mushrooms','버섯','蘑菇','きのこ'],
 ['noodles','noodles','국수','面条','麺'],['sujebi','sujebi','수제비','面片汤','スジェビ'],['rice','rice','밥','米饭','ご飯'],
 ['porridge','porridge','죽','粥','お粥'],['ricecake','rice cake','떡','年糕','餅'],['dumpling','dumplings','만두','饺子','餃子'],
 ['fishcake','fish cake','어묵','鱼饼','練り物'],['pancake','green onion pancake','파전','葱饼','チヂミ'],['pocket','tofu pocket','유부주머니','豆皮福袋','油揚げの巾着'],
 ['soysoup','soy soup','콩국','豆浆汤','豆乳スープ'],['hotteok','hotteok','호떡','糖饼','ホットク'],['fruit','fruit','과일','水果','果物'],['icecream','ice cream','아이스크림','冰淇淋','アイスクリーム']
];
const templates={
 en:{wanted:['I want {x}','I like {x}','I love {x}','I would like {x}'],excluded:['No {x} please','I do not want {x}',"I don't like {x}",'I cannot eat {x}','I want food without {x}','{x}-free please',"I wouldn't like {x}",'I am avoiding {x}',"I'd prefer not to eat {x}",'Please leave out {x}','I hate {x}'],allergies:['I am allergic to {x}','I have a {x} allergy']},
 ko:{wanted:['{x} 먹고 싶어','{x} 좋아해','{x} 추천해줘','{x} 먹을래'],excluded:['{x} 못 먹어','{x} 안 먹어','{x} 싫어','{x} 빼 주세요','{x} 피하고 싶어'],allergies:['{x} 알레르기가 있어','{x} 알러지가 있어']},
 zh:{wanted:['我想吃{x}','我喜欢{x}','我爱吃{x}'],excluded:['不要{x}','我不吃{x}','我不喜欢{x}','我想要不含{x}的食物','我不想吃{x}','我讨厌{x}'],allergies:['我对{x}过敏','{x}过敏']},
 ja:{wanted:['{x}を食べたい','{x}が好きです','{x}をお願いします'],excluded:['{x}なしでお願いします','{x}は食べられません','{x}は食べたくない','{x}は好きではありません','{x}が嫌いです','{x}を避けたい'],allergies:['{x}アレルギーがあります','{x}にアレルギーがあります']}
};
for(const [lang,index] of [['en',1],['ko',2],['zh',3],['ja',4]]){b.setLanguage(lang);for(const item of ingredients)for(const [kind,phrases] of Object.entries(templates[lang]))for(const phrase of phrases){if(kind==='allergies'&&!b.allergyKeys.includes(item[0])&&item[0]!=='tofu')continue;const input=phrase.replace('{x}',item[index]),key=kind==='allergies'&&item[0]==='tofu'?'soy':item[0];check('interpretation',lang+' / '+input,()=>{const r=b.respond(input);assert.ok(r.state[kind].includes(key),JSON.stringify({want:{kind,key},actual:{wanted:r.state.wanted,excluded:r.state.excluded,allergies:r.state.allergies}}));for(const other of ['wanted','excluded','allergies'].filter(k=>k!==kind))assert.ok(!r.state[other].includes(item[0]),'Opposite interpretation: '+other);});}}
const sequences=[
 ['en',['I am allergic to peanuts, shrimp and milk'],{allergies:['peanut','shrimp','dairy']}],
 ['en',['I want beef, pork and chicken'],{wanted:['beef','pork','chicken']}],
 ['en',['No pork, I want beef and I am allergic to peanuts'],{wanted:['beef'],excluded:['pork'],allergies:['peanut']}],
 ['ko',['소고기는 좋아하고 돼지고기는 싫어'],{wanted:['beef'],excluded:['pork']}],
 ['ko',['돼지고기는 빼고 소고기는 먹고 싶어'],{wanted:['beef'],excluded:['pork']}],
 ['zh',['不要猪肉，我喜欢牛肉'],{wanted:['beef'],excluded:['pork']}],
 ['ja',['豚肉なしで牛肉を食べたい'],{wanted:['beef'],excluded:['pork']}],
 ['en',['No pork please','I want pork'],{wanted:['pork'],excluded:['pork']}],
 ['en',['I want pork','No pork please'],{excluded:['pork']}],
 ['en',['I am allergic to shrimp','I want beef'],{allergies:['shrimp'],wanted:['beef']}],
 ['en',['I am vegan and allergic to peanuts'],{diet:'vegan',allergies:['peanut']}]
];
sequences.push(
 ['en',['I have no allergies except peanuts'],{allergies:['peanut'],allergyStatus:'selected'}],
 ['zh',['除了花生没有其他过敏'],{allergies:['peanut'],allergyStatus:'selected'}],
 ['ja',['卵以外のアレルギーはありません'],{allergies:['egg'],allergyStatus:'selected'}],
 ['en',["I don't like spicy food"],{spice:'mild'}],
 ['ko',['매운 음식은 싫어'],{spice:'mild'}],
 ['zh',['我不喜欢辣的食物'],{spice:'mild'}],
 ['ja',['辛い料理は好きではありません'],{spice:'mild'}]
);
sequences.push(
 ['zh',['我想吃不含花生的牛肉'],{wanted:['beef'],excluded:['peanut']}],
 ['ja',['牛肉を卵なしでお願いします'],{wanted:['beef'],excluded:['egg']}],
 ['en',['beef without peanuts please'],{wanted:['beef'],excluded:['peanut']}],
 ['en',["I don't eat pork but beef is okay"],{wanted:['beef'],excluded:['pork']}]
);
sequences.push(['ko',['땅콩 외에는 알레르기 없어'],{allergies:['peanut'],allergyStatus:'selected'}]);
for(const [lang,negative,none] of [['en','I have no milk allergy',"I don't have any allergies"],['ko','우유 알레르기는 없어','알러지 없어'],['zh','我没有牛奶过敏','我没有任何食物过敏'],['ja','牛乳のアレルギーはありません','アレルギーはない']]){sequences.push([lang,['I am allergic to shrimp',negative],{allergies:['shrimp']}]);sequences.push([lang,[none],{allergyStatus:'none'}]);}
for(const [lang,inputs,expected] of sequences){b.setLanguage(lang);check('conversation',lang+' / '+inputs.join(' → '),()=>{let r;for(const input of inputs)r=b.respond(input,r?.state);for(const [key,values] of Object.entries(expected)){if(Array.isArray(values))assert.deepEqual(Array.from(r.state[key]).sort(),[...values].sort(),JSON.stringify({key,want:values,actual:r.state[key]}));else assert.equal(r.state[key],values);}if(expected.wanted?.some(k=>expected.excluded?.includes(k)))assert.equal(r.state.stage,'conflict');});}
for(const text of ["I don't want to avoid pork",'I do not dislike beef','not mild please','Is this dairy-free?','Does this contain peanuts?','Can I eat pork?','不是不吃猪肉','牛肉は苦手ではない','소고기를 안 먹는 건 아니야'])check('ambiguity',text,()=>{b.setLanguage('en');const s=b.createState();s.excluded=['shrimp'];const r=b.respond(text,s);assert.deepEqual(Array.from(r.state.excluded),['shrimp']);assert.equal(r.state.wanted.length,0);assert.equal(r.state.spice,null);assert.equal(r.uncertain,true);});
// Independent recipe facts, including ingredients hidden only in possible-ingredient metadata.
const families={meat:['beef','pork','chicken','whale'],seafood:['finfish','mackerel','shrimp','crab','crustacean','shellfish','squid','mollusc','seasquirt','jellyfish'],finfish:['mackerel'],crustacean:['shrimp','crab'],mollusc:['shellfish','squid'],soy:['tofu']};
function forbidden(ingredient,restriction){if(ingredient===restriction)return true;const children=families[restriction]||[];if(children.includes(ingredient))return true;return (families[ingredient]||[]).includes(restriction);}
const keys=Object.keys(c.BusanRules.labels),recipes=keys.map((key,i)=>({id:'synthetic-'+key,ko:{name:'Menu '+i,ingredients:'Test ingredient',allergens:[]},classification:{ingredients:[key],categories:[key==='noodles'?'noodle':['fruit','icecream','hotteok'].includes(key)?'dessert':['sujebi','soysoup'].includes(key)?'stew':'other'],spicy:i%2===0}}));
recipes.push({id:'synthetic-hidden-shrimp',ko:{name:'Menu sauce',ingredients:'Rice',allergens:[]},classification:{ingredients:['rice'],possibleIngredients:['shrimp'],categories:['other'],spicy:false}});
b.replaceCatalog(recipes);
// Parse actual user text, then search without inserting an expected restriction into state.
for(const [lang,index] of [['en',1],['ko',2],['zh',3],['ja',4]]){b.setLanguage(lang);for(const item of ingredients)for(const kind of ['wanted','excluded'])for(const phrase of templates[lang][kind])check('endToEnd',lang+' / '+phrase.replace('{x}',item[index]),()=>{const parsed=b.respond(phrase.replace('{x}',item[index])),s=parsed.state;s.stage='confirm';s.profileComplete=true;let r=b.respond({action:'confirm'},s),seen=0;for(let page=0;page<20;page++){for(const food of r.foods){seen++;const facts=recipes.find(f=>f.id===food.id).classification;const contents=[...facts.ingredients,...facts.possibleIngredients||[]];if(kind==='excluded')assert.ok(contents.every(k=>!forbidden(k,item[0])),'Excluded food returned: '+food.id);else assert.ok(contents.some(k=>k===item[0]||(families[item[0]]||[]).includes(k)),'Unrelated preferred food: '+food.id);}if(!r.choices.some(x=>x.id==='result:more'))break;r=b.respond({action:'result:more'},r.state);}if(kind==='wanted')assert.ok(seen>0,'A matching controlled recipe was silently omitted');});}
for(const kind of ['excluded','allergies'])for(const key of kind==='allergies'?b.allergyKeys:keys){const s=b.createState();Object.assign(s,{stage:'confirm',profileComplete:true,allergyStatus:'selected',[kind]:[key]});for(const alternative of [false,true]){check('recommendation',kind+' '+key+' alternative='+alternative,()=>{let r=b.respond({action:'confirm'},s);if(alternative){r=b.respond({action:'result:edit'},r.state);r.state.stage='confirm';r.state.wanted=['fruit'];r.state.category='dessert';r=b.respond({action:'confirm'},r.state);if(r.state.stage==='relax')r=b.respond({action:'alternatives:accept'},r.state);}for(let page=0;page<20;page++){for(const food of r.foods){const raw=recipes.find(f=>f.id===food.id);assert.ok(raw,'Non-DB candidate');for(const ingredient of [...raw.classification.ingredients,...raw.classification.possibleIngredients||[]])assert.ok(!forbidden(ingredient,key),JSON.stringify({restriction:key,id:food.id,ingredient}));}if(!r.choices.some(x=>x.id==='result:more'))break;r=b.respond({action:'result:more'},r.state);}});}}
check('diet','Verified-vegan flag cannot override a declared possible animal ingredient in strict mode',()=>{b.replaceCatalog([{id:'contradictory',ko:{name:'Test soup',ingredients:'Rice',allergens:[]},classification:{ingredients:['rice'],possibleIngredients:['egg']},dietary:{veganVerified:true}},{id:'verified-fruit',ko:{name:'Test fruit',ingredients:'Fruit',allergens:[]},classification:{ingredients:['fruit']},dietary:{veganVerified:true}}]);const s=b.createState();Object.assign(s,{stage:'confirm',profileComplete:true,diet:'vegan',reviewVegan:false});const r=b.respond({action:'confirm'},s);assert.deepEqual(Array.from(r.foods,f=>f.id),['verified-fruit']);});
b.replaceCatalog(c.FOODS);
for(const lang of ['ko','en','zh','ja']){b.setLanguage(lang);for(const food of b.foods){const name=b.displayFood(food).name;check('namedFood',lang+' / '+name,()=>{const r=b.respond(({en:'I want ',ko:'',zh:'我想吃',ja:''}[lang])+name+({ko:' 먹고 싶어',ja:'を食べたい'}[lang]||''));assert.deepEqual(Array.from(r.state.requestedFoodIds),[food.id]);r.state.stage='confirm';r.state.profileComplete=true;const found=b.respond({action:'confirm'},r.state);assert.deepEqual(Array.from(found.foods,f=>f.id),[food.id]);});check('namedExclusion',lang+' / '+name,()=>{const r=b.respond(({en:"I don't like ",ko:'',zh:'不要',ja:''}[lang])+name+({ko:' 싫어',ja:'なしでお願いします'}[lang]||''));assert.ok(r.state.excludedFoodIds?.includes(food.id),'Specific dish exclusion was omitted');r.state.stage='confirm';r.state.profileComplete=true;let found=b.respond({action:'confirm'},r.state);for(let page=0;page<20;page++){assert.ok(!found.foods.some(f=>f.id===food.id),'Excluded dish was recommended');if(!found.choices.some(c=>c.id==='result:more'))break;found=b.respond({action:'result:more'},found.state);}});}}
check('namedConflict','No Milmyeon → I want Milmyeon',()=>{b.setLanguage('en');let r=b.respond('No Busan Wheat Noodles');r=b.respond('I want Busan Wheat Noodles',r.state);assert.equal(r.state.stage,'conflict');assert.ok(r.state.excludedFoodIds.includes('milmyeon'));});
check('namedConflict','Repeated menu in one sentence is not allowed to erase its exclusion',()=>{b.setLanguage('en');const r=b.respond('I want Bokguk but no Bokguk');assert.ok(r.state.excludedFoodIds.includes('bokguk'));assert.equal(r.state.stage,'conflict');assert.equal(r.foods.length,0);});
for(const lang of ['en','zh','ja']){b.setLanguage(lang);for(const food of b.foods)check('translation',lang+' / '+food.id,()=>{const f=b.displayFood(food);for(const field of ['name','detail','primary','note','priceText','spiceText'])assert.ok(!/[가-힣]/.test(f[field]||''),field+' contains untranslated Korean');assert.ok(f.note.length>20,'Missing safety note');assert.equal(f.originalName,food.name);});}
// Hand-checked source facts: a script/word-presence check alone is not linguistic review.
const anchors={
 'dwaeji-gukbap':['salted shrimp','虾酱','塩辛'],'milmyeon':['wheat','小麦','小麦'],'ssiat-hotteok':['peanuts','花生','落花生'],'nakgopsae':['octopus','章鱼','たこ'],
 'jagalchi-hoe':['raw fish','生鱼','生魚'],'eomuk':['egg white','蛋白','卵白'],'haeundae-galbi':['beef','牛肉','牛肉'],'cheongsapo-jogae':['cheese','奶酪','チーズ'],
 'naengchae-jokbal':['mustard','芥末','からし'],'gijang-daege':['crab','蟹','かに'],'kkomjangeo':['shared grills','共用烤盘','共用'],'dongnae-pajeon':['rice flour','米粉','米粉'],
 'bokguk':['toxin','毒素','ふぐ毒'],'bibim-dangmyeon':['soy','大豆','大豆'],'jobang-nakji':['beef offal','牛内脏','牛の内臓'],'multteok':['fish','鱼','魚'],
 'yubu-jumeoni':['pork or beef','猪肉或牛肉','豚肉・牛肉'],'sogogi-gukbap':['coagulated blood','血块','血の塊'],'gijang-myeolchi':['anchovy','鳀鱼','いわし'],'yeongdo-jeonbokjuk':['abalone','鲍鱼','あわび'],
 'busan-wandang':['clear broth','清汤','透明な汁'],'pohang-mulhoe':['raw fish','生鱼','生魚'],'gwamegi':['not heat-cooked','未加热','非加熱'],'mungtigi':['raw beef','生牛肉','生の牛肉'],
 'andong-jjimdak':['glass noodles','粉丝','春雨'],'andong-godeungeo':['mackerel','鲭鱼','さば'],'yeongdeok-uljin-daege':['removing the shell','去壳','殻を外しても'],'daegu-kongguk':['shared fryers','共用炸锅','共用'],
 'cheongdo-minari-samgyeopsal':['pork','猪肉','豚肉'],'daegu-makchang':['beef or pork','牛内脏或猪内脏','牛か豚'],'daegu-napjak-mandu':['wheat wrappers','面皮小麦','皮の小麦'],'eonyang-bulgogi':['sesame','芝麻','ごま'],
 'gorae-gogi':['whale meat','鲸肉','鯨肉'],'jinju-naengmyeon':['buckwheat','荞麦','そば'],'masan-bokguk':['toxin','毒素','ふぐ毒'],'hadong-jaecheopguk':['clams','蚬','しじみ'],
 'namhae-myeolchi-ssambap':['anchovy','鳀鱼','いわし'],'masan-agujjim':['monkfish','安康鱼','あんこう'],'chungmu-gimbap':['squid','鱿鱼','いか'],'meongge-bibimbap':['sea squirt','海鞘','ホヤ'],
 'dodari-ssukguk':['fish species','鱼种','魚種'],'jinju-bibimbap':['raw beef','生牛肉','生牛肉'],'uiryeong-manggaetteok':['cross-contact','交叉接触','交差接触']
};
for(const [index,lang] of ['en','zh','ja'].entries()){b.setLanguage(lang);for(const food of b.foods)check('semanticAnchors',lang+' / '+food.id,()=>{assert.ok(anchors[food.id],'Missing source fact audit');assert.ok(b.displayFood(food).note.toLowerCase().includes(anchors[food.id][index].toLowerCase()),'Core source meaning missing: '+anchors[food.id][index]);});}
const appSource=ref?require('node:child_process').execFileSync('git',['show',ref+':chatbot/app.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'chatbot/app.js'),'utf8');sourceHashes['chatbot/app.js']=require('node:crypto').createHash('sha256').update(appSource.replace(/\r\n/g,'\n')).digest('hex');c.bot=b;c.T=value=>c.ChatLocale.ui(value,b.language);vm.runInContext(appSource.slice(appSource.indexOf(' function scenarioTranscript('),appSource.indexOf(' function startScenario(')),c);
for(const lang of ['en','zh','ja']){b.setLanguage(lang);for(const scenario of c.FoodScenarios)check('translatedExamples',lang+' / '+scenario.id,()=>{const transcript=c.scenarioTranscript(scenario);for(const line of transcript)assert.ok(!/[가-힣]/.test(line.text),'Untranslated example: '+line.text.slice(0,120));});}
for(const [kind,n,want] of [['available',0,'Available: 0 items'],['available',1,'Available: 1 item'],['available',2,'Available: 2 items'],['foodcount',0,'0 food items'],['foodcount',1,'1 food item'],['foodcount',2,'2 food items']])check('countGrammar',kind+' '+n,()=>{assert.equal(typeof c.ChatLocale.count,'function');assert.equal(c.ChatLocale.count(kind,n,'en'),want);});
const report={date:'2026-11-12',source:ref||'current workspace',sourceHashes,hashNormalization:'UTF-8 with LF line endings',simulationHash:require('node:crypto').createHash('sha256').update(fs.readFileSync(__filename,'utf8').replace(/\r\n/g,'\n')).digest('hex'),catalog:'synthetic controlled recipes + 43 repository food fixtures; not live DB',total:count,passed:count-failures.length,failed:failures.length,groups,failures};
const target=process.argv.indexOf('--report');if(target>=0){const out=path.resolve(process.argv[target+1]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');}
console.log(JSON.stringify({...report,sourceHashes:undefined,simulationHash:undefined,failures:failures.slice(0,28)},null,2));process.exitCode=failures.length?1:0;
