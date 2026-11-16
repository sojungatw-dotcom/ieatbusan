/* Korean and selected-language staff card. No server persistence. */
(function(root){
 'use strict';
 const rows=[
  ['card.title','직원에게 보여줄 카드','Card for restaurant staff','向店员出示的卡片','店員に見せるカード'],
  ['card.note','한국어와 선택한 언어를 함께 이미지로 저장합니다.','Save your choices in Korean and your selected language.','将条件以韩文和所选语言一同保存为图片。','韓国語と選択した言語を併記した画像で保存します。'],
  ['card.create','내 조건 이미지 저장','Save my choices as an image','保存条件图片','条件を画像で保存'],
  ['card.pending','식단·알레르기와 충돌 항목을 확인한 후 저장할 수 있습니다.','Complete diet and allergy questions and resolve conflicting choices to save.','请完成饮食与过敏问题并确认冲突条件后保存。','食事制限・アレルギーの質問と矛盾する条件の確認後に保存できます。'],
  ['card.download','PNG 이미지 저장','Download PNG','下载 PNG 图片','PNG画像を保存'],
  ['card.share','이미지 공유','Share image','分享图片','画像を共有'],
  ['card.tip','저장이 시작되지 않으면 아래 저장 버튼을 누르거나 이미지를 길게 눌러 저장해 주세요.','If the download does not start, use the button below or press and hold the image to save it.','如未开始下载，请点击下方保存按钮或长按图片保存。','保存が始まらない場合は下のボタン、または画像を長押しして保存してください。'],
  ['card.failed','이미지 저장을 완료하지 못했습니다. 다시 시도해 주세요.','Could not save the image. Please try again.','未能保存图片，请重试。','画像を保存できませんでした。もう一度お試しください。'],
  ['card.close','카드 닫기','Close card','关闭卡片','カードを閉じる']
 ];if(root.ChatLocale)for(const row of rows)root.ChatLocale.add(...row);
 const diets={none:'별도 식단 없음',vegan:'비건: 동물성 재료·육수·양념을 먹지 않습니다.',vegetarian:'채식: 고기·생선·해산물·육수는 먹지 않으며 달걀·유제품은 먹습니다.'};
 const warning='실제 원료·육수·양념과 교차 접촉 가능성을 확인해 주세요. 안전하게 준비하기 어렵다면 알려 주세요. 이 카드는 사용자가 입력한 조건이며 안전 보증이 아닙니다.';
 const copy={
  en:{title:'Please show this to restaurant staff',subtitle:'My diet and allergy card',labels:['Food allergies','Diet','Other ingredients / dishes to avoid (not allergies)','Preferred ingredients / dishes','Spice level'],none:'None (self-reported)',unknown:'Unconfirmed — allergy status is not known.',empty:'Not specified',diets:{none:'No special diet',vegan:'Vegan: no animal ingredients, broth or seasonings.',vegetarian:'Vegetarian: no meat, fish, seafood or their broth; eggs and dairy are allowed.'},spice:{mild:'Please make it non-spicy. Serve chili, spicy paste and spicy sauces separately.',hot:'Prefer spicy food',any:'Any spice level'},unset:'Not selected yet',warningTitle:'Please check with the restaurant',warning:'Please check the actual ingredients, broth, seasonings and cross-contact risk. Tell me if safe preparation is not possible. These are self-reported choices, not a safety guarantee.'},
  zh:{title:'请向餐厅工作人员出示',subtitle:'我的饮食与过敏确认卡',labels:['食物过敏','饮食方式','其他不吃的食材／菜品（与过敏分开）','想吃的食材／菜品（偏好）','辣度'],none:'无（本人回答）',unknown:'未确认 — 尚不清楚是否存在食物过敏。',empty:'未填写',diets:{none:'无特殊饮食限制',vegan:'纯素：不吃动物性食材、汤底及调味料。',vegetarian:'素食：不吃肉类、鱼类、海鲜及其汤底；可以吃鸡蛋和乳制品。'},spice:{mild:'请做成不辣。辣椒、辣酱及辣味调味料请另外提供。',hot:'偏好辣食',any:'辣度不限'},unset:'尚未选择',warningTitle:'请向餐厅核实',warning:'请核实实际食材、汤底、调味料及交叉接触风险。如果无法安全制作，请告知。这是用户本人填写的条件，不代表安全保证。'},
  ja:{title:'店舗のスタッフにお見せください',subtitle:'食事制限・アレルギー確認カード',labels:['食物アレルギー','食事スタイル','ほかに避ける食材・料理（アレルギーとは別）','食べたい食材・料理（好み）','辛さ'],none:'なし（本人の申告）',unknown:'未確認 — アレルギーの有無は分かりません。',empty:'入力なし',diets:{none:'特別な食事制限なし',vegan:'ヴィーガン：動物性の食材・だし・調味料は食べません。',vegetarian:'ベジタリアン：肉・魚・海産物とそのだしは食べません。卵・乳製品は食べられます。'},spice:{mild:'辛くしないでください。唐辛子・辛い薬味・ソースは別添えにしてください。',hot:'辛い料理を希望',any:'辛さの指定なし'},unset:'まだ選択していません',warningTitle:'店舗にご確認ください',warning:'実際の食材・だし・調味料と交差接触の可能性をご確認ください。安全に調理できない場合はお知らせください。本人が入力した条件であり、安全を保証するものではありません。'}
 };
 function model(state,bot){
  const labels=root.BusanRules.labels,join=keys=>(keys||[]).map(key=>labels[key]||key).join(', '),dishes=ids=>(ids||[]).map(id=>bot.foods.find(food=>food.id===id)).filter(Boolean).map(food=>food.originalName||food.name).join(', ');
  const ready=state.profileComplete===true&&state.stage!=='conflict'&&!state.pendingAllergy?.length&&!(state.allergyStatus==='selected'&&!state.allergies.length);
  const allergy=state.allergies.length?join(state.allergies):state.allergyStatus==='none'&&ready?'없음 (본인 응답)':'미확인 — 알레르기 유무를 확정하지 못했습니다.';
  const card={ready,title:'직원분께 보여 주세요',subtitle:'나의 식단·알레르기 확인 카드',rows:[
   {key:'allergies',label:'음식 알레르기',value:allergy},
   {key:'diet',label:'식단',value:diets[state.diet]||'미확인'},
   {key:'excluded',label:'추가로 피하는 재료·음식 (알레르기와 별개)',value:[join(state.excluded),dishes(state.excludedFoodIds)].filter(Boolean).join(' / ')||'별도 입력 없음'},
   {key:'wanted',label:'먹고 싶은 재료·음식 (선호)',value:[join(state.wanted),dishes(state.requestedFoodIds)].filter(Boolean).join(' / ')||'별도 입력 없음'},
   {key:'spice',label:'맵기',value:state.spice==='mild'?'맵지 않게 부탁드립니다. 고추·다대기·매운 소스는 따로 주세요.':state.spice==='hot'?'매운 음식 선호':state.spice==='any'?'상관없음':'아직 선택하지 않음'}
  ],warning,translation:null};
  const text=copy[bot.language];
  if(text){
   const translatedJoin=keys=>(keys||[]).map(key=>bot.labels[key]||labels[key]||key).join(', ');
   const translatedDishes=ids=>(ids||[]).map(id=>bot.foods.find(food=>food.id===id)).filter(Boolean).map(food=>bot.displayFood(food).name).join(', ');
   const values=[state.allergies.length?translatedJoin(state.allergies):state.allergyStatus==='none'&&ready?text.none:text.unknown,text.diets[state.diet]||text.unknown,[translatedJoin(state.excluded),translatedDishes(state.excludedFoodIds)].filter(Boolean).join(' / ')||text.empty,[translatedJoin(state.wanted),translatedDishes(state.requestedFoodIds)].filter(Boolean).join(' / ')||text.empty,text.spice[state.spice]||text.unset];
   card.translation={language:bot.language,title:text.title,subtitle:text.subtitle,rows:card.rows.map((row,i)=>({key:row.key,label:text.labels[i],value:values[i]})),warningTitle:text.warningTitle,warning:text.warning};
  }
  return card;
 }
 function draw(canvas,data){
  const width=820,padding=40,inner=width-padding*2,font='"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  let ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  function wrap(value,size,bold=false){ctx.font=`${bold?'700':'400'} ${size}px ${font}`;const lines=[];for(const paragraph of String(value).split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line&&ctx.measureText(line+ch).width>inner){lines.push(line);line=ch;}else line+=ch;}lines.push(line);}return lines;}
  let y=66;const blocks=[];
  function add(value,size,color,bold=false,gap=18){const lineHeight=Math.ceil(size*1.55),lines=wrap(value,size,bold);blocks.push({lines,y,size,color,bold,lineHeight});y+=lines.length*lineHeight+gap;}
  add('MUBOSO · I EAT BUSAN',23,'#CC4936',true,20);add(data.title,39,'#282622',true,5);add(data.subtitle,26,'#71685E',false,30);
  if(data.translation){add(data.translation.title,27,'#282622',true,5);add(data.translation.subtitle,23,'#71685E',false,30);}
  for(const row of data.rows){add(row.label,24,row.key==='allergies'?'#CC4936':'#71685E',true,5);add(row.value,32,'#282622',row.key==='allergies',data.translation?8:30);if(data.translation){const translated=data.translation.rows.find(item=>item.key===row.key);add(translated.label,22,'#71685E',true,5);add(translated.value,27,'#514A42',row.key==='allergies',30);}}
  add('식당에 확인해 주세요',25,'#CC4936',true,8);add(data.warning,24,'#514A42',false,20);
  if(data.translation){add(data.translation.warningTitle,23,'#CC4936',true,8);add(data.translation.warning,23,'#514A42',false,20);}
  canvas.width=width;canvas.height=y+padding;ctx=canvas.getContext('2d');ctx.fillStyle='#F5F2EC';ctx.fillRect(0,0,width,canvas.height);ctx.textBaseline='top';
  for(const block of blocks){ctx.fillStyle=block.color;ctx.font=`${block.bold?'700':'400'} ${block.size}px ${font}`;block.lines.forEach((line,i)=>ctx.fillText(line,padding,block.y+i*block.lineHeight));}
  return canvas;
 }
 root.ConditionCard={model,draw};
})(globalThis);
