(function(root){
 'use strict';
 const controls=form=>form?[...form.querySelectorAll('input')].filter(input=>!input.disabled):[];
 function capture(form){return form?{kind:form.dataset.kind,inputs:controls(form).map(input=>({name:input.name,value:input.value,checked:input.checked}))}:null;}
 function restore(form,draft){if(!form||!draft||form.dataset.kind!==draft.kind)return false;for(const input of controls(form)){const saved=draft.inputs.find(row=>row.name===input.name&&row.value===input.value);input.checked=!!saved?.checked;}return true;}
 function submission(form,state){
  if(!form)return null;const values=name=>controls(form).filter(input=>input.name===name&&input.checked).map(input=>input.value);
  if(form.dataset.kind==='profile'){const allergyStatus=values('allergyStatus')[0];return {action:'profile:submit',diet:values('diet')[0],allergyStatus,allergies:allergyStatus==='selected'?[...state.allergies]:[],excluded:values('excluded'),excludedFoodIds:values('excludedFood')};}
  if(form.dataset.kind==='allergies')return {action:'allergies:submit',allergies:values('allergy')};
  if(form.dataset.kind==='wanted')return {action:'wanted:submit',wanted:values('wanted'),mode:values('mode')[0],spice:values('spice')[0]};
  return null;
 }
 const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
 function plan(text,form,state){
  text=String(text||'').trim();const selected=submission(form,state);if(!text)return selected?[selected]:[];
  // Text wins over food preferences. Visible restriction edits remain binding.
  const profileChanged=selected?.action==='profile:submit'&&(selected.diet!==state.diet||selected.allergyStatus!==state.allergyStatus||!same(selected.excluded,state.excluded)||!same(selected.excludedFoodIds,state.excludedFoodIds||[]));
  const allergyChanged=selected?.action==='allergies:submit'&&selected.allergies.length&&!same(selected.allergies,state.allergies);
  return profileChanged||allergyChanged?[selected,text]:[text];
 }
 root.ChatInput={capture,restore,submission,plan};
 if(root.ChatLocale)root.ChatLocale.add('등록 음식 전체 목록입니다. 식단·알레르기 조건을 반영하려면 도우미와 대화해 주세요.','선택한 식단·알레르기·제외 조건을 반영한 목록입니다. 실제 재료는 식당에 확인해 주세요.','This list applies your diet, allergies and exclusions. Confirm actual ingredients with the restaurant.','此列表已应用饮食、过敏及排除条件。请向餐厅确认实际食材。','食事制限・アレルギー・除外条件を反映した一覧です。実際の原材料は店舗に確認してください。');
})(globalThis);
