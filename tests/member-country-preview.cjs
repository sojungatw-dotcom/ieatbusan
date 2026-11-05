/* Local-only UI fixture: synthetic in-memory data, no Supabase calls or credentials. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const countries=require('../js/countries.js'),root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml'};
let signedIn=false,countryCode='KR',username='country_tester',nickname='테스트 회원',bio='',preferences={};
const sample=(id,countryCode,createdAt,likes)=>({id,title:countryCode+' 회원의 부산 이야기',body:'국가 우선 정렬을 확인하는 테스트 게시글입니다.',
  author:countryCode+' 여행자',area:'해운대구',cat:'free',food:null,photos:[],mine:false,countryCode,authorCountryCode:countryCode,createdAt,likes});
const now=Date.now(),posts=[sample('fixture-kr','KR',now,100),sample('fixture-jp','JP',now-60000,10),sample('fixture-us','US',now-120000,1)];
const comments={'fixture-jp':[{id:'fixture-comment',author:'이전 댓글 회원',countryCode:null,authorCountryCode:null,text:'국가 정보가 저장되지 않은 이전 댓글입니다.',createdAt:now,likes:0,mine:false}]};
http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const pathname=new URL(req.url,'http://127.0.0.1:8781').pathname;
  if(pathname==='/api/service') {
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000){res.writeHead(413).end();return;}}
    let body;try{body=raw?JSON.parse(raw):{};}catch{res.writeHead(400).end();return;}
    const action=new URL(req.url,'http://127.0.0.1:8781').searchParams.get('action');
    const reply=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    if(action==='bootstrap')return reply({user:signedIn?{id:'fixture-user',username,nickname,countryCode,area:8,bio,joined:'2026.11.05'}:null,
      preferences:signedIn?preferences:{},posts,comments,postLikes:{}});
    if(action==='signup'){if(!countries.isValid(body.countryCode))return reply({error:'profile.invalidCountry'},400);countryCode=body.countryCode;username=body.username;return reply({username});}
    if(action==='login'){signedIn=true;return reply({signedIn:true});}
    if(action==='logout'){signedIn=false;return reply({signedOut:true});}
    if(!signedIn)return reply({error:'auth.invalidCredentials'},401);
    if(action==='profile'){if(!countries.isValid(body.countryCode))return reply({error:'profile.invalidCountry'},400);countryCode=body.countryCode;nickname=body.nickname;bio=body.bio;return reply({saved:true});}
    if(action==='comment'){const id='fixture-comment-'+Date.now();(comments[body.postId]||=[]).push({id,author:nickname,countryCode,authorCountryCode:countryCode,text:body.text,createdAt:Date.now(),likes:0,mine:true});return reply({saved:true});}
    if(action==='post'){const id='fixture-post-'+Date.now();posts.unshift({id,title:body.title,body:body.body,author:nickname,area:'해운대구',cat:body.cat,food:body.food,photos:[],mine:true,countryCode,authorCountryCode:countryCode,createdAt:Date.now(),likes:0});return reply({id});}
    if(action==='country'){if(!countries.isValid(body.countryCode))return reply({error:'profile.invalidCountry'},400);countryCode=body.countryCode;return reply({saved:true});}
    if(action==='preferences'){preferences=body.data;return reply({saved:true});}
    return reply({error:'db.notFound'},404);
  }
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).slice(1);
  if(!/^(index\.html|(?:js|css|assets)\/)/.test(relative)){res.writeHead(404).end();return;}
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  if(relative==='index.html')return res.end(fs.readFileSync(file,'utf8').replace('<body>','<body><div style="position:fixed;z-index:9999;bottom:2px;right:4px;background:#fff8cc;color:#554b24;font:10px/1.4 sans-serif;padding:2px 4px;pointer-events:none">국가 기능 테스트 · 실제 DB 미연결</div>'));
  fs.createReadStream(file).pipe(res);
}).listen(8781,'127.0.0.1',()=>console.log('Synthetic member preview: http://127.0.0.1:8781/ (no DB writes)'));
