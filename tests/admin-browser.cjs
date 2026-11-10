// Isolated fixture: all Supabase upstream requests are replaced in memory.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SECRET_KEY:'fixture-secret'});
const stamp=()=>new Date().toISOString();
const tables={
  ieb_foods:[{id:'fixture-food',name:'돼지국밥 (로컬 검증용)',summary:'실제 데이터와 연결되지 않는 관리자 화면 테스트입니다.',category:'국밥',image_asset:'dwaeji-gukbap.jpg',updated_at:stamp(),content:{ko:{name:'돼지국밥',summary:'소개 문구',ingredients:'돼지고기, 쌀',steps:['국물을 먼저 맛봅니다.'],allergens:['돼지고기']},en:{name:'Pork soup',summary:'A local preview dish.'},manuscript:{introduction:'부산의 국밥입니다.',infoRows:[['분류','국밥']],sections:['<p>상세 소개입니다.</p>','<ol><li>국물을 맛봅니다.</li><li>밥을 함께 먹습니다.</li></ol>']},places:[]}}],
  ieb_restaurant:[{id:'fixture-restaurant',name:'테스트 식당',address:'부산광역시 중구 테스트로 1',opening_hours:'월,화,수,목,금,토,일 10:00–21:00',closed_days:'매주 화요일',phone:'051-000-0000',image_asset:'',updated_at:stamp()}],
  ieb_posts:[{id:'fixture-post',title:'관리자가 수정할 게시글',body:'이 글은 로컬 테스트입니다.',created_at:stamp()}],
  ieb_comments:[{id:'fixture-comment',post_id:'fixture-post',body:'관리자가 수정할 댓글',created_at:stamp()}]
};
global.fetch=async(url,options={})=>{
 const u=new URL(url),reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
 if(u.origin!=='https://fixture.supabase.co')throw Error('Network access is forbidden in the fixture');
 if(u.pathname==='/auth/v1/token')return reply({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600});
 if(u.pathname==='/auth/v1/user')return options.headers.Authorization==='Bearer fixture-access'?reply({id:'fixture-admin',email:'local-admin@accounts.ieatbusan.invalid',app_metadata:{ieatbusan_admin:true}}):reply({},401);
 if(u.pathname==='/auth/v1/logout')return reply({});
 const table=u.pathname.replace('/rest/v1/',''),rows=tables[table];if(!rows)throw Error('Unexpected fixture table');
 const id=u.searchParams.get('id')?.replace(/^eq\./,''),filtered=id?rows.filter(row=>row.id===id):rows;
 if(options.method==='PATCH'){const body=JSON.parse(options.body);for(const row of filtered){Object.assign(row,body);if(row.updated_at)row.updated_at=stamp();}return reply(filtered.map(row=>({id:row.id})));}
 if(options.method==='DELETE'){tables[table]=rows.filter(row=>!filtered.includes(row));return reply(filtered.map(row=>({id:row.id})));}
 let result=filtered;
 const field=table==='ieb_posts'?'title':table==='ieb_comments'?'body':'name',search=u.searchParams.get(field);
 if(search)result=result.filter(row=>row[field].includes(search.replace(/^ilike\.\*|\*$/g,'')));
 return reply(structuredClone(result));
};
const handler=require('../api/service.js');
const send=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/service'){
  if(url.searchParams.get('action')==='bootstrap'){send(res,{user:null,preferences:{lang:'ko',langChosen:true},posts:[],comments:{},postLikes:{},foodLikes:{}});return;}
  let raw='';for await(const chunk of req)raw+=chunk;req.body=raw||undefined;await handler(req,res);return;
 }
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
 if(name==='/')name='/index.html';
 if(!/^\/((?:index|admin)\.html|(?:js|css|assets|chatbot)\/)/.test(name)){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 fs.createReadStream(file).pipe(res);
}).listen(8782,'127.0.0.1',()=>console.log('Isolated admin preview: http://127.0.0.1:8782/admin.html (any fixture login; never use real credentials)'));
