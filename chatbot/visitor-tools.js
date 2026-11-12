(function(root){
 'use strict';
 function replay(inputs,bot){let result=bot.view(bot.createState());const history=[];for(const input of inputs.slice(-100)){if(typeof input!=='string'&&(!input||typeof input!=='object'))continue;try{result=bot.respond(input,result.state);}catch{continue;}history.push({rawInput:input,result:result._canonical||result});}return {result,history};}
 function orderCard(food,state,bot){
  const labels=root.BusanRules.labels,lines=['메뉴: '+(food.originalName||food.name),food.name];
  if(state.diet==='vegan')lines.push('비건 식사를 합니다. 고기, 생선, 해산물, 달걀, 유제품, 꿀과 동물성 육수·양념이 들어가나요?');
  else if(state.diet==='vegetarian')lines.push('고기·생선·해산물과 그 육수는 먹지 않습니다. 달걀·유제품은 먹습니다.');
  if(state.pendingAllergy?.length)lines.push('알레르기 항목이 아직 미확인입니다. 갑각류·조개류 등 정확한 범위와 재료·교차 접촉을 먼저 확인해 주세요.');
  if(state.allergies.length)lines.push('음식 알레르기가 있습니다: '+state.allergies.map(k=>labels[k]).join(', ')+'. 재료·육수·소스·새우젓과 교차 접촉 가능성을 확인해 주세요.');
  if(state.excluded.length)lines.push('이 재료는 빼 주세요: '+state.excluded.map(k=>labels[k]).join(', ')+'. 미리 들어간 재료라면 알려 주세요.');
  if(state.excludedFoodIds?.length)lines.push('이 음식은 원하지 않습니다: '+state.excludedFoodIds.map(id=>bot.foods.find(f=>f.id===id)?.name||id).join(', ')+'.');
  if(state.spice==='mild')lines.push('맵지 않은 음식을 원합니다. 고추·다대기·매운 소스는 따로 주세요.');
  lines.push('실제 재료와 조리 환경을 확인해 주세요. 안전하게 준비하기 어렵다면 알려 주세요.');return [...new Set(lines)].join('\n');
 }
 function snapshot(history,language,now=Date.now()){return {version:1,savedAt:now,language,inputs:history.slice(-100).map(h=>h.rawInput)};}
 function readSnapshot(storage,now=Date.now()){try{const data=JSON.parse(storage.getItem('ieb.chatbot.recovery.v1')||'null');if(data&&Number.isFinite(data.savedAt)&&now-data.savedAt>=86400000){storage.removeItem?.('ieb.chatbot.recovery.v1');return null;}return data?.version===1&&Number.isFinite(data.savedAt)&&now-data.savedAt<86400000&&Array.isArray(data.inputs)&&data.inputs.length<=100?data:null;}catch{return null;}}
 root.VisitorTools={replay,orderCard,snapshot,readSnapshot};
})(globalThis);
