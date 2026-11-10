/* Copy the tested standalone UI into the app, reusing app-owned food data and photos. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../chatbot-lab/dist'),out=path.join(root,'chatbot');
fs.mkdirSync(out,{recursive:true});
for(const name of ['db-rules.js','db-bot.js','db-scenarios.js'])fs.copyFileSync(path.join(source,name),path.join(out,name));
let html=fs.readFileSync(path.join(source,'index.html'),'utf8');
html=html.replace(/  <aside class="desktop-story"[\s\S]*?(?=  <main id="chatbot-panel")/,'');
html=html.replace('src="busan-data.js"','src="../js/data/foods.js"></script><script defer src="busan-data.js"').replaceAll('assets/muboso-header.png','../assets/brand/muboso-header.png').replaceAll('assets/CREDITS.md','CREDITS.md');
fs.writeFileSync(path.join(out,'index.html'),html);
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/data/foods.js'))).digest('hex');
fs.writeFileSync(path.join(out,'busan-data.js'),`/* The chatbot reads the same local catalog as the application. */\n(function(root){'use strict';root.BusanData={source:'앱 공용 js/data/foods.js',syncedAt:${JSON.stringify(new Date().toISOString())},sha256:${JSON.stringify(hash)},foods:root.FOODS.map(food=>({...food,photo:'../'+(food.photo||'assets/food/'+food.id+'.jpg')}))};})(globalThis);\n`);
fs.copyFileSync(path.join(root,'CREDITS.md'),path.join(out,'CREDITS.md'));
let app=fs.readFileSync(path.join(source,'app.js'),'utf8');
app=app.replace(" const input=$('message');",` const input=$('message');
 document.body.classList.add('embedded');
 function bridge(type){if(window.parent!==window)window.parent.postMessage({type},location.origin==='null'?'*':location.origin);}
 function setMode(mode){document.body.classList.toggle('embedded-desktop',mode==='desktop');$('close-chat').setAttribute('aria-label',mode==='desktop'?'챗봇 닫기':'이전 화면으로 돌아가기');}
 document.body.classList.toggle('embedded-desktop',new URLSearchParams(location.search).get('embed')==='desktop');
 window.addEventListener('message',event=>{if(event.source!==window.parent||event.origin!==location.origin)return;if(event.data?.type==='ieb-chatbot:mode'&&['desktop','mobile'].includes(event.data.mode))setMode(event.data.mode);});
`);
app=app.replace("const opened=window.location.hash==='#chatbot';","const opened=true;");
app=app.replace("mobile.matches?'이전 화면으로 돌아가기':'챗봇 닫기'","document.body.classList.contains('embedded-desktop')?'챗봇 닫기':'이전 화면으로 돌아가기'");
app=app.replace(' function closeChat(){',` function closeChat(){
  if(window.parent===window)location.href='../index.html';else bridge('ieb-chatbot:close');return;
`);
app=app.replace("const expanded=panel.classList.toggle('is-expanded');", "bridge('ieb-chatbot:expand');const expanded=panel.classList.toggle('is-expanded');");
app=app.replace(" reset();renderCategories();renderCatalog();renderLibrary();syncChatSurface();", " $('chatbot-panel').querySelector('.brand-logo').addEventListener('click',event=>{event.preventDefault();closeChat();});\n reset();renderCategories();renderCatalog();renderLibrary();syncChatSurface();");
app=app.replace(/  if\(window.history.state\?\.mubosoChat\)[\s\S]*?\n \}/, ' }');
fs.writeFileSync(path.join(out,'app.js'),app);
const embedCss=`\n/* The host app controls placement; the conversation fills its frame. */
body.embedded{background:var(--bg)}.embedded .desktop-story,.embedded .mobile-entry,.embedded #chatbot-launcher{display:none!important}.embedded .experience{display:block;min-height:100dvh;padding:0}.embedded .app-frame,.embedded .app-frame.is-expanded{inset:0;width:100%;max-width:none;height:100dvh;min-height:0;max-height:none;border:0;border-radius:0;box-shadow:none}.embedded-desktop .expand-chat{display:inline-grid}.embedded-desktop .mobile-back{display:none}.embedded-desktop .desktop-close{display:block}.embedded-desktop .close-chat{order:initial}.embedded-desktop .app-header h1{font-size:16px}.embedded-desktop .app-header{height:66px}.embedded-desktop .app-frame.is-expanded .food-list{grid-template-columns:repeat(2,minmax(0,1fr))}\n`;
fs.writeFileSync(path.join(out,'style.css'),fs.readFileSync(path.join(source,'style.css'),'utf8')+embedCss+'\n.embedded #close-chat,.embedded #expand-chat{display:none!important}.embedded .app-header{padding-left:12px;padding-right:100px}.embedded .app-header h1{font-size:14px}@media(max-width:500px){.embedded .app-header{padding-left:6px;padding-right:46px}}@media(max-width:360px){.embedded .app-header h1{font-size:12px}}.embedded-desktop .app-header{padding-right:100px}\n');
console.log('Integrated chatbot updated: 43 app-owned foods, shared photos, 44 scenarios.');
