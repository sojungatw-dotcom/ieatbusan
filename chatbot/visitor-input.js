(function(root){
 'use strict';
 // Deliberately bounded rules, not free-form language understanding. Longest token wins.
 const terms={
  beef:/\bbeef\b|소고기|쇠고기|牛肉/gi,pork:/\bpork\b|돼지고기|豚肉|猪肉|豬肉/gi,chicken:/\bchicken\b|닭고기|鸡肉|雞肉|鶏肉/gi,
  dairy:/\b(?:dairy|milk|cheese|butter)\b|우유|유제품|牛奶|乳制品|乳製品|牛乳/gi,
  egg:/\beggs?\b|달걀|계란|鸡蛋|雞蛋|たまご|卵/gi,wheat:/\b(?:wheat|flour)\b|밀가루|小麦|小麥|面粉/gi,buckwheat:/\bbuckwheat\b|메밀|荞麦|蕎麦|そば/gi,
  peanut:/\bpeanuts?\b|땅콩|花生|落花生/gi,walnut:/\bwalnuts?\b|호두|核桃|くるみ/gi,pine:/\bpine nuts?\b|잣|松子|松の実/gi,sesame:/\bsesame\b|참깨|芝麻|ごま/gi,
  soy:/\b(?:soy|soybean)s?\b|대두|大豆/gi,tofu:/\btofu\b|두부|豆腐/gi,
  shrimp:/\b(?:shrimps?|prawns?)\b|새우|虾|蝦|えび|エビ/gi,crab:/\bcrabs?\b|게(?=\s|\b)|螃蟹|蟹|かに|カニ/gi,
  finfish:/\b(?:fish|finfish)\b|생선|鱼|魚|さかな/gi,'?shellfish':/\bshellfish\b/gi,
  shellfish:/\b(?:clams?|oysters?|mussels?|abalone)\b|조개|전복|貝|贝/gi,squid:/\b(?:squid|octopus)\b|오징어|낙지|鱿鱼|章鱼|イカ|タコ|いか|たこ/gi,
  crustacean:/\bcrustaceans?\b|갑각류|甲壳类|甲殻類/gi,mollusc:/\bmollusc?s?\b|연체동물/gi,
  seafood:/\bseafood\b|해산물|海鲜|海鮮|魚介/gi,meat:/\bmeat\b|고기|肉类/gi,
  noodles:/\b(?:noodles?|ramen|pasta|udon)\b|면류|국수|라멘|面条|麺|ラーメン/gi,sujebi:/\bsujebi\b|수제비/gi,
  fruit:/\bfruit\b|과일|水果|果物|フルーツ/gi,icecream:/\bice[ -]?cream\b|아이스크림|冰淇淋|アイスクリーム/gi,
  rice:/\brice\b|밥|米饭|ご飯/gi,fishcake:/\bfish[ -]?cakes?\b|어묵|鱼饼|練り物/gi,
  honey:/\bhoney\b|꿀|蜂蜜|はちみつ/gi,mushroom:/\bmushrooms?\b|버섯|蘑菇|きのこ/gi
 };
 const allergy=/allerg(?:y|ies|ic|en)?|알레르기|알러지|过敏|過敏|アレルギー/i;
 const negative=/\b(?:no|without|avoid|exclude|cannot|can['’]?t|don['’]?t eat|do not eat)\b|不吃|不要|不能吃|不含|抜き|なし|食べられ|食べない|苦手|못\s*먹|안\s*먹|제외|빼|싫/ig;
 const positive=/\b(?:want|like|prefer|recommend)\b|想吃|喜欢|喜歡|食べたい|먹고\s*싶|좋아|추천/ig;
 function parse(input){
  const text=String(input).trim().slice(0,2000),result={action:'request:parsed',allergies:[],excluded:[],wanted:[],pendingAllergy:[],unsupported:[],recognized:false};
  const push=(key,value)=>{if(!result[key].includes(value))result[key].push(value);result.recognized=true;};
  if(/my friend|친구|友達|朋友/i.test(text))return result;
  const noAllergy=/\b(?:no (?:food )?allerg(?:y|ies)|not allergic)\b|没有.{0,5}过敏|アレルギー.{0,6}(?:なし|ありません)|알레르기.{0,5}없/i.test(text);
  const targetedNegative=/not allergic to|对.{1,20}不过敏|アレルギーではない/i.test(text);if(noAllergy&&!targetedNegative){result.allergyStatus='none';result.recognized=true;}
  if(/\bvegan\b|비건|纯素|純素|ヴィーガン/i.test(text)){result.diet=/\b(?:not|non)[ -]?(?:a )?vegan\b|비건.{0,3}아니|不是纯素|ヴィーガンではない/i.test(text)?'none':'vegan';result.recognized=true;}
  if((!result.diet||result.diet==='none')&&/\bvegetarian\b|채식|素食|ベジタリアン/i.test(text)){result.diet=/not (?:a )?vegetarian/i.test(text)?'none':'vegetarian';result.recognized=true;}
  if(/non[ -]?spicy|not spicy|no chili|mild|덜\s*맵|안\s*맵|맵지|不辣|微辣|辛くない|辛い.{0,3}(?:苦手|だめ)|辛さ控えめ/i.test(text)){result.spice='mild';result.recognized=true;}
  else if(/\bspicy\b|매운|매콤|辣|辛い/i.test(text)){result.spice='hot';result.recognized=true;}
  const unsupported={budget:/\b(?:budget|krw|won|cheap|under\s*\d)|[₩¥￥$]|\d[\d,]*\s*(?:원|円|元)|예산|预算|予算/i,location:/\b(?:near|station|haeundae|seomyeon|nampo|gwangalli)\b|근처|해운대|서면|남포|附近|车站|駅|近く/i,halal:/halal|할랄|清真|ハラール/i,hours:/open now|opening hours|영업|营业|營業|営業時間|営業中/i};
  for(const [key,re] of Object.entries(unsupported))if(re.test(text))push('unsupported',key);
  // Clause boundaries stop one allergy or exclusion from attaching to an unrelated preference.
  for(const clause of text.split(/[,;.!?\n]|\bbut\b|\band\s+(?=(?:I\b|(?:would )?want\b|(?:am|have)\b))|하지만|그런데|但是|不过|けど/iu)){
   const matches=[];for(const [key,re] of Object.entries(terms)){re.lastIndex=0;for(const m of clause.matchAll(re))matches.push({key,start:m.index,end:m.index+m[0].length});}
   matches.sort((a,b)=>(b.end-b.start)-(a.end-a.start));const tokens=[];for(const m of matches)if(!tokens.some(t=>m.start<t.end&&m.end>t.start))tokens.push(m);tokens.sort((a,b)=>a.start-b.start);
   for(let i=0;i<tokens.length;i++){
    const token=tokens[i],before=clause.slice(0,token.start),after=clause.slice(token.end,i+1<tokens.length?tokens[i+1].start:undefined);
    const markers=[];negative.lastIndex=positive.lastIndex=0;
    for(const m of before.matchAll(negative))markers.push({index:m.index,mode:'excluded'});
    for(const m of before.matchAll(positive))markers.push({index:m.index,mode:'wanted'});
    // Allergy phrases apply to a coordinated list unless a newer preference/exclusion starts.
    const a=before.match(/allerg(?:y|ies|ic|en)?|알레르기|알러지|过敏|過敏|アレルギー/i);if(a&&!noAllergy)markers.push({index:a.index,mode:'allergies'});
    markers.sort((a,b)=>b.index-a.index);let mode=markers[0]?.mode;
    if(/^[\s-]*(?:free\b)|なし|抜き|제외|빼|못\s*먹|안\s*먹|食べられ|苦手|不吃/i.test(after))mode='excluded';
    else if(allergy.test(after)&&!noAllergy)mode='allergies';
    else if(!mode&&allergy.test(clause)&&!noAllergy)mode='allergies';else if(!mode){negative.lastIndex=0;if(negative.test(after))mode='excluded';else if(positive.test(after))mode='wanted';else if(tokens.length===1&&clause.trim().length===token.end-token.start)mode='wanted';}
    if(!mode)continue;
    if(mode==='wanted'&&['meat','seafood','noodles'].includes(token.key)){result.category={meat:'meat',seafood:'seafood',noodles:'noodle'}[token.key];result.recognized=true;}
    if(token.key==='?shellfish'){if(mode==='allergies'){push('pendingAllergy','shellfish');result.allergyStatus='selected';}else if(mode==='excluded'){push('excluded','crustacean');push('excluded','mollusc');}else push('pendingAllergy','shellfish');continue;}
    const key=mode==='allergies'&&token.key==='tofu'?'soy':token.key;
    if(mode==='allergies'){result.allergyStatus='selected';if(['seafood','meat'].includes(key))push('pendingAllergy',key);else push('allergies',key);}else push(mode,key);
   }
   if(allergy.test(clause)&&!noAllergy&&!tokens.length){push('pendingAllergy','unknown');result.allergyStatus='selected';}
  }
  const categories={dessert:/dessert|甜点|甜點|デザート|디저트|후식/i,stew:/\b(?:soup|stew)s?\b|スープ|汤|湯|찜탕/i,snack:/\bsnacks?\b|小吃|軽食|분식/i,any:/anything|any meal|随便|何でも|아무거나/i};for(const [key,re] of Object.entries(categories)){if(re.test(text)&&!negative.test(text)){result.category=key;result.recognized=true;}negative.lastIndex=0;}
  if(/\bor\b|或者|或是|または|또는|혹은/i.test(text))result.ingredientMode='any';
  if(result.allergies.length)result.allergyStatus='selected';
  return result;
 }
 root.VisitorInput={parse};
})(globalThis);
