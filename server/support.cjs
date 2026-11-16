'use strict';
const {randomUUID}=require('node:crypto');
const kinds={notices:'notice',faq:'faq',support:'settings'};
const languages=['ko','en','zh','ja'];
const settingKeys=['sectionTitle','noticesLabel','faqLabel','contactLabel','noticesTitle','faqTitle','contactTitle','contactDescription'];
const owns=(object,key)=>Object.hasOwn(object,key);
const plain=value=>value && typeof value==='object' && !Array.isArray(value);
function validate(kind,patch,fail){
  const keys=['translations','published','display_order','notice_date','contact_email'];
  if(!plain(patch)||Object.keys(patch).some(key=>!keys.includes(key))||typeof patch.published!=='boolean'||!Number.isInteger(patch.display_order)||patch.display_order<0||patch.display_order>10000)fail('db.validation');
  if(!plain(patch.translations)||Object.keys(patch.translations).some(key=>!languages.includes(key))||!plain(patch.translations.ko))fail('db.validation');
  const translations={},fields=kind==='settings'?settingKeys:['title','body'];
  for(const language of languages){
    const source=patch.translations[language];if(source===undefined)continue;
    if(!plain(source)||Object.keys(source).some(key=>!fields.includes(key)))fail('db.validation');
    const target={};
    for(const key of fields){const value=source[key];const max=key==='body'?12000:key==='contactDescription'?4000:160;
      if(typeof value!=='string'||value.length>max)fail('db.validation');
      target[key]=value.trim();
    }
    if(language!=='ko'&&fields.every(key=>!target[key]))continue;
    if(fields.some(key=>key!=='contactDescription'&&!target[key]))fail('db.validation');
    translations[language]=target;
  }
  if(Buffer.byteLength(JSON.stringify(translations))>95000)fail('db.validation');
  let date=null;
  if(kind==='notice'){
    date=patch.notice_date;
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail('db.validation');
  }else if(patch.notice_date!==null&&patch.notice_date!==undefined&&patch.notice_date!=='')fail('db.validation');
  const email=patch.contact_email??'';
  if(typeof email!=='string'||email.length>254||/[\r\n]/.test(email)|| (email && !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(email)))fail('db.validation');
  if(kind!=='settings'&&email)fail('db.validation');
  if(kind==='settings'&&!patch.published)fail('db.validation');
  return {translations,published:patch.published,display_order:patch.display_order,notice_date:date,contact_email:email};
}
async function read(cfg,rest,options){
  const rows=await rest(cfg,'ieb_support_content','?select=id,kind,translations,contact_email,notice_date,display_order,published,updated_at&published=eq.true&order=display_order.asc,notice_date.desc.nullslast,id.asc&limit=1000',options);
  if(!Array.isArray(rows))return null;
  return {notices:rows.filter(row=>row.kind==='notice'),faq:rows.filter(row=>row.kind==='faq'),settings:rows.find(row=>row.kind==='settings')||null};
}
async function admin({cfg,session,name,body,rest,fail}){
  if(session.user?.app_metadata?.ieatbusan_admin!==true)fail('db.forbidden',403);
  const kind=owns(kinds,body.kind)?kinds[body.kind]:null;if(!kind)fail('db.validation');
  const base='?kind=eq.'+kind;
  if(name==='adminList'){
    const page=body.page??0,search=body.search??'';
    if(!Number.isInteger(page)||page<0||page>10000||typeof search!=='string'||search.length>100)fail('db.validation');
    const term=search.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim();
    const filter=term?'&translations->ko->>title=ilike.'+encodeURIComponent('*'+term+'*'):'';
    const rows=await rest(cfg,'ieb_support_content',base+'&select=*&order=display_order.asc,notice_date.desc.nullslast,id.asc&limit=51&offset='+page*50+(kind==='settings'?'':filter),{admin:true});
    return {rows:rows.slice(0,50).map(row=>({...row,name:kind==='settings'?'고객지원 메뉴 · 문의 안내':row.translations.ko.title,summary:(row.published?'공개':'비공개')+' · 순서 '+row.display_order+(row.notice_date?' · '+row.notice_date:'')})),hasNext:rows.length>50};
  }
  if(name==='adminCreate'){
    if(kind==='settings')fail('db.validation');
    const value=validate(kind,body.patch,fail),id=randomUUID();
    await rest(cfg,'ieb_support_content','',{admin:true,method:'POST',body:{id,kind,...value}});
    return {id,saved:true};
  }
  if(!['adminGet','adminSave','adminDelete'].includes(name))fail('db.notFound',404);
  if(typeof body.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(body.id))fail('db.validation');
  const query=base+'&id=eq.'+encodeURIComponent(body.id);
  const rows=await rest(cfg,'ieb_support_content',query+'&select=*',{admin:true});
  const row=rows[0];if(!row)fail('db.notFound',404);
  if(name==='adminGet')return {row};
  if(body.version!==row.updated_at)fail('db.conflict',409);
  if(name==='adminDelete'&&kind==='settings')fail('db.validation');
  const patch=name==='adminSave'?validate(kind,body.patch,fail):undefined;
  const changed=await rest(cfg,'ieb_support_content',query+'&updated_at=eq.'+encodeURIComponent(body.version)+'&select=id',{admin:true,method:patch?'PATCH':'DELETE',body:patch,headers:{Prefer:'return=representation'}});
  if(!changed?.length)fail('db.conflict',409);
  return {id:row.id,saved:true};
}
module.exports={read,admin,isKind:kind=>owns(kinds,kind)};
