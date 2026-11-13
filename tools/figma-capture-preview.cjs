/* Local script-tag Figma capture bridge. Never included in the production build. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),{spawn}=require('node:child_process');
const entries=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),pending=new Map();
const promptId='9344dfcd-88d7-47be-9706-98eda0358f16';
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/capture-done'){pending.get(u.searchParams.get('id'))?.();res.end('ok');return;}
 const upstream=await fetch('http://127.0.0.1:8783'+u.pathname+u.search);let bytes=Buffer.from(await upstream.arrayBuffer());
 if(u.pathname==='/'||u.pathname.endsWith('/index.html')){
  const c=entries.find(c=>c.id===u.searchParams.get('capture'));
  if(c){let html=bytes.toString();html=html.replace('</head>',`<script>localStorage.setItem('ieatbusan.ui.v2',JSON.stringify({lang:'ko',langChosen:true}));</script><script src="/js/chatbot-catalog.js"></script><script src="https://mcp.figma.com/mcp/html-to-design/capture.js"></script></head>`);
  html=html.replace('</body>',`<script>window.addEventListener('load',async()=>{await new Promise(r=>setTimeout(r,1800));await document.fonts.ready;if(location.pathname.includes('/chatbot/')){const data=await fetch('/api/service?action=bootstrap').then(r=>r.json());window.postMessage({type:'ieb-chatbot:context',language:'ko',catalog:IEBChatbotCatalog.project(data.foods,[])},location.origin);await new Promise(r=>setTimeout(r,250));}document.querySelectorAll('.map-restaurant-row').forEach((e,i)=>{if(i>7)e.remove()});const state=${JSON.stringify(c.state==='foods'?'browse':c.state==='profile'?'conditions':c.state)};if(state){const f=document.querySelector('iframe');const d=f?f.contentDocument:document;if(state==='help')d.querySelector('#open-help')?.click();else d.querySelector('[data-tab="'+state+'"]')?.click();await new Promise(r=>setTimeout(r,300));}await window.figma.captureForDesign({captureId:'${c.id}',endpoint:'https://mcp.figma.com/mcp/capture/${c.id}/submit?bindVariables=true&promptId=${promptId}',selector:'body'});fetch('/capture-done?id=${c.id}');});</script></body>`);bytes=Buffer.from(html);}
 }
 res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type')||'application/octet-stream'});res.end(bytes);
 }catch(e){res.writeHead(500);res.end(String(e));}});
server.listen(8790,'127.0.0.1',async()=>{
 const run=async c=>{let done;const completed=new Promise(r=>done=r);pending.set(c.id,done);const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--hide-scrollbars','--user-data-dir='+process.env.TEMP+'/muboso-figma-'+c.id+'-final-'+Date.now(),'--window-size='+c.width+',1000','http://127.0.0.1:8790/'+(c.path||'')+'?capture='+c.id+'#/'+c.route],{stdio:'ignore'});const timer=setTimeout(()=>done(),120000);await completed;clearTimeout(timer);child.kill();pending.delete(c.id);console.log('CAPTURE ATTEMPT FINISHED',c.name,c.id);};
 for(let i=0;i<entries.length;i+=3)await Promise.all(entries.slice(i,i+3).map(run));server.close();
});
