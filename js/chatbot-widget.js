(function(){
 'use strict';
 const L=window.ChatLocale,language=()=>{const selected=window.Store?.get()?.lang||document.documentElement?.lang||'ko';return L?L.normalize(selected):(['ko','en','zh','ja'].includes(selected)?selected:'ko');},t=key=>L?.t(key,language())||key;
 const mobile=window.matchMedia('(max-width:740px)'),route='#/chatbot';
 const launcher=document.createElement('button');launcher.type='button';launcher.className='ieb-chat-launcher';launcher.id='ieb-chat-launcher';launcher.textContent='무';launcher.setAttribute('aria-label','나에게 맞는 부산의 맛 챗봇 열기');launcher.setAttribute('aria-controls','ieb-chat-panel');launcher.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.id='ieb-chat-panel';panel.className='ieb-chat-panel';panel.setAttribute('aria-label','나에게 맞는 부산의 맛');panel.hidden=true;
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='ieb-chat-control ieb-chat-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','챗봇 닫기');
 const expandButton=document.createElement('button');expandButton.type='button';expandButton.className='ieb-chat-control ieb-chat-expand';expandButton.textContent='⛶';expandButton.setAttribute('aria-label','챗봇 크게 보기');expandButton.setAttribute('aria-pressed','false');panel.append(expandButton,closeButton);
 let refreshing=false;
 let databaseReady=Array.isArray(window.Store?.get()?.foods),lastContext='',frame=null,opened=false,expanded=false,returnFocus=launcher,fromLauncher=false,lastHash=location.hash;
 const targetOrigin=location.origin==='null'?'*':location.origin;
 function mode(){return mobile.matches?'mobile':'desktop';}
 function sendContext(force=false){if(!frame)return;const state=window.Store?.get()||{},snapshot=databaseReady&&window.IEBChatbotCatalog?window.IEBChatbotCatalog.project(state.foods,window.FOODS||[]):{available:false,foods:[]};const payload={type:'ieb-chatbot:context',language:language(),mode:mode(),catalog:snapshot};const key=JSON.stringify(payload);if(force||key!==lastContext){lastContext=key;frame.contentWindow?.postMessage(payload,targetOrigin);}}
 function sendMode(){frame?.contentWindow?.postMessage({type:'ieb-chatbot:mode',mode:mode()},targetOrigin);sendContext();}
 function ensureFrame(){if(frame)return;frame=document.createElement('iframe');frame.title=t('나에게 맞는 부산의 맛 챗봇');frame.src='chatbot/index.html?v=20261113-toolbar-row&embed='+mode()+'&lang='+language();frame.className='ieb-chat-frame';frame.addEventListener('load',()=>{sendMode();sendContext(true);if(opened)frame.focus();});panel.append(frame);}
 async function refreshCatalog(){if(refreshing||!window.Store?.load)return;refreshing=true;frame?.contentWindow?.postMessage({type:'ieb-chatbot:refresh-state',busy:true},targetOrigin);try{await window.Store.load();databaseReady=true;}catch{databaseReady=false;}finally{refreshing=false;sendContext(true);frame?.contentWindow?.postMessage({type:'ieb-chatbot:refresh-state',busy:false},targetOrigin);}}
 function render(){
  launcher.setAttribute('aria-label',t('나에게 맞는 부산의 맛 챗봇 열기'));panel.setAttribute('aria-label',t('나에게 맞는 부산의 맛'));if(frame)frame.title=t('나에게 맞는 부산의 맛 챗봇');
  closeButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="'+(mobile.matches?'m14 6-6 6 6 6M8 12h12':'m6 6 12 12M18 6 6 18')+'"/></svg>';expandButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';closeButton.setAttribute('aria-label',t(mobile.matches?'이전 화면으로 돌아가기':'챗봇 닫기'));expandButton.setAttribute('aria-pressed',String(expanded));expandButton.setAttribute('aria-label',t(expanded?'챗봇 기본 크기로 보기':'챗봇 크게 보기'));
  panel.hidden=!opened;launcher.hidden=opened;launcher.setAttribute('aria-expanded',String(opened));
  panel.classList.toggle('is-expanded',expanded);document.body.classList.toggle('ieb-chat-open',opened&&mobile.matches);
  // On a phone the dedicated route replaces the visible app screen.
  const app=document.getElementById('app');if(app)app.inert=opened&&mobile.matches;
  if(opened){ensureFrame();sendMode();}
 }
 function open(event){returnFocus=event?.currentTarget||launcher;opened=true;
  if(mobile.matches&&location.hash!==route){fromLauncher=true;location.hash=route;}
  render();if(!databaseReady)refreshCatalog();if(frame)frame.focus();
 }
 function close(){
  opened=false;render();
  if(location.hash===route){if(fromLauncher){fromLauncher=false;history.back();}else location.hash='#/home';}
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
 }
 closeButton.addEventListener('click',close);expandButton.addEventListener('click',()=>{expanded=!expanded;render();});
 launcher.addEventListener('click',open);
 window.addEventListener('hashchange',()=>{const next=location.hash;if(next===route)opened=true;else if(mobile.matches||lastHash===route)opened=false;lastHash=next;render();});
 mobile.addEventListener('change',()=>{if(opened&&mobile.matches&&location.hash!==route){fromLauncher=true;location.hash=route;}render();});
 window.addEventListener('message',event=>{if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin)return;
  if(event.data?.type==='ieb-chatbot:visit'){
   const {foodId,placeIndex,kind}=event.data;const row=(window.Store?.get()?.foods||[]).find(f=>f.id===foodId);if(!row||row.content?.catalogStatus==='archived')return;
   const food=(window.FOODS||[]).find(f=>f.id===foodId),places=row.content?.places||food?.places||[];
   if(!Number.isInteger(placeIndex)||placeIndex<0||placeIndex>=places.length||!['place','map'].includes(kind))return;
   opened=false;fromLauncher=false;render();location.hash=kind==='map'?'#/map/'+encodeURIComponent(foodId):'#/place/'+encodeURIComponent(foodId)+'/'+placeIndex;return;
  }
  if(event.data?.type==='ieb-chatbot:dialog')panel.classList.toggle('has-dialog',event.data.open===true);
  else if(event.data?.type==='ieb-chatbot:close')close();else if(event.data?.type==='ieb-chatbot:refresh')refreshCatalog();
  else if(event.data?.type==='ieb-chatbot:expand'&&!mobile.matches){expanded=!expanded;render();}
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)close();});
 document.body.append(panel,launcher);opened=location.hash===route;render();
 window.addEventListener('ieb:catalog',event=>{if(event.detail==='catalogReady')databaseReady=true;else if(event.detail==='catalogUnavailable')databaseReady=false;sendContext();});
 window.IEBChatbot={open,close,refreshCatalog,sync(){render();sendContext();}};
})();
