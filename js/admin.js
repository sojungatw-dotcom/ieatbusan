(function () {
  'use strict';
  const root=document.getElementById('admin-root'),logout=document.getElementById('logout'),status=document.getElementById('admin-status');
  const labels={foods:'음식 정보',restaurants:'식당 정보',posts:'커뮤니티 게시글',comments:'댓글'};
  const fields={foods:['name','summary','category','image_asset'],restaurants:['name','address','opening_hours','closed_days','phone','image_asset'],posts:['title','body'],comments:['body']};
  const names={name:'이름',summary:'음식 설명',category:'분류',image_asset:'이미지 파일 이름',address:'상세 주소',opening_hours:'영업일·영업시간',closed_days:'휴무일',phone:'전화번호',title:'제목',body:'내용',ko:'한국어',en:'영어',zh:'중국어',ja:'일본어',manuscript:'음식 상세 내용',introduction:'음식 소개',sections:'상세 섹션',infoRows:'상세 정보',ingredients:'주재료',taste:'맛·식감',price:'가격',origin:'소개·유래',steps:'먹는 방법',allergens:'알레르기 성분',allergenNote:'알레르기 주의사항',allergenInfo:'알레르기 정보',notes:'안내 문구',restaurants:'식당 소개',gloss:'한국어 이름 표기',region:'지역',spice:'매운맛',season:'계절',method:'조리 방법',cooking:'조리 방법'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let kind='foods',page=0,search='',selected=null,dirty=false,busy=false,listGeneration=0,editorGeneration=0,textFields=[];
  let toastTimer;
  const messages={'db.forbidden':'관리자 권한이 없습니다. 관리자 계정으로 로그인해 주세요.','db.configuration':'서버 연결 설정을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.','auth.invalidCredentials':'아이디와 비밀번호를 확인하거나 다시 로그인해 주세요.','db.conflict':'다른 곳에서 정보가 변경되었습니다. 다시 불러온 뒤 수정해 주세요.','db.validation':'입력한 내용의 길이나 형식을 확인해 주세요.','db.notFound':'정보를 찾을 수 없습니다.','db.rateLimit':'요청이 많습니다. 잠시 후 다시 시도해 주세요.'};
  function notify(message){status.textContent=message;status.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{status.hidden=true;},5000);}
  async function api(action,data={}) {
    let response;
    try {response=await fetch('/api/service?action='+action,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}catch{throw new Error('서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.');}
    let payload;try{payload=await response.json();}catch{throw new Error('서버 응답을 읽을 수 없습니다.');}
    if(!response.ok){const error=new Error(messages[payload.error]||'요청을 처리하지 못했습니다.');error.status=response.status;throw error;}
    return payload;
  }
  function report(error){if(error.status===401||error.status===403){selected=null;dirty=false;login(error.message);}else notify(error.message);}
  function confirmAction(message) {
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog');
      dialog.className='admin-confirm';dialog.setAttribute('aria-labelledby','confirm-title');
      dialog.innerHTML='<form method="dialog"><h2 id="confirm-title">확인해 주세요</h2><p></p><div class="actions"><button value="cancel" autofocus>취소</button><button class="primary" value="confirm">확인</button></div></form>';
      dialog.querySelector('p').textContent=message;
      dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='confirm';dialog.remove();resolve(accepted);},{once:true});
      document.body.append(dialog);dialog.showModal();
    });
  }
  function login(message='') {
    listGeneration++; editorGeneration++; selected=null; dirty=false;
    root.removeAttribute('aria-busy');logout.hidden=true;
    root.innerHTML=`<section class="login"><h1>관리자 로그인</h1><p class="muted">관리자 권한을 받은 회원 계정으로 로그인해 주세요.</p><form id="admin-login"><label>아이디<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="4" maxlength="20" pattern="[A-Za-z0-9_]{4,20}"></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="72"></label><p class="error" role="alert" ${message?'':'hidden'}>${esc(message)}</p><button class="primary" type="submit">로그인</button></form></section>`;
  }
  function workspace(user) {
    logout.hidden=false;root.removeAttribute('aria-busy');
    root.innerHTML=`<div class="workspace"><h1>콘텐츠 관리</h1><p class="muted">${esc(user.username)} 관리자 · 저장한 내용은 웹서비스의 DB 데이터에 반영됩니다.</p><nav class="tabs" aria-label="관리 항목">${Object.entries(labels).map(([key,label])=>`<button type="button" data-kind="${key}" aria-pressed="${key===kind}">${label}</button>`).join('')}</nav><div class="columns"><section class="panel" aria-label="게시물 목록"><form class="search" id="admin-search"><input name="search" aria-label="이름 또는 내용 검색" placeholder="이름 또는 내용 검색" maxlength="100"><button>검색</button></form><p id="list-state" role="status"></p><ul class="records" id="records"></ul><div class="pager"><button type="button" id="prev">이전</button><span id="page"></span><button type="button" id="next">다음</button></div></section><section class="panel" id="editor" aria-label="내용 수정"><p class="empty">목록에서 수정할 항목을 선택해 주세요.</p></section></div></div>`;
  }
  async function loadList() {
    const generation=++listGeneration,state=document.getElementById('list-state');if(!state)return;
    state.textContent='목록을 불러오고 있습니다.';
    const data=await api('adminList',{kind,page,search});if(generation!==listGeneration||!state.isConnected)return;
    state.textContent=data.rows.length?`${labels[kind]} · ${data.rows.length}개 표시`:'검색 결과가 없습니다.';
    document.getElementById('records').innerHTML=data.rows.map(row=>`<li><button class="record" type="button" data-record="${esc(row.id)}" aria-current="${selected?.id===row.id}"><b>${esc(row.name||row.title||row.body?.slice(0,60)||row.id)}</b><small>${esc(row.address||row.summary||row.created_at?.slice(0,10)||'')}</small>${row.catalogStatus==='archived'?'<span class="archive">숨김 상태</span>':''}</button></li>`).join('');
    document.getElementById('prev').disabled=page===0;document.getElementById('next').disabled=!data.hasNext;document.getElementById('page').textContent=`${page+1} 페이지`;
  }
  function collectText(value,path=[],out=[]) {
    if(out.length>1000||path.length>12)return out;
    if(path.length===2 && path[0]==='ko' && ['name','summary','category'].includes(path[1])) return out;
    if(typeof value==='string'){
      if(!value.trim()||/^https?:\/\//i.test(value)||['url','source','sourceUrl','naverUrl','kakaoUrl','googleUrl','photo','imageAsset','file','license','tip'].includes(path.at(-1)))return out;
      const label=path.map(key=>names[key]||(/^\d+$/.test(key)?Number(key)+1:key)).join(' / ');
      if(/<[a-z][\s\S]*>/i.test(value)){
        const doc=new DOMParser().parseFromString(value,'text/html');
        const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);const nodes=[];
        while(walker.nextNode())if(walker.currentNode.textContent.trim()&&!['SCRIPT','STYLE'].includes(walker.currentNode.parentElement?.tagName))nodes.push(walker.currentNode);
        for(const [i,node] of nodes.entries())out.push({path,label:label+' / 문장 '+(i+1),value:node.textContent,doc,node,original:value});
      }else out.push({path,label,value,original:value});
    }else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value))collectText(child,[...path,key],out);
    return out;
  }
  function field(label,value,name,max=30000){return `<label>${esc(label)}<textarea name="${name}" maxlength="${max}" rows="${String(value??'').length>120?4:2}">${esc(value)}</textarea></label>`;}
  async function openRecord(id,{discard=false}={}) {
    if(!discard&&dirty&&!(await confirmAction('저장하지 않은 변경 내용을 버리고 이동할까요?')))return;
    const generation=++editorGeneration,recordKind=kind;
    const {row}=await api('adminGet',{kind:recordKind,id});if(generation!==editorGeneration||recordKind!==kind)return;
    selected=row;dirty=false;
    textFields=[];
    if(kind==='foods')for(const key of ['manuscript','ko','en','zh','ja'])if(row.content?.[key])collectText(row.content[key],[key],textFields);
    const limits={name:kind==='restaurants'?200:160,summary:2000,category:100,image_asset:200,address:500,opening_hours:2000,closed_days:1000,phone:100,title:80,body:kind==='comments'?300:2000};
    document.getElementById('editor').innerHTML=`<h2>${esc(row.name||row.title||'댓글 수정')}</h2><p class="hint muted">${kind==='foods'?'음식 삭제는 서비스 목록에서 숨기며, 복원할 수 있습니다.':kind==='restaurants'?'식당의 주소·운영 정보와 이미지 파일 이름을 수정할 수 있습니다.':'삭제한 게시글과 댓글은 복구할 수 없습니다.'}</p><form id="admin-edit"><fieldset>${fields[kind].map(key=>field(names[key],row[key],key,limits[key])).join('')}${kind==='foods'?`<details><summary>음식 상세 문구 수정 (${textFields.length}개)</summary><p class="hint muted">기존 문장과 서식은 유지하면서 필요한 문구를 수정하세요. 언어별 내용은 각각 수정합니다.</p><div class="detail-fields">${textFields.map((item,i)=>field(item.label,item.value,'text-'+i)).join('')}</div></details>`:''}<div class="actions"><button class="primary" type="submit">저장하기</button><button type="button" id="reload">다시 불러오기</button>${kind!=='restaurants'?`<button class="danger" type="button" id="delete">${kind==='foods'&&row.content?.catalogStatus==='archived'?'복원':'삭제'}</button>`:''}</div></fieldset></form>`;
    document.querySelectorAll('[data-record]').forEach(el=>el.setAttribute('aria-current',el.dataset.record===id?'true':'false'));
  }
  function version(){return{version:selected.updated_at,originalBody:selected.body,originalTitle:selected.title};}
  function changes(form) {
    const changes=new Map();
    for(const [i,item]of textFields.entries()){
      const value=form.elements['text-'+i].value;
      if(item.node)item.node.textContent=value;
    }
    for(const [i,item]of textFields.entries()){
      const value=item.doc?item.doc.body.innerHTML:form.elements['text-'+i].value;
      if(value!==item.original)changes.set(JSON.stringify(item.path),{path:item.path,value});
    }
    return [...changes.values()];
  }
  root.addEventListener('input',event=>{if(event.target.closest('#admin-edit'))dirty=true;});
  root.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;const form=event.target;busy=true;
    const buttons=[...form.querySelectorAll('button')];buttons.forEach(el=>el.disabled=true);
    try{
      if(form.id==='admin-login'){
        const username=form.elements.username.value,password=form.elements.password.value;
        await api('login',{username,password});form.elements.password.value='';
        const user=await api('adminSession');workspace(user);await loadList();
      }else if(form.id==='admin-search'){search=form.elements.search.value;page=0;await loadList();}
      else if(form.id==='admin-edit'){
        const patch=Object.fromEntries(fields[kind].map(key=>[key,form.elements[key].value]));
        const payload={kind,id:selected.id,...version(),patch,contentChanges:kind==='foods'?changes(form):[]};
        form.querySelector('fieldset').disabled=true;
        await api('adminSave',payload);dirty=false;notify('저장했습니다. 서비스 화면을 새로고침하면 반영됩니다.');await openRecord(selected.id,{discard:true});await loadList();
      }
    }catch(error){if(form.id==='admin-login'&&error.status!==403){const message=form.querySelector('.error');message.textContent=error.message;message.hidden=false;}else report(error);}
    finally{busy=false;buttons.forEach(el=>el.disabled=false);const fieldset=form.querySelector('fieldset');if(fieldset)fieldset.disabled=false;}
  });
  root.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button||busy)return;
    try{
      if(button.dataset.kind){if(dirty&&!confirm('저장하지 않은 변경 내용을 버리고 이동할까요?'))return;kind=button.dataset.kind;page=0;search='';selected=null;dirty=false;editorGeneration++;document.getElementById('admin-search').reset();document.getElementById('editor').innerHTML='<p class="empty">목록에서 수정할 항목을 선택해 주세요.</p>';root.querySelectorAll('[data-kind]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.kind===kind?'true':'false'));await loadList();}
      else if(button.dataset.record)await openRecord(button.dataset.record);
      else if(button.id==='prev'||button.id==='next'){page+=button.id==='prev'?-1:1;await loadList();}
      else if(button.id==='reload')await openRecord(selected.id);
      else if(button.id==='delete'){
        const restore=kind==='foods'&&selected.content?.catalogStatus==='archived';
        const prompt=restore?'이 음식을 다시 공개할까요?':kind==='foods'?'이 음식을 서비스 목록에서 숨길까요?':'정말 삭제하시겠습니까?'+(kind==='posts'?' 게시글에 달린 댓글도 함께 삭제됩니다.':'');
        if(!(await confirmAction(prompt)))return;busy=true;button.disabled=true;
        await api(restore?'adminRestore':'adminDelete',{kind,id:selected.id,...version()});dirty=false;notify(restore?'복원했습니다.':'삭제했습니다.');
        if(kind==='foods')await openRecord(selected.id,{discard:true});else{selected=null;document.getElementById('editor').innerHTML='<p class="empty">삭제했습니다. 다른 항목을 선택해 주세요.</p>';}
        await loadList();
      }
    }catch(error){report(error);}finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
  logout.addEventListener('click',async()=>{if(busy||(dirty&&!(await confirmAction('변경 내용을 저장하지 않고 로그아웃할까요?'))))return;busy=true;try{await api('logout');selected=null;dirty=false;login();}catch(error){report(error);}finally{busy=false;}});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  api('adminSession').then(async user=>{workspace(user);await loadList();}).catch(error=>{login(error.status===401?'':error.message);});
})();
