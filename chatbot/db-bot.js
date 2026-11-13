(function(root){
 'use strict';
 const node=typeof module!=='undefined',R=node?require('./db-rules.js'):root.BusanRules,data=node?require('./busan-data.js'):root.BusanData;
 const foods=data.foods.map(R.adapt),labels=R.labels,categories=R.categories,diets={none:'별도 식단 없음',vegan:'비건',vegetarian:'채식 · 달걀·유제품 허용'};
 const stages={profile:'식단·알레르기 여부',allergies:'알레르기 항목',veganReview:'비건 후보 안내',wanted:'주재료·맵기',category:'한 끼 종류',confirm:'마지막 확인',results:'음식 후보',empty:'후보 없음',relax:'대안 조건 확인',edit:'나의 조건 수정',conflict:'조건 다시 살펴보기'};
 const allergyKeys=['wheat','buckwheat','egg','dairy','soy','peanut','walnut','pine','sesame','shrimp','crab','crustacean','shellfish','squid','mollusc','finfish','mackerel','beef','pork','chicken','whale','jellyfish','mustard','seasquirt'];
 const excludeKeys=Object.keys(labels);
 const wantedByCategory={meat:['beef','pork','chicken','whale'],seafood:['finfish','shrimp','crab','shellfish','squid','seasquirt','jellyfish'],stew:['beef','pork','chicken','finfish','shellfish','squid','porridge','dumpling','pocket','sujebi'],rice:['beef','pork','finfish','shellfish','squid','seasquirt','rice'],noodle:['noodles','beef','sujebi'],snack:['fishcake','ricecake','dumpling','pancake','pocket','soysoup'],dessert:['fruit','icecream','hotteok','ricecake']};
 const mainKeys=[...new Set(Object.values(wantedByCategory).flat())];
 function wantedKeys(s){return [...new Set([...(wantedByCategory[s.category]||mainKeys),...(s.wanted||[])])];}
 const spiceLabels={any:'맵기 상관없어요',mild:'기본 맵기가 낮은 음식',hot:'매운 음식'};
 const createState=()=>({stage:'profile',diet:'none',profileComplete:false,allergyStatus:'unknown',allergies:[],excluded:[],allowed:[],wanted:[],ingredientMode:'all',reviewVegan:false,category:null,spice:null,requestedFoodIds:[],excludedFoodIds:[],seen:[],proposal:null,pendingAllergy:[],unsupported:[],relaxAllowed:false});
 const clone=s=>JSON.parse(JSON.stringify(s)),c=(id,label)=>({id,label});
 function summary(s){const parts=[diets[s.diet]];parts.push('알레르기: '+(s.allergies.length?s.allergies.map(k=>labels[k]).join(', '):s.allergyStatus==='none'?'없다고 응답':'미확인'));if(s.excluded.length)parts.push('추가 제외: '+s.excluded.map(k=>labels[k]).join(', '));if(s.wanted.length)parts.push('찾는 재료: '+s.wanted.map(k=>labels[k]).join(s.ingredientMode==='any'?' 또는 ':' + '));if(s.requestedFoodIds.length)parts.push('음식: '+s.requestedFoodIds.map(id=>foods.find(f=>f.id===id)?.name||id).join(', '));if(s.category)parts.push(categories[s.category]);if(s.spice)parts.push(s.spice==='mild'?'원문상 기본 맵기 낮음':s.spice==='hot'?'매운 음식':'맵기 상관없음');return parts.join(' · ');}
 function describeAction(action){if(typeof action==='string')return action;if(action.action==='profile:submit')return `${diets[action.diet]} / 알레르기: ${action.allergies?.length?action.allergies.map(k=>labels[k]).join(', '):action.allergyStatus==='none'?'없어요':action.allergyStatus==='selected'?'있어요 · 다음 질문에서 선택':'모르겠어요'}${action.excluded?.length?' / 추가 제외: '+action.excluded.map(k=>labels[k]).join(', '):''}`;if(action.action==='allergies:submit')return '알레르기: '+action.allergies.map(k=>labels[k]).join(', ');if(action.action==='wanted:submit')return '주재료·음식: '+(action.wanted.map(k=>labels[k]).join(', ')||'상관없어요')+' / '+(action.mode==='any'?'하나 이상 포함':'모두 포함')+' / '+(spiceLabels[action.spice||'any']);return action.action;}
 function getConflict(s){const dish=s.requestedFoodIds.find(id=>s.excludedFoodIds?.includes(id));if(dish){s.proposal='food:'+dish;s.stage='conflict';return true;}const blocked=s.wanted.find(k=>s.allergies.some(a=>R.related(k,a))||s.excluded.some(a=>R.related(k,a))||(s.diet==='vegan'&&['meat','seafood','egg','dairy','honey'].some(a=>R.belongs(k,a)))||(s.diet==='vegetarian'&&['meat','seafood'].some(a=>R.belongs(k,a))));if(blocked){s.proposal=blocked;s.stage='conflict';return true;}return false;}
 function view(s,prefix='',matches=[],selected=[],info={}){
  let text='',choices=[],form=null;
  switch(s.stage){
   case 'profile':text='부산의 한 끼, 함께 찾아볼까요?\n먼저 식단과 알레르기가 있는지 알려 주세요. 있다고 답하시면 다음 질문에서 항목을 고를 수 있어요.';form={kind:'profile',excludeKeys};choices=[c('profile:submit','다음으로')];break;
   case 'allergies':text='어떤 알레르기가 있으신가요?\n피해야 하는 항목을 모두 골라 주세요. 알려 주신 항목은 미리 선택해 두었습니다.';form={kind:'allergies',allergyKeys};choices=[c('allergies:submit','알레르기 항목 저장'),c('allergies:unknown','정확한 항목은 모르겠어요'),c('allergies:back','알레르기 여부 다시 선택')];break;
   case 'veganReview':text='DB에 비건 적합성이 확인된 음식 '+foods.filter(f=>f.veganVerified).length+'개가 등록되어 있습니다. 식물성 기본 재료 후보 '+foods.filter(f=>f.plantCandidate).length+'개를 “비건 여부 확인 필요” 후보로 볼까요? 알려 주신 알레르기와 피하는 재료는 계속 적용합니다.';choices=[c('vegan:review','확인이 필요한 식물성 후보도 보기'),c('vegan:strict','확정된 비건 음식만 보기')];break;
   case 'wanted':{const keys=wantedKeys(s),items=foods.filter(f=>!s.category||s.category==='any'||f.categories.includes(s.category));text=(s.category&&s.category!=='any'?categories[s.category]+'에서 ':'')+'어떤 주재료나 음식이 당기시나요?\n여러 항목을 고르거나 선택 없이 넘어가셔도 좋아요. 맵기도 함께 알려 주세요.';form={kind:'wanted',wantedKeys:keys.filter(k=>s.wanted.includes(k)||items.some(f=>f.preferences.some(p=>R.belongs(p,k)))),spiceLabels,counts:Object.fromEntries(keys.map(k=>[k,items.filter(f=>f.preferences.some(p=>R.belongs(p,k))).length]))};choices=[c('wanted:submit','이 취향으로 찾기')];break;}
   case 'category':text='어떤 한 끼가 좋으세요?\n든든한 밥부터 달콤한 디저트까지, 원하시는 종류를 골라 주세요.';choices=Object.entries(categories).filter(([key])=>key==='any'||foods.some(f=>f.categories.includes(key))).map(([key,label])=>c('category:'+key,label));break;
   case 'confirm':text='이렇게 골라드리면 될까요?\n'+summary(s)+'\n등록된 부산·부울경 음식에서 살펴보겠습니다. 실제 재료와 조리 환경은 식당에 확인해 주세요.';choices=[c('confirm','이 조건으로 찾기'),c('result:edit','조건 수정')];break;
   case 'results':text=(info.alternatives?'요청하신 종류·주재료·맵기로는 등록된 음식을 찾지 못했어요.\n식단·알레르기·추가 제외 조건은 그대로 유지하고, 동의하신 종류·주재료 취향을 넓혀 (낮은 맵기는 유지) 다른 후보 '+selected.length+'개를 무작위로 골랐습니다.\n원래 요청: '+summary(s):'이런 부산의 맛은 어떠세요?\n조건으로 살펴볼 수 있는 음식 '+(info.total||0)+'개 중 '+selected.length+'개를 골랐습니다.')+(s.diet==='vegan'?'\n비건 적합 여부는 확인이 필요합니다.':'')+(s.allergies.length?'\n선택한 알레르기 재료가 명시되거나 포함 가능성이 적힌 음식은 제외했습니다. 남은 음식도 식당 확인이 필요합니다.':'\n식당마다 재료와 양념이 다를 수 있어요. 음식 정보를 함께 확인해 주세요.');choices=[c('result:more','다른 후보 보기'),c('result:edit','조건 수정')];break;
   case 'empty':text=(info.exhausted?'지금 조건으로 살펴볼 새 음식은 모두 보여 드렸어요.':'아쉽지만 지금 조건으로 살펴볼 음식을 찾지 못했어요.')+'\n'+summary(s)+'\n'+(info.reasons?.slice(0,3).map(r=>r.reason).join(' / ')||'식당별 확인 정보가 더 필요합니다.')+'\n알레르기와 식단 조건은 유지했습니다. 다른 종류나 재료로 다시 살펴볼까요?';choices=[c('result:edit','조건 수정'),c('result:again','같은 조건으로 처음부터 보기')];break;
   case 'relax':text='일치하는 음식이 없습니다. 식단·알레르기·제외와 낮은 맵기 조건은 유지하고 종류·원하는 주재료만 넓혀 다른 후보를 찾아볼까요?';choices=[c('alternatives:accept','조건 완화에 동의 · 대안 찾기'),c('result:edit','조건 수정')];break;
   case 'edit':text='바꾸고 싶은 항목을 선택해 주세요. 다른 조건은 유지합니다.';choices=[c('edit:profile','식단·알레르기·제외 재료 수정'),c('edit:category','한 끼 종류 수정'),c('edit:wanted','주재료·맵기 수정'),c('edit:done','현재 조건으로 돌아가기')];break;
   case 'conflict':text='찾고 싶은 '+(labels[s.proposal]||foods.find(f=>'food:'+f.id===s.proposal)?.name||'음식')+' 재료가 현재 식단·알레르기·제외 조건과 충돌합니다. 제외 조건을 유지하고 찾는 재료를 빼거나, 조건 설정 화면에서 직접 검토해 주세요.';choices=[c('conflict:remove-wanted','제외 조건 유지 · 찾는 재료 빼기'),c('conflict:profile','식단·알레르기 설정 다시 검토')];break;
  }
  return {state:s,text:prefix?prefix+'\n\n'+text:text,choices,form,matches,foods:selected,uncertain:s.stage==='empty'||s.stage==='conflict',...info};
 }
 function shuffled(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
 function results(s,matches){if(s.pendingAllergy?.length){s.stage='allergies';return view(s);}const all=R.filter(foods,s);if(s.requestedFoodIds.length)all.foods=all.foods.filter(f=>s.requestedFoodIds.includes(f.id));const fresh=all.foods.filter(f=>!s.seen.includes(f.id));let selected=fresh.slice(0,3),alternatives=false;
  if(!all.foods.length){if(!s.relaxAllowed){const possible=R.filter(foods,{...s,wanted:[],category:'any',spice:s.spice==='mild'?'mild':'any',requestedFoodIds:[]}).foods;if(possible.length){s.stage='relax';return view(s);}}const relaxed={...s,wanted:[],category:'any',spice:s.spice==='mild'?'mild':'any',requestedFoodIds:[]},pool=R.filter(foods,relaxed).foods.filter(f=>!s.seen.includes(f.id)),same=pool.filter(f=>s.category&&s.category!=='any'&&f.categories.includes(s.category));selected=shuffled(same.length>=2?same:pool).slice(0,3);alternatives=selected.length>0;}
  s.stage=selected.length?'results':'empty';s.seen.push(...selected.map(f=>f.id));return view(s,'',matches,selected,{total:all.foods.length,alternatives,exhausted:all.foods.length>0&&!fresh.length,reasons:all.reasons});}
 function afterProfile(s){s.profileComplete=true;if(s.pendingAllergy?.length){s.stage='allergies';return;}if(getConflict(s))return;if(s.diet==='vegan')s.stage='veganReview';else s.stage='category';}
 function respond(input,previous=createState()){
  const s=clone(previous),matches=[];
  if(input&&typeof input==='object'){
   if(input.action==='request:uncertain')return view(s,'입력만으로 조건을 확정하기 어려워 기존 선택을 유지했습니다. 원하는 재료와 피할 재료를 각각 선택해 주세요.',[],[],{uncertain:true});
   if(input.action==='request:parsed'){
    if(input.diet)s.diet=input.diet;
    if(input.allergyStatus==='none'){s.allergies=[];s.pendingAllergy=[];s.allergyStatus='none';}
    for(const key of ['allergies','excluded','wanted'])for(const value of input[key]||[])if((key==='allergies'?allergyKeys:key==='excluded'?excludeKeys:Object.keys(labels)).includes(value)&&!s[key].includes(value))s[key].push(value);
    if(input.allergies?.length||input.pendingAllergy?.length)s.allergyStatus='selected';
    s.pendingAllergy=[...new Set([...(s.pendingAllergy||[]),...(input.pendingAllergy||[])])];
    s.unsupported=[...new Set([...(s.unsupported||[]),...(input.unsupported||[])])];
    s.wanted=s.wanted.filter(k=>!(input.excluded||[]).some(a=>R.related(k,a))&&!(input.allergies||[]).some(a=>R.related(k,a)));
    for(const key of input.wanted||[])if(Object.hasOwn(labels,key)&&!s.wanted.includes(key))s.wanted.push(key);
    if(input.excludedFoodIds){s.excludedFoodIds=[...new Set([...(s.excludedFoodIds||[]),...input.excludedFoodIds.filter(id=>foods.some(f=>f.id===id))])];s.requestedFoodIds=s.requestedFoodIds.filter(id=>!s.excludedFoodIds.includes(id));}if(input.requestedFoodIds){s.requestedFoodIds=input.requestedFoodIds.filter(id=>foods.some(f=>f.id===id));s.category=null;}
    if(input.spice)s.spice=input.spice;if(input.category)s.category=input.category;if(input.wanted?.length&&!input.requestedFoodIds)s.requestedFoodIds=[];
    if(input.ingredientMode)s.ingredientMode=input.ingredientMode;
    s.seen=[];s.relaxAllowed=false;
    s.stage=s.pendingAllergy.length?'allergies':!s.profileComplete||input.diet||input.allergyStatus?'profile':'confirm';
    if(!s.pendingAllergy.length)getConflict(s);
    return view(s,'',[],[],{interpretation:{applied:{diet:input.diet,allergies:input.allergies,excluded:input.excluded,wanted:input.wanted,spice:input.spice},unresolved:s.pendingAllergy,unsupported:s.unsupported}});
   }
   if(input.action==='profile:open'){s.stage='profile';return view(s,'식단과 피하실 재료를 다시 살펴볼까요? 기존 선택은 그대로 가져왔습니다.');}
   const action=input.action;if(!view(s).choices.some(x=>x.id===action))return view(s,'현재 질문에 표시된 항목을 선택해 주세요.');
   if(action==='profile:submit'){
    if(!Object.hasOwn(diets,input.diet)||!['none','selected','unknown'].includes(input.allergyStatus)||!Array.isArray(input.allergies)||!input.allergies.every(k=>allergyKeys.includes(k))||!Array.isArray(input.excluded)||!input.excluded.every(k=>excludeKeys.includes(k)))return view(s,'식단과 재료 항목을 다시 확인해 주세요.');
    if(input.excludedFoodIds!==undefined){if(!Array.isArray(input.excludedFoodIds)||!input.excludedFoodIds.every(id=>s.excludedFoodIds?.includes(id)))return view(s,'식단과 재료 항목을 다시 확인해 주세요.');s.excludedFoodIds=input.excludedFoodIds;}
    s.diet=input.diet;s.allergies=input.allergyStatus==='selected'?[...new Set(input.allergies)]:[];s.excluded=[...new Set(input.excluded)];s.allergyStatus=input.allergyStatus;s.profileComplete=false;s.reviewVegan=false;s.relaxAllowed=false;s.seen=[];if(s.allergyStatus==='selected')s.stage='allergies';else afterProfile(s);
   }else if(action==='allergies:submit'){
    if(!Array.isArray(input.allergies)||!input.allergies.length||!input.allergies.every(k=>allergyKeys.includes(k)))return view(s,'알레르기 항목을 한 개 이상 선택해 주세요. 정확히 모르시면 미확인을 선택해 주세요.');
    s.allergies=[...new Set(input.allergies)];s.pendingAllergy=[];s.allergyStatus='selected';s.seen=[];afterProfile(s);
   }else if(action==='allergies:unknown'){s.allergies=[];s.pendingAllergy=[];s.allergyStatus='unknown';afterProfile(s);
   }else if(action==='allergies:back'){s.stage='profile';
   }else if(action==='wanted:submit'){
    if(!Array.isArray(input.wanted)||!input.wanted.every(k=>wantedKeys(s).includes(k))||!['all','any'].includes(input.mode)||!Object.hasOwn(spiceLabels,input.spice||'any'))return view(s,'찾을 재료와 포함 방식을 다시 선택해 주세요.');
    s.wanted=[...new Set(input.wanted)];s.ingredientMode=input.mode;s.spice=input.spice||'any';s.seen=[];s.relaxAllowed=false;if(!getConflict(s))s.stage='confirm';
   }
   else if(action.startsWith('vegan:')){s.reviewVegan=action==='vegan:review';s.stage='category';}
   else if(action.startsWith('category:')){const next=action.slice(9);if(s.category&&s.category!==next){s.wanted=[];}s.category=next;s.relaxAllowed=false;s.wanted=s.wanted.filter(k=>wantedKeys(s).includes(k));s.seen=[];s.stage='wanted';}
   else if(action==='alternatives:accept'){s.relaxAllowed=true;return results(s,[]);}
   else if(action==='confirm'||action==='result:more'||action==='result:again'){if(action==='result:again')s.seen=[];return results(s,[{rule:'실제 프로젝트 데이터 검색',evidence:summary(s)}]);}
   else if(action==='result:edit')s.stage='edit';
   else if(action.startsWith('edit:')){const key=action.slice(5);s.stage=key==='done'?'confirm':key;if(key==='category')s.requestedFoodIds=[];s.seen=[];}
   else if(action==='conflict:profile')s.stage='profile';
   else if(action==='conflict:remove-wanted'){if(s.proposal?.startsWith('food:'))s.requestedFoodIds=s.requestedFoodIds.filter(id=>'food:'+id!==s.proposal);s.wanted=s.wanted.filter(k=>!R.related(k,s.proposal));s.proposal=null;if(!getConflict(s))s.stage=!s.profileComplete?'profile':s.diet==='vegan'?'veganReview':'category';}
   matches.push({rule:'대화 조건 저장',evidence:describeAction(input)});return view(s,'',matches);
  }
  const text=String(input||'').trim().slice(0,2000);if(!text||/^(시작|안녕|안녕하세요)[.!\s]*$/.test(text))return view(s);
  if(s.stage==='conflict')return view(s,'충돌하는 조건을 먼저 검토해 주세요.');
  if(/^(다른\s*(거|후보|메뉴))$/.test(text)&&s.stage==='results')return respond({action:'result:more'},s);
  if(/^(응|네|좋아|찾아줘|추천해줘)$/.test(text)&&s.stage==='confirm')return respond({action:'confirm'},s);
  if(/친구|예전|과거|될까요|싫은\s*건\s*아/.test(text))return view(s,'현재 본인의 조건으로 확정하기 어려워 기존 조건을 유지했습니다. 아래에서 선택해 주세요.');
  let known=false,profileChanged=false;
  if(/비건/.test(text)){s.diet=/비건(?:은|이)?\s*아니/.test(text)?'none':'vegan';known=true;profileChanged=true;}
  else if(/채식/.test(text)){s.diet='vegetarian';known=true;profileChanged=true;}
  if(/(?:알레르기|알러지).{0,5}없/.test(text)){s.allergyStatus='none';s.allergies=[];known=true;profileChanged=true;}
  else if(/(?:알레르기|알러지).{0,5}있/.test(text)){s.allergyStatus='selected';known=true;profileChanged=true;}
  const terms=[...text.matchAll(/아이스크림|과일|수제비|면류|면|국수|호떡|떡|만두|완당|어묵|소고기|쇠고기|돼지고기|돼지|닭고기|닭|고기|해산물|생선|고등어|새우|갑각류|조개류|전복|오징어|낙지|해파리|멍게|달걀|계란|우유|유제품|치즈|밀가루|메밀|밀(?=\s|은|는|도|을|$)|대두|두부|땅콩|호두|잣|참깨|겨자|꿀|버섯/g)];
  const keyFor=t=>({아이스크림:'icecream',과일:'fruit',수제비:'sujebi',면류:'noodles',면:'noodles',국수:'noodles',호떡:'hotteok',떡:'ricecake',만두:'dumpling',완당:'dumpling',어묵:'fishcake',소고기:'beef',쇠고기:'beef',돼지고기:'pork',돼지:'pork',닭고기:'chicken',닭:'chicken',고기:'meat',해산물:'seafood',생선:'finfish',고등어:'mackerel',새우:'shrimp',갑각류:'crustacean',조개류:'shellfish',전복:'shellfish',오징어:'squid',낙지:'squid',해파리:'jellyfish',멍게:'seasquirt',달걀:'egg',계란:'egg',우유:'dairy',유제품:'dairy',치즈:'dairy',밀가루:'wheat',밀:'wheat',메밀:'buckwheat',대두:'soy',두부:'tofu',땅콩:'peanut',호두:'walnut',잣:'pine',참깨:'sesame',겨자:'mustard',꿀:'honey',버섯:'mushroom'})[t];
  const segment=i=>text.slice(terms[i].index+terms[i][0].length,i+1<terms.length?terms[i+1].index:text.length);
  const predicate=/알레르기|알러지|못\s*먹|안\s*먹|빼|제외|싫|먹고\s*싶|추천|검색|들어간|포함한/;
  terms.forEach((m,i)=>{let tail=segment(i);let j=i;while(!predicate.test(tail)&&j<terms.length-1&&/^[\s,]*(?:(?:은|는|이|가|와|과|랑|이랑|또는|하고)[\s,]*)?$/.test(tail)){tail=segment(++j);}tail=tail.split(/[.!?\n]/)[0];const k=keyFor(m[0]);
   if(/알레르기|알러지/.test(tail)&&!/없/.test(tail)){const allergen=k==='tofu'?'soy':k;if(allergyKeys.includes(allergen)&&!s.allergies.includes(allergen))s.allergies.push(allergen);s.allergyStatus='selected';profileChanged=true;known=true;}
   else if(/못\s*먹|안\s*먹|빼|제외|싫/.test(tail)){if(excludeKeys.includes(k)&&!s.excluded.includes(k))s.excluded.push(k);profileChanged=true;known=true;}
   else if(/먹고\s*싶|추천|검색|들어간|포함한/.test(tail)||text===m[0]){if(!s.wanted.includes(k))s.wanted.push(k);known=true;}
  });
  if(/또는|혹은|아니면/.test(text))s.ingredientMode='any';else if(/함께|같이|모두/.test(text))s.ingredientMode='all';
  const categoryTerms={meat:/육류/,seafood:/해산물/,stew:/찜탕|찜[·\s]*탕|국[·\s]*탕/,rice:/밥류|밥\s*요리/,noodle:/면류|면\s*요리/,snack:/분식/,dessert:/디저트|후식/};
  const categoryFromText=Object.entries(categoryTerms).find(([,pattern])=>pattern.test(text))?.[0];if(categoryFromText){s.category=categoryFromText;s.requestedFoodIds=[];known=true;}
  const dish=foods.find(f=>text.includes(f.name));if(dish){s.requestedFoodIds=[dish.id];s.category=dish.categories[0]||'any';known=true;}
  if(/추천|아무거나|찾아/.test(text))known=true;
  if(!known)return view(previous,'등록된 표현으로 확정하기 어려워 조건을 유지했습니다. 아래 선택지로 이어가 주세요.',[{rule:'확인 질문',evidence:text}]);
  s.seen=[];
  if(!profileChanged&&s.profileComplete&&s.wanted.length&&!getConflict(s)){
   const desired=s.wanted.filter(k=>mainKeys.includes(k));if(desired.length&&desired.some(k=>!wantedKeys(s).includes(k))){s.category=Object.keys(wantedByCategory).find(key=>desired.every(k=>wantedByCategory[key].includes(k)))||'any';s.spice=null;}
   if(!R.filter(foods,{...s,diet:'none',allergies:[],excluded:[],category:'any',spice:'any'}).foods.length)return results(s,[{rule:'DB에 없는 직접 요청의 대안 검색',evidence:text}]);
  }
  s.seen=[];if(profileChanged||!s.profileComplete){s.stage='profile';}else if(!getConflict(s)){s.stage=categoryFromText||s.category?'wanted':'category';}
  matches.push({rule:'직접 입력을 선택 화면에 반영',evidence:text});return view(s,'입력하신 조건을 아래 선택 화면에 반영했습니다. 저장한 뒤 대화를 이어가 주세요.',matches);
 }
 function replaceCatalog(input,metadata={}){if(!Array.isArray(input))return false;if(metadata.available===false)input=[];const unique=new Map();for(const food of input){if(food&&typeof food.id==='string'&&food.id&&food.ko&&typeof food.ko.name==='string')unique.set(food.id,food);}const raw=[...unique.values()],next=raw.map(R.adapt);const changed=JSON.stringify(foods)!==JSON.stringify(next)||data.available!==(metadata.available!==false);data.available=metadata.available!==false;if(changed){foods.splice(0,foods.length,...next);data.foods=raw;data.source=metadata.source||'앱 음식 카탈로그';data.syncedAt=metadata.syncedAt||new Date().toISOString();}return changed;}
 const api={replaceCatalog,createState,respond,view,summary,describeAction,labels,categories,diets,stages,foods,source:data,allergyKeys};if(node)module.exports=api;else root.FoodGuide=api;
})(globalThis);
