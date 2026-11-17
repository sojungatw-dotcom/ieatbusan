/* Every mobile home document load (including refresh). Runs in <head> before public content can paint. */
(function(){
  'use strict';
  const HOME=/^(?:|#|#\/|#\/home)$/;
  if(typeof window.matchMedia!=='function')return;
  const mobile=window.matchMedia('(max-width:740px), (pointer:coarse) and (max-width:1024px) and (max-height:740px)');
  if(!mobile.matches||!HOME.test(location.hash))return;
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const root=document.documentElement;
  root.classList.add('mobile-intro-pending');
  let overlay,app,image,resourceTimer,playTimer,watchdog,url,direct=false,closed=false,oldInert=false,oldHidden=null;
  const theme=document.querySelector('meta[name="theme-color"]'),oldTheme=theme?.getAttribute('content');
  theme?.setAttribute('content','#C44934');
  const controller=new AbortController();
  // Buffer the animation before displaying it so slow downloads cannot consume its playback time.
  const asset=reduced?'assets/brand/mobile-intro-poster.png':'assets/brand/mobile-intro-fast.gif';
  const resource=fetch(asset,{cache:'force-cache',signal:controller.signal})
    .then(response=>{if(!response.ok)throw Error('intro asset unavailable');return response.blob();});
  resource.catch(()=>{}); // The mounted handler owns failure recovery.
  function finish(){
    if(closed)return;closed=true;
    clearTimeout(resourceTimer);clearTimeout(playTimer);clearTimeout(watchdog);controller.abort();
    root.classList.remove('mobile-intro-pending');overlay?.remove();
    if(app){app.inert=oldInert;if(oldHidden===null)app.removeAttribute('aria-hidden');else app.setAttribute('aria-hidden',oldHidden);}
    if(theme){if(oldTheme===null)theme.removeAttribute('content');else theme.setAttribute('content',oldTheme);}
    if(url)URL.revokeObjectURL(url);
    document.removeEventListener('DOMContentLoaded',mount);
    window.removeEventListener('hashchange',changedRoute);window.removeEventListener('pagehide',finish);mobile.removeEventListener?.('change',resized);
    if(HOME.test(location.hash)&&location.hash!=='#/home')location.replace('#/home');
  }
  function changedRoute(){if(!HOME.test(location.hash))finish();}
  function resized(){if(!mobile.matches)finish();}
  function mount(){
    if(closed)return;
    app=document.getElementById('app');
    if(app){oldInert=!!app.inert;oldHidden=app.getAttribute('aria-hidden');app.inert=true;app.setAttribute('aria-hidden','true');}
    overlay=document.createElement('div');overlay.className='mobile-intro';overlay.id='mobile-intro';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','무보소 · I Eat Busan');
    image=document.createElement('img');image.alt='';image.width=540;image.height=1170;image.decoding='sync';
    image.addEventListener('load',()=>{
      if(closed)return;clearTimeout(resourceTimer);overlay.classList.add('mobile-intro-ready');
      playTimer=setTimeout(finish,reduced?2200:3920);
    },{once:true});
    function nativeFallback(){
      if(closed)return;
      if(direct){finish();return;}
      direct=true;image.src=asset+'?play='+Date.now();
    }
    image.addEventListener('error',nativeFallback);overlay.append(image);document.body.append(overlay);
    resourceTimer=setTimeout(finish,12000);watchdog=setTimeout(finish,17000);
    resource.then(blob=>{if(closed)return;url=URL.createObjectURL(blob);image.src=url;}).catch(nativeFallback);
  }
  window.addEventListener('hashchange',changedRoute);window.addEventListener('pagehide',finish);mobile.addEventListener?.('change',resized);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
