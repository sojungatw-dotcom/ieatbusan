(function(){
 'use strict';
 const mobile=window.matchMedia('(max-width:740px)'),route='#/chatbot';
 const launcher=document.createElement('button');launcher.type='button';launcher.className='ieb-chat-launcher';launcher.id='ieb-chat-launcher';launcher.textContent='무';launcher.setAttribute('aria-label','나에게 맞는 부산의 맛 챗봇 열기');launcher.setAttribute('aria-controls','ieb-chat-panel');launcher.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.id='ieb-chat-panel';panel.className='ieb-chat-panel';panel.setAttribute('aria-label','나에게 맞는 부산의 맛');panel.hidden=true;
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='ieb-chat-control ieb-chat-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','챗봇 닫기');
 const expandButton=document.createElement('button');expandButton.type='button';expandButton.className='ieb-chat-control ieb-chat-expand';expandButton.textContent='⛶';expandButton.setAttribute('aria-label','챗봇 크게 보기');expandButton.setAttribute('aria-pressed','false');panel.append(expandButton,closeButton);
 let frame=null,opened=false,expanded=false,returnFocus=launcher,fromLauncher=false,lastHash=location.hash;
 const targetOrigin=location.origin==='null'?'*':location.origin;
 function mode(){return mobile.matches?'mobile':'desktop';}
 function sendMode(){frame?.contentWindow?.postMessage({type:'ieb-chatbot:mode',mode:mode()},targetOrigin);}
 function ensureFrame(){if(frame)return;frame=document.createElement('iframe');frame.title='나에게 맞는 부산의 맛 · 한국어 음식 도우미';frame.src='chatbot/index.html?embed='+mode();frame.className='ieb-chat-frame';frame.addEventListener('load',()=>{sendMode();if(opened)frame.focus();});panel.append(frame);}
 function render(){
  closeButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="'+(mobile.matches?'m14 6-6 6 6 6M8 12h12':'m6 6 12 12M18 6 6 18')+'"/></svg>';expandButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';closeButton.setAttribute('aria-label',mobile.matches?'이전 화면으로 돌아가기':'챗봇 닫기');expandButton.setAttribute('aria-pressed',String(expanded));expandButton.setAttribute('aria-label',expanded?'챗봇 기본 크기로 보기':'챗봇 크게 보기');
  panel.hidden=!opened;launcher.hidden=opened;launcher.setAttribute('aria-expanded',String(opened));
  panel.classList.toggle('is-expanded',expanded);document.body.classList.toggle('ieb-chat-open',opened&&mobile.matches);
  // On a phone the dedicated route replaces the visible app screen.
  const app=document.getElementById('app');if(app)app.inert=opened&&mobile.matches;
  if(opened){ensureFrame();sendMode();}
 }
 function open(event){returnFocus=event?.currentTarget||launcher;opened=true;
  if(mobile.matches&&location.hash!==route){fromLauncher=true;location.hash=route;}
  render();if(frame)frame.focus();
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
  if(event.data?.type==='ieb-chatbot:close')close();
  else if(event.data?.type==='ieb-chatbot:expand'&&!mobile.matches){expanded=!expanded;render();}
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)close();});
 document.body.append(panel,launcher);opened=location.hash===route;render();
 window.IEBChatbot={open,close};
})();
