/* Support forms are separate from restaurant/community editing. */
(function(){
  'use strict';
  const languages={ko:'한국어',en:'English',zh:'中文',ja:'日本語'};
  const keys={sectionTitle:'지원 메뉴 묶음 이름',noticesLabel:'공지사항 메뉴 이름',faqLabel:'자주 묻는 질문 메뉴 이름',contactLabel:'문의 메뉴 이름',noticesTitle:'공지사항 페이지 제목',faqTitle:'FAQ 페이지 제목',contactTitle:'문의 페이지 제목',contactDescription:'문의 안내 문구'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isKind=kind=>['notices','faq','support'].includes(kind);
  const title=(row,kind)=>kind==='support'?'고객지원 메뉴 · 문의 안내':row.translations?.ko?.title||'새 항목';
  function draft(kind){return {id:null,kind:kind==='notices'?'notice':'faq',translations:{ko:{title:'',body:''}},published:true,display_order:0,notice_date:kind==='notices'?new Date().toLocaleDateString('sv-SE'):null,contact_email:''};}
  function form(row,kind){
    const fields=kind==='support'?keys:{title:kind==='faq'?'질문':'공지 제목',body:kind==='faq'?'답변':'공지 내용'};
    const groups=Object.entries(languages).map(([language,label])=>{
      const content=row.translations?.[language]||{};
      const inputs=Object.entries(fields).map(([key,name])=>`<label>${name}<textarea name="support-${language}-${key}" maxlength="${key==='body'?12000:key==='contactDescription'?4000:160}" rows="${['body','contactDescription'].includes(key)?5:2}" ${language==='ko'&&key!=='contactDescription'?'required':''}>${esc(content[key])}</textarea></label>`).join('');
      return `<details ${language==='ko'?'open':''}><summary>${label}${language==='ko'?' (필수)':''}</summary><div class="detail-fields">${inputs}</div></details>`;
    }).join('');
    return `<h2>${esc(title(row,kind))}</h2><p class="hint muted">${kind==='support'?'메뉴 이름, 페이지 제목, 이메일과 안내 문구를 관리합니다.':'한국어 내용은 필수입니다. 다른 언어는 제목과 내용을 함께 입력하거나 모두 비워주세요. 비워두면 한국어로 표시됩니다.'}</p><form id="admin-edit"><fieldset>${kind==='support'?`<label>문의 이메일<input name="contact_email" type="email" maxlength="254" value="${esc(row.contact_email)}" placeholder="예: help@example.com"></label>`:`<label><span>공개 여부</span><select name="support-published"><option value="true" ${row.published?'selected':''}>공개</option><option value="false" ${!row.published?'selected':''}>비공개</option></select></label><label>표시 순서 (작은 숫자가 먼저)<input name="display_order" type="number" min="0" max="10000" step="1" required value="${row.display_order??0}"></label>${kind==='notices'?`<label>공지 날짜<input name="notice_date" type="date" required value="${esc(row.notice_date)}"></label>`:''}`}${groups}<div class="actions"><button class="primary" type="submit">저장하기</button>${row.id?'<button type="button" id="reload">다시 불러오기</button>':''}${row.id&&kind!=='support'?'<button class="danger" type="button" id="delete">삭제</button>':''}</div></fieldset></form>`;
  }
  function read(form,kind){
    const fields=kind==='support'?Object.keys(keys):['title','body'];const translations={};
    for(const language of Object.keys(languages)){
      const row=Object.fromEntries(fields.map(key=>[key,form.elements['support-'+language+'-'+key].value.trim()]));
      if(language==='ko'||Object.values(row).some(Boolean))translations[language]=row;
    }
    return {translations,published:kind==='support'||form.elements['support-published'].value==='true',display_order:kind==='support'?0:Number(form.elements.display_order.value),notice_date:kind==='notices'?form.elements.notice_date.value:null,contact_email:kind==='support'?form.elements.contact_email.value.trim():''};
  }
  window.IEBAdminSupport={isKind,title,draft,form,read};
})();
