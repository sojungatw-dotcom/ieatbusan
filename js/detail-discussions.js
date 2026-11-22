/* DB-backed food discussions and restaurant reviews. Five rows per request. */
(function(){
 'use strict';
 const words={
 ko:['이 음식의 커뮤니티 글','식당 리뷰','+더보기','아직 이 음식에 대한 글이 없어요.','아직 등록된 식당 리뷰가 없어요.','리뷰 작성','방문 경험을 남겨주세요.','등록하기','로그인 후 리뷰를 작성할 수 있어요.','로그인','불러오는 중…','불러오지 못했습니다. 다시 시도해 주세요.','다시 시도','리뷰가 등록되었습니다.','음식 선택','제목','리뷰 내용을 입력해 주세요.'],
 en:['Community posts about this dish','Restaurant reviews','Show more','No posts about this dish yet.','No restaurant reviews yet.','Write a review','Tell us about your visit.','Post review','Sign in to write a review.','Sign in','Loading…','Could not load. Please try again.','Try again','Review posted.','Food','Title','Please enter your review.'],
 zh:['关于这道菜的社区帖子','餐厅评价','查看更多','暂无这道菜的帖子。','暂无餐厅评价。','写评价','分享您的用餐体验。','发布评价','登录后可写评价。','登录','加载中…','加载失败，请重试。','重试','评价已发布。','选择美食','标题','请输入评价内容。'],
 ja:['この料理に関する投稿','お店のレビュー','もっと見る','この料理の投稿はまだありません。','レビューはまだありません。','レビューを書く','お店での感想をお聞かせください。','投稿する','ログインするとレビューを書けます。','ログイン','読み込み中…','読み込めませんでした。再試行してください。','再試行','レビューを投稿しました。','料理','タイトル','レビューを入力してください。']};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const copy=()=>words[Store.get().lang]||words.ko;
 function section({restaurant=false}={}){const w=copy();return '<section class="detail-section detail-discussions" data-discussions><h2>'+esc(w[restaurant?1:0])+'</h2><div data-review-editor></div><div data-discussion-list aria-live="polite"></div><p data-discussion-status role="status">'+esc(w[10])+'</p><button type="button" class="btn btn-outline discussion-more" data-discussion-more hidden>'+esc(w[2])+'</button></section>';}
 function mount({root,food,place,postCard,requireLogin,toast}){
  const section=root.querySelector('[data-discussions]');if(!section)return ()=>{};
  const w=copy(),list=section.querySelector('[data-discussion-list]'),status=section.querySelector('[data-discussion-status]'),more=section.querySelector('[data-discussion-more]');
  let active=true,busy=false,offset=0,hasMore=false,failed=false;const ids=new Set();
  const restaurantId=place?.restaurantId;
  function controls(){more.hidden=!hasMore&&!failed;more.disabled=busy;more.textContent=failed?w[12]:w[2];}
  async function load(reset=false){
   if(busy||!active)return;busy=true;failed=false;status.textContent=w[10];controls();
   try{
    const params=new URLSearchParams({action:'detailPosts',offset:String(reset?0:offset),...(place?{restaurantId}:{food})});
    const response=await fetch('/api/service?'+params,{credentials:'same-origin',cache:'no-store'});const result=await response.json();
    if(!response.ok)throw Error(result.error||'db.failure');if(!active)return;
    if(reset){offset=0;ids.clear();list.innerHTML='';}
    Store.update(s=>{const byId=new Map(s.posts.map(p=>[p.id,p]));for(const p of result.posts){byId.set(p.id,p);if(result.postLikes[p.id])s.postLikes[p.id]=true;else delete s.postLikes[p.id];}s.posts=[...byId.values()];});
    const fresh=result.posts.filter(p=>!ids.has(p.id));fresh.forEach(p=>ids.add(p.id));
    list.insertAdjacentHTML('beforeend',fresh.map(postCard).join(''));offset+=result.posts.length;hasMore=result.hasMore;
    status.textContent=ids.size?'':w[place?4:3];
   }catch(error){if(active){failed=true;status.textContent=w[11];}}
   finally{busy=false;if(active)controls();}
  }
  const editor=section.querySelector('[data-review-editor]');
  if(place&&restaurantId){
   if(!Store.get().user)editor.innerHTML='<p>'+esc(w[8])+' <a href="#/login">'+esc(w[9])+'</a></p>';
   else {
    editor.innerHTML='<form class="review-form"><h3>'+esc(w[5])+'</h3><label>'+esc(w[15])+'<input class="input" name="reviewTitle" maxlength="80" required></label><label>'+esc(w[5])+'<textarea class="textarea" name="reviewBody" maxlength="2000" placeholder="'+esc(w[6])+'" required></textarea></label><button class="btn btn-primary" type="submit">'+esc(w[7])+'</button><p data-review-status role="status"></p></form>';
    const form=editor.querySelector('form');let saving=false;
    form.addEventListener('submit',async event=>{
     event.preventDefault();event.stopPropagation();if(saving||busy||!requireLogin())return;
     const title=form.elements.reviewTitle.value.trim(),body=form.elements.reviewBody.value.trim();if(!title||!body){toast(w[16]);return;}
     saving=true;const button=form.querySelector('button');button.disabled=true;const message=form.querySelector('[data-review-status]');message.textContent='';
     try{await Cloud.call('post',{title,body,cat:'review',food,restaurantId,photos:[]});if(!active)return;form.reset();await load(true);toast(w[13]);}
     catch(error){if(active)message.textContent=w[11];}
     finally{saving=false;if(active)button.disabled=false;}
    });
   }
  }
  if(place&&!restaurantId){status.textContent=w[11];return ()=>{active=false;};}
  more.addEventListener('click',()=>load());load();return ()=>{active=false;};
 }
 window.IEBDiscussions={section,mount};
})();
