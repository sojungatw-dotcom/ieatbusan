(function(root){
 'use strict';
 const labels={meat:'고기 전체',beef:'소고기',pork:'돼지고기',chicken:'닭고기',whale:'고래고기',seafood:'해산물 전체',finfish:'생선',mackerel:'고등어',crustacean:'갑각류 전체',shrimp:'새우',crab:'게',mollusc:'연체동물 전체',shellfish:'조개류·전복',squid:'오징어·낙지',jellyfish:'해파리',seasquirt:'멍게',egg:'달걀',dairy:'우유·유제품',wheat:'밀·밀가루',buckwheat:'메밀',soy:'대두',tofu:'두부',peanut:'땅콩',walnut:'호두',pine:'잣',sesame:'참깨',mustard:'겨자',honey:'꿀',mushroom:'버섯'};
 Object.assign(labels,{noodles:'면·국수',sujebi:'수제비',rice:'밥',porridge:'죽',ricecake:'떡',dumpling:'만두·완당',fishcake:'어묵',pancake:'파전',pocket:'유부주머니',soysoup:'콩국',hotteok:'호떡',fruit:'과일',icecream:'아이스크림'});
 const parents={beef:'meat',pork:'meat',chicken:'meat',whale:'meat',finfish:'seafood',mackerel:'finfish',crustacean:'seafood',shrimp:'crustacean',crab:'crustacean',mollusc:'seafood',shellfish:'mollusc',squid:'mollusc',jellyfish:'seafood',seasquirt:'seafood',tofu:'soy'};
 function belongs(key,group){for(let k=key;k;k=parents[k])if(k===group)return true;return false;}
 const related=(a,b)=>belongs(a,b)||belongs(b,a);
 const patterns={beef:/소고기|쇠고기|한우|소곱창|소대창|소막창|소뼈|소갈비/,pork:/돼지|삼겹살|돈코츠|돈골/,chicken:/닭|치킨/,whale:/고래/,shrimp:/새우/,crab:/대게|꽃게|게\(|^게$|(?:^|[\s·,])게(?=$|[\s·,])/,crustacean:/갑각류/,shellfish:/조개|가리비|키조개|백합|전복|소라|굴|홍합|재첩/,squid:/오징어|낙지/,mollusc:/연체동물/,jellyfish:/해파리/,seasquirt:/멍게/,mackerel:/고등어/,finfish:/생선|광어|우럭|도다리|숭어|멸치|먹장어|복어|장어|꽁치|청어|아귀|가자미/,seafood:/해산물|해물|수산물/,egg:/달걀|계란|난류/,dairy:/우유|유제품|치즈|버터|요거트/,wheat:/밀가루|밀면|소맥|(?:^|[\s·,、])밀(?=$|[\s·,、])/m,buckwheat:/메밀/,soy:/대두|두유|간장|된장|쌈장|콩나물|유부/,tofu:/두부/,peanut:/땅콩/,walnut:/호두/,pine:/잣/,sesame:/참깨|참기름/,mustard:/겨자/,honey:/꿀/,mushroom:/버섯/};
 function scan(text){const keys=Object.entries(patterns).filter(([,p])=>p.test(text)).map(([k])=>k);if(/고기소|양념한 고기|소·돼지 내장/.test(text))keys.push('meat');return [...new Set(keys)];}
 const categories={any:'종류 상관없어요',meat:'육류',seafood:'해산물',stew:'찜탕',rice:'밥류',noodle:'면류',snack:'분식',dessert:'디저트'};
 function adapt(food){
  const ko=food.ko||{},rows=food.manuscript?.infoRows||[],row=name=>rows.find(r=>r[0]===name)?.[1]||'';
  const primary=row('주재료')||ko.ingredients||'',note=ko.allergenNote||'';
  let ingredients=scan(primary),possibleIngredients=scan([...(ko.allergens||[]),note].join(' '));
  if(/또는/.test(primary)&&ingredients.includes('beef')&&ingredients.includes('pork')){ingredients=ingredients.filter(k=>!['beef','pork'].includes(k));ingredients.push('meat');possibleIngredients.push('beef','pork');}
  possibleIngredients=[...new Set(possibleIngredients)].filter(k=>!ingredients.includes(k));
  const name=ko.name||food.id,categoryText=row('분류')||ko.category||'',kind=categoryText+' '+name,tags=[];
  if(ingredients.some(k=>belongs(k,'meat')))tags.push('meat');
  if(ingredients.some(k=>belongs(k,'seafood')))tags.push('seafood');
  if(!/물회/.test(name)&&/국(?!수)|탕|죽|찜|전골|조림|낙곱새|조방낙지|완당|유부주머니|물떡/.test(kind))tags.push('stew');
  if(/국밥|덮밥|볶음밥|비빔밥|쌈밥|김밥/.test(kind))tags.push('rice');
  if(/면|국수|우동|당면/.test(kind))tags.push('noodle');
  const isDessert=/호떡|망개떡|디저트|후식/.test(kind);
  if(!isDessert&&/분식|어묵|만두|물떡|완당|유부주머니|시장 간식/.test(kind))tags.push('snack');
  if(isDessert)tags.push('dessert');
  const spiceText=row('매운맛');let spicy=null;if(/^(기본 맵지 않음|기본 낮음)(?:$|,)/.test(spiceText))spicy=false;else if(/^(높음|중간 이상)/.test(spiceText))spicy=true;
  const preferences=[...ingredients];
  if(tags.includes('noodle'))preferences.push('noodles');
  for(const [key,pattern] of Object.entries({sujebi:/수제비/,rice:/밥/,porridge:/죽/,ricecake:/(?<!호)떡/,dumpling:/만두|완당/,fishcake:/어묵/,pancake:/파전/,pocket:/유부주머니/,soysoup:/콩국/,hotteok:/호떡/,fruit:/과일|과일컵|과일샐러드/,icecream:/아이스크림|젤라토/}))if(pattern.test(name))preferences.push(key);
  return {id:food.id,name,photo:food.photo||null,credit:food.credit||null,ingredients,possibleIngredients,preferences:[...new Set(preferences)],categories:tags,category:tags[0]||null,categoryText,price:null,priceText:row('가격')||ko.price||'식당 확인 필요',spicy,spiceText,primary,detail:ko.summary||primary,note,plantCandidate:/채식: 가능성/.test(note),veganVerified:false,veganCandidateNote:note,places:(food.places||[]).map(p=>({name:p.name})),allergenLabels:ko.allergens||[]};
 }
 function filter(foods,s){
  const accepted=[],rejected=[],counts=new Map();
  for(const f of foods){const reasons=[],all=[...f.ingredients,...f.possibleIngredients];
   for(const key of s.allergies||[])if(all.some(k=>related(k,key)))reasons.push('알레르기 관련 재료 또는 포함 가능성: '+labels[key]);
   for(const key of s.excluded||[])if([...all,...(f.preferences||[])].some(k=>related(k,key)))reasons.push('제외 재료·음식 또는 포함 가능성: '+labels[key]);
   if(s.diet==='vegan'){
    if(!f.veganVerified&&(!s.reviewVegan||!f.plantCandidate))reasons.push(s.reviewVegan?'원문에 식물성 기본 재료 후보로 분류되지 않음':'비건 적합성 확정 자료 없음');
    if(f.ingredients.some(k=>['meat','seafood','egg','dairy','honey'].some(group=>belongs(k,group))))reasons.push('비건 기본 조건과 주재료 충돌');
   }else if(s.diet==='vegetarian'&&all.some(k=>belongs(k,'meat')||belongs(k,'seafood')))reasons.push('채식 기본 조건과 동물성 재료·가능성 충돌');
   if(s.wanted?.length){const has=key=>(f.preferences||f.ingredients).some(k=>belongs(k,key));if(!(s.ingredientMode==='any'?s.wanted.some(has):s.wanted.every(has)))reasons.push('찾는 주재료·음식 형태가 원문에 명시되지 않음');}
   if(s.category&&s.category!=='any'&&!f.categories.includes(s.category))reasons.push('선택한 음식 종류와 다름');
   if(s.spice&&s.spice!=='any'&&(f.spicy===null||f.spicy!==(s.spice==='hot')))reasons.push(f.spicy===null?'맵기 정보 확인 필요':'맵기 조건과 다름');
   if(reasons.length){const unique=[...new Set(reasons)];rejected.push({id:f.id,name:f.name,reasons:unique});for(const r of unique)counts.set(r,(counts.get(r)||0)+1);}
   else accepted.push({...f,verification:s.diet==='vegan'?'비건 적합 여부 확인 필요':s.allergies?.length?'알레르기 적합 여부 미확인':'실제 재료·양념 확인 필요'});
  }
  return {foods:accepted,rejected,reasons:[...counts].map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count)};
 }
 const api={labels,parents,belongs,related,scan,adapt,categories,filter};if(typeof module!=='undefined')module.exports=api;else root.BusanRules=api;
})(globalThis);
