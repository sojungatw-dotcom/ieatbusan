const fs=require('node:fs'),path=require('node:path');
const [root,source]=process.argv.slice(2);
const ids=['dwaeji-gukbap','milmyeon','multteok','nakgopsae','dongnae-pajeon','jobang-nakji','ssiat-hotteok','busan-wandang','kkomjangeo','naengchae-jokbal','pohang-mulhoe','gwamegi','mungtigi','andong-jjimdak','andong-godeungeo','yeongdeok-uljin-daege','daegu-kongguk','cheongdo-minari-samgyeopsal','yonggung-sundae','daegu-makchang','daegu-napjak-mandu','andong-heotjesatbap','eonyang-bulgogi','gorae-gogi','jinju-naengmyeon','masan-bokguk','hadong-jaecheopguk','namhae-myeolchi-ssambap','masan-agujjim','chungmu-gimbap','meongge-bibimbap','dodari-ssukguk','jinju-bibimbap','uiryeong-manggaetteok'];
const text=fs.readFileSync(source,'utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n').replace(/^- \*\*출처:\*\*[^\n]*\n?/gm,'');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(s){
 const links=[];
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/\S+?)\)(?=\s|$)/g,(_,label,href)=>{
  const u=new URL(href); if(u.hostname.endsWith('visitbusan.net'))u.searchParams.delete('pagingParms');
  const token='@@LINK'+links.length+'@@'; links.push(`<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`);return token;
 });
 s=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
 links.forEach((link,i)=>{s=s.replace('@@LINK'+i+'@@',link)});return s;
}
function render(s){
 const lines=s.trim().split('\n'),out=[];let i=0;
 while(i<lines.length){const line=lines[i].trim();
  if(!line||line==='---'||/^3곳 목표에서/.test(line)){i++;continue}
  if(line.startsWith('|')){const rows=[];while(i<lines.length&&lines[i].trim().startsWith('|')){
   const cells=lines[i++].trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
   if(cells.length===2&&cells[0]!=='항목'&&!/^:?-+:?$/.test(cells[0]))rows.push(cells);
  }out.push('<dl class="info-card">'+rows.map(([a,b])=>`<div class="info-row"><dt>${inline(a)}</dt><dd>${inline(b)}</dd></div>`).join('')+'</dl>');continue;}
  if(line.startsWith('- ')){const items=[];while(i<lines.length&&lines[i].trim().startsWith('- '))items.push('<li>'+inline(lines[i++].trim().slice(2))+'</li>');out.push('<ul>'+items.join('')+'</ul>');continue;}
  if(/^\*\*Step \d+\.\*\*/.test(line)){const items=[];while(i<lines.length){const cur=lines[i].trim();if(!cur){i++;continue;}const m=cur.match(/^\*\*Step \d+\.\*\*\s*(.*)/);if(!m)break;items.push('<li><span>'+inline(m[1])+'</span></li>');i++;}out.push('<ol class="steps">'+items.join('')+'</ol>');continue;}
  if(line.startsWith('#### '))out.push('<h3>'+inline(line.slice(5))+'</h3>');
  else if(/^\*\*.+\*\*$/.test(line))out.push('<h3>'+inline(line.slice(2,-2))+'</h3>');
  else if(line.startsWith('> '))out.push('<blockquote>'+inline(line.slice(2))+'</blockquote>');
  else out.push('<p>'+inline(line)+'</p>'); i++;
 }return out.join('\n');
}
const field=(s,label)=>s.match(new RegExp('^- \\*\\*'+label+':\\*\\*\\s*(.*)$','m'))?.[1]?.trim()||'';
const matches=[...text.matchAll(/^## (\d{2})\. (.+)$/gm)];if(matches.length!==34||ids.length!==34)throw Error('Expected 34 foods');
const entries=matches.map((m,n)=>{
 const chunk=text.slice(m.index+m[0].length,matches[n+1]?.index??text.indexOf('## 초기 서비스 후보')).split('**팀 내부 메모**')[0].trim().replace(/-+$/,'').trim();
 const sections=chunk.split(/^### (?:상단 소개|[1-4]\. .+)\s*$/m).slice(1);if(sections.length!==5)throw Error('Sections '+n);
 const [intro,info,rawHow,allergy,places]=sections;
 // The visitor card contains its introduction and numbered steps only.
 const how=rawHow.replace(/^- \*\*소스·양념:[\s\S]*$/m,'').trim();
 const rows=Object.fromEntries([...info.matchAll(/^\| ([^|]+) \| ([^|]+) \|$/gm)].map(m=>[m[1].trim(),m[2].trim()]));
 const introduction=info.match(/\*\*음식 소개·유래\*\*\s*([^\n]+)/)?.[1]?.trim();
 if(!introduction)throw Error('Missing revised introduction: '+ids[n]);
 const infoRows=[...info.matchAll(/^\| ([^|]+) \| ([^|]+) \|$/gm)].filter(m=>m[1].trim()!=='항목').map(m=>[m[1].trim(),m[2].trim()]);
 const allergenTerms=[field(allergy,'일반적으로 확인할 재료'),field(allergy,'가게·메뉴별 가변 재료')].flatMap(value=>value.split(' · ')).map(value=>value.trim()).filter(value=>value&&!value.includes('확정 안 됨'));
 const allergyNotes=allergy.split('\n').map(line=>line.trim()).filter(line=>line&&!/^- \*\*(?:일반적으로 확인할 재료|가게·메뉴별 가변 재료):/.test(line)).map(line=>line.replace(/^- \*\*([^*]+)\*\*\s*/,'$1 '));
 const allergenInfo={allergens:[...new Set(allergenTerms)],notes:allergyNotes};
 const placesIntro=render(places.split(/^#### /m)[0].replace(/^\*\*[^\n]+\*\*\s*$/gm,''));
 const restaurants=[...places.matchAll(/^#### (.+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)].map(r=>({name:r[1],area:field(r[2],'주소'),signature:field(r[2],'실제 메뉴 / 게시 가격'),hours:field(r[2],'게시 영업시간'),holiday:field(r[2],'게시 정기휴무'),priceNote:field(r[2],'가격 기준'),visitNote:field(r[2],'외국인 방문 참고'),unverified:field(r[2],'미확인'),date:field(r[2],'조사일'),linksHtml:inline(field(r[2],'지도 검색')),matchType:places.slice(0,r.index).lastIndexOf('**유사 메뉴')>places.slice(0,r.index).lastIndexOf('**해당 메뉴')?'similar':'exact',html:render(r[2])}));
 return {id:ids[n],sourceId:'IEB-FOOD-'+String(n+1).padStart(3,'0'),name:field(intro,'음식명'),summary:field(intro,'한 줄 소개'),category:field(intro,'분류 문구'),ingredients:rows['주재료']||'',taste:rows['맛·식감']||'',price:rows['가격']||'',names:field(intro,'다국어 음식명\\(검수 전\\)').split(' / '),introduction,infoRows,allergenInfo,sections:[info,how,allergy,places].map(render),placesIntro,restaurants};
});
const file=path.join(root,'js/data/foods.js');const base=fs.readFileSync(file,'utf8').split('\n/* Imported food-detail manuscript')[0].trimEnd();
fs.writeFileSync(file,base+`\n/* Imported food-detail manuscript (2026-11-03). Source: docs/research/food-detail-manuscript.md.
   Generated by tools/import-food-manuscript.cjs. Unknown photos, metrics and coordinates stay unset. */
(function () {
 const entries = ${JSON.stringify(entries,null,2)};
 for (const item of entries) {
  let food = window.FOODS.find(f => f.id === item.id);
  if (!food) { food = { id: item.id, likes: 0, places: [], ko: {} }; window.FOODS.push(food); }
  const originalPlaces = food.places.map((p, i) => ({ ...p, info: { ...food.ko.restaurants[i] } }));
  const normalize = name => name.replace(/\\s+/g, '').toLowerCase();
  for (const restaurant of item.restaurants) {
   const prior = originalPlaces.find(p => normalize(p.name) === normalize(restaurant.name));
   if (prior) { prior.research = restaurant; prior.info = { area: restaurant.area, signature: restaurant.signature }; }
   else originalPlaces.push({ name: restaurant.name, lat: null, lng: null, research: restaurant, info: { area: restaurant.area, signature: restaurant.signature } });
  }
  item.placeRecordsMerged = true;
  food.manuscript = item;
  food.photo = food.credit ? 'assets/food/' + food.id + '.jpg' : 'assets/food-placeholder.svg';
  food.places = originalPlaces.map(({ info, ...place }) => place);
  food.ko = { name: item.name, summary: item.summary, category: item.category, ingredients: item.ingredients,
   taste: item.taste, price: item.price, calories: '', origin: '', steps: [], tip: '', allergens: item.allergenInfo.allergens, allergenNote: item.allergenInfo.notes.join(' '),
   restaurants: originalPlaces.map(p => p.info) };
  for (const [i, language] of ['en','zh','ja'].entries()) food[language] = { ...food.ko, name: item.names[i] || item.name, gloss: '' };
 }
})();\n`);
if(path.resolve(source)!==path.resolve(root,'docs/research/food-detail-manuscript.md'))fs.copyFileSync(source,path.join(root,'docs/research/food-detail-manuscript.md'));
if(path.resolve(__filename)!==path.resolve(root,'tools/import-food-manuscript.cjs'))fs.copyFileSync(__filename,path.join(root,'tools/import-food-manuscript.cjs'));
fs.writeFileSync(path.join(root,'assets/food-placeholder.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#f5f2ec"/><text x="320" y="210" text-anchor="middle" font-size="24" fill="#777" font-family="sans-serif">사진 준비 중</text></svg>');
console.log('Imported',entries.length,'foods and',entries.reduce((n,f)=>n+f.restaurants.length,0),'restaurant source records');
