'use strict';
// This module is reachable only through the same-origin, CSRF-checked backend.
const kinds = {
  foods: { table:'ieb_foods', list:'id,name,summary,updated_at,content->>catalogStatus', fields:{name:160,summary:2000,category:100,image_asset:200}, detail:'id,name,summary,category,image_asset,content,updated_at' },
  restaurants: { table:'ieb_restaurant', list:'id,name,address,updated_at', fields:{name:200,address:500,opening_hours:2000,closed_days:1000,phone:100,image_asset:200}, detail:'id,name,address,opening_hours,closed_days,phone,image_asset,updated_at' },
  posts: { table:'ieb_posts', list:'id,title,created_at', fields:{title:80,body:2000}, detail:'id,title,body,category,food,created_at' },
  comments: { table:'ieb_comments', list:'id,body,created_at,post_id', fields:{body:300}, detail:'id,body,post_id,created_at' },
};
const forbiddenKeys = new Set(['__proto__','prototype','constructor']);
function editContent(original, changes, fail) {
  const content=JSON.parse(JSON.stringify(original || {}));
  if (!Array.isArray(changes) || changes.length>1000) fail('db.validation');
  for (const change of changes) {
    const path=change?.path;
    if (!Array.isArray(path) || path.length<2 || path.length>12 || !['ko','en','zh','ja','manuscript'].includes(path[0]) ||
        path.some(key=>typeof key!=='string' || forbiddenKeys.has(key)) || typeof change.value!=='string' || change.value.length>30000) fail('db.validation');
    let parent=content;
    for (const key of path.slice(0,-1)) {
      if (!parent || typeof parent!=='object' || !Object.hasOwn(parent,key)) fail('db.validation');
      parent=parent[key];
    }
    const last=path.at(-1);
    if (!parent || !Object.hasOwn(parent,last) || typeof parent[last]!=='string') fail('db.validation');
    // Existing rich text is edited as text nodes by the UI. Reject executable markup.
    if (/<\s*(script|iframe|object|embed|svg|math|style|link|meta)\b|\bon[a-z]+\s*=|(?:javascript|vbscript|data)\s*:/i.test(change.value)) fail('db.validation');
    parent[last]=change.value;
    if (['en','zh','ja'].includes(path[0]) && path.length===2 && last==='summary') {
      content.editorSummaries ||= {}; content.editorSummaries[path[0]]=change.value;
    }
  }
  return content;
}
module.exports = async function adminAction({cfg,session,name,body,rest,fail}) {
  // Auth /user was fetched afresh by identity(). Never trust client-editable user_metadata.
  if (session.user?.app_metadata?.ieatbusan_admin !== true) fail('db.forbidden',403);
  if (!cfg.secret) fail('db.configuration',503);
  if (name==='adminSession') return {username:session.user.email?.split('@')[0] || '관리자'};
  const kind=Object.hasOwn(kinds,body.kind) ? kinds[body.kind] : null; if (!kind) fail('db.validation');
  if (name==='adminList') {
    const page=body.page ?? 0;
    if (!Number.isInteger(page) || page<0 || page>10000) fail('db.validation');
    const search=body.search ?? '';
    if (typeof search!=='string' || search.length>100) fail('db.validation');
    const column=body.kind==='posts'?'title':body.kind==='comments'?'body':'name';
    // PostgREST operators are fixed, and user search punctuation is literalized to spaces.
    const term=search.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim();
    const filter=term?'&'+column+'=ilike.'+encodeURIComponent('*'+term+'*'):'';
    const rows=await rest(cfg,kind.table,'?select='+kind.list+'&order=id.asc&limit=51&offset='+page*50+filter,{admin:true});
    return {rows:rows.slice(0,50),hasNext:rows.length>50};
  }
  if (!['adminGet','adminSave','adminDelete','adminRestore'].includes(name)) fail('db.notFound',404);
  if (typeof body.id!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.id)) fail('db.validation');
  const query='?id=eq.'+encodeURIComponent(body.id);
  const rows=await rest(cfg,kind.table,query+'&select='+kind.detail,{admin:true});
  const row=rows[0]; if (!row) fail('db.notFound',404);
  if (name==='adminGet') return {row};
  let match=query;
  if (row.updated_at) {
    if (body.version!==row.updated_at) fail('db.conflict',409);
    match+='&updated_at=eq.'+encodeURIComponent(body.version);
  } else {
    if (body.originalBody!==row.body) fail('db.conflict',409);
    match+='&body=eq.'+encodeURIComponent(row.body);
    if (body.kind==='posts') {
      if (body.originalTitle!==row.title) fail('db.conflict',409);
      match+='&title=eq.'+encodeURIComponent(row.title);
    }
  }
  let patch;
  if (name==='adminSave') {
    if (!body.patch || typeof body.patch!=='object' || Array.isArray(body.patch) || Object.keys(body.patch).some(key=>!Object.hasOwn(kind.fields,key))) fail('db.validation');
    patch={};
    for (const [key,value] of Object.entries(body.patch)) {
      if (typeof value!=='string' || value.length>kind.fields[key] || (['name','title','body'].includes(key) && !value.trim())) fail('db.validation');
      if (key==='image_asset' && value && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(value)) fail('db.validation');
      patch[key]=value.trim();
    }
    if (body.kind==='foods') patch.content=editContent(row.content,body.contentChanges || [],fail);
    if (!Object.keys(patch).length) fail('db.validation');
  } else if (body.kind==='foods') {
    // Food deletion hides the item from the public catalog, with a restore action.
    patch={content:{...row.content,catalogStatus:name==='adminRestore'?'active':'archived'}};
  } else if (name==='adminRestore' || body.kind==='restaurants') fail('db.validation');
  const changed=await rest(cfg,kind.table,match+'&select=id', {admin:true,method:patch?'PATCH':'DELETE',body:patch,headers:{Prefer:'return=representation'}});
  if (!changed?.length) fail('db.conflict',409);
  return {saved:true};
};
