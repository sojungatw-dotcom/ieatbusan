(function() {
 'use strict';
 const bot=FoodGuide,$=id=>document.getElementById(id),T=value=>ChatLocale.ui(value,bot.language);
 bot.setLanguage(new URLSearchParams(location.search).get('lang')||'ko');
 document.querySelectorAll('select option:not([value])').forEach(option=>{option.value=option.textContent;});
 const staticText=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let staticNode;while((staticNode=walker.nextNode())){const value=staticNode.nodeValue.trim();if(value&&/[가-힣]/.test(value)&&!['SCRIPT','STYLE'].includes(staticNode.parentElement?.tagName))staticText.push({node:staticNode,original:staticNode.nodeValue,value});}
 const staticAttributes=[];document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(node=>{for(const name of ['aria-label','placeholder','title']){const value=node.getAttribute(name);if(value&&/[가-힣]/.test(value))staticAttributes.push({node,name,value});}});
 function translateStatic(){document.querySelectorAll('[data-visitor-text]').forEach(node=>{node.textContent=T(node.dataset.visitorText);});document.documentElement.lang=bot.language;document.title=T('무보소 · 나에게 맞는 부산의 맛');for(const item of staticText)if(item.node.isConnected)item.node.nodeValue=item.original.replace(item.value,T(item.value));for(const item of staticAttributes)if(item.node.isConnected)item.node.setAttribute(item.name,T(item.value));}
 function displayScenario(scenario){return ChatLocale.scenario?ChatLocale.scenario(scenario,bot.language):scenario;}
 function userLabel(value){return typeof value==='object'?bot.describeAction(value):value==='시작'?T(value):value;}

 let state=bot.createState(),recoveryInputs=[],history=[],activeScenario=null,catalogCategory='any';
 const input=$('message');
 document.body.classList.add('embedded');
 function bridge(type){if(window.parent!==window)window.parent.postMessage({type},location.origin==='null'?'*':location.origin);}
 function setMode(mode){document.body.classList.toggle('embedded-desktop',mode==='desktop');$('close-chat').setAttribute('aria-label',mode==='desktop'?T('챗봇 닫기'):T('이전 화면으로 돌아가기'));}
 document.body.classList.toggle('embedded-desktop',new URLSearchParams(location.search).get('embed')==='desktop');
 window.addEventListener('message',event=>{if(event.source!==window.parent||event.origin!==location.origin)return;if(event.data?.type==='ieb-chatbot:mode'&&['desktop','mobile'].includes(event.data.mode))setMode(event.data.mode);});

 const panel=$('chatbot-panel'),launcher=$('chatbot-launcher'),mobile=window.matchMedia('(max-width:740px)');
 let returnFocus=launcher;
 function syncChatSurface(){
  const opened=true;
  panel.hidden=!opened;launcher.hidden=opened;
  launcher.setAttribute('aria-expanded',String(opened));
  document.body.classList.toggle('chat-open',opened);
  $('close-chat').setAttribute('aria-label',document.body.classList.contains('embedded-desktop')?T('챗봇 닫기'):T('이전 화면으로 돌아가기'));
  if(!opened){closeDialogs();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
  else requestAnimationFrame(()=>$('app-title').focus({preventScroll:true}));
 }
 function openChat(event){
  returnFocus=event.currentTarget;
  if(window.location.hash==='#chatbot'){syncChatSurface();return;}
  window.history.pushState({mubosoChat:true},'', '#chatbot');syncChatSurface();
 }
 function closeChat(){
  if(window.parent===window)location.href='../index.html';else bridge('ieb-chatbot:close');return;

 }
 document.querySelectorAll('[data-open-chat]').forEach(node=>node.addEventListener('click',openChat));
 $('close-chat').addEventListener('click',closeChat);
 $('expand-chat').addEventListener('click',()=>{bridge('ieb-chatbot:expand');const expanded=panel.classList.toggle('is-expanded');$('expand-chat').setAttribute('aria-pressed',String(expanded));$('expand-chat').setAttribute('aria-label',expanded?T('챗봇 기본 크기로 보기'):T('챗봇 크게 보기'));});
 window.addEventListener('popstate',syncChatSurface);window.addEventListener('hashchange',syncChatSurface);mobile.addEventListener('change',syncChatSurface);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden&&!document.querySelector('dialog[open]'))closeChat();});

 function el(tag,css,text){const node=document.createElement(tag);if(css)node.className=css;if(text!==undefined)node.textContent=typeof text==='string'?T(text):text;return node;}
 function button(label,callback,css=''){const node=el('button',css,label);node.type='button';node.addEventListener('click',callback);return node;}
 function openTab(name){
  document.querySelectorAll('[data-view]').forEach(panel=>{panel.hidden=panel.dataset.view!==name;});
  document.querySelectorAll('[data-tab]').forEach(tab=>{const active=tab.dataset.tab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  $('app-title').textContent={chat:T('나에게 맞는 부산의 맛'),browse:T('음식 둘러보기'),conditions:T('내 식단과 취향')}[name];
 }
 function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
 function openDialog(id){closeDialogs();$(id).showModal();}
 function imageFor(food,css){const placeholder=()=>{const node=el('span',css+' photo-placeholder',T('사진 준비 중'));node.setAttribute('role','img');node.setAttribute('aria-label',food.name+' · '+T('사진 준비 중'));return node;};if(!food.photo||food.photo.endsWith('food-placeholder.svg'))return placeholder();const photo=el('img',css);photo.src=food.photo;photo.alt=food.name;photo.loading='lazy';photo.addEventListener('error',()=>photo.replaceWith(placeholder()),{once:true});return photo;}
 async function copyText(text,status){try{await navigator.clipboard.writeText(text);status.textContent=T('copy.ok');}catch{status.textContent=T('copy.manual');}}
 function visitAction(food,place,kind){if(window.parent!==window)window.parent.postMessage({type:'ieb-chatbot:visit',foodId:food.id,placeIndex:place.index,kind},location.origin);else location.href='../index.html'+(kind==='map'?'#/map/'+encodeURIComponent(food.id):'#/place/'+encodeURIComponent(food.id)+'/'+place.index);}
 function visitList(food){
  const list=el('div','visit-list');
  for(const place of food.places){const card=el('section','visit-card'),status=el('p','action-status');status.setAttribute('role','status');card.append(el('h4','',place.name));
   if(place.address){const address=el('p','address',place.address);address.lang='ko';card.append(address);}
   if(place.addressEn)card.append(el('p','address',place.addressEn));
   const actions=el('div','visit-actions');actions.append(button(T('visit.details'),()=>visitAction(food,place,'place')),button(T('visit.map'),()=>visitAction(food,place,'map')));
   if(place.address||Number.isFinite(place.lat)){const link=el('a','',T('visit.directions'));link.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place.address||place.lat+','+place.lng);link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
   if(place.address)actions.append(button(T('visit.copyKo'),()=>copyText(place.address,status)));
   if(place.addressEn)actions.append(button(T('visit.copyEn'),()=>copyText(place.addressEn,status)));else card.append(el('p','form-note',T('visit.missing')));
   card.append(actions,status);list.append(card);
  }return list;
 }
 function orderSection(food){const section=el('section','order-card'),text=VisitorTools.orderCard(food,state,bot),status=el('p','action-status');status.setAttribute('role','status');section.append(el('h3','',T('order.title')),el('p','form-note',T('order.note')));const original=el('pre','order-text',text);original.lang='ko';section.append(original);const actions=el('div','visit-actions');actions.append(button(T('order.copy'),()=>copyText(text,status)));if(navigator.share)actions.append(button(T('order.share'),async()=>{try{await navigator.share({title:food.originalName||food.name,text});}catch(error){if(error.name!=='AbortError')status.textContent=T('copy.manual');}}));section.append(actions,status);return section;}
 function showFood(food){
  food=bot.displayFood(food);
  $('food-detail').replaceChildren(imageFor(food,'detail-photo'));const content=el('div','detail-content');if(food.sourceLanguage==='ko'&&bot.language!=='ko')content.append(el('p','source-language-note',T('원문 정보 (한국어)')));
  content.append(el('span','small-kicker','TASTE OF BUSAN'),el('h2','',food.name));content.lastChild.id='food-dialog-title';
  if(bot.language!=='ko'){const original=el('p','original-name',T('visit.original')+': '+food.originalName);original.lang='ko';content.append(original);}if(food.romanization)content.append(el('p','',T('order.phonetic')+': '+food.romanization));
  const tags=el('div','food-categories');for(const key of food.categories)tags.append(el('span','',bot.categories[key]));content.append(tags,el('p','detail-summary',food.detail));
  const rows=el('dl');for(const [key,value] of [[T('주재료'),food.primary],[T('가격 안내'),food.priceText],[T('매운 정도'),food.spiceText||T('식당별 확인이 필요합니다.')]])rows.append(el('dt','',key),el('dd','',value));content.append(rows);
  content.append(el('div','detail-caption',food.verification||T('실제 재료·육수·양념을 식당에 확인해 주세요.')),el('h3','',T('재료와 알레르기 확인 사항')),el('p','',food.note||T('가게마다 재료와 조리 환경이 다를 수 있습니다.')));
  if(food.allergenLabels.length)content.append(el('p','',T('원문 관련 항목: ')+food.allergenLabels.join(', ')));
  content.append(orderSection(food));
  if(food.places.length)content.append(el('h3','',T('함께 살펴볼 등록 식당')),visitList(food));
  if(food.credit){const credit=el('p','credit-link',T('사진: ')+(food.credit.author||T('원문 출처 참고'))+' · '+(food.credit.license||''));if(/^https:\/\//.test(food.credit.url||'')){const link=el('a','',T('사진 원문 ↗'));link.href=food.credit.url;link.target='_blank';link.rel='noopener noreferrer';credit.append(document.createTextNode(' · '),link);}content.append(credit);}
  $('food-detail').append(content);openDialog('food-dialog');
 }
 function disableOldChoices(){document.querySelectorAll('.reply-choices button,.conversation-form input,.conversation-form button').forEach(node=>{node.disabled=true;});}
 function option(form,type,name,value,label,checked,aria){
  const wrap=el('label','form-option');const input=el('input');input.type=type;input.name=name;input.value=value;input.checked=checked;if(aria)input.setAttribute('aria-label',aria);wrap.append(input,el('span','',label));form.append(wrap);return input;
 }
 function group(form,title){const field=el('fieldset');field.append(el('legend','',title));const options=el('div','option-grid');field.append(options);form.append(field);return options;}
 function buildForm(schema){
  const form=el('form','conversation-form');
  const values=name=>[...form.querySelectorAll('input[name="'+name+'"]:checked')].map(n=>n.value);
  function submit(label,callback){const control=el('button','form-submit',label);control.type='submit';form.append(control);form.addEventListener('submit',event=>{event.preventDefault();callback();});}
  if(schema.kind==='profile'){
   const diet=group(form,T('기본 식단'));for(const [key,label] of Object.entries(bot.diets))option(diet,'radio','diet',key,label,state.diet===key);
   const status=group(form,T('알레르기가 있으신가요?'));for(const [key,label] of [['none',T('없어요')],['selected',T('있어요 · 다음 질문에서 선택')],['unknown',T('모르겠어요 / 미확인')]])option(status,'radio','allergyStatus',key,label,state.allergyStatus===key);
   const exclusions=el('details','form-details');exclusions.open=state.excluded.length>0;exclusions.append(el('summary','',T('알레르기와 별개로 피하고 싶은 재료·음식 (선택)')));
   const excluded=group(exclusions,T('추가로 피할 재료·음식'));for(const key of schema.excludeKeys)option(excluded,'checkbox','excluded',key,bot.labels[key],state.excluded.includes(key),T('추가 제외: ')+bot.labels[key]);form.append(exclusions);
   form.append(el('p','form-note',T('알레르기가 있다고 답하시면 다음 질문에서 피해야 하는 항목을 여러 개 선택할 수 있어요.')));
   submit(T('다음으로'),()=>send({action:'profile:submit',diet:values('diet')[0],allergyStatus:values('allergyStatus')[0],allergies:values('allergyStatus')[0]==='selected'?state.allergies:[],excluded:values('excluded')}));
  }else if(schema.kind==='allergies'){
   const allergies=group(form,T('피해야 하는 알레르기 항목 · 복수 선택'));for(const key of schema.allergyKeys)option(allergies,'checkbox','allergy',key,bot.labels[key],state.allergies.includes(key),T('알레르기: ')+bot.labels[key]);
   form.append(el('p','form-note',T('해당하는 항목을 모두 선택해 주세요. 실제 원료·육수·양념과 교차 접촉 여부는 식당에 확인해야 합니다.')));
   submit(T('알레르기 항목 저장'),()=>send({action:'allergies:submit',allergies:values('allergy')}));
  }else if(schema.kind==='wanted'){
   const wanted=group(form,T('먹고 싶은 주재료·음식 · 복수 선택'));for(const key of schema.wantedKeys){const check=option(wanted,'checkbox','wanted',key,bot.labels[key],state.wanted.includes(key),T('찾는 재료: ')+bot.labels[key]);check.parentElement.append(el('small','option-count',schema.counts[key]?T('등록 ')+schema.counts[key]+T('개'):T('현재 등록 0개')));}
   form.append(el('p','form-note',T('현재 DB에 있는 항목만 표시합니다. 음식이 추가되면 목록 새로고침 후 선택 항목에도 반영됩니다.')));
   const mode=group(form,T('여러 항목을 선택했다면'));option(mode,'radio','mode','all',T('선택한 항목 모두 포함'),state.ingredientMode==='all');option(mode,'radio','mode','any',T('선택한 항목 중 하나 이상'),state.ingredientMode==='any');
   const spice=group(form,T('맵기도 함께 골라 주세요'));for(const [key,label] of Object.entries(schema.spiceLabels))option(spice,'radio','spice',key,label,(state.spice||'any')===key);
   form.append(el('p','form-note',T('spice.retained')));
   submit(T('이 취향으로 찾기'),()=>send({action:'wanted:submit',wanted:values('wanted'),mode:values('mode')[0],spice:values('spice')[0]}));
  }
  return form;
 }
 function addMessage(role,text,foods=[],choices=[],schema=null){
  const row=el('div','message '+role);if(role==='bot')row.append(el('span','avatar',T('무')));
  const content=el('div','message-content');content.append(el('div','sender',role==='bot'?T('무보소 음식 도우미'):T('나')),el('div','bubble',text));
  if(foods.length){const list=el('div','food-list');for(const rawFood of foods){const food=bot.displayFood(rawFood);
   const card=el('article','food-card');card.append(imageFor(food,'food-photo'));const body=el('div','food-card-body');if(food.sourceLanguage==='ko'&&bot.language!=='ko')body.append(el('small','source-language-note',T('원문 정보 (한국어)')));body.append(el('span','verification',food.verification),el('h3','',food.name),el('p','',food.detail));
   if(bot.language!=='ko'){const original=el('small','original-name',food.originalName);original.lang='ko';body.append(original);}body.append(el('small','recommend-reason',T('recommend.reason')));
   const tags=el('div','food-categories');for(const key of food.categories)tags.append(el('span','',bot.categories[key]));body.append(tags,el('small','',food.priceText));
   const detailButton=button('',()=>showFood(food),'food-detail-button');detailButton.setAttribute('aria-label',food.name+T(' 음식 정보 보기'));detailButton.append(el('span','',T('음식 정보 살펴보기')),el('span','','↗'));card.append(body,detailButton);list.append(card);
  }content.append(list);}
  if(schema)content.append(buildForm(schema));
  const buttons=choices.filter(c=>!schema||!['profile:submit','allergies:submit','wanted:submit'].includes(c.id));
  if(buttons.length){const list=el('div','reply-choices');list.setAttribute('aria-label',T('현재 질문의 답변 선택지'));for(const c of buttons)list.append(button(c.label,()=>send({action:c.id},c.label)));content.append(list);}
  row.append(content);$('messages').append(row);$('messages').scrollTop=schema?row.offsetTop-$('messages').offsetTop:$('messages').scrollHeight;
 }
 function render(result){
  $('condition-summary').textContent=ChatLocale.t('condition-summary',bot.language,{summary:bot.summary(state)});
  $('diet').textContent=(bot.diets[state.diet]||'')+(state.profileComplete?'':T(' · 설정 대기'));
  for(const key of ['wanted','excluded','allergies']){ $(key).replaceChildren();for(const value of state[key])$(key).append(el('span','tag '+key,bot.labels[value]));if(!state[key].length)$(key).append(el('span','empty',key==='allergies'?(state.allergyStatus==='none'?T('없다고 응답'):T('미확인 / 미입력')):T('등록된 조건이 없습니다.')));}
  if(state.wanted.length>1)$('wanted').append(el('span','tag',state.ingredientMode==='any'?T('하나 이상 포함'):T('모두 포함')));
  const prefs=[];
  if(state.category)prefs.push(bot.categories[state.category]);
  if(state.spice)prefs.push(state.spice==='mild'?T('원문상 기본 맵기 낮음'):state.spice==='hot'?T('매운 음식'):T('맵기 상관없음'));
  if(state.diet==='vegan')prefs.push(state.reviewVegan?T('확인 필요 후보 표시'):T('choice.vegan:strict'));
  if(state.pendingAllergy?.length)prefs.push(T('request.clarify'));if(state.unsupported?.length)prefs.push(T('request.unsupported')+' '+state.unsupported.map(k=>T('unsupported.'+k)).join(', '));
  $('preferences').replaceChildren(...prefs.map(p=>el('span','tag',p)));if(!prefs.length)$('preferences').append(el('span','empty',T('아직 정한 취향이 없습니다.')));
  $('stage-name').textContent=bot.stages[state.stage];$('stage-summary').textContent=state.stage==='results'?T('부산의 맛을 만나보세요.'):result.form?T('여러 항목을 선택할 수 있어요.'):T('원하시는 답변을 골라 주세요.');
  const phase={profile:0,allergies:0,veganReview:0,category:1,wanted:2,confirm:3,results:4,relax:3,empty:4,edit:0,conflict:0}[state.stage];$('step-dots').replaceChildren(...[0,1,2,3,4].map(i=>el('i',i===phase?'active':'')));
  $('flow').textContent=bot.stages[state.stage]+' · '+(result.form?T('여러 항목 선택 후 저장해 주세요.'):result.choices.length+T('개 선택지로 이어갈 수 있습니다.'));
  $('rule-count').textContent=result.matches.length+T('개');$('rules').replaceChildren();for(const match of result.matches){const li=el('li');li.append(el('b','',match.rule),el('small','','“'+match.evidence+'”'));$('rules').append(li);}
  if(!result.matches.length)$('rules').append(el('li','empty',T('답변을 선택하면 적용한 분기가 표시됩니다.')));
 }
 function send(value,label){
  if(typeof value==='string'&&!value.trim())return;
  openTab('chat');
  label=label||userLabel(value);
  disableOldChoices();const result=bot.respond(value,state);state=result.state;
  recoveryInputs.push(JSON.parse(JSON.stringify(value)));history.push({rawInput:JSON.parse(JSON.stringify(value)),result:result._canonical||result,input:label||value,action:typeof value==='object'?value.action:null,response:result.text,state:JSON.parse(JSON.stringify(state)),matches:result.matches,foods:result.foods.map(f=>f.name),choices:result.choices,alternatives:!!result.alternatives,uncertain:result.uncertain});
  addMessage('user',label);addMessage('bot',result.text,result.foods,result.choices,result.form);render(result);
  input.value='';$('count').textContent='0 / 2,000';
  saveRecovery();
 }
 function reset(){
  closeDialogs();openTab('chat');state=bot.createState();recoveryInputs=[];history=[];activeScenario=null;$('scenario-active').hidden=true;$('messages').replaceChildren();const result=bot.view(state);addMessage('bot',result.text,[],result.choices,result.form);render(result);input.value='';$('count').textContent='0 / 2,000';
 }
 function scenarioTranscript(scenario){
  let current=bot.respond(scenario.initial);const entries=[{who:T('나'),text:scenario.initial},{who:T('도우미'),text:current.text}];
  for(const step of scenario.steps){let label,value;if(typeof step==='object'){value=step;label=bot.describeAction(step);}else if(step.startsWith('text:')){label=step.slice(5);value=label;}else{label=current.choices.find(c=>c.id===step)?.label||step;value={action:step};}if(typeof value==='object'&&!bot.view(current.state).choices.some(c=>c.id===value.action)){entries.push({who:T('도우미'),text:T('현재 DB에서 사용할 수 없는 선택이 있어 예시를 멈췄습니다. 표시된 항목으로 계속해 주세요.')});break;}current=bot.respond(value,current.state);entries.push({who:T('나'),text:label},{who:T('도우미'),text:current.text+(current.foods.length?T('\n확인할 후보: ')+current.foods.map(f=>f.name).join(', '):'')});}
  return entries;
 }
 function startScenario(scenario,playAll){
  reset();activeScenario=scenario.id;$('scenario-active').hidden=false;$('scenario-active').textContent=T('체험 중 · ')+displayScenario(scenario).title+(playAll?T(' · 전체 예시 재생 완료'):T(' · 답변 버튼을 눌러 이어가 주세요.'));send(scenario.initial,scenario.initial==='시작'?T('시작'):T(scenario.initial));
  if(playAll){let completed=true;for(const step of scenario.steps){const action=typeof step==='object'?step.action:step.startsWith('text:')?null:step;if(action&&!bot.view(state).choices.some(c=>c.id===action)){completed=false;break;}if(typeof step==='object')send(step);else if(step.startsWith('text:'))send(step.slice(5));else{const c=bot.view(state).choices.find(x=>x.id===step);send({action:step},c.label);}}if(!completed)$('scenario-active').textContent=T('현재 DB에서 사용할 수 없는 선택이 있어 예시를 멈췄습니다. 표시된 항목으로 계속해 주세요.');}
 }
 function renderLibrary(){
  const query=$('scenario-search').value.trim().toLowerCase(),group=$('scenario-group').value;
  const preview=s=>s.initial==='시작'?bot.describeAction(s.steps.find(step=>typeof step==='object'&&step.action==='profile:submit')||s.initial):T(s.initial);
  const items=FoodScenarios.filter(s=>(group==='all'||s.group===group)&&[displayScenario(s).title,displayScenario(s).description,s.title,s.description,preview(s)].join(' ').toLowerCase().includes(query));
  $('scenario-count').textContent=items.length+' / '+FoodScenarios.length+T('개');$('scenario-grid').replaceChildren();
  for(const scenario of items){
   const card=el('article','scenario-card');card.append(el('span','badge',scenario.group),el('h3','',displayScenario(scenario).title),el('p','',displayScenario(scenario).description),el('blockquote','',preview(scenario)));
   const actions=el('div','scenario-actions');actions.append(button(T('직접 체험'),()=>startScenario(scenario,false),'scenario-start'),button(T('전체 예시 재생'),()=>startScenario(scenario,true),'scenario-play'));card.append(actions);
   const details=el('details'),summary=el('summary','',T('전체 대사 예시 보기'));details.append(summary);
   details.addEventListener('toggle',()=>{if(details.open&&!details.dataset.loaded){const list=el('ol','transcript');for(const entry of scenarioTranscript(scenario)){const li=el('li',entry.who===T('나')?'transcript-user':'');li.append(el('b','',entry.who),el('span','',entry.text));list.append(li);}details.append(list);details.dataset.loaded='true';}});
   card.append(details);$('scenario-grid').append(card);
  }
  if(!items.length)$('scenario-grid').append(el('p','empty',T('검색 결과가 없습니다. 다른 단어로 찾아 주세요.')));
 }
 function renderCategories(){
  $('category-catalog').replaceChildren();
  for(const [key,label] of Object.entries(bot.categories)){const count=key==='any'?bot.foods.length:bot.foods.filter(food=>food.categories.includes(key)).length;if(key!=='any'&&!count)continue;const chip=button(key==='any'?T('전체'):label,()=>{catalogCategory=key;renderCategories();renderCatalog();},'category-chip');chip.append(el('span','',count));chip.setAttribute('aria-pressed',String(catalogCategory===key));$('category-catalog').append(chip);}
 }
 function renderCatalog(){
  const query=$('catalog-query').value.trim().toLowerCase();const items=bot.foods.filter(food=>(catalogCategory==='any'||food.categories.includes(catalogCategory))&&[bot.displayFood(food).name,bot.displayFood(food).primary,food.name,food.primary,...food.categories.map(key=>bot.categories[key])].join(' ').toLowerCase().includes(query));
  $('catalog-title').textContent=catalogCategory==='any'?T('전체 음식'):bot.categories[catalogCategory];$('catalog-count').textContent=items.length+T('가지 음식');$('catalog-list').replaceChildren();
  for(const rawFood of items){const food=bot.displayFood(rawFood);const row=button('',()=>showFood(food),'catalog-food');row.setAttribute('aria-label',food.name+T(' 음식 정보 보기'));const body=el('span','catalog-food-content');body.append(el('strong','',food.name),el('p','',food.detail),el('small','',food.categories.map(key=>bot.categories[key]).join(' · ')));row.append(imageFor(food,''),body,el('span','catalog-arrow','›'));$('catalog-list').append(row);}
  if(!items.length)$('catalog-list').append(el('p','empty',T(bot.source.available===false?'DB 음식 목록을 받지 못해 추천할 수 없습니다. 잠시 후 다시 열어 주세요.':'아직 등록된 음식을 찾지 못했어요. 다른 재료나 이름으로 찾아보세요.')));
 }
 $('chat-form').addEventListener('submit',event=>{event.preventDefault();send(input.value);});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send(input.value);}});
 input.addEventListener('input',()=>{$('count').textContent=input.value.length.toLocaleString()+' / 2,000';});
 document.querySelectorAll('[data-example]').forEach(node=>node.addEventListener('click',()=>{if(node.dataset.example==='restrictions'){send({action:'profile:open'});return;}input.value=T(node.dataset.example==='vegan'?'quick.vegan':'quick.meat');input.dispatchEvent(new Event('input'));input.focus();}));
 $('reset').addEventListener('click',()=>{deleteRecovery();reset();});$('scenario-search').addEventListener('input',renderLibrary);$('scenario-group').addEventListener('change',renderLibrary);
 document.querySelectorAll('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>openTab(tab.dataset.tab)));
 document.querySelector('.app-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const tabs=[...document.querySelectorAll('[data-tab]')];const index=tabs.indexOf(document.activeElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;openTab(tabs[next].dataset.tab);tabs[next].focus();});
 $('catalog-query').addEventListener('input',renderCatalog);
 $('edit-profile').addEventListener('click',()=>send({action:'profile:open'},T('식단과 알레르기 다시 설정')));
 $('open-help').addEventListener('click',()=>openDialog('help-dialog'));$('open-scenarios').addEventListener('click',()=>openDialog('scenarios-dialog'));
 document.querySelectorAll('[data-close-dialog]').forEach(close=>close.addEventListener('click',()=>close.closest('dialog').close()));
 document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
 $('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:5,language:bot.language,databaseCatalogAvailable:bot.source.available===true,dataSource:bot.source.source,sourceHash:bot.source.sha256,scenario:activeScenario,exportedAt:new Date().toISOString(),history},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download='busan-chatbot-scenario.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 function updateSource(){
  $('restore-conversation').disabled=bot.source.available!==true;
  $('scenario-eyebrow').textContent=FoodScenarios.length+T('가지 대화 예시');$('menu-count').textContent=bot.foods.length;
  $('data-source').textContent=T('DB 음식 카탈로그')+' · '+bot.foods.length;
  document.querySelectorAll('[data-refresh-catalog]').forEach(node=>{if(!node.disabled)node.textContent=T('DB 음식 목록 새로고침');});
  $('catalog-status').hidden=bot.source.available===true;$('catalog-status').textContent=T('DB 음식 목록을 받지 못해 추천할 수 없습니다. 잠시 후 다시 열어 주세요.');
 }
 function redrawConversation(){const current=state;$('messages').replaceChildren();if(!history.length){const r=bot.view(current);addMessage('bot',r.text,r.foods,r.choices,r.form);}else for(const entry of history){disableOldChoices();const r=bot.localize(entry.result);state=r.state;entry.input=userLabel(entry.rawInput);entry.response=r.text;addMessage('user',entry.input);addMessage('bot',r.text,r.foods,r.choices,r.form);}state=current;render(bot.view(state));}
 function applyContext(payload){
  const languageChanged=bot.language!==ChatLocale.normalize(payload.language);bot.setLanguage(payload.language);
  const catalogChanged=payload.catalog&&Array.isArray(payload.catalog.foods)?bot.replaceCatalog(payload.catalog.foods,{available:payload.catalog.available===true,source:'DB 음식 카탈로그'}):false;
  if(catalogChanged){state.seen=[];if(['results','empty','relax'].includes(state.stage))state.stage=state.profileComplete?'confirm':'profile';history=[];closeDialogs();$('messages').replaceChildren();const r=bot.view(state,'DB 음식 목록이 갱신되었습니다. 알려 주신 조건은 유지했습니다.');addMessage('bot',r.text,r.foods,r.choices,r.form);render(r);}else if(languageChanged){closeDialogs();redrawConversation();}
  translateStatic();openTab(document.querySelector('[data-tab][aria-selected="true"]')?.dataset.tab||'chat');renderCategories();renderCatalog();renderLibrary();updateSource();
 }
 window.addEventListener('message',event=>{if(event.source!==window.parent||event.origin!==location.origin)return;if(event.data?.type==='ieb-chatbot:context')applyContext(event.data);else if(event.data?.type==='ieb-chatbot:refresh-state')document.querySelectorAll('[data-refresh-catalog]').forEach(node=>{node.disabled=!!event.data.busy;node.textContent=T(event.data.busy?'불러오는 중…':'DB 음식 목록 새로고침');});});
 document.querySelectorAll('[data-refresh-catalog]').forEach(node=>node.addEventListener('click',()=>bridge('ieb-chatbot:refresh')));
 function saveRecovery(){if(!$('save-conversation').checked)return;if(recoveryInputs.length>100){deleteRecovery();$('recovery-status').textContent=T('recovery.failed');return;}try{localStorage.setItem('ieb.chatbot.recovery.v1',JSON.stringify(VisitorTools.snapshot(recoveryInputs.map(rawInput=>({rawInput})),bot.language)));}catch{$('recovery-status').textContent=T('recovery.failed');}}
 function deleteRecovery(){try{localStorage.removeItem('ieb.chatbot.recovery.v1');}catch{}$('save-conversation').checked=false;$('recovery-banner').hidden=true;$('recovery-status').textContent='';}
 $('save-conversation').addEventListener('change',()=>{if($('save-conversation').checked)saveRecovery();else deleteRecovery();});
 $('delete-conversation').addEventListener('click',deleteRecovery);
 $('restore-conversation').addEventListener('click',()=>{const saved=VisitorTools.readSnapshot(localStorage);if(!saved)return deleteRecovery();const restored=VisitorTools.replay(saved.inputs,bot);state=restored.result.state;history=restored.history;recoveryInputs=saved.inputs;$('save-conversation').checked=true;$('recovery-banner').hidden=true;redrawConversation();saveRecovery();});
 translateStatic();reset();renderCategories();renderCatalog();renderLibrary();updateSource();syncChatSurface();
 try{$('recovery-banner').hidden=!VisitorTools.readSnapshot(localStorage);}catch{$('recovery-banner').hidden=true;}

})();
