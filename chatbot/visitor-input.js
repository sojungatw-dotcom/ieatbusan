(function(root){
 'use strict';
 // Deliberately bounded rules, not free-form language understanding. Longest token wins.
 const terms={
  beef:/\bbeef\b|소고기|쇠고기|牛肉/gi,pork:/\bpork\b|돼지고기|豚肉|猪肉|豬肉/gi,chicken:/\bchicken\b|닭고기|鸡肉|雞肉|鶏肉/gi,whale:/\bwhale(?: meat)?\b|고래고기|鲸肉|鯨肉/gi,
  dairy:/\b(?:dairy|milk|cheese|butter)\b|우유|유제품|牛奶|乳制品|乳製品|牛乳/gi,
  egg:/\beggs?\b|달걀|계란|鸡蛋|雞蛋|たまご|卵/gi,wheat:/\b(?:wheat|flour)\b|밀가루|小麦|小麥|面粉/gi,buckwheat:/\bbuckwheat\b|메밀|荞麦|蕎麦|そば/gi,
  peanut:/\bpeanuts?\b|땅콩|花生|落花生/gi,walnut:/\bwalnuts?\b|호두|核桃|くるみ/gi,pine:/\bpine nuts?\b|잣|松子|松の実/gi,sesame:/\bsesame\b|참깨|芝麻|ごま/gi,
  soy:/\b(?:soy|soybean)s?\b|대두|大豆/gi,tofu:/\btofu\b|두부|豆腐/gi,
  shrimp:/\b(?:shrimps?|prawns?)\b|새우|虾|蝦|えび|エビ/gi,crab:/\bcrabs?\b|게(?=\s|\b)|螃蟹|蟹|かに|カニ/gi,
  finfish:/\b(?:fish|finfish)\b|생선|鱼|魚|さかな/gi,'?shellfish':/\bshellfish\b/gi,
  shellfish:/\b(?:clams?|oysters?|mussels?|abalone)\b|조개|전복|貝|贝/gi,squid:/\b(?:squid|octopus)\b|오징어|낙지|鱿鱼|章鱼|イカ|タコ|いか|たこ/gi,
  crustacean:/\bcrustaceans?\b|갑각류|甲壳类|甲殻類/gi,mollusc:/\bmollusc?s?\b|연체동물|软体动物|軟体動物/gi,
  mackerel:/\bmackerel\b|고등어|鲭鱼|鯖魚|さば|サバ/gi,jellyfish:/\bjellyfish\b|해파리|海蜇|くらげ/gi,seasquirt:/\bsea squirts?\b|멍게|海鞘|ホヤ/gi,mustard:/\bmustard\b|겨자|芥末|からし/gi,
  seafood:/\bseafood\b|해산물|海鲜|海鮮|魚介/gi,meat:/\bmeat\b|고기|肉类|肉類/gi,
  noodles:/\b(?:noodles?|ramen|pasta|udon)\b|면류|국수|라멘|面条|麺|ラーメン/gi,sujebi:/\bsujebi\b|수제비|面片汤|スジェビ/gi,
  fruit:/\bfruit\b|과일|水果|果物|フルーツ/gi,icecream:/\bice[ -]?cream\b|아이스크림|冰淇淋|アイスクリーム/gi,
  rice:/\brice\b|밥|米饭|ご飯/gi,porridge:/\bporridge\b|죽|お粥|粥/gi,ricecake:/\brice[ -]?cakes?\b|떡|年糕|餅/gi,dumpling:/\bdumplings?\b|만두|饺子|餃子/gi,
  fishcake:/\bfish[ -]?cakes?\b|어묵|鱼饼|練り物/gi,pancake:/\bgreen onion pancakes?\b|파전|葱饼|チヂミ/gi,pocket:/\btofu pockets?\b|유부주머니|豆皮福袋|油揚げの巾着/gi,soysoup:/\bsoy soup\b|콩국|豆浆汤|豆乳スープ/gi,hotteok:/\bhotteok\b|호떡|糖饼|ホットク/gi,
  honey:/\bhoney\b|꿀|蜂蜜|はちみつ/gi,mushroom:/\bmushrooms?\b|버섯|蘑菇|きのこ/gi
 };
 const allergy=/allerg(?:y|ies|ic|en)?|알레르기|알러지|过敏|過敏|アレルギー/i;
 const negative=/\b(?:do not (?:want|like|love|eat)|don['’]?t (?:want|like|love|eat)|would(?: not|n['’]?t) like|not to eat|leave out|dislike|hate|no|without|avoid(?:ing)?|exclude|cannot(?: eat)?|can['’]?t(?: eat)?)\b|不喜欢|不喜歡|不爱吃|不愛吃|不想吃|讨厌|討厭|不吃|不要|不能吃|不含|好きでは(?:ありません|ない)|好きじゃない|嫌い|避けたい|食べたくない|抜き|なし|食べられません|食べられない|食べない|苦手|못\s*먹|안\s*먹|피하고\s*싶|제외|빼|싫/ig;
 const positive=/\b(?:want|like|love|prefer|recommend)\b|想吃|喜欢|喜歡|爱吃|愛吃|食べたい|好き|お願いします|먹고\s*싶|먹을래|좋아|추천/ig;
 function markers(text){
  const found=[];for(const [mode,re] of [['excluded',negative],['wanted',positive],['allergies',/allerg(?:y|ies|ic|en)?|알레르기|알러지|过敏|過敏|アレルギー/ig],['denyAllergy',/not allergic(?: to)?|不过敏|不過敏|アレルギーではない/ig]]){re.lastIndex=0;for(const m of text.matchAll(re))found.push({mode,start:m.index,end:m.index+m[0].length,text:m[0]});}
  found.sort((a,b)=>(b.end-b.start)-(a.end-a.start));const selected=[];for(const m of found)if(!selected.some(s=>s.start<m.end&&s.end>m.start))selected.push(m);return selected.sort((a,b)=>a.start-b.start);
 }
 const postfixLead=/^[\s-]*(?:(?:은|는|을|를|이|가|에|は|が|を|に|の|で|的|真的|정말|너무|좀)\s*)*$/u;
 const connector=/^[\s,，、&]*(?:(?:and|or|와|과|랑|및|하고|또는|と|や|和|及|还有)[\s,，、&]*)*$/iu;
 function postfix(tail){
  if(/^[\s-]*free\b/i.test(tail))return 'excluded';
  if(/^\s*(?:is not|isn['’]?t)\s+(?:okay|ok|fine)\b/i.test(tail))return 'excluded';
  if(/^\s*(?:is\s+)?(?:okay|ok|fine)\b/i.test(tail))return 'wanted';
  const m=markers(tail).find(m=>postfixLead.test(tail.slice(0,m.start))&&(!/^[a-z]/i.test(m.text)||m.mode==='allergies'));
  return m?.mode;
 }
 function parse(input){
  const text=String(input).trim().slice(0,2000),result={action:'request:parsed',allergies:[],excluded:[],wanted:[],pendingAllergy:[],unsupported:[],recognized:false};
  const push=(key,value)=>{if(!result[key].includes(value))result[key].push(value);result.recognized=true;};
  if(/my friend|친구|友達|朋友/i.test(text))return result;
  if(/\?\s*$/.test(text)&&/^(?:is|are|does|do|can i|could i)\b/i.test(text)&&!/recommend|suggest|find/i.test(text))return {...result,recognized:true,action:'request:uncertain'};
  if(/\b(?:do not|don['’]?t)\s+(?:want to avoid|dislike)|\bnot\s+mild\b|不想避免|不是不(?:吃|喜欢|喜歡)|(?:嫌い|苦手)ではない|싫지\s*않|안\s*먹는\s*건\s*아니|피하고\s*싶지\s*않/i.test(text))return {...result,recognized:true,action:'request:uncertain'};
  const allergyException=/\bno (?:food )?allerg(?:y|ies).{0,12}(?:except|apart from)|除了.{1,30}(?:过敏|過敏)|以外.{0,20}アレルギー|(?:외에는|말고는|빼고는).{0,15}(?:알레르기|알러지).{0,5}없/i.test(text);
  if(!allergyException)for(const re of Object.values(terms)){re.lastIndex=0;for(const match of text.matchAll(re)){const before=text.slice(0,match.index),after=text.slice(match.index+match[0].length);if((/^(?:\s|の|의)*(?:allerg(?:y|ies)|알레르기|알러지|アレルギー).{0,8}(?:없|なし|ない|ありません|free)/i.test(after))||(/(?:\bno|没有|沒有|(?:do not|don['’]?t) have(?: any| a)?)\s*$/i.test(before)&&/^[\sの]*(?:allerg|过敏|過敏|アレルギー)/i.test(after)))return {...result,recognized:true,action:'request:uncertain'};}}
  const noAllergy=!allergyException&&/\b(?:no (?:food )?allerg(?:y|ies)|not allergic)\b|(?:do not|don['’]?t)\s+have(?:\s+(?:any|food))*\s+allerg(?:y|ies)|没有.{0,5}过敏|アレルギー.{0,6}(?:なし|ない|ありません)|(?:알레르기|알러지).{0,5}없/i.test(text);
  const targetedNegative=/not allergic to|对.{1,20}不过敏|アレルギーではない/i.test(text);if(noAllergy&&!targetedNegative){result.allergyStatus='none';result.recognized=true;}
  if(/\bvegan\b|비건|纯素|純素|ヴィーガン/i.test(text)){result.diet=/\b(?:not|non)[ -]?(?:a )?vegan\b|비건.{0,3}아니|不是纯素|ヴィーガンではない/i.test(text)?'none':'vegan';result.recognized=true;}
  if((!result.diet||result.diet==='none')&&/\bvegetarian\b|채식|素食|ベジタリアン/i.test(text)){result.diet=/not (?:a )?vegetarian/i.test(text)?'none':'vegetarian';result.recognized=true;}
  if(/non[ -]?spicy|not spicy|no chili|mild|(?:don['’]?t|do not|cannot|can['’]?t).{0,15}(?:like|want|eat).{0,10}spicy|avoid.{0,8}spicy|덜\s*맵|안\s*맵|맵지|매운.{0,8}(?:싫|못\s*먹|안\s*먹)|不辣|微辣|不喜欢.{0,8}辣|不喜歡.{0,8}辣|辛くない|辛い.{0,12}(?:苦手|だめ|好きでは|食べられ)|辛さ控えめ/i.test(text)){result.spice='mild';result.recognized=true;}
  else if(/\bspicy\b|매운|매콤|辣|辛い/i.test(text)){result.spice='hot';result.recognized=true;}
  const unsupported={budget:/\b(?:budget|krw|won|cheap|under\s*\d)|[₩¥￥$]|\d[\d,]*\s*(?:원|円|元)|예산|预算|予算/i,location:/\b(?:near|station|haeundae|seomyeon|nampo|gwangalli)\b|근처|해운대|서면|남포|附近|车站|駅|近く/i,halal:/halal|할랄|清真|ハラール/i,hours:/open now|opening hours|영업|营业|營業|営業時間|営業中/i};
  for(const [key,re] of Object.entries(unsupported))if(re.test(text))push('unsupported',key);
  // Keep comma-separated ingredient lists together; new subjects/contrast start a clause.
  for(const clause of text.split(/[;.!?\n。；]|\bbut\b|\band\s+(?=(?:I\b|(?:would )?want\b|(?:am|have)\b))|하지만|그런데|但是|不过|けど/iu)){
   const matches=[];for(const [key,re] of Object.entries(terms)){re.lastIndex=0;for(const m of clause.matchAll(re))matches.push({key,start:m.index,end:m.index+m[0].length});}
   matches.sort((a,b)=>(b.end-b.start)-(a.end-a.start));const tokens=[];for(const m of matches)if(!tokens.some(t=>m.start<t.end&&m.end>t.start))tokens.push(m);tokens.sort((a,b)=>a.start-b.start);
   for(let i=0;i<tokens.length;i++){
    const token=tokens[i],before=clause.slice(0,token.start),after=clause.slice(token.end,i+1<tokens.length?tokens[i+1].start:undefined);
    const prefix=markers(before).at(-1);let mode=postfix(after)||prefix?.mode;
    if(mode==='excluded'&&/(?:不含|不加|不要)[^，,。;.]*的\s*$/.test(before))mode='wanted';
    // A trailing predicate belongs to every item in a coordinated list, not only the last.
    if(!mode){let j=i;while(j+1<tokens.length&&connector.test(clause.slice(tokens[j].end,tokens[j+1].start))){j++;const tail=clause.slice(tokens[j].end,j+1<tokens.length?tokens[j+1].start:undefined);mode=postfix(tail);if(mode)break;}}
    if(!mode){const bare=clause.replace(new RegExp(terms[token.key].source,terms[token.key].flags),'').trim();if(/^(?:please|주세요|お願いします)?$/i.test(bare))mode='wanted';}
    if(!mode&&/(?:please|お願いします|주세요)\s*$/i.test(clause))mode='wanted';
    if(allergyException&&allergy.test(clause))mode='allergies';
    if(!mode||mode==='denyAllergy'||(mode==='allergies'&&noAllergy))continue;
    if(mode==='wanted'&&['meat','seafood','noodles'].includes(token.key)){result.category={meat:'meat',seafood:'seafood',noodles:'noodle'}[token.key];result.recognized=true;}
    if(token.key==='?shellfish'){if(mode==='allergies'){push('pendingAllergy','shellfish');result.allergyStatus='selected';}else if(mode==='excluded'){push('excluded','crustacean');push('excluded','mollusc');}else push('pendingAllergy','shellfish');continue;}
    const key=mode==='allergies'&&token.key==='tofu'?'soy':token.key;
    if(mode==='allergies'){result.allergyStatus='selected';if(root.FoodGuide?.allergyKeys&&!root.FoodGuide.allergyKeys.includes(key))push('pendingAllergy',key);else push('allergies',key);}else push(mode,key);
   }
   if(allergy.test(clause)&&!noAllergy&&!tokens.length){push('pendingAllergy','unknown');result.allergyStatus='selected';}
  }
  const categories={dessert:/dessert|甜点|甜點|デザート|디저트|후식/i,stew:/\b(?:soup|stew)s?\b|スープ|汤|湯|찜탕/i,snack:/\bsnacks?\b|小吃|軽食|분식/i,any:/anything|any meal|随便|何でも|아무거나/i};for(const [key,re] of Object.entries(categories)){if(re.test(text)&&!negative.test(text)){result.category=key;result.recognized=true;}negative.lastIndex=0;}
  if(/\bor\b|或者|或是|または|또는|혹은/i.test(text))result.ingredientMode='any';
  if(result.allergies.length)result.allergyStatus='selected';
  return result;
 }
 function intentAt(text,start,end){return postfix(text.slice(end))||markers(text.slice(0,start)).at(-1)?.mode||(!text.slice(0,start).trim()&&!text.slice(end).trim()?'wanted':null);}
 root.VisitorInput={parse,intentAt};
})(globalThis);
