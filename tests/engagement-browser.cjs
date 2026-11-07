// Disposable local-only browser fixture; never connects to Supabase.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let fail=false, count=0;
const state={user:{id:'fixture-user',nickname:'테스트 사용자',countryCode:'KR',area:8},preferences:{lang:'ko',langChosen:true,savedFoods:[],savedPlaces:[]},foodLikes:{},
  posts:[{id:'fixture-post',author:'테스트 사용자',area:'부산',title:'지연 검증용 게시글',body:'실제 DB에 저장되지 않는 로컬 테스트입니다.',createdAt:Date.now(),cat:'review',photos:[],likes:2,mine:false}],comments:{},postLikes:{}};
const send=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/__fixture/mode'){fail=url.searchParams.get('fail')==='1';send(res,{fail});return;}
 if(url.pathname==='/__fixture/state'){send(res,{count,fail});return;}
 if(url.pathname==='/api/service'){
   const action=url.searchParams.get('action'); count++;
   console.log('REQUEST '+count+' '+action);
   if(action==='bootstrap'){send(res,state);return;}
   let raw='';for await(const chunk of req)raw+=chunk;
   const data=JSON.parse(raw||'{}'), shouldFail=fail;
   setTimeout(()=>{
     if(shouldFail){send(res,{error:'db.failure'},503);return;}
     if(action==='preferences')state.preferences=data.data;
     if(action==='like')state.postLikes[data.postId]=data.on;
     if(action==='foodLike') { if(data.on)state.foodLikes[data.foodId]=true;else delete state.foodLikes[data.foodId]; }
     let comment;
     if(action==='comment'){
       comment={id:'canonical-'+count,text:data.text,createdAt:Date.now(),author:state.user.nickname,countryCode:state.user.countryCode,mine:true,likes:0};
       (state.comments[data.postId]||=[]).push(comment);
     }
     send(res,{saved:true,...(comment?{comment}:{})});
   },8000);return;
 }
 const name=url.pathname==='/'?'/index.html':url.pathname;
 if(!/^\/(index\.html|(?:js|css|assets)\/)/.test(name)){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+decodeURIComponent(name));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const ext=path.extname(file),types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp'};
 res.setHeader('Content-Type',types[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 if(name==='/index.html'){
  const toolbar=`<aside style="position:fixed;top:65px;right:5px;z-index:99999;background:white;border:2px solid red;padding:8px;font-size:12px">로컬 테스트 · 서버 응답 8초 지연 <button id="fail-mode">실패 모드</button><button id="ok-mode">성공 모드</button><output id="fixture-stats"></output></aside><script>document.getElementById('fail-mode').onclick=()=>fetch('/__fixture/mode?fail=1');document.getElementById('ok-mode').onclick=()=>fetch('/__fixture/mode?fail=0');setInterval(async()=>{const s=await(await fetch('/__fixture/state')).json();document.getElementById('fixture-stats').textContent=' 요청 '+s.count+' / 실패 '+s.fail;},500);</script>`;
  res.end(fs.readFileSync(file,'utf8').replace('</body>',toolbar+'</body>'));return;
 }
 fs.createReadStream(file).pipe(res);
}).listen(8781,'127.0.0.1',()=>console.log('Fixture http://127.0.0.1:8781'));
