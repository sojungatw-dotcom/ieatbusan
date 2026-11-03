/* I EAT BUSAN — 해시 라우팅 기반 단일 페이지 앱 (빌드 없이 index.html만 열면 동작) */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const S = () => Store.get();
  const FOODS = window.FOODS;
  const FOOD = Object.fromEntries(FOODS.map(f => [f.id, f]));
  const PROVIDERS = { kakao: 'Kakao', naver: 'Naver', apple: 'Apple' };
  const DEFAULT_NICK = { ko: '부산토박이', en: 'Busan Foodie', zh: '釜山吃货', ja: '釜山グルメ' };

  /* ---------- helpers ---------- */
  const lang = () => S().lang || 'ko';
  function t(key, vars) {
    let s = (I18N[lang()] && I18N[lang()][key]) ?? I18N.ko[key] ?? key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = f => (lang() !== 'ko' && f[lang()]) ? f[lang()] : f.ko;
  const fname = f => L(f).name;
  const img = id => `assets/food/${id}.jpg`;
  const placeKey = (fid, i) => `${fid}:${i}`;
  const placeOf = (fid, i) => {
    const f = FOOD[fid]; if (!f || !f.places[i]) return null;
    const lp = (L(f).restaurants || [])[i] || f.ko.restaurants[i];
    return { food: f, i, name: f.places[i].name, lat: f.places[i].lat, lng: f.places[i].lng, area: lp.area, signature: lp.signature, areaKo: f.ko.restaurants[i].area };
  };
  const allPlaces = () => FOODS.flatMap(f => f.places.map((_, i) => placeOf(f.id, i)));
  const foodLikes = f => f.likes + (S().savedFoods.includes(f.id) ? 1 : 0);
  const placeLikes = p => Math.max(12, Math.round(p.food.likes * (0.45 - p.i * 0.08))) + (S().savedPlaces.includes(placeKey(p.food.id, p.i)) ? 1 : 0);
  function ago(ts) {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 1) return t('time.now');
    if (m < 60) return t('time.min', { n: m });
    if (m < 1440) return t('time.hour', { n: Math.floor(m / 60) });
    return t('time.day', { n: Math.floor(m / 1440) });
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }
  const loggedIn = () => !!S().user;
  function requireLogin() { if (loggedIn()) return true; toast(t('toast.loginRequired')); loginIntent = true; go('#/login'); return false; }
  const go = h => { if (location.hash === h) route(); else location.hash = h; };
  const initial = name => esc(String(name || '?').trim().charAt(0).toUpperCase());

  /* ---------- community data ---------- */
  const seedTime = mins => S().seededAt - mins * 60000;
  function allPosts() {
    const st = S();
    const seed = SEED.posts.filter(p => !st.deletedPosts.includes(p.id)).map(p => ({ ...p, createdAt: seedTime(p.minutesAgo), photos: p.img ? [img(p.img)] : [], mine: false }));
    return [...st.posts.filter(p => !st.deletedPosts.includes(p.id)), ...seed];
  }
  const postById = id => allPosts().find(p => p.id === id);
  const postLikes = p => p.likes + (S().postLikes[p.id] ? 1 : 0);
  function commentsOf(id) {
    const seed = (SEED.comments[id] || []).map(c => ({ ...c, createdAt: seedTime(c.minutesAgo) }));
    return [...seed, ...(S().comments[id] || [])].sort((a, b) => a.createdAt - b.createdAt);
  }
  const notifications = () => SEED.notifications.map(n => ({ ...n, createdAt: seedTime(n.minutesAgo) }));
  const hasUnread = () => notifications().some(n => n.createdAt > S().notiReadAt);
  const catLabel = c => t('cat.' + c);
  const districtName = i => (DISTRICTS[lang()] || DISTRICTS.ko)[i] ?? '';

  /* ---------- shared UI ---------- */
  function appHeader() {
    return `<header class="app-header">
      <a class="logo" href="#/home">I EAT BUSAN</a>
      <div class="header-actions">
        <a class="lang-pill" href="#/lang" aria-label="${esc(t('set.language'))}">${icon('globe')}<span>${esc(t('lang.code'))}</span></a>
        <a class="icon-btn" href="#/search" aria-label="${esc(t('search.placeholder'))}">${icon('search')}</a>
        <a class="icon-btn" href="#/notifications" aria-label="${esc(t('noti.title'))}">${icon('bell')}${hasUnread() ? '<span class="dot"></span>' : ''}</a>
      </div>
    </header>`;
  }
  function pageHeader(title, { back = true, fallback = '#/home', right = '' } = {}) {
    return `<header class="page-header">
      ${back ? `<button class="icon-btn" data-act="back" data-fallback="${fallback}" aria-label="${esc(t('common.back'))}">${icon('back')}</button>` : '<span style="width:10px"></span>'}
      <h1 class="page-title">${esc(title)}</h1>${right}
    </header>`;
  }
  function tabbar(active) {
    const tabs = [['home', 'home', '#/home'], ['map', 'map', '#/map'], ['community', 'community', '#/community'], ['saved', 'heart', '#/saved'], ['my', 'user', '#/my']];
    return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, ic, href]) =>
      `<a class="tab" href="${href}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(t('tab.' + k))}</span></a>`).join('')}</nav>`;
  }
  const empty = (msg, ic = 'info', extra = '') => `<div class="empty">${icon(ic)}<p>${esc(msg)}</p>${extra}</div>`;
  function foodRow(f, { save = true } = {}) {
    const saved = S().savedFoods.includes(f.id);
    return `<div class="list-item">
      <a href="#/food/${f.id}" style="display:contents"><img class="thumb" src="${img(f.id)}" alt="" loading="lazy">
      <span class="li-body"><span class="li-title">${esc(fname(f))}</span><span class="li-sub">${esc(L(f).summary)}</span>
      <span class="li-meta">♥ ${foodLikes(f)} · ${esc(t('saved.places.count', { n: f.places.length }))}</span></span></a>
      ${save ? `<button class="save-btn" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="♥">${icon('heart', saved)}</button>` : ''}
    </div>`;
  }
  function placeRow(p, { save = true, showFood = false } = {}) {
    const key = placeKey(p.food.id, p.i), saved = S().savedPlaces.includes(key);
    return `<div class="list-item">
      <a href="#/place/${p.food.id}/${p.i}" style="display:contents"><img class="thumb sm" src="${img(p.food.id)}" alt="" loading="lazy">
      <span class="li-body"><span class="li-title">${esc(p.name)}</span><span class="li-sub">${esc(p.area)}</span>
      <span class="li-meta">${esc(showFood ? fname(p.food) + ' · ' : '')}${esc(t('place.signature'))} · ${esc(p.signature)}</span></span></a>
      ${save ? `<button class="save-btn" data-act="savePlace" data-key="${key}" aria-pressed="${saved}" aria-label="♥">${icon('heart', saved)}</button>` : `<span class="like">${icon('heart')}${placeLikes(p)}</span>`}
    </div>`;
  }
  function postCard(p) {
    const n = commentsOf(p.id).length;
    return `<a class="post-card" href="#/post/${p.id}">
      <div class="post-head"><span class="avatar">${initial(p.author)}</span>
        <span class="who"><b>${esc(p.author)}</b><span>${esc(p.areaLabel || p.area)} · ${esc(ago(p.createdAt))}</span></span>
        <span class="badge">${esc(catLabel(p.cat))}</span></div>
      <div class="post-content"><div class="post-text"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div>
        ${p.photos && p.photos[0] ? `<img class="thumb" src="${esc(p.photos[0])}" alt="" loading="lazy">` : ''}</div>
      <div class="post-foot"><span class="like ${S().postLikes[p.id] ? 'on' : ''}">${icon('heart', !!S().postLikes[p.id])}${postLikes(p)}</span><span class="like">${icon('comment')}${n}</span></div>
    </a>`;
  }

  /* ---------- views ---------- */
  const V = {};

  V.login = () => `<main class="screen login">
    <a class="lang-pill top-right" href="#/lang">${icon('globe')}<span>${esc(t('lang.name'))} · ${esc(t('lang.code'))}</span></a>
    <div class="login-hero"><div class="app-icon">IEB</div><div class="logo">I EAT BUSAN</div><p class="sub" style="margin:0">${esc(t('app.tagline'))}</p></div>
    <div class="login-buttons">
      <button class="btn btn-primary btn-block" data-act="login" data-p="kakao">${esc(t('login.kakao'))}</button>
      <button class="btn btn-outline btn-block" data-act="login" data-p="naver">${esc(t('login.naver'))}</button>
      <button class="btn btn-outline btn-block" data-act="login" data-p="apple">${esc(t('login.apple'))}</button>
    </div>
    <div class="login-foot"><button data-act="guest">${esc(t('login.browse'))}</button><span>${esc(t('login.terms'))}</span><span>${esc(t('login.demo'))}</span></div>
  </main>`;

  V.lang = () => {
    const cur = lang();
    return `<main class="screen">${pageHeader(t('lang.header'), { fallback: loggedIn() || S().guest ? '#/home' : '#/login' })}
      <div class="intro"><h1>${esc(t('lang.title'))}</h1><p class="sub" style="margin:0">${esc(t('lang.sub'))}</p></div>
      <div class="options" role="radiogroup">${LANGS.map(l => `<button class="option" role="radio" aria-checked="${l.code === cur}" data-act="pickLang" data-code="${l.code}" lang="${l.code}">
        <span><span class="native">${esc(l.native)}</span><br><span class="eng">${esc(l.eng)}</span></span><span class="radio"></span></button>`).join('')}</div>
      <div class="note-card"><strong>${esc(t('lang.noteTitle'))}</strong>${esc(t('lang.note'))}</div>
      <div class="grow"></div>
      <div class="bottom-cta"><button class="btn btn-primary btn-block" data-act="confirmLang">${esc(t('common.confirm'))}</button></div>
    </main>`;
  };

  V.home = () => {
    const sort = S().sort;
    const list = [...FOODS];
    if (sort === 'name') list.sort((a, b) => fname(a).localeCompare(fname(b), lang()));
    else list.sort((a, b) => foodLikes(b) - foodLikes(a));
    return `<main class="screen has-tabbar">${appHeader()}
      <div class="home-toolbar"><h1>${esc(t('home.title'))}</h1>
        <button class="sort-btn" data-act="sort">${esc(t(sort === 'name' ? 'home.sort.name' : 'home.sort.popular'))}${icon('chevronDown')}</button></div>
      <div class="food-list">${list.map((f, i) => {
        const saved = S().savedFoods.includes(f.id);
        return `<article class="food-card"><a href="#/food/${f.id}">
          <div class="photo"><img src="${img(f.id)}" alt="${esc(fname(f))}" loading="${i < 3 ? 'eager' : 'lazy'}">${sort === 'popular' ? `<span class="rank">${i + 1}</span>` : ''}</div></a>
          <div class="info"><a class="names" href="#/food/${f.id}"><div class="name">${esc(fname(f))}</div>${lang() !== 'ko' ? `<div class="orig">${esc(f.ko.name)}</div>` : ''}</a>
          <button class="like-btn" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="♥ ${foodLikes(f)}">${icon('heart', saved)}<span>${foodLikes(f)}</span></button></div>
        </article>`;
      }).join('')}</div>${tabbar('home')}</main>`;
  };

  V.food = ({ id }) => {
    const f = FOOD[id]; if (!f) return V.notFound();
    const d = L(f), saved = S().savedFoods.includes(f.id);
    const secs = [['info', 'food.sec.info'], ['how', 'food.sec.how'], ['allergy', 'food.sec.allergy'], ['places', 'food.sec.places']];
    return `<main class="screen has-cta">
      <div class="hero"><img src="${img(f.id)}" alt="${esc(d.name)}">
        <div class="hero-nav"><button class="circle-btn" data-act="back" data-fallback="#/home" aria-label="${esc(t('common.back'))}">${icon('back')}</button><span class="grow"></span>
          <button class="circle-btn" data-act="share" data-title="${esc(d.name)}" aria-label="${esc(t('common.share'))}">${icon('share')}</button>
          <button class="circle-btn ${saved ? 'on' : ''}" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="♥">${icon('heart', saved)}</button></div></div>
      <div class="title-block"><span class="eyebrow">${esc(t('food.badge'))} · ${esc(d.category)}</span><h1>${esc(d.name)}</h1>
        ${lang() !== 'ko' ? `<span class="orig-line" lang="ko">${esc(f.ko.name)}${d.gloss ? ' · <span lang="' + lang() + '">' + esc(d.gloss) + '</span>' : ''}</span>` : ''}
        <p class="summary">${esc(d.summary)}</p>
        <div class="meta-line">${icon('heart', true)}<span>${foodLikes(f)} · ${esc(t('food.places', { n: f.places.length }))}</span></div></div>
      <nav class="section-chips" aria-label="sections">${secs.map(([k, label], i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-act="jump" data-sec="${k}">${esc(t(label))}</button>`).join('')}</nav>
      <section class="detail-section" id="sec-info"><h2>${esc(t('food.h.info'))}</h2>
        <dl class="info-card">${[['category', d.category], ['ingredients', d.ingredients], ['taste', d.taste], ['price', d.price], ['calories', d.calories]].map(([k, v]) =>
          `<div class="info-row"><dt>${esc(t('food.row.' + k))}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="origin"><h3>${esc(t('food.origin'))}</h3><p>${esc(d.origin)}</p></div></section>
      <section class="detail-section" id="sec-how"><h2>${esc(t('food.h.how'))}</h2>
        <ol class="steps">${d.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>
        <div class="tip-card"><strong>${esc(t('food.tip'))}</strong>${esc(d.tip)}</div></section>
      <section class="detail-section" id="sec-allergy"><h2>${esc(t('food.h.allergy'))}</h2>
        <div class="allergen-card"><strong>${esc(t('food.allergyTitle'))}</strong>
          <div class="pills">${d.allergens.map(a => `<span class="pill">${esc(a)}</span>`).join('')}</div><p>※ ${esc(d.allergenNote)}</p></div></section>
      <section class="detail-section" id="sec-places"><h2>${esc(t('food.h.places'))} <small>${esc(t('food.count', { n: f.places.length }))}</small></h2>
        <div class="place-list">${f.places.map((_, i) => placeRow(placeOf(f.id, i))).join('')}</div></section>
      <div style="height:24px"></div>
      <div class="fixed-cta"><a class="btn btn-primary btn-block" href="#/map/${f.id}">${esc(t('food.cta'))}${icon('arrowRight')}</a></div>
    </main>`;
  };
  V.food.mount = ({ id }) => {
    Store.update(s => { s.recentFoods = [id, ...s.recentFoods.filter(x => x !== id)].slice(0, 20); });
    const chips = [...app.querySelectorAll('.section-chips .chip')];
    const setActive = k => chips.forEach(c => c.classList.toggle('active', c.dataset.sec === k));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.filter(e => e.isIntersecting).forEach(e => setActive(e.target.id.replace('sec-', '')));
      }, { rootMargin: '-70px 0px -65% 0px' });
      app.querySelectorAll('.detail-section').forEach(s => io.observe(s));
      cleanup.push(() => io.disconnect());
    }
  };

  V.place = ({ id, i }) => {
    const p = placeOf(id, Number(i)); if (!p) return V.notFound();
    const key = placeKey(id, p.i), saved = S().savedPlaces.includes(key);
    const related = allPosts().filter(x => x.food === id);
    const q = encodeURIComponent(p.name);
    return `<main class="screen">
      <div class="hero" style="height:260px"><img src="${img(id)}" alt="">
        <div class="hero-nav"><button class="circle-btn" data-act="back" data-fallback="#/food/${id}" aria-label="${esc(t('common.back'))}">${icon('back')}</button><span class="grow"></span>
          <button class="circle-btn" data-act="share" data-title="${esc(p.name)}" aria-label="${esc(t('common.share'))}">${icon('share')}</button>
          <button class="circle-btn ${saved ? 'on' : ''}" data-act="savePlace" data-key="${key}" aria-pressed="${saved}" aria-label="♥">${icon('heart', saved)}</button></div></div>
      <div class="title-block"><span class="eyebrow">${esc(t('place.signature'))} · ${esc(p.signature)}</span><h1 lang="ko">${esc(p.name)}</h1>
        <span class="orig-line">${esc(p.area)}</span>
        <div class="meta-line">${icon('heart', true)}<span>${placeLikes(p)}</span></div></div>
      <div class="actions-row">
        <a class="action" href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">${icon('map')}${esc(t('place.naver'))}</a>
        <a class="action" href="https://map.kakao.com/?q=${q}" target="_blank" rel="noopener">${icon('pin')}${esc(t('place.kakao'))}</a>
        <a class="action" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">${icon('navigation')}${esc(t('place.directions'))}</a>
      </div>
      <div class="band"></div>
      <div class="section-head"><h2>${esc(t('food.h.info'))}</h2></div>
      <div class="rows">
        <div class="row">${icon('pin')}<span>${esc(p.area)}${lang() !== 'ko' ? ` <span class="muted" lang="ko">(${esc(p.areaKo)})</span>` : ''}</span></div>
        <div class="row">${icon('utensils')}<span>${esc(t('place.signature'))} · ${esc(p.signature)}</span></div>
        <div class="row">${icon('clock')}<span class="sub">${esc(t('place.notice'))}</span></div>
      </div>
      <div class="mini-map" id="mini-map" role="img" aria-label="${esc(p.name)}"></div>
      <div class="band"></div>
      <div class="section-head"><h2>${esc(t('place.servesFood'))}</h2></div>
      <div class="card" style="margin:0 16px">${foodRow(p.food)}</div>
      <div class="section-head"><h2>${esc(t('place.related'))}</h2></div>
      ${related.length ? related.map(postCard).join('') : `<p class="pad muted" style="margin:0 0 32px">${esc(t('place.noRelated'))}</p>`}
      <div style="height:24px"></div>
    </main>`;
  };
  V.place.mount = ({ id, i }) => {
    const p = placeOf(id, Number(i)); const el = document.getElementById('mini-map');
    if (!p || !el || !window.L) return;
    const m = window.L.map(el, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: true }).setView([p.lat, p.lng], 15);
    tiles().addTo(m); window.L.marker([p.lat, p.lng], { icon: pinIcon(true) }).addTo(m);
    cleanup.push(() => m.remove());
  };

  V.search = () => {
    const rec = S().recentSearches;
    return `<main class="screen">
      <form class="search-bar" data-form="search" role="search">
        <button type="button" class="icon-btn" data-act="back" data-fallback="#/home" aria-label="${esc(t('common.back'))}">${icon('back')}</button>
        <label class="search-input">${icon('search')}<input id="q" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t('search.placeholder'))}" aria-label="${esc(t('search.placeholder'))}"></label>
      </form>
      <div class="section-head"><h2>${esc(t('search.recent'))}</h2>${rec.length ? `<button class="text-btn" data-act="clearRecent">${esc(t('search.clear'))}</button>` : ''}</div>
      ${rec.length ? `<div class="wrap-chips">${rec.map(r => `<span class="recent-chip"><a href="#/results/${encodeURIComponent(r)}">${esc(r)}</a><button class="x" data-act="removeRecent" data-q="${esc(r)}" aria-label="${esc(t('common.delete'))}">${icon('close')}</button></span>`).join('')}</div>`
        : `<p class="pad muted" style="margin:0 0 8px;font-size:14px">${esc(t('search.noRecent'))}</p>`}
      <div class="section-head"><h2>${esc(t('search.popular'))}</h2></div>
      <div class="popular">${SEED.popular.map((id, i) => `<a href="#/results/${encodeURIComponent(fname(FOOD[id]))}" style="display:flex;gap:12px;padding:10px 0"><b style="width:18px;color:var(--accent)">${i + 1}</b><span>${esc(fname(FOOD[id]))}</span></a>`).join('')}</div>
    </main>`;
  };
  V.search.mount = () => { const q = document.getElementById('q'); if (q) setTimeout(() => q.focus(), 50); };

  const norm = s => String(s || '').toLowerCase().replace(/[\s·\-()（）]/g, '');
  function searchAll(q) {
    const n = norm(q);
    if (!n) return { foods: [], places: [], posts: [] };
    const foods = FOODS.filter(f => ['ko', 'en', 'zh', 'ja'].some(l => f[l] && [f[l].name, f[l].gloss, f[l].category, f[l].summary, f[l].ingredients].some(v => norm(v).includes(n))));
    const places = allPlaces().filter(p => [p.name, p.areaKo, p.area, p.signature, p.food.ko.name, fname(p.food)].some(v => norm(v).includes(n)));
    const posts = allPosts().filter(p => [p.title, p.body].some(v => norm(v).includes(n)));
    return { foods, places, posts };
  }
  V.results = ({ q, tab = 'all' }) => {
    const r = searchAll(q);
    const tabs = [['all', r.foods.length + r.places.length + r.posts.length], ['foods', r.foods.length], ['places', r.places.length], ['posts', r.posts.length]];
    const sec = (key, items, render, limit) => items.length ? `<div class="section-head"><h2>${esc(t('search.tab.' + key))} ${items.length}</h2>${limit && items.length > limit ? `<a class="text-btn" href="#/results/${encodeURIComponent(q)}/${key}">${esc(t('search.seeAll'))}</a>` : ''}</div>
      <div class="card" style="margin:0 16px 8px">${items.slice(0, limit || items.length).map(render).join('')}</div>` : '';
    let body;
    if (!tabs[0][1]) body = empty(t('search.empty', { q }), 'search');
    else if (tab === 'all') body = sec('foods', r.foods, f => foodRow(f), 3) + sec('places', r.places, p => placeRow(p, { showFood: true }), 3) + (r.posts.length ? `<div class="section-head"><h2>${esc(t('search.tab.posts'))} ${r.posts.length}</h2></div>${r.posts.slice(0, 3).map(postCard).join('')}` : '');
    else if (tab === 'foods') body = sec('foods', r.foods, f => foodRow(f)) || empty(t('search.empty', { q }), 'search');
    else if (tab === 'places') body = sec('places', r.places, p => placeRow(p, { showFood: true })) || empty(t('search.empty', { q }), 'search');
    else body = r.posts.length ? r.posts.map(postCard).join('') : empty(t('search.empty', { q }), 'search');
    return `<main class="screen">
      <form class="search-bar" data-form="search" role="search">
        <button type="button" class="icon-btn" data-act="back" data-fallback="#/search" aria-label="${esc(t('common.back'))}">${icon('back')}</button>
        <label class="search-input">${icon('search')}<input id="q" name="q" type="search" value="${esc(q)}" autocomplete="off" enterkeyhint="search" aria-label="${esc(t('search.placeholder'))}"></label>
      </form>
      <div class="seg" role="tablist">${tabs.map(([k, n]) => `<a role="tab" aria-selected="${k === tab}" href="#/results/${encodeURIComponent(q)}/${k}" style="padding:12px 2px 10px;border-bottom:2px solid ${k === tab ? 'var(--accent)' : 'transparent'};color:${k === tab ? 'var(--ink)' : 'var(--ink-3)'};font-weight:${k === tab ? 700 : 400};white-space:nowrap">${esc(t('search.tab.' + k))} ${n}</a>`).join('')}</div>
      ${body}<div style="height:32px"></div></main>`;
  };

  V.notifications = () => {
    const list = notifications(), readAt = S().notiReadAt, dayAgo = Date.now() - 86400000;
    const icons = { comment: 'comment', heart: 'heart', bell: 'bell', megaphone: 'megaphone' };
    const item = n => `<a class="noti ${n.createdAt > readAt ? 'unread' : ''}" href="${n.link}"><span class="ic">${icon(icons[n.type])}</span>
      <span><p>${esc(n[lang()] || n.ko)}</p><span class="muted" style="font-size:12px">${esc(ago(n.createdAt))}</span></span></a>`;
    const today = list.filter(n => n.createdAt >= dayAgo), earlier = list.filter(n => n.createdAt < dayAgo);
    const html = `<main class="screen">${pageHeader(t('noti.title'), { right: `<a class="icon-btn" href="#/settings" aria-label="${esc(t('set.title'))}">${icon('settings')}</a>` })}
      ${list.length ? '' : empty(t('noti.empty'), 'bell')}
      ${today.length ? `<div class="group-title">${esc(t('noti.today'))}</div>${today.map(item).join('')}` : ''}
      ${earlier.length ? `<div class="group-title">${esc(t('noti.earlier'))}</div>${earlier.map(item).join('')}` : ''}</main>`;
    return html;
  };
  V.notifications.mount = () => Store.set({ notiReadAt: Date.now() });

  /* ---------- map ---------- */
  function tiles() {
    return window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
  }
  function pinIcon(sel) {
    const fill = sel ? '#CC4936' : '#FFFFFF', dot = sel ? '#FFFFFF' : '#CC4936';
    return window.L.divIcon({ className: 'pin', iconSize: [30, 30], iconAnchor: [15, 28], popupAnchor: [0, -26],
      html: `<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" fill="${fill}" stroke="#CC4936" stroke-width="1.6"/><circle cx="12" cy="10" r="3" fill="${dot}"/></svg>` });
  }
  V.map = ({ id }) => {
    const sel = id && FOOD[id] ? id : null;
    const places = sel ? FOOD[sel].places.map((_, i) => placeOf(sel, i)) : allPlaces();
    return `<main class="map-screen">${appHeader()}
      <div class="chip-row" role="toolbar">${['', ...FOODS.map(f => f.id)].map(fid => `<a class="chip ${fid === (sel || '') ? 'active' : ''}" href="#/map${fid ? '/' + fid : ''}" ${fid === (sel || '') ? 'aria-current="true"' : ''}>${esc(fid ? fname(FOOD[fid]) : t('map.all'))}</a>`).join('')}</div>
      <div class="map-wrap"><div id="map">${window.L ? '' : `<div class="map-fallback">${esc(t('map.offline'))}</div>`}</div>
        <button class="locate-btn" data-act="locate" style="bottom:calc(132px + 16px)" aria-label="${esc(t('map.locate'))}">${icon('locate')}</button>
        <section class="sheet collapsed" id="sheet"><button class="sheet-handle" data-act="sheet" aria-expanded="false"><span class="sheet-title">${esc(sel ? fname(FOOD[sel]) + ' · ' : '')}${esc(t('map.nearby', { n: places.length }))}</span></button>
          <div class="sheet-list">${places.map(p => `<div class="list-item" data-act="flyTo" data-key="${placeKey(p.food.id, p.i)}" role="button" tabindex="0"><img class="thumb sm" src="${img(p.food.id)}" alt="" loading="lazy">
            <span class="li-body"><span class="li-title" lang="ko">${esc(p.name)}</span><span class="li-sub">${esc(p.area)}</span><span class="li-meta">${esc(fname(p.food))} · ${esc(p.signature)}</span></span>
            <a class="save-btn" href="#/place/${p.food.id}/${p.i}" aria-label="${esc(t('map.detail'))}">${icon('chevronRight')}</a></div>`).join('')}</div></section>
      </div>${tabbar('map')}</main>`;
  };
  let mapRef = null, markers = {};
  V.map.mount = ({ id }) => {
    const el = document.getElementById('map'); if (!el || !window.L) return;
    const sel = id && FOOD[id] ? id : null;
    const places = sel ? FOOD[sel].places.map((_, i) => placeOf(sel, i)) : allPlaces();
    mapRef = window.L.map(el, { zoomControl: false, zoomAnimation: false }).setView([35.155, 129.07], 11);
    tiles().addTo(mapRef);
    window.L.control.zoom({ position: 'topright' }).addTo(mapRef);
    markers = {};
    places.forEach(p => {
      const k = placeKey(p.food.id, p.i);
      markers[k] = window.L.marker([p.lat, p.lng], { icon: pinIcon(!!sel) }).addTo(mapRef)
        .bindPopup(`<b lang="ko">${esc(p.name)}</b>${esc(fname(p.food))} · ${esc(p.area)}<br><a href="#/place/${p.food.id}/${p.i}">${esc(t('map.detail'))} →</a>`);
    });
    if (places.length) mapRef.fitBounds(window.L.latLngBounds(places.map(p => [p.lat, p.lng])).pad(0.15), { maxZoom: 15 });
    const ref = mapRef;
    const resizeTimer = setTimeout(() => ref.invalidateSize(), 60);
    cleanup.push(() => { clearTimeout(resizeTimer); ref.remove(); if (mapRef === ref) mapRef = null; });
  };

  /* ---------- community ---------- */
  V.community = ({ tab = 'popular' }) => {
    let list = allPosts();
    if (tab === 'popular') list.sort((a, b) => postLikes(b) - postLikes(a));
    else if (tab === 'latest') list.sort((a, b) => b.createdAt - a.createdAt);
    else list = list.filter(p => p.cat === tab).sort((a, b) => b.createdAt - a.createdAt);
    const tabs = [['popular', t('com.tab.popular')], ['latest', t('com.tab.latest')], ['review', t('cat.review')], ['question', t('cat.question')], ['free', t('cat.free')]];
    return `<main class="screen has-tabbar">${appHeader()}
      <nav class="seg" aria-label="categories">${tabs.map(([k, label]) => `<a href="#/community/${k}" ${k === tab ? 'aria-current="page"' : ''} style="padding:12px 2px 10px;white-space:nowrap;border-bottom:2px solid ${k === tab ? 'var(--accent)' : 'transparent'};color:${k === tab ? 'var(--ink)' : 'var(--ink-3)'};font-weight:${k === tab ? 700 : 400}">${esc(label)}</a>`).join('')}</nav>
      ${list.length ? list.map(postCard).join('') : empty(t('com.empty'), 'community')}
      <div style="height:72px"></div>
      <a class="fab" href="#/write" data-act="needLogin">${icon('pencil')}${esc(t('com.write'))}</a>
      ${tabbar('community')}</main>`;
  };

  V.post = ({ id }) => {
    const p = postById(id); if (!p) return `<main class="screen">${pageHeader(t('post.header'), { fallback: '#/community' })}${empty(t('post.notFound'))}</main>`;
    const cs = commentsOf(id), liked = !!S().postLikes[id];
    const right = p.mine ? `<button class="icon-btn" data-act="deletePost" data-id="${id}" aria-label="${esc(t('common.delete'))}">${icon('trash')}</button>` : `<button class="icon-btn" data-act="share" data-title="${esc(p.title)}" aria-label="${esc(t('common.share'))}">${icon('share')}</button>`;
    return `<main class="screen" style="padding-bottom:96px">${pageHeader(t('post.header'), { fallback: '#/community', right })}
      <article class="post-body">
        <div class="post-head"><span class="avatar" style="width:40px;height:40px">${initial(p.author)}</span>
          <span class="who"><b style="font-size:15px">${esc(p.author)}</b><span style="font-size:12px">${esc(p.areaLabel || p.area)} · ${esc(ago(p.createdAt))}</span></span>
          <span class="badge">${esc(catLabel(p.cat))}</span></div>
        <h1>${esc(p.title)}</h1>
        <p class="content">${esc(p.body)}</p>
        ${p.photos && p.photos.length ? `<div class="post-photos">${p.photos.map(src => `<img src="${esc(src)}" alt="">`).join('')}</div>` : ''}
        ${p.food && FOOD[p.food] ? `<a class="card list-item" href="#/food/${p.food}" style="border:1px solid var(--border)"><img class="thumb sm" src="${img(p.food)}" alt=""><span class="li-body"><span class="li-meta">${esc(t('post.foodTag'))}</span><span class="li-title">${esc(fname(FOOD[p.food]))}</span></span>${icon('chevronRight')}</a>` : ''}
        <div class="post-actions"><button class="like ${liked ? 'on' : ''}" data-act="likePost" data-id="${id}" aria-pressed="${liked}">${icon('heart', liked)}${esc(t('post.like', { n: postLikes(p) }))}</button>
          <span class="like">${icon('comment')}${esc(t('post.comments', { n: cs.length }))}</span></div>
      </article>
      <div class="band"></div>
      <div class="group-title">${esc(t('post.comments', { n: cs.length }))}</div>
      ${cs.map(c => `<div class="comment"><span class="avatar" style="width:32px;height:32px;font-size:13px">${initial(c.author)}</span><div class="c-body">
        <div class="c-meta"><b style="font-weight:500">${esc(c.author)}</b><span>${esc(ago(c.createdAt))}</span></div><p>${esc(c.text)}</p>
        <span class="muted" style="font-size:12px">♡ ${c.likes || 0}</span></div></div>`).join('')}
      <form class="comment-bar" data-form="comment" data-id="${id}"><input id="comment-input" name="text" maxlength="300" autocomplete="off" placeholder="${esc(t('post.placeholder'))}" aria-label="${esc(t('post.placeholder'))}"><button type="submit">${esc(t('post.submit'))}</button></form>
    </main>`;
  };

  let draftPhotos = [];
  V.write = () => {
    if (!loggedIn()) return V.login();
    draftPhotos = [];
    return `<main class="screen">
      <header class="page-header"><button class="icon-btn" data-act="back" data-fallback="#/community" aria-label="${esc(t('common.cancel'))}">${icon('close')}</button>
        <h1 class="page-title" style="text-align:center">${esc(t('write.title'))}</h1><button form="write-form" type="submit" style="font-weight:700;color:var(--accent);padding:0 8px">${esc(t('write.submit'))}</button></header>
      <form class="form" id="write-form" data-form="write">
        <div class="field"><span class="label">${esc(t('write.category'))}</span>
          <div style="display:flex;gap:8px" role="radiogroup">${['review', 'question', 'free'].map((c, i) => `<label class="chip ${i === 0 ? 'active' : ''}" data-cat-chip><input type="radio" name="cat" value="${c}" ${i === 0 ? 'checked' : ''} class="sr-only">${esc(catLabel(c))}</label>`).join('')}</div></div>
        <input class="input title-input" id="w-title" name="title" maxlength="60" placeholder="${esc(t('write.titlePh'))}" aria-label="${esc(t('write.titlePh'))}">
        <textarea class="textarea" id="w-body" name="body" maxlength="2000" placeholder="${esc(t('write.bodyPh'))}" aria-label="${esc(t('write.bodyPh'))}"></textarea>
        <div class="field"><span class="label">${esc(t('write.photos'))}</span>
          <div class="photo-row" id="photo-row"><label class="add-photo">${icon('camera')}<span id="photo-count">0/4</span><input type="file" id="w-photos" accept="image/*" multiple class="sr-only"></label></div></div>
        <div class="field"><label for="w-food">${esc(t('write.foodTag'))}</label>
          <select class="select" id="w-food" name="food"><option value="">${esc(t('write.noTag'))}</option>${FOODS.map(f => `<option value="${f.id}">${esc(fname(f))}</option>`).join('')}</select></div>
      </form></main>`;
  };
  function renderPhotos() {
    const row = document.getElementById('photo-row'); if (!row) return;
    row.querySelectorAll('.photo-prev').forEach(n => n.remove());
    draftPhotos.forEach((src, i) => row.insertAdjacentHTML('beforeend', `<span class="photo-prev"><img src="${src}" alt=""><button type="button" data-act="rmPhoto" data-i="${i}" aria-label="${esc(t('common.delete'))}">${icon('close')}</button></span>`));
    document.getElementById('photo-count').textContent = `${draftPhotos.length}/4`;
  }
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => {
        const max = 1080, k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.78));
      }; im.onerror = reject; im.src = r.result; };
      r.onerror = reject; r.readAsDataURL(file);
    });
  }
  V.write.mount = () => {
    const inp = document.getElementById('w-photos'); if (!inp) return;
    inp.addEventListener('change', async () => {
      for (const file of [...inp.files]) {
        if (draftPhotos.length >= 4) { toast(t('write.photoMax')); break; }
        try { draftPhotos.push(await resizeImage(file)); } catch (e) { /* 이미지가 아니면 건너뜀 */ }
      }
      inp.value = ''; renderPhotos();
    });
    app.querySelectorAll('[data-cat-chip] input').forEach(r => r.addEventListener('change', () => {
      app.querySelectorAll('[data-cat-chip]').forEach(l => l.classList.toggle('active', l.querySelector('input').checked));
    }));
  };

  /* ---------- saved / my ---------- */
  V.saved = ({ tab = 'foods' }) => {
    const st = S();
    const foods = st.savedFoods.map(id => FOOD[id]).filter(Boolean);
    const places = st.savedPlaces.map(k => { const [fid, i] = k.split(':'); return placeOf(fid, Number(i)); }).filter(Boolean);
    return `<main class="screen has-tabbar">${pageHeader(t('saved.title'), { back: false })}
      <div class="seg" role="tablist">${[['foods', t('saved.foods', { n: foods.length })], ['places', t('saved.places', { n: places.length })]].map(([k, label]) =>
        `<a role="tab" aria-selected="${k === tab}" href="#/saved/${k}" style="padding:12px 2px 10px;border-bottom:2px solid ${k === tab ? 'var(--accent)' : 'transparent'};color:${k === tab ? 'var(--ink)' : 'var(--ink-3)'};font-weight:${k === tab ? 700 : 400}">${esc(label)}</a>`).join('')}</div>
      ${tab === 'foods'
        ? (foods.length ? foods.map(f => foodRow(f)).join('') : empty(t('saved.emptyFoods'), 'heart', `<a class="btn btn-primary btn-sm" href="#/home">${esc(t('saved.go'))}</a>`))
        : (places.length ? places.map(p => placeRow(p, { showFood: true })).join('') : empty(t('saved.emptyPlaces'), 'heart', `<a class="btn btn-primary btn-sm" href="#/map">${esc(t('food.cta'))}</a>`))}
      ${tabbar('saved')}</main>`;
  };

  const myComments = () => Object.entries(S().comments).flatMap(([pid, list]) => list.filter(c => c.mine).map(c => ({ ...c, pid })));
  V.my = () => {
    const st = S(), u = st.user;
    const menu = (href, label, val = '') => `<a class="menu-row" href="${href}"><span>${esc(label)}</span>${val ? `<span class="val">${esc(val)}</span>` : ''}${icon('chevronRight')}</a>`;
    const top = u ? `<div class="profile"><span class="avatar lg">${initial(u.nickname)}</span><div class="who"><b>${esc(u.nickname)}</b><span class="muted" style="font-size:13px">${esc(t('my.joined', { area: districtName(u.area), date: u.joined }))}</span>${u.bio ? `<div class="sub" style="font-size:13px">${esc(u.bio)}</div>` : ''}</div>
        <a class="btn btn-outline btn-sm" href="#/profile">${esc(t('my.edit'))}</a></div>
      <div class="stats"><a href="#/my/posts"><b>${st.posts.length}</b><span>${esc(t('my.posts'))}</span></a><i></i><a href="#/my/comments"><b>${myComments().length}</b><span>${esc(t('my.comments'))}</span></a><i></i><a href="#/saved"><b>${st.savedFoods.length + st.savedPlaces.length}</b><span>${esc(t('my.saved'))}</span></a></div>`
      : `<div class="login-card"><b>${esc(t('my.loginTitle'))}</b><span class="sub" style="font-size:14px">${esc(t('my.loginDesc'))}</span><a class="btn btn-primary" href="#/login">${esc(t('my.login'))}</a></div>`;
    return `<main class="screen has-tabbar">${pageHeader(t('my.title'), { back: false, right: `<a class="icon-btn" href="#/settings" aria-label="${esc(t('set.title'))}">${icon('settings')}</a>` })}
      ${top}<div class="band"></div>
      <div class="menu-group-title">${esc(t('my.activity'))}</div>
      ${menu('#/my/posts', t('my.myPosts'))}${menu('#/my/comments', t('my.myComments'))}${menu('#/my/recent', t('my.recent'))}
      <div class="band"></div>
      <div class="menu-group-title">${esc(t('my.support'))}</div>
      ${menu('#/notices', t('my.notices'))}${menu('#/faq', t('my.faq'))}${menu('#/contact', t('my.contact'))}
      ${tabbar('my')}</main>`;
  };
  V.myPosts = () => {
    const list = allPosts().filter(p => p.mine);
    return `<main class="screen">${pageHeader(t('my.myPosts'), { fallback: '#/my' })}${list.length ? list.map(postCard).join('') : empty(t('my.emptyPosts'), 'pencil', `<a class="btn btn-primary btn-sm" href="#/write">${esc(t('com.write'))}</a>`)}</main>`;
  };
  V.myComments = () => {
    const list = myComments().sort((a, b) => b.createdAt - a.createdAt);
    return `<main class="screen">${pageHeader(t('my.myComments'), { fallback: '#/my' })}${list.length ? list.map(c => {
      const p = postById(c.pid);
      return `<a class="comment" href="#/post/${c.pid}" style="border-bottom:1px solid var(--border)"><div class="c-body"><p>${esc(c.text)}</p><span class="muted" style="font-size:12px">${esc(p ? p.title : '')} · ${esc(ago(c.createdAt))}</span></div></a>`;
    }).join('') : empty(t('my.emptyComments'), 'comment')}</main>`;
  };
  V.myRecent = () => {
    const list = S().recentFoods.map(id => FOOD[id]).filter(Boolean);
    return `<main class="screen">${pageHeader(t('my.recent'), { fallback: '#/my' })}${list.length ? list.map(f => foodRow(f)).join('') : empty(t('my.emptyRecent'), 'clock')}</main>`;
  };

  V.profile = () => {
    const u = S().user; if (!u) return V.login();
    const ds = DISTRICTS[lang()] || DISTRICTS.ko;
    return `<main class="screen">${pageHeader(t('profile.title'), { fallback: '#/my' })}
      <form class="form" data-form="profile" id="profile-form">
        <div style="display:grid;justify-items:center;padding:8px 0"><span class="avatar xl">${initial(u.nickname)}</span></div>
        <div class="field"><label for="p-nick">${esc(t('profile.nickname'))}</label><input class="input" id="p-nick" name="nickname" value="${esc(u.nickname)}" minlength="2" maxlength="10" required><span class="helper">${esc(t('profile.nickHelp'))}</span></div>
        <div class="field"><label for="p-area">${esc(t('profile.area'))}</label><select class="select" id="p-area" name="area">${ds.map((d, i) => `<option value="${i}" ${i === u.area ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
        <div class="field"><label for="p-bio">${esc(t('profile.bio'))}</label><input class="input" id="p-bio" name="bio" value="${esc(u.bio || '')}" maxlength="30"><span class="helper"><span></span><span id="bio-count">${(u.bio || '').length}/30</span></span></div>
      </form><div class="grow"></div>
      <div class="bottom-cta"><button class="btn btn-primary btn-block" type="submit" form="profile-form">${esc(t('common.save'))}</button></div></main>`;
  };
  V.profile.mount = () => {
    const bio = document.getElementById('p-bio');
    if (bio) bio.addEventListener('input', () => { document.getElementById('bio-count').textContent = `${bio.value.length}/30`; });
  };

  V.settings = () => {
    const st = S(), s = st.settings;
    const tog = (k, label, desc) => `<div class="toggle-row"><span class="t"><span>${esc(label)}</span>${desc ? `<small>${esc(desc)}</small>` : ''}</span>
      <label class="switch"><input type="checkbox" data-setting="${k}" ${s[k] ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label></div>`;
    const row = (href, label, val = '', act = '') => `<${href ? `a href="${href}"` : `button type="button" data-act="${act}"`} class="menu-row"><span>${esc(label)}</span>${val ? `<span class="val">${esc(val)}</span>` : ''}${href ? icon('chevronRight') : ''}</${href ? 'a' : 'button'}>`;
    const acct = st.user ? t('set.provider', { p: PROVIDERS[st.user.provider] || st.user.provider }) : t('set.guestNow');
    return `<main class="screen">${pageHeader(t('set.title'), { fallback: '#/my' })}
      <div class="menu-group-title">${esc(t('set.noti'))}</div>
      ${tog('comments', t('set.comments'), t('set.commentsDesc'))}${tog('likes', t('set.likes'))}${tog('newPlaces', t('set.newPlaces'), t('set.newPlacesDesc'))}${tog('events', t('set.events'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.app'))}</div>
      ${row('#/lang', t('set.language'), t('lang.name'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.account'))}</div>
      <div class="menu-row"><span>${esc(t('set.accountInfo'))}</span><span class="val">${esc(acct)}</span></div>
      ${st.user || st.guest ? row('', t('set.logout'), '', 'logout') : row('#/login', t('my.login'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.info'))}</div>
      ${row('#/terms', t('set.terms'))}${row('#/privacy', t('set.privacy'))}${row('#/credits', t('set.credits'))}
      <div class="menu-row"><span>${esc(t('set.version'))}</span><span class="val">1.0.0</span></div>
      <div class="danger-link"><button data-act="withdraw">${esc(t('set.withdraw'))}</button></div></main>`;
  };

  V.notices = () => `<main class="screen">${pageHeader(t('notice.title'), { fallback: '#/my' })}${SEED.notices.map(n => {
    const [title, body] = n[lang()] || n.ko;
    return `<details class="faq"><summary><span>${esc(title)}<br><small class="muted">${esc(n.date)}</small></span></summary><p>${esc(body)}</p></details>`;
  }).join('')}</main>`;
  V.faq = () => `<main class="screen">${pageHeader(t('faq.title'), { fallback: '#/my' })}${(SEED.faq[lang()] || SEED.faq.ko).map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</main>`;
  V.contact = () => `<main class="screen">${pageHeader(t('contact.title'), { fallback: '#/my' })}<div class="prose"><p>${esc(t('contact.desc'))}</p>
    <p><b style="color:var(--ink);user-select:all">help@ieatbusan.example</b></p><button class="btn btn-outline btn-sm" data-act="copyText" data-text="help@ieatbusan.example">Copy</button></div></main>`;
  const LEGAL = {
    terms: { ko: ['이 서비스는 팀 프로젝트용 시안입니다.', '음식·식당 정보는 참고용이며 실제와 다를 수 있습니다.', '커뮤니티 글은 작성한 브라우저에만 저장됩니다.', '타인을 비방하거나 광고성 글을 올리지 마세요.'],
      en: ['This service is a prototype for a team project.', 'Food and restaurant info is for reference and may differ from reality.', 'Community posts are stored only in the browser where they were written.', 'Please do not post abusive or promotional content.'] },
    privacy: { ko: ['로그인은 데모 기능으로, 실제 계정 정보를 받거나 서버로 보내지 않습니다.', '닉네임, 글, 댓글, 찜 기록은 이 기기의 브라우저 저장소에만 저장됩니다.', '내 위치 기능은 지도에 현재 위치를 표시할 때만 사용하며 저장하지 않습니다.', '설정 > 회원 탈퇴를 누르면 저장된 데이터가 모두 삭제됩니다.'],
      en: ['Sign-in is a demo; no real account data is collected or sent to a server.', 'Nickname, posts, comments and saved items are stored only in this browser.', 'Your location is used only to show it on the map and is never stored.', 'Settings > Delete account removes all stored data.'] },
  };
  const legal = (k, title) => () => `<main class="screen">${pageHeader(title(), { fallback: '#/settings' })}<div class="prose"><ol>${(LEGAL[k][lang()] || LEGAL[k].en).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></main>`;
  V.terms = legal('terms', () => t('set.terms'));
  V.privacy = legal('privacy', () => t('set.privacy'));
  V.credits = () => `<main class="screen">${pageHeader(t('credits.title'), { fallback: '#/settings' })}<p class="pad sub" style="font-size:14px">${esc(t('credits.desc'))}</p>
    ${FOODS.map(f => `<div class="credit"><img class="thumb sm" src="${img(f.id)}" alt=""><div><b>${esc(fname(f))}</b><br><span class="sub">${esc(f.credit.author)} · ${esc(f.credit.license)}</span><br><a href="${esc(f.credit.url)}" target="_blank" rel="noopener">${esc(f.credit.file)}</a></div></div>`).join('')}
    <div class="credit"><span class="sub">Map data © OpenStreetMap contributors · Icons: Lucide (ISC)</span></div></main>`;
  V.notFound = () => `<main class="screen">${pageHeader('404')}${empty('Not found')}</main>`;

  /* ---------- router ---------- */
  const ROUTES = [
    [/^#\/login$/, 'login'], [/^#\/lang$/, 'lang'], [/^#\/home$/, 'home'],
    [/^#\/food\/([\w-]+)$/, 'food', ['id']], [/^#\/place\/([\w-]+)\/(\d+)$/, 'place', ['id', 'i']],
    [/^#\/search$/, 'search'], [/^#\/results\/([^/]+)(?:\/(all|foods|places|posts))?$/, 'results', ['q', 'tab']],
    [/^#\/notifications$/, 'notifications'], [/^#\/map(?:\/([\w-]+))?$/, 'map', ['id']],
    [/^#\/community(?:\/(popular|latest|review|question|free))?$/, 'community', ['tab']],
    [/^#\/post\/([\w-]+)$/, 'post', ['id']], [/^#\/write$/, 'write'],
    [/^#\/saved(?:\/(foods|places))?$/, 'saved', ['tab']], [/^#\/my$/, 'my'], [/^#\/my\/posts$/, 'myPosts'],
    [/^#\/my\/comments$/, 'myComments'], [/^#\/my\/recent$/, 'myRecent'], [/^#\/profile$/, 'profile'],
    [/^#\/settings$/, 'settings'], [/^#\/notices$/, 'notices'], [/^#\/faq$/, 'faq'], [/^#\/contact$/, 'contact'],
    [/^#\/terms$/, 'terms'], [/^#\/privacy$/, 'privacy'], [/^#\/credits$/, 'credits'],
  ];
  const OPEN = ['login', 'lang', 'terms', 'privacy', 'credits'];
  let cleanup = [];
  const stack = [];
  function route() {
    const hash = location.hash || '#/home';
    let name = 'notFound', params = {};
    for (const [re, n, keys] of ROUTES) {
      const m = hash.match(re);
      if (m) { name = n; (keys || []).forEach((k, i) => { if (m[i + 1] !== undefined) params[k] = decodeURIComponent(m[i + 1]); }); break; }
    }
    const st = S();
    if (!st.user && !st.guest && !OPEN.includes(name)) { location.replace('#/login'); return; }
    if (name === 'login' && (st.user || st.guest) && !loginIntent) { location.replace('#/home'); return; }
    loginIntent = false;
    if (stack[stack.length - 2] === hash) stack.pop(); else if (stack[stack.length - 1] !== hash) stack.push(hash);
    cleanup.forEach(fn => { try { fn(); } catch (e) {} }); cleanup = [];
    document.documentElement.lang = lang();
    app.innerHTML = V[name](params);
    const titleKeys = { map: 'tab.map', community: 'tab.community', search: 'search.placeholder' };
    const pageTitle = app.querySelector('h1')?.textContent || (titleKeys[name] ? t(titleKeys[name]) : '');
    document.title = name === 'home' || name === 'login' || !pageTitle ? 'I EAT BUSAN' : `${pageTitle} · I EAT BUSAN`;
    window.scrollTo(0, 0);
    if (V[name].mount) V[name].mount(params);
  }
  let loginIntent = false;
  function back(fallback) {
    if (stack.length > 1) history.back(); else location.hash = fallback || '#/home';
  }

  /* ---------- actions ---------- */
  function rerender() { const y = window.scrollY; route(); window.scrollTo(0, y); }
  const A = {
    back: el => back(el.dataset.fallback),
    login: el => {
      const lg = lang();
      Store.set({ user: { provider: el.dataset.p, nickname: DEFAULT_NICK[lg], area: 8, bio: '', joined: new Date().toISOString().slice(0, 10).replace(/-/g, '.') }, guest: false });
      go(S().langChosen ? '#/home' : '#/lang');
    },
    guest: () => { Store.set({ guest: true }); go(S().langChosen ? '#/home' : '#/lang'); },
    pickLang: el => { Store.set({ lang: el.dataset.code }); rerender(); },
    confirmLang: () => { Store.set({ langChosen: true }); if (stack.length > 1 && (S().user || S().guest) && !stack[stack.length - 2].startsWith('#/login')) history.back(); else go(S().user || S().guest ? '#/home' : '#/login'); },
    sort: () => { Store.set({ sort: S().sort === 'popular' ? 'name' : 'popular' }); rerender(); },
    saveFood: el => {
      const id = el.dataset.id; let on;
      Store.update(s => { on = !s.savedFoods.includes(id); s.savedFoods = on ? [id, ...s.savedFoods] : s.savedFoods.filter(x => x !== id); });
      toast(t(on ? 'food.saved' : 'food.unsaved')); rerender();
    },
    savePlace: el => {
      const k = el.dataset.key; let on;
      Store.update(s => { on = !s.savedPlaces.includes(k); s.savedPlaces = on ? [k, ...s.savedPlaces] : s.savedPlaces.filter(x => x !== k); });
      toast(t(on ? 'food.saved' : 'food.unsaved')); rerender();
    },
    jump: el => {
      const sec = document.getElementById('sec-' + el.dataset.sec); if (!sec) return;
      const chips = app.querySelector('.section-chips');
      const y = sec.getBoundingClientRect().top + window.scrollY - (chips ? chips.offsetHeight : 0) - 8;
      window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      app.querySelectorAll('.section-chips .chip').forEach(c => c.classList.toggle('active', c === el));
    },
    share: async el => {
      const data = { title: `${el.dataset.title} · I EAT BUSAN`, url: location.href };
      try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(location.href); toast(t('toast.copied')); } catch (e) { toast(location.href); }
    },
    copyText: async el => { try { await navigator.clipboard.writeText(el.dataset.text); toast(t('toast.copied')); } catch (e) { toast(el.dataset.text); } },
    clearRecent: () => { Store.set({ recentSearches: [] }); rerender(); },
    removeRecent: el => { Store.update(s => { s.recentSearches = s.recentSearches.filter(x => x !== el.dataset.q); }); rerender(); },
    sheet: el => { const sh = document.getElementById('sheet'); const open = sh.classList.toggle('collapsed') === false; el.setAttribute('aria-expanded', open); const lb = app.querySelector('.locate-btn'); if (lb) lb.style.bottom = open ? 'calc(62% + 16px)' : 'calc(132px + 16px)'; },
    flyTo: (el, e) => {
      if (e.target.closest('a')) return;
      const m = markers[el.dataset.key]; if (!m || !mapRef) return;
      mapRef.flyTo(m.getLatLng(), 16, { duration: 0.6 }); setTimeout(() => m.openPopup(), 650);
      const sh = document.getElementById('sheet'); if (sh && !sh.classList.contains('collapsed')) A.sheet(app.querySelector('.sheet-handle'));
    },
    locate: () => {
      if (!navigator.geolocation || !mapRef) { toast(t('map.locFail')); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        if (!mapRef) return;
        const ll = [pos.coords.latitude, pos.coords.longitude];
        window.L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#3A7291', fillOpacity: 1 }).addTo(mapRef);
        mapRef.flyTo(ll, 14);
      }, () => toast(t('map.locFail')), { timeout: 8000 });
    },
    needLogin: (el, e) => { if (!loggedIn()) { e.preventDefault(); requireLogin(); } },
    likePost: el => { if (!requireLogin()) return; const id = el.dataset.id; Store.update(s => { if (s.postLikes[id]) delete s.postLikes[id]; else s.postLikes[id] = true; }); rerender(); },
    deletePost: el => {
      if (!confirm(t('post.deleteConfirm'))) return;
      const id = el.dataset.id; Store.update(s => { s.posts = s.posts.filter(p => p.id !== id); delete s.comments[id]; });
      toast(t('post.deleted')); location.replace('#/community'); stack.pop();
    },
    rmPhoto: el => { draftPhotos.splice(Number(el.dataset.i), 1); renderPhotos(); },
    logout: () => { Store.set({ user: null, guest: false }); toast(t('set.loggedOut')); stack.length = 0; location.replace('#/login'); },
    withdraw: () => { if (!confirm(t('set.withdrawConfirm'))) return; const lg = S().lang; Store.reset(); Store.set({ lang: lg }); stack.length = 0; location.replace('#/login'); },
  };
  app.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = A[el.dataset.act]; if (!fn) return;
    // Preserve native navigation for links inside actionable map rows.
    const link = e.target.closest('a');
    if (link && link !== el) return;
    if (el.dataset.act !== 'needLogin') e.preventDefault();
    fn(el, e);
  });
  app.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); A[e.target.dataset.act](e.target, e); }
  });
  app.addEventListener('change', e => {
    const k = e.target.dataset.setting;
    if (k) Store.update(s => { s.settings[k] = e.target.checked; });
  });
  app.addEventListener('submit', e => {
    const f = e.target; e.preventDefault();
    const kind = f.dataset.form;
    if (kind === 'search') {
      const q = f.q.value.trim(); if (!q) return;
      Store.update(s => { s.recentSearches = [q, ...s.recentSearches.filter(x => x !== q)].slice(0, 10); });
      go('#/results/' + encodeURIComponent(q));
    } else if (kind === 'comment') {
      if (!requireLogin()) return;
      const text = f.text.value.trim(); if (!text) return;
      const id = f.dataset.id, u = S().user;
      Store.update(s => { (s.comments[id] = s.comments[id] || []).push({ id: 'uc' + Date.now(), author: u.nickname, text, createdAt: Date.now(), likes: 0, mine: true }); });
      toast(t('post.commented')); rerender(); window.scrollTo(0, document.body.scrollHeight);
    } else if (kind === 'write') {
      const title = f.title.value.trim(), body = f.body.value.trim();
      if (!title || !body) { toast(t('write.need')); return; }
      const u = S().user, id = 'u' + Date.now();
      const post = { id, author: u.nickname, area: districtName(u.area), areaLabel: districtName(u.area), cat: f.cat.value, food: f.food.value || null, title, body, photos: draftPhotos.slice(), likes: 0, createdAt: Date.now(), mine: true };
      Store.update(s => { s.posts = [post, ...s.posts]; });
      if (!Store.save()) { Store.update(s => { s.posts[0].photos = []; }); }
      toast(t('write.done')); stack.pop(); location.replace('#/post/' + id);
    } else if (kind === 'profile') {
      const nick = f.nickname.value.trim();
      if (nick.length < 2 || nick.length > 10) { toast(t('profile.invalid')); return; }
      Store.update(s => { s.user.nickname = nick; s.user.area = Number(f.area.value); s.user.bio = f.bio.value.trim(); });
      toast(t('profile.saved')); back('#/my');
    }
  });
  // 로그인 화면은 명시적으로 이동할 때만 다시 보이게 합니다.
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#/login"]'); if (a) loginIntent = true; });

  window.addEventListener('hashchange', route);
  if (!S().lang) {
    const nav = (navigator.language || 'ko').slice(0, 2);
    Store.set({ lang: ['ko', 'en', 'zh', 'ja'].includes(nav) ? nav : 'en' });
  }
  route();
})();
