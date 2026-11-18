/* Presentation only: canonical conversation and recommendation rules stay unchanged. */
(function(root){
 'use strict';
 const rows=[
  ['design.stepDiet','식단·알레르기','Diet & allergies','饮食与过敏','食事・アレルギー'],
  ['design.stepTaste','음식 취향','Food preferences','饮食偏好','料理の好み'],
  ['design.stepResult','확인·추천','Review & results','确认与推荐','確認・おすすめ'],
  ['design.history','이전 선택지 보기','Review previous choices','查看先前选项','以前の選択肢を見る'],
  ['design.choices','현재 조건 보기','View current choices','查看当前条件','現在の条件を見る'],
  ['design.staffTitle','직원에게 보여줄 나의 조건','My choices for restaurant staff','向店员出示的用餐条件','店員に見せる食事条件'],
  ['design.staffIntro','조건을 확인하고 이미지로 저장하세요.','Review your choices and save the card.','请确认条件并保存为图片。','条件を確認して画像で保存できます。'],
  ['design.manage','대화 기록 관리','Conversation records','管理对话记录','対話履歴の管理'],
  ['design.notReady','조건 확인이 필요해요','Review required','需要确认条件','条件の確認が必要です'],
  ['design.ready','저장할 수 있어요','Ready to save','可以保存','保存できます'],
  ['design.category','음식 종류','Food category','食物类别','料理の種類'],
  ['design.veganReview','비건 후보 확인 방식','Vegan candidate review','纯素候选确认方式','ヴィーガン候補の確認方法'],
  ['design.more','자세히 보기','View details','查看详情','詳しく見る']
 ];for(const row of rows)root.ChatLocale.add(...row);
 function phase(stage){return ['category','wanted'].includes(stage)?1:['confirm','results','relax','empty'].includes(stage)?2:0;}
 function staffPreview(state,bot){
  const card=root.ConditionCard.model(state,bot),preview={...card,...(card.translation||{}),ready:card.ready};
  preview.rows=preview.rows.map(row=>({...row}));
  if(state.wanted.length>1){const row=preview.rows.find(row=>row.key==='wanted');row.value+=' · '+root.ChatLocale.ui(state.ingredientMode==='any'?'하나 이상 포함':'모두 포함',bot.language);}
  if(state.category)preview.rows.push({key:'category',label:root.ChatLocale.t('design.category',bot.language),value:bot.categories[state.category]});
  if(state.diet==='vegan')preview.rows.push({key:'veganReview',label:root.ChatLocale.t('design.veganReview',bot.language),value:root.ChatLocale.ui(state.reviewVegan?'확인 필요 후보 표시':'choice.vegan:strict',bot.language)});
  return preview;
 }
 function captureDraft(form){
  if(!form)return null;
  return {kind:form.dataset.kind,inputs:[...form.querySelectorAll('input')].filter(input=>!input.disabled).map(input=>({name:input.name,value:input.value,checked:input.checked}))};
 }
 function restoreDraft(form,draft){
  if(!form||!draft||form.dataset.kind!==draft.kind)return false;
  for(const input of form.querySelectorAll('input')){if(input.disabled)continue;const previous=draft.inputs.find(saved=>saved.name===input.name&&saved.value===input.value);if(previous)input.checked=previous.checked;}
  return true;
 }
 function applySubmission(form,input){
  if(!form||!input||typeof input!=='object')return false;
  let kind,values;
  if(input.action==='profile:submit'){kind='profile';values={diet:[input.diet],allergyStatus:[input.allergyStatus],excluded:input.excluded||[],excludedFood:input.excludedFoodIds||[]};}
  else if(input.action==='allergies:submit'){kind='allergies';values={allergy:input.allergies||[]};}
  else if(input.action==='wanted:submit'){kind='wanted';values={wanted:input.wanted||[],mode:[input.mode],spice:[input.spice||'any']};}
  else return false;
  if(form.dataset.kind!==kind)return false;
  for(const control of form.querySelectorAll('input'))if(Object.hasOwn(values,control.name))control.checked=values[control.name].includes(control.value);
  return true;
 }
 root.ChatDesign={phase,staffPreview,captureDraft,restoreDraft,applySubmission};
})(globalThis);
