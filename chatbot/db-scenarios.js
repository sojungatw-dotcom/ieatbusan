(function(root){
 const profile=(diet='none',allergies=[],excluded=[],status='none')=>({action:'profile:submit',diet,allergies,excluded,allergyStatus:allergies.length?'selected':status});
 function route(p,wanted=[],category='any',spice='any',mode='all',vegan='review'){
  return [p,...(p.allergyStatus==='selected'?[{action:'allergies:submit',allergies:p.allergies}]:[]),...(p.diet==='vegan'?['vegan:'+vegan]:[]),'category:'+category,{action:'wanted:submit',wanted,mode,spice},'confirm'];
 }
 const rows=[
  ['basic','01. 제한 없이 부산 음식 둘러보기','기본','별도 식단과 알레르기가 없다고 응답한 뒤 전체 등록 음식을 찾습니다.',profile()],
  ['vegan','02. 비건 · 확인할 식물성 후보','비건','확정 비건 자료가 없음을 안내하고 원문상 식물성 기본 재료 후보만 확인 필요로 보여 줍니다.',profile('vegan')],
  ['vegan-strict','03. 확정 비건 음식만 요청','비건','확인되지 않은 후보 표시는 거절하고, 확정 자료가 없는 현재 상태를 그대로 안내합니다.',profile('vegan'),[],'any','any','all','strict'],
  ['vegan-milk','04. 비건 + 우유 알레르기','비건','식물성 후보 표시를 허용해도 우유 포함 가능성이 있는 음식은 제외합니다.',profile('vegan',['dairy'])],
  ['vegetarian','05. 달걀·유제품 허용 채식','비건','고기와 해산물의 주재료 및 포함 가능성을 검토합니다.',profile('vegetarian')],
  ['wheat-egg','06. 밀·달걀 알레르기 복수 선택','알레르기','주재료뿐 아니라 반죽·고명·소스의 포함 가능성도 함께 제외합니다.',profile('none',['wheat','egg'])],
  ['shrimp-crab','07. 새우·게 복수 선택','알레르기','새우와 게를 각각 저장하고 갑각류 포함 가능성도 보수적으로 검토합니다.',profile('none',['shrimp','crab'])],
  ['wheat-buckwheat','08. 밀과 메밀을 각각 선택','알레르기','밀과 메밀을 같은 재료로 합치지 않고 두 조건을 모두 적용합니다.',profile('none',['wheat','buckwheat'])],
  ['soy-peanut','09. 대두와 땅콩 복수 선택','알레르기','두부·간장 등의 대두 분류와 땅콩을 별도로 처리합니다.',profile('none',['soy','peanut'])],
  ['nuts-seeds','10. 호두·잣·참깨 구분','알레르기','견과와 참깨를 개별 항목으로 선택하고 등록된 확인 사항을 검토합니다.',profile('none',['walnut','pine','sesame'])],
  ['fish-shellfish','11. 생선·조개류 복수 선택','알레르기','생선과 조개를 구분하면서 육수·반찬의 관련 가능성도 제외합니다.',profile('none',['finfish','shellfish'])],
  ['jelly-mustard','12. 해파리·겨자 선택','알레르기','냉채족발처럼 주재료에 해파리·겨자가 명시된 음식이 제외됩니다.',profile('none',['jellyfish','mustard'])],
  ['no-beef-pork','13. 소고기 제외 · 돼지고기 검색','재료','소고기 육수 혼합 가능성이 있는 돼지국밥을 보류하고 다른 돼지고기 후보를 찾습니다.',profile('none',[],['beef']),['pork']],
  ['no-pork-beef','14. 돼지고기 제외 · 소고기 검색','재료','돼지고기 제외와 소고기 포함 조건을 동시에 적용합니다.',profile('none',[],['pork']),['beef']],
  ['want-pork','15. 돼지고기가 먹고 싶은 날','검색','돼지국밥·냉채족발·청도미나리삼겹살처럼 주재료에 돼지고기가 명시된 음식을 찾습니다.',profile(),['pork']],
  ['want-beef','16. 소고기가 먹고 싶은 날','검색','소고기가 가능성 목록에만 있는 음식은 긍정 검색 근거로 쓰지 않습니다.',profile(),['beef']],
  ['want-chicken','17. 닭고기 메뉴 검색','검색','현재 프로젝트의 안동찜닭 등 닭고기 주재료 음식을 찾습니다.',profile(),['chicken']],
  ['want-shrimp','18. 새우가 들어간 음식','검색','선택 가능한 토핑이 아닌 주재료에 새우가 명시된 음식을 찾습니다.',profile(),['shrimp']],
  ['meat','19. 육류 선택','종류','갈비·불고기·삼겹살·고기국밥 등 주재료에 육류가 명시된 음식을 찾습니다.',profile(),[],'meat'],
  ['rice','20. 밥류 선택','종류','국밥·쌈밥·비빔밥·김밥을 밥류로 찾아 식단·알레르기 조건과 함께 적용합니다.',profile(),[],'rice'],
  ['stew','21. 찜탕 선택','종류','국·탕·죽·찜·전골·조림을 묶어 복국·전복죽·완당·안동찜닭 등을 찾습니다.',profile(),[],'stew'],
  ['noodle','22. 면류 선택','종류','현재 등록된 밀면·비빔당면·진주냉면을 면류로 찾습니다.',profile(),[],'noodle'],
  ['snack','23. 분식 선택','종류','어묵·물떡·완당·만두 등 분식을 찾고 달콤한 호떡·망개떡은 디저트로 구분합니다.',profile(),[],'snack'],
  ['seafood','24. 해산물 선택','종류','주재료에 해산물이 명시된 음식을 찾으며 알레르기 확인 항목에만 있는 가능성은 분류 근거로 쓰지 않습니다.',profile(),[],'seafood'],
  ['mild','25. 원문상 기본 맵기가 낮은 음식','맵기','명확한 기본 맵기 설명이 있는 음식만 남기며 불명확한 정보는 추정하지 않습니다.',profile(),[],'any','mild'],
  ['hot','26. 매운 음식 선택','맵기','원문에 높은 매운맛이 명시된 음식만 찾습니다.',profile(),[],'any','hot'],
  ['wheat-noodle','27. 밀 알레르기 + 면 요리','알레르기','당면도 양념·어묵의 밀 가능성을 검토하고, 일치 후보가 없으면 밀 제한을 유지한 대안을 안내합니다.',profile('none',['wheat']),[],'noodle'],
  ['pocket','28. 유부주머니 검색','검색','분식에서 유부주머니를 고르고 고기소·육수 확인 사항을 함께 살펴봅니다.',profile(),['pocket'],'snack'],
  ['beef-shrimp','29. 소고기와 새우 모두 포함','복합','두 재료가 함께 명시된 낙곱새 등 현재 데이터 안에서 찾습니다.',profile(),['beef','shrimp'],'any','any','all'],
  ['beef-or-pork','30. 소고기 또는 돼지고기','복합','둘 중 하나 이상 들어간 음식 검색을 명시적으로 선택합니다.',profile(),['beef','pork'],'any','any','any'],
  ['unknown','31. 알레르기를 모르는 상태','기본','알레르기 미확인을 알레르기 없음으로 바꾸지 않고 결과에 상태를 유지합니다.',profile('none',[],[],'unknown')],
  ['two-meat','32. 소·돼지 제외 후 닭고기 검색','복합','두 고기 제외 조건을 유지하고 닭고기 주재료 음식을 찾습니다.',profile('none',[],['beef','pork']),['chicken']],
 ];
 const scenarios=rows.map(([id,title,group,description,p,wanted=[],category='any',spice='any',mode='all',vegan='review'])=>({id,title,group,description,initial:'시작',steps:route(p,wanted,category,spice,mode,vegan)}));
 scenarios.push({id:'conflict',title:'33. 알레르기와 원하는 재료 충돌',group:'수정',description:'돼지고기 알레르기를 저장한 뒤 돼지고기를 찾으면 충돌을 확인합니다. 알레르기를 자동 해제하지 않습니다.',initial:'시작',steps:[profile('none',['pork']),{action:'allergies:submit',allergies:['pork']},'category:meat',{action:'wanted:submit',wanted:['pork'],mode:'all',spice:'any'},'conflict:remove-wanted','category:any',{action:'wanted:submit',wanted:[],mode:'all',spice:'any'},'confirm']});
 scenarios.push({id:'edit-allergies',title:'34. 추천 후 알레르기 두 항목 추가',group:'수정',description:'처음 추천을 받은 뒤 밀·새우를 추가 선택하면 기존 후보를 재검사합니다.',initial:'시작',steps:[...route(profile()),'result:edit','edit:profile',...route(profile('none',['wheat','shrimp']))]});
 scenarios.push({id:'vegan-wheat',title:'35. 비건 + 밀 알레르기',group:'비건',description:'비건 후보 보기 동의와 별개로 밀 포함 가능성은 제외하며 맞는 후보가 없으면 이유를 안내합니다.',initial:'시작',steps:route(profile('vegan',['wheat']))});
 scenarios.push({id:'prefill',title:'36. 대사로 복수 알레르기 입력',group:'알레르기',description:'“새우와 밀가루 알레르기가 있어”를 체크박스에 반영하고 저장 후 진행합니다.',initial:'새우와 밀가루 알레르기가 있어',steps:route(profile('none',['shrimp','wheat']))});
 scenarios.push({id:'dessert',title:'37. 디저트 선택',group:'종류',description:'씨앗호떡·의령 망개떡을 디저트로 찾으며 원문의 반죽·소·기름 확인 사항을 보여 줍니다.',initial:'시작',steps:route(profile(),[],'dessert')});
 scenarios.push({id:'dessert-wheat',title:'38. 디저트 + 밀 알레르기',group:'알레르기',description:'디저트 일치 후보가 없으면 밀 포함·가능성을 계속 제외한 대안을 찾고 제한은 해제하지 않습니다.',initial:'시작',steps:route(profile('none',['wheat']),[],'dessert')});
 scenarios.push({id:'icecream-alternative',title:'39. 아이스크림 대신 다른 디저트',group:'종류',description:'등록 0개인 아이스크림을 선택하면 식단·알레르기 조건을 유지한 다른 후보 2~3개를 안내합니다.',initial:'시작',steps:route(profile(),['icecream'],'dessert'),expectAlternatives:true});
 scenarios.push({id:'fruit-alternative',title:'40. 과일 디저트 대안',group:'종류',description:'과일 메뉴가 등록되지 않았음을 알리고 현재 등록된 후보를 안내합니다.',initial:'시작',steps:route(profile(),['fruit'],'dessert'),expectAlternatives:true});
 scenarios.push({id:'sujebi-wheat',title:'41. 수제비 요청과 밀 알레르기',group:'알레르기',description:'수제비는 음식 형태로, 밀은 알레르기 성분으로 구분합니다. 대안에서도 밀 포함 가능성을 제외합니다.',initial:'시작',steps:route(profile('none',['wheat']),['sujebi'],'noodle'),expectAlternatives:true});
 scenarios.push({id:'vegan-alternative',title:'42. 비건·우유 알레르기 대안',group:'비건',description:'아이스크림이 없어도 식물성 후보 표시 동의와 우유 알레르기를 유지합니다.',initial:'시작',steps:route(profile('vegan',['dairy']),['icecream'],'dessert'),expectAlternatives:true});
 scenarios.push({id:'no-safe-alternative',title:'43. 제한에 맞는 대안도 없는 경우',group:'비건',description:'비건에 밀·우유·대두 알레르기를 적용해 후보가 없으면 없는 그대로 안내합니다.',initial:'시작',steps:route(profile('vegan',['wheat','dairy','soy']),['icecream'],'dessert'),expectStage:'empty'});
 scenarios.push({id:'allergy-unknown-next',title:'44. 알레르기 항목을 모르는 경우',group:'알레르기',description:'알레르기는 있다고 했지만 정확한 항목을 모르면 미확인으로 저장하고 종류 질문으로 이어갑니다.',initial:'시작',steps:[profile('none',[],[],'selected'),'allergies:unknown','category:any',{action:'wanted:submit',wanted:[],mode:'any',spice:'any'},'confirm']});
 for(const scenario of scenarios)if(['wheat-noodle','dessert-wheat','icecream-alternative','fruit-alternative','sujebi-wheat','vegan-alternative'].includes(scenario.id)){scenario.steps.push('alternatives:accept');scenario.description+=' 종류·주재료를 넓힌 대안은 동의 후 검색하며 낮은 맵기는 유지합니다.';}
 if(typeof module!=='undefined')module.exports=scenarios;else root.FoodScenarios=scenarios;
})(globalThis);
