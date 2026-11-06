/* I EAT BUSAN — 해시 라우팅 기반 단일 페이지 앱 (빌드 없이 index.html만 열면 동작) */
(function () {
  'use strict';
  const app = document.getElementById('app');
  app.classList.add('persistent-nav');
  const toastEl = document.getElementById('toast');
  const S = () => Store.get();
  const FOODS = window.FOODS;
  const FOOD = Object.fromEntries(FOODS.map(f => [f.id, f]));
  const PROVIDERS = { kakao: 'Kakao', naver: 'Naver', apple: 'Apple' };

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
  const Countries = window.IEBCountries;
  const countryOptions = value => Countries.list(lang()).map(item => `<option value="${item.code}" ${item.code === Countries.normalize(value) ? 'selected' : ''}>${esc(item.name)}</option>`).join('');
  const countryBadge = value => {
    if (!Countries.isValid(value)) return '';
    const code = value, name = esc(Countries.name(code, lang()));
    return `<span class="country-badge" title="${name}" aria-label="${name}"><span lang="en" aria-hidden="true">${code}</span></span>`;
  };
  const img = id => FOOD[id]?.photo || `assets/food/${id}.jpg`;
  const placeImg = p => window.IEBRestaurantImages.image(p, img(p.food.id));
  const mapData = window.IEBMapData.create(FOODS, lang);
  const { placeKey, placeOf, allPlaces } = mapData;
  const hasCoordinates = mapData.hasCoordinates;

  function syncFoodCatalog() {
    const entries = S().foods;
    if (!Array.isArray(entries)) return; // No DB payload: retain the offline catalog.
    const ids = new Set(entries.map(row => row.id));
    for (let i = FOODS.length - 1; i >= 0; i--) if (!ids.has(FOODS[i].id)) { delete FOOD[FOODS[i].id]; delete mapData.byId[FOODS[i].id]; FOODS.splice(i, 1); }
    for (const row of entries) {
      let food = FOOD[row.id];
      if (!food) { food = { id: row.id }; FOODS.push(food); FOOD[row.id] = food; mapData.byId[row.id] = food; }
      const placeLinks = new Map((food.places || []).filter(place => place.naverUrl).map(place => [place.name, place.naverUrl]));
      Object.assign(food, row.content || {}, { id: row.id, likes: row.likes || 0 });
      food.ko = { allergens: [], steps: [], restaurants: [], ...food.ko, name: row.name, summary: row.summary, category: row.category };
      food.places ||= [];
      // Retain explicit restaurant links when an older DB snapshot omits them.
      food.places = food.places.map(place => place.naverUrl || !placeLinks.has(place.name) ? place : { ...place, naverUrl: placeLinks.get(place.name) });
      food.photo = row.imageAsset === 'food-placeholder.svg' ? 'assets/food-placeholder.svg' : 'assets/food/' + row.imageAsset;
      window.IEBFoodSummaries.apply(food);
    }
    FOODS.sort((a, b) => entries.findIndex(row => row.id === a.id) - entries.findIndex(row => row.id === b.id));
  }
  const foodLikes = f => Number.isInteger(f.likes) ? Math.max(0, f.likes) : 0;
  const placeLikes = p => Number.isInteger(p.likes) ? Math.max(0, p.likes) : 0;
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
  function profileAvatar(user, size = '') {
    return `<span class="avatar ${size}"><span>${initial(user.nickname)}</span>${user.avatarUrl ? `<img src="${esc(user.avatarUrl)}" alt="${esc(t('profile.photo'))}">` : ''}</span>`;
  }

  /* ---------- community data ---------- */
  const seedTime = mins => S().seededAt - mins * 60000;
  function allPosts() {
    return S().posts;
  }
  const postById = id => allPosts().find(p => p.id === id);
  const postLikes = p => p.likes + (S().postLikes[p.id] ? 1 : 0);
  function commentsOf(id) {
    return [...(S().comments[id] || [])].sort((a, b) => a.createdAt - b.createdAt);
  }
  const notifications = () => SEED.notifications.map(n => ({ ...n, createdAt: seedTime(n.minutesAgo) }));
  const hasUnread = () => notifications().some(n => n.createdAt > S().notiReadAt);
  const catLabel = c => t('cat.' + c);
  const districtName = i => (DISTRICTS[lang()] || DISTRICTS.ko)[i] ?? '';

  /* ---------- shared UI ---------- */
  function appHeader() {
    return `<header class="app-header">
      <a class="logo brand-logo" href="#/home" aria-label="${esc(t('brand.home'))}"><img src="assets/brand/muboso-header.png" width="1672" height="941" alt="무보소 · I Eat Busan"></a>
      <div class="header-actions">
        <a class="lang-pill" href="#/lang" aria-label="${esc(t('set.language'))}">${icon('globe')}<span>${esc(t('lang.code'))}</span></a>
        <a class="icon-btn" href="#/search" aria-label="${esc(t('search.placeholder'))}">${icon('search')}</a>
        ${loggedIn() ? `<a class="icon-btn" href="#/notifications" aria-label="${esc(t('noti.title'))}">${icon('bell')}${hasUnread() ? '<span class="dot"></span>' : ''}</a>` : `<a class="header-login" href="#/login">${esc(t('auth.login'))}</a>`}
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
    return `<nav class="tabbar" aria-label="${esc(t('nav.main'))}">${tabs.map(([k, ic, href]) =>
      `<a class="tab" href="${href}" ${k === active ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(t('tab.' + k))}</span></a>`).join('')}</nav>`;
  }
  const empty = (msg, ic = 'info', extra = '') => `<div class="empty">${icon(ic)}<p>${esc(msg)}</p>${extra}</div>`;
  function foodRow(f, { save = true } = {}) {
    const saved = !!S().foodLikes?.[f.id];
    return `<div class="list-item">
      <a href="#/food/${f.id}" style="display:contents"><img class="thumb" src="${img(f.id)}" alt="" loading="lazy">
      <span class="li-body"><span class="li-title">${esc(fname(f))}</span><span class="li-sub" lang="${lang()}">${esc(L(f).summary)}</span>
      <span class="li-meta">♥ ${foodLikes(f)} · ${esc(t('saved.places.count', { n: f.places.length }))}</span></span></a>
      ${save ? `<button class="save-btn" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'common.unlike' : 'common.like'))}">${icon('heart', saved)}</button>` : ''}
    </div>`;
  }
  function placeRow(p, { save = true, showFood = false } = {}) {
    const key = placeKey(p.food.id, p.i), saved = S().savedPlaces.includes(key);
    return `<div class="list-item">
      <a href="#/place/${p.food.id}/${p.i}" style="display:contents"><img class="thumb sm" src="${esc(placeImg(p))}" data-image-fallback="${esc(img(p.food.id))}" alt="${esc(p.name)}" loading="lazy">
      <span class="li-body"><span class="li-title" lang="ko">${esc(p.name)}</span><span class="li-sub">${esc(p.area)}</span>
      <span class="li-meta">${esc(showFood ? fname(p.food) + ' · ' : '')}${esc(t('place.signature'))} · ${esc(p.signature)}</span></span></a>
      ${save ? `<button class="save-btn" data-act="savePlace" data-key="${key}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'common.unsaveItem' : 'common.saveItem'))}">${icon('heart', saved)}</button>` : `<span class="like">${icon('heart')}${placeLikes(p)}</span>`}
    </div>`;
  }
  function postCard(p) {
    const n = commentsOf(p.id).length, liked = !!S().postLikes[p.id];
    const href = '#/post/' + encodeURIComponent(p.id);
    return `<article class="post-card">
      <a class="post-card-link" href="${href}">
        <div class="post-head"><span class="avatar">${initial(p.author)}</span>
          <span class="who"><b>${countryBadge(p.countryCode)}${esc(p.author)}</b><span>${esc(p.areaLabel || p.area)} · ${esc(ago(p.createdAt))}</span></span>
          <span class="badge">${esc(catLabel(p.cat))}</span></div>
        <div class="post-content"><div class="post-text"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div>
          ${p.photos && p.photos[0] ? `<img class="thumb" src="${esc(p.photos[0])}" alt="" loading="lazy">` : ''}</div>
      </a>
      <div class="post-foot"><button type="button" class="like ${liked ? 'on' : ''}" data-act="likePost" data-id="${esc(p.id)}" aria-pressed="${liked}" aria-label="${esc(t('post.like', { n: postLikes(p) }))}">${icon('heart', liked)}${postLikes(p)}</button><a class="like" href="${href}" aria-label="${esc(t('post.comments', { n }))}">${icon('comment')}${n}</a></div>
    </article>`;
  }

  /* ---------- views ---------- */
  const V = {};
  let homeFeaturedId = null;
  let homeFeaturedPeriod = null;
  let homeAutoplayPaused = false;

  function homeFoodCard(f, { rank = 0, eager = false, slide = false, count = 5 } = {}) {
    const saved = !!S().foodLikes?.[f.id];
    return `<article class="food-card${slide ? ' home-slide' : ''}"${slide ? ` role="group" aria-roledescription="${esc(t('home.slide'))}" aria-label="${rank} / ${count}: ${esc(fname(f))}" data-food-id="${f.id}"` : ''}>
      <a href="#/food/${f.id}"><div class="photo"><img src="${img(f.id)}" alt="${esc(fname(f))}" loading="${eager ? 'eager' : 'lazy'}">${rank ? `<span class="rank">${rank}</span>` : ''}</div></a>
      <div class="info"><a class="names" href="#/food/${f.id}"><div class="name">${esc(fname(f))}</div>${lang() !== 'ko' ? `<div class="orig" lang="ko">${esc(f.ko.name)}</div>` : ''}</a>
        <button class="like-btn" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'common.unlike' : 'common.like'))}">${icon('heart', saved)}<span>${foodLikes(f)}</span></button></div>
      <p class="home-summary" lang="${lang()}">${esc(L(f).summary)}</p>
    </article>`;
  }

  let registeredId = '';
  function authScreen(signup) {
    return `<main class="screen login auth-screen">
    <div class="login-hero"><div class="auth-logo"><img src="assets/brand/muboso-login.png" width="1254" height="1254" alt="무보소 · I Eat Busan"></div><p class="sub" style="margin:0">${esc(t('app.tagline'))}</p></div>
    <form class="auth-form" data-form="${signup ? 'signup' : 'login'}">
      <h1>${esc(t(signup ? 'auth.signup' : 'auth.login'))}</h1>
      <div class="field"><label for="auth-username">${esc(t('auth.username'))}</label>
        <input class="input" id="auth-username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="4" maxlength="20" pattern="[A-Za-z0-9_]{4,20}" value="${signup ? '' : esc(registeredId)}" ${signup ? 'aria-describedby="auth-id-help"' : ''}>
        ${signup ? `<span class="helper" id="auth-id-help">${esc(t('auth.idHelp'))}</span>` : ''}</div>
      <div class="field"><label for="auth-password">${esc(t('auth.password'))}</label>
        <input class="input" id="auth-password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="8" maxlength="72" ${signup ? 'aria-describedby="auth-password-help"' : ''}>
        ${signup ? `<span class="helper" id="auth-password-help">${esc(t('auth.passwordHelp'))}</span>` : ''}</div>
      ${signup ? `<div class="field"><label for="auth-country">${esc(t('country.label'))}</label><select class="select" id="auth-country" name="countryCode" required>${countryOptions('KR')}</select><span class="helper">${esc(t('country.help'))}</span></div>` : ''}
      <p class="auth-error" role="alert" id="auth-error" hidden></p>
      <button class="btn btn-primary btn-block" type="submit">${esc(t(signup ? 'auth.signup' : 'auth.login'))}</button>
      <a class="auth-switch" href="${signup ? '#/login' : '#/signup'}">${esc(t(signup ? 'auth.haveAccount' : 'auth.createAccount'))}</a>
    </form>
    <div class="login-foot">${signup ? '' : `<button data-act="guest">${esc(t('login.browse'))}</button>`}<span>${esc(t('auth.localNotice'))}</span></div>
  </main>`;
  }
  V.login = () => authScreen(false);
  V.signup = () => authScreen(true);

  V.lang = () => {
    const cur = lang();
    return `<main class="screen">${pageHeader(t('lang.header'), { fallback: loggedIn() || S().guest ? '#/home' : '#/login' })}
      <div class="intro"><h1>${esc(t('lang.title'))}</h1><p class="sub" style="margin:0">${esc(t('lang.sub'))}</p></div>
      <div class="options" role="group" aria-label="${esc(t('lang.title'))}">${LANGS.map(l => `<button class="option" aria-pressed="${l.code === cur}" data-act="pickLang" data-code="${l.code}" lang="${l.code}">
        <span><span class="native">${esc(l.native)}</span><br><span class="eng" lang="en">${esc(l.eng)}</span></span><span class="radio"></span></button>`).join('')}</div>
      <div class="note-card"><strong>${esc(t('lang.noteTitle'))}</strong>${esc(t('lang.note'))}</div>
      <div class="grow"></div>
      <div class="bottom-cta"><button class="btn btn-primary btn-block" data-act="confirmLang">${esc(t('common.confirm'))}</button></div>
    </main>`;
  };

  V.home = () => {
    const sort = S().sort;
    const list = [...FOODS];
    const featuredAt = Date.now();
    const period = window.IEBFeaturedFoods.periodAt(featuredAt);
    if (period !== homeFeaturedPeriod) homeFeaturedId = null;
    homeFeaturedPeriod = period;
    const featured = window.IEBFeaturedFoods.select(FOODS, featuredAt);
    if (sort === 'name') list.sort((a, b) => fname(a).localeCompare(fname(b), lang()));
    else list.sort((a, b) => foodLikes(b) - foodLikes(a));
    return `<main class="screen has-tabbar home-screen">${appHeader()}
      <section class="home-carousel" aria-labelledby="home-featured-title" aria-roledescription="${esc(t('home.carousel'))}">
        <div class="section-head"><h2 id="home-featured-title">${esc(t('home.featured'))}</h2></div>
        <p class="home-swipe-hint" id="home-swipe-hint">${esc(t('home.swipe'))}</p>
        <div class="home-track" tabindex="0" aria-label="${esc(t('home.featured'))}" aria-describedby="home-swipe-hint">
          ${featured.map((f, i) => homeFoodCard(f, { rank: i + 1, eager: i === 0, slide: true, count: featured.length })).join('')}
        </div>
        <div class="home-carousel-controls">
          <button class="icon-btn home-prev" type="button" aria-label="${esc(t('home.previous'))}">${icon('back')}</button>
          <div class="home-pages" role="group" aria-label="${esc(t('home.featured'))}">${featured.map((f, i) => `<button type="button" data-slide="${i}" aria-label="${i + 1}: ${esc(fname(f))}"><span></span></button>`).join('')}</div>
          <span class="home-count" aria-live="polite" aria-atomic="true">1 / ${featured.length}</span>
          <button class="icon-btn home-next" type="button" aria-label="${esc(t('home.next'))}">${icon('chevronRight')}</button>
        </div>
        <button class="text-btn home-autoplay" type="button" aria-pressed="false">${esc(t('home.pause'))}</button>
      </section>
      <div class="band"></div>
      <div class="home-toolbar"><h1>${esc(t('home.title'))}</h1>
        <button class="sort-btn" data-act="sort">${esc(t(sort === 'name' ? 'home.sort.name' : 'home.sort.popular'))}${icon('chevronDown')}</button></div>
      ${lang() !== 'ko' ? `<p class="pad muted source-note">${esc(t('source.korean'))}</p>` : ''}
      <div class="food-list">${list.map((f, i) => homeFoodCard(f, { rank: sort === 'popular' ? i + 1 : 0 })).join('')}</div>${tabbar('home')}</main>`;
  };
  V.home.mount = () => {
    const carousel = app.querySelector('.home-carousel');
    const track = app.querySelector('.home-track');
    if (!track) return;
    const slides = [...track.children];
    if (!slides.length) return;
    const pages = [...app.querySelectorAll('[data-slide]')];
    const prev = app.querySelector('.home-prev'), next = app.querySelector('.home-next');
    const counter = app.querySelector('.home-count');
    const autoplay = app.querySelector('.home-autoplay');
    const pointers = new Set();
    let timer = null, paused = homeAutoplayPaused, disposed = false, touching = false;
    let featuredTimer = null;
    const mountedPeriod = homeFeaturedPeriod;
    const refreshFeatured = () => {
      if (disposed || document.hidden) return false;
      if (window.IEBFeaturedFoods.periodAt() === mountedPeriod) return false;
      homeFeaturedId = null;
      rerender();
      return true;
    };
    const scheduleFeatured = () => {
      clearTimeout(featuredTimer);
      featuredTimer = setTimeout(() => {
        if (!refreshFeatured() && !disposed) scheduleFeatured();
      }, Math.max(1, window.IEBFeaturedFoods.nextRefreshAt() - Date.now()));
    };
    let index = Math.max(0, slides.findIndex(slide => slide.dataset.foodId === homeFeaturedId));
    const stop = () => { clearTimeout(timer); timer = null; };
    const schedule = () => {
      stop();
      if (disposed || paused || touching || pointers.size || document.hidden) return;
      timer = setTimeout(() => {
        if (disposed || paused || touching || pointers.size || document.hidden) return;
        // 마지막 음식에서는 첫 음식으로 돌아가 반복합니다.
        move((index + 1) % slides.length, index === slides.length - 1);
        schedule();
      }, 4000);
    };
    const update = () => {
      homeFeaturedId = slides[index].dataset.foodId;
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      counter.textContent = `${index + 1} / ${slides.length}`;
      pages.forEach((page, i) => page.setAttribute('aria-current', String(i === index)));
    };
    const move = (to, instant = false) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, to));
      track.scrollTo({ left: targetIndex * track.clientWidth,
        behavior: instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    const onScroll = () => {
      if (!track.clientWidth) return;
      const nearest = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (nearest !== index) { index = nearest; update(); }
      schedule();
    };
    const onKey = event => {
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (delta) { event.preventDefault(); move(index + delta); schedule(); }
    };
    const onResize = () => move(index, true);
    const onPointerDown = event => { pointers.add(event.pointerId); stop(); };
    const onPointerEnd = event => { if (pointers.delete(event.pointerId)) schedule(); };
    // 네이티브 터치 스크롤의 pointercancel 뒤에도 손가락을 뗄 때까지 대기합니다.
    const onTouchStart = () => { touching = true; stop(); };
    const onTouchEnd = event => { if (touching) { touching = event.touches.length > 0; schedule(); } };
    const onVisibility = () => { if (!document.hidden && refreshFeatured()) return; if (document.hidden) { pointers.clear(); touching = false; } schedule(); };
    const onPause = () => {
      paused = !paused;
      homeAutoplayPaused = paused;
      autoplay.setAttribute('aria-pressed', String(paused));
      autoplay.textContent = t(paused ? 'home.resume' : 'home.pause');
      counter.setAttribute('aria-live', paused ? 'polite' : 'off');
      schedule();
    };
    prev.addEventListener('click', () => { move(index - 1); schedule(); });
    next.addEventListener('click', () => { move(index + 1); schedule(); });
    pages.forEach((page, i) => page.addEventListener('click', () => { move(i); schedule(); }));
    autoplay.addEventListener('click', onPause);
    carousel.addEventListener('pointerdown', onPointerDown, { passive: true });
    carousel.addEventListener('touchstart', onTouchStart, { passive: true });
    carousel.addEventListener('wheel', schedule, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    update();
    autoplay.setAttribute('aria-pressed', String(paused));
    autoplay.textContent = t(paused ? 'home.resume' : 'home.pause');
    counter.setAttribute('aria-live', paused ? 'polite' : 'off');
    move(index, true);
    schedule();
    scheduleFeatured();
    cleanup.push(() => {
      disposed = true;
      stop();
      clearTimeout(featuredTimer);
      pointers.clear();
      autoplay.removeEventListener('click', onPause);
      carousel.removeEventListener('pointerdown', onPointerDown);
      carousel.removeEventListener('touchstart', onTouchStart);
      carousel.removeEventListener('wheel', schedule);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('visibilitychange', onVisibility);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    });
  };

  function foodDetailContent(f) {
    const d = L(f), manuscript = f.manuscript;
    const labels = [t('food.row.category'), t('food.row.region'), t('food.row.ingredients'), t('food.row.method'), t('food.row.taste'), t('food.row.spice'), t('food.row.season'), t('food.row.price')];
    const values = manuscript ? window.IEBFoodInfo.rows(f, lang()) : [d.category, '', d.ingredients, '', d.taste, '', '', d.price];
    const infoRows = labels.map((label, index) => [label, values[index] || t('food.unconfirmed')]);
    const introduction = manuscript ? manuscript.introduction : (d.origin || d.summary);
    const how = manuscript ? manuscript.sections[1] : `<ol class="steps">${d.steps.map(step => `<li><span>${esc(step)}</span></li>`).join('')}</ol>`;
    const allergyNotes = manuscript ? manuscript.allergenInfo.notes : [d.allergenNote];
    const allergy = `<strong lang="${lang()}">${esc(t('food.allergyTitle'))}</strong><div class="pills">${d.allergens.map(a=>`<span class="pill">${esc(a)}</span>`).join('')}</div>${allergyNotes.filter(Boolean).map(note=>`<p>※ ${esc(note)}</p>`).join('')}`;
    return { infoRows, infoLang: lang(), introduction, how, allergy, bodyLang: manuscript ? 'ko' : lang() };
  }

  V.food = ({ id }) => {
    const f = FOOD[id]; if (!f) return V.notFound();
    const d = L(f), saved = !!S().foodLikes?.[f.id], content = foodDetailContent(f);
    const secs = [['info', 'food.sec.info'], ['how', 'food.sec.how'], ['allergy', 'food.sec.allergy'], ['places', 'food.sec.places']];
    return `<main class="screen has-cta">
      <div class="hero"><img src="${img(f.id)}" alt="${f.photo?.includes('placeholder') ? esc(t('food.photoPending')) : esc(d.name)}">
        <div class="hero-nav"><button class="circle-btn" data-act="back" data-fallback="#/home" aria-label="${esc(t('common.back'))}">${icon('back')}</button><span class="grow"></span>
          <button class="circle-btn" data-act="share" data-title="${esc(d.name)}" aria-label="${esc(t('common.share'))}">${icon('share')}</button>
          <button class="circle-btn ${saved ? 'on' : ''}" data-act="saveFood" data-id="${f.id}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'common.unlike' : 'common.like'))}">${icon('heart', saved)}</button></div></div>
      <nav class="section-chips" aria-label="${esc(t('food.sections'))}">${secs.map(([key,label],index)=>`<button class="chip ${index===0?'active':''}" data-act="jump" data-sec="${key}">${esc(t(label))}</button>`).join('')}</nav>
      <div class="title-block"><span class="eyebrow" lang="${content.infoLang}">${esc(content.infoRows[0][1])}</span><h1>${esc(d.name)}</h1>
        ${lang()!=='ko'?`<span class="orig-line" lang="ko">${esc(f.ko.name)}</span>`:''}
        ${f.manuscript && lang()!=='ko'?`<p class="muted">${esc(t('food.translationPending'))}</p>`:''}
        <p class="summary" lang="${lang()}">${esc(d.summary)}</p></div>
      <section class="detail-section" id="sec-info"><h2>${esc(t('food.h.info'))}</h2>
        <dl class="info-card">${content.infoRows.map(([label,value])=>`<div class="info-row"><dt>${esc(label)}</dt><dd lang="${content.infoLang}">${esc(value)}</dd></div>`).join('')}</dl>
        <div class="origin"><h3>${esc(t('food.introduction'))}</h3><p lang="${content.bodyLang}">${esc(content.introduction)}</p></div></section>
      <section class="detail-section" id="sec-how"><h2>${esc(t('food.h.how'))}</h2>
        <div class="how-card manuscript" lang="${content.bodyLang}">${content.how}</div></section>
      <section class="detail-section" id="sec-allergy"><h2>${esc(t('food.h.allergy'))}</h2>
        <div class="allergen-card manuscript" lang="${content.bodyLang}">${content.allergy}</div></section>
      <section class="detail-section" id="sec-places"><h2>${esc(t('food.h.places'))} <small>${esc(t('food.count',{n:f.places.length}))}</small></h2>
        <div class="place-list">${f.places.map((_,index)=>placeRow(placeOf(f.id,index))).join('') || `<p class="muted">${esc(t('food.noPlaces'))}</p>`}</div>
        ${f.manuscript?`<details class="manuscript"><summary>${esc(t('food.placeReview'))}</summary><div lang="ko">${f.manuscript.placesIntro}</div></details>`:''}</section>
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
      }, { rootMargin: `-${(app.querySelector('header')?.offsetHeight || 0) + (app.querySelector('.section-chips')?.offsetHeight || 0) + 8}px 0px -50% 0px` });
      app.querySelectorAll('.detail-section').forEach(s => io.observe(s));
      cleanup.push(() => io.disconnect());
    }
  };

  V.place = ({ id, i }) => {
    const p = placeOf(id, Number(i)); if (!p) return V.notFound();
    const key = placeKey(id, p.i), saved = S().savedPlaces.includes(key);
    const related = allPosts().filter(x => x.food === id);
    const address = p.address || p.area || t('food.unconfirmed');
    const hours = p.hours || t('food.unconfirmed');
    const holiday = p.holiday || t('food.unconfirmed');
    const q = encodeURIComponent(p.name + (p.address ? ' ' + p.address : ''));
    const naverUrl = p.naverUrl || `https://map.naver.com/p/search/${q}`;
    const research = p.research;
    const menuParts = research ? research.signature.split(' / ') : [];
    const menuPrice = menuParts.length > 1 ? menuParts.pop() : t('food.unconfirmed');
    const menuName = menuParts.join(' / ') || p.signature;
    const directions = hasCoordinates(p) ? 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng : 'https://www.google.com/maps/search/?api=1&query=' + q;
    return `<main class="screen">
      <div class="hero" style="height:260px"><img src="${esc(placeImg(p))}" data-image-fallback="${esc(img(id))}" alt="${esc(p.name)}">
        <div class="hero-nav"><button class="circle-btn" data-act="back" data-fallback="#/food/${id}" aria-label="${esc(t('common.back'))}">${icon('back')}</button><span class="grow"></span>
          <button class="circle-btn" data-act="share" data-title="${esc(p.name)}" aria-label="${esc(t('common.share'))}">${icon('share')}</button>
          <button class="circle-btn ${saved ? 'on' : ''}" data-act="savePlace" data-key="${key}" aria-pressed="${saved}" aria-label="${esc(t(saved ? 'common.unsaveItem' : 'common.saveItem'))}">${icon('heart', saved)}</button></div></div>
      <div class="title-block"><span class="eyebrow">${esc(t('place.signature'))} · ${esc(research ? menuName : p.signature)}</span><h1 lang="ko">${esc(p.name)}</h1>
        <span class="orig-line">${esc(p.area)}</span>
        ${research ? `<p class="muted">${esc(t(research.matchType === 'similar' ? 'place.similar' : 'place.exact'))} · ${esc(t('place.researched'))} ${esc(research.date)} · ${esc(t('place.checkFirst'))}</p>` : `<div class="meta-line">${icon('heart', true)}<span>${placeLikes(p)}</span></div>`}</div>
      <div class="actions-row">
        <a class="action" href="${esc(directions)}" target="_blank" rel="noopener">${icon('navigation')}${esc(t('place.google'))}</a>
        <a class="action" href="${esc(naverUrl)}" target="_blank" rel="noopener">${icon('map')}${esc(t('place.naver'))}</a>
        <a class="action" href="https://map.kakao.com/?q=${q}" target="_blank" rel="noopener">${icon('pin')}${esc(t('place.kakao'))}</a>
      </div>
      <div class="band"></div>
      <div class="section-head"><h2>${esc(t('food.h.info'))}</h2></div>
      <div class="rows place-info">
        <div class="row">${icon('pin')}<span${p.address ? ' lang="ko"' : ''}>${esc(address)}</span></div>
        <div class="row">${icon('clock')}<span class="place-schedule">
          <span>${esc(t('place.businessHours'))}: <span${p.hours ? ' lang="ko"' : ''}>${esc(hours)}</span></span>
          <span>${esc(t('place.holidays'))}: <span${p.holiday ? ' lang="ko"' : ''}>${esc(holiday)}</span></span>
        </span></div>
      </div>
      <div class="mini-map" id="mini-map" role="img" aria-label="${esc(p.name)}"></div>
      ${!hasCoordinates(p) ? `<p class="map-inline-status"><a href="${esc(directions)}" target="_blank" rel="noopener">${esc(t('place.google'))}</a></p>` : ''}
      <div class="band"></div>
      ${research ? `<section class="detail-section"><h2>${esc(t('place.menu'))}</h2><dl class="info-card"><div class="info-row"><dt lang="ko">${esc(menuName)}</dt><dd>${esc(menuPrice)}</dd></div></dl><p class="muted" lang="ko">${esc(research.priceNote)}</p></section>
      <div class="band"></div><section class="detail-section manuscript"><h2>${esc(t('place.beforeVisit'))}</h2>${lang() !== 'ko' ? `<p class="muted">${esc(t('source.korean'))}</p>` : ''}<p lang="ko">${esc(research.visitNote)}</p><p><strong>${esc(t('place.unverified'))}:</strong> <span lang="ko">${esc(research.unverified)}</span></p><p><strong>${esc(t('place.researched'))}:</strong> ${esc(research.date)}</p></section><div class="band"></div>` : ''}
      <div class="section-head"><h2>${esc(t('place.servesFood'))}</h2></div>
      <div class="card" style="margin:0 16px">${foodRow(p.food)}</div>
      <div class="section-head"><h2>${esc(t('place.related'))}</h2></div>
      ${related.length ? related.map(postCard).join('') : `<p class="pad muted" style="margin:0 0 32px">${esc(t('place.noRelated'))}</p>`}
      <div style="height:24px"></div>
    </main>`;
  };
  V.place.mount = ({ id, i }) => {
    cleanup.push(mapView.mountMini({ id, i }));
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
      <p class="pad muted">${esc(t('noti.example'))}</p>${list.length ? '' : empty(t('noti.empty'), 'bell')}
      ${today.length ? `<div class="group-title">${esc(t('noti.today'))}</div>${today.map(item).join('')}` : ''}
      ${earlier.length ? `<div class="group-title">${esc(t('noti.earlier'))}</div>${earlier.map(item).join('')}` : ''}</main>`;
    return html;
  };
  V.notifications.mount = () => Store.set({ notiReadAt: Date.now() });

  /* ---------- map ---------- */
  const mapView = window.IEBMapView.create({
    data: mapData, provider: (window.IEBGoogleMapProvider || window.IEBMapProvider).create(), root: app, document, navigator,
    t, esc, fname, img, placeImg, icon, appHeader, tabbar, toast, getLanguage: lang, districtName,
    setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
  });
  V.map = params => mapView.render(params);
  V.map.mount = params => cleanup.push(mapView.mount(params));

  /* ---------- community ---------- */
  V.community = ({ tab = 'popular' }) => {
    let list = allPosts();
    if (tab === 'popular') list.sort((a, b) => postLikes(b) - postLikes(a));
    else if (tab === 'latest') list.sort((a, b) => b.createdAt - a.createdAt);
    else list = list.filter(p => p.cat === tab).sort((a, b) => b.createdAt - a.createdAt);
    const viewer = S().user;
    if (viewer) {
      const country = Countries.normalize(viewer.countryCode);
      // Stable partition retains popular/latest order within both country groups.
      list = [...list.filter(post => post.countryCode === country),
        ...list.filter(post => post.countryCode !== country)];
    }
    const tabs = [['popular', t('com.tab.popular')], ['latest', t('com.tab.latest')], ['review', t('cat.review')], ['question', t('cat.question')], ['free', t('cat.free')]];
    return `<main class="screen has-tabbar">${appHeader()}
      <div class="section-head"><h1 class="page-title">${esc(t('tab.community'))}</h1><button class="text-btn" data-act="refreshCommunity">${esc(t('db.refresh'))}</button></div>
      ${viewer ? `<p class="country-feed-note">${esc(t('country.feedFirst', {country: Countries.name(viewer.countryCode, lang())}))}</p>` : ''}
      <nav class="seg" aria-label="${esc(t('com.categories'))}">${tabs.map(([k, label]) => `<a href="#/community/${k}" ${k === tab ? 'aria-current="page"' : ''} style="padding:12px 2px 10px;white-space:nowrap;border-bottom:2px solid ${k === tab ? 'var(--accent)' : 'transparent'};color:${k === tab ? 'var(--ink)' : 'var(--ink-3)'};font-weight:${k === tab ? 700 : 400}">${esc(label)}</a>`).join('')}</nav>
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
          <span class="who"><b style="font-size:15px">${countryBadge(p.countryCode)}${esc(p.author)}</b><span style="font-size:12px">${esc(p.areaLabel || p.area)} · ${esc(ago(p.createdAt))}</span></span>
          <span class="badge">${esc(catLabel(p.cat))}</span></div>
        <h1>${esc(p.title)}</h1>
        <p class="content">${esc(p.body)}</p>
        ${p.photos && p.photos.length ? `<div class="post-photos">${p.photos.map(src => `<img src="${esc(src)}" alt="">`).join('')}</div>` : ''}
        ${p.food && FOOD[p.food] ? `<a class="card list-item" href="#/food/${p.food}" style="border:1px solid var(--border)"><img class="thumb sm" src="${img(p.food)}" alt=""><span class="li-body"><span class="li-meta">${esc(t('post.foodTag'))}</span><span class="li-title">${esc(fname(FOOD[p.food]))}</span></span>${icon('chevronRight')}</a>` : ''}
        <div class="post-actions"><button class="like ${liked ? 'on' : ''}" data-act="likePost" data-id="${id}" aria-pressed="${liked}">${icon('heart', liked)}${esc(t('post.like', { n: postLikes(p) }).trim())}</button>
          <span class="like">${icon('comment')}${esc(t('post.comments', { n: cs.length }))}</span></div>
      </article>
      <div class="band"></div>
      <div class="group-title">${esc(t('post.comments', { n: cs.length }))}</div>
      ${cs.map(c => `<div class="comment"><span class="avatar" style="width:32px;height:32px;font-size:13px">${initial(c.author)}</span><div class="c-body">
        <div class="c-meta"><b style="font-weight:500">${countryBadge(c.countryCode)}${esc(c.author)}</b><span>${esc(ago(c.createdAt))}</span></div><p>${esc(c.text)}</p>
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
          <div style="display:flex;gap:8px" role="radiogroup" aria-label="${esc(t('write.category'))}">${['review', 'question', 'free'].map((c, i) => `<label class="chip ${i === 0 ? 'active' : ''}" data-cat-chip><input type="radio" name="cat" value="${c}" ${i === 0 ? 'checked' : ''} class="sr-only">${esc(catLabel(c))}</label>`).join('')}</div></div>
        <input class="input title-input" id="w-title" name="title" maxlength="60" placeholder="${esc(t('write.titlePh'))}" aria-label="${esc(t('write.titlePh'))}">
        <textarea class="textarea" id="w-body" name="body" maxlength="2000" placeholder="${esc(t('write.bodyPh'))}" aria-label="${esc(t('write.bodyPh'))}"></textarea>
        <div class="field"><span class="label">${esc(t('write.photos'))}</span>
          <div class="photo-row" id="photo-row"><label class="add-photo">${icon('camera')}<span id="photo-count">0/4</span><input aria-label="${esc(t('write.addPhotos'))}" type="file" id="w-photos" accept="image/*" multiple class="sr-only"></label></div></div>
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
    const photos = draftPhotos;
    let active = true;
    cleanup.push(() => { active = false; });
    inp.addEventListener('change', async () => {
      for (const file of [...inp.files]) {
        if (!active) return;
        if (photos.length >= 4) { toast(t('write.photoMax')); break; }
        try {
          const photo = await resizeImage(file);
          if (!active) return;
          if (photos.length < 4) photos.push(photo);
        } catch (e) { /* 이미지가 아니면 건너뜀 */ }
      }
      if (!active) return;
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
    const top = u ? `<div class="profile">${profileAvatar(u, 'lg')}<div class="who"><b>${countryBadge(u.countryCode)}${esc(u.nickname)}</b><span class="muted" style="font-size:13px">${esc(t('my.joined', { area: districtName(u.area), date: u.joined }))}</span>${u.bio ? `<div class="sub" style="font-size:13px">${esc(u.bio)}</div>` : ''}</div>
        <a class="btn btn-outline btn-sm" href="#/profile">${esc(t('my.edit'))}</a></div>
      <div class="stats"><a href="#/my/posts"><b>${st.posts.filter(post => post.mine).length}</b><span>${esc(t('my.posts'))}</span></a><i></i><a href="#/my/comments"><b>${myComments().length}</b><span>${esc(t('my.comments'))}</span></a><i></i><a href="#/saved"><b>${st.savedFoods.length + st.savedPlaces.length}</b><span>${esc(t('my.saved'))}</span></a></div>`
      : `<div class="login-card"><b>${esc(t('my.loginTitle'))}</b><span class="sub" style="font-size:14px">${esc(t('my.loginDesc'))}</span><a class="btn btn-primary" href="#/login">${esc(t('my.login'))}</a></div>`;
    return `<main class="screen has-tabbar">${pageHeader(t('my.title'), { back: false, right: `<a class="icon-btn" href="#/settings" aria-label="${esc(t('set.title'))}">${icon('settings')}</a>` })}
      ${top}<div class="band"></div>
      ${u ? `<div class="menu-group-title">${esc(t('my.activity'))}</div>
      ${menu('#/my/posts', t('my.myPosts'))}${menu('#/my/comments', t('my.myComments'))}${menu('#/my/recent', t('my.recent'))}
      <div class="band"></div>` : ''}
      <div class="menu-group-title">${esc(t('my.support'))}</div>
      ${menu('#/notices', t('my.notices'))}${menu('#/faq', t('my.faq'))}${menu('#/contact', t('my.contact'))}
      ${tabbar('my')}</main>`;
  };
  V.myPosts = () => {
    if (!S().user) return V.login();
    const list = allPosts().filter(p => p.mine);
    return `<main class="screen">${pageHeader(t('my.myPosts'), { fallback: '#/my' })}${list.length ? list.map(postCard).join('') : empty(t('my.emptyPosts'), 'pencil', `<a class="btn btn-primary btn-sm" href="#/write">${esc(t('com.write'))}</a>`)}</main>`;
  };
  V.myComments = () => {
    if (!S().user) return V.login();
    const list = myComments().sort((a, b) => b.createdAt - a.createdAt);
    return `<main class="screen">${pageHeader(t('my.myComments'), { fallback: '#/my' })}${list.length ? list.map(c => {
      const p = postById(c.pid);
      return `<a class="comment" href="#/post/${c.pid}" style="border-bottom:1px solid var(--border)"><div class="c-body"><p>${esc(c.text)}</p><span class="muted" style="font-size:12px">${esc(p ? p.title : '')} · ${esc(ago(c.createdAt))}</span></div></a>`;
    }).join('') : empty(t('my.emptyComments'), 'comment')}</main>`;
  };
  V.myRecent = () => {
    if (!S().user) return V.login();
    const list = S().recentFoods.map(id => FOOD[id]).filter(Boolean);
    return `<main class="screen">${pageHeader(t('my.recent'), { fallback: '#/my' })}${list.length ? list.map(f => foodRow(f)).join('') : empty(t('my.emptyRecent'), 'clock')}</main>`;
  };

  V.profile = () => {
    const u = S().user; if (!u) return V.login();
    return `<main class="screen has-cta">${pageHeader(t('profile.title'), { fallback: '#/my' })}
      <form class="form" data-form="profile" id="profile-form">
        <div class="profile-photo-editor">
          <div id="p-photo-preview">${profileAvatar(u, 'xl')}</div>
          <input type="file" id="p-photo" accept="image/*" aria-label="${esc(t('profile.photo'))}" hidden>
          <div class="profile-photo-actions"><button type="button" class="btn btn-outline btn-sm" id="p-photo-choose">${esc(t('profile.photoChoose'))}</button><button type="button" class="text-btn" id="p-photo-remove" ${u.avatarUrl ? '' : 'hidden'}>${esc(t('profile.photoRemove'))}</button></div>
          <p class="helper" id="p-photo-help">${esc(t('profile.photoHelp'))}</p>
        </div>
        <div class="field"><label for="p-nick">${esc(t('profile.nickname'))}</label><input class="input" id="p-nick" name="nickname" value="${esc(u.nickname)}" minlength="2" maxlength="10" required><span class="helper">${esc(t('profile.nickHelp'))}</span></div>
        <div class="field"><label for="p-country">${esc(t('country.change'))}</label><select class="select" id="p-country" name="countryCode" required>${countryOptions(u.countryCode)}</select><span class="helper">${esc(t('country.profileHelp'))}</span></div>
        <div class="field"><label for="p-bio">${esc(t('profile.bio'))}</label><input class="input" id="p-bio" name="bio" value="${esc(u.bio || '')}" maxlength="30"><span class="helper"><span></span><span id="bio-count">${(u.bio || '').length}/30</span></span></div>
      </form><div class="grow"></div>
      <div class="fixed-cta"><button class="btn btn-primary btn-block" type="submit" form="profile-form" id="profile-save">${esc(t('common.save'))}</button></div></main>`;
  };
  V.profile.mount = () => {
    const form = document.getElementById('profile-form'), input = document.getElementById('p-photo');
    const bio = document.getElementById('p-bio');
    if (bio) bio.addEventListener('input', () => { document.getElementById('bio-count').textContent = `${bio.value.length}/30`; });
    if (!form || !input) return;
    const choose = document.getElementById('p-photo-choose'), remove = document.getElementById('p-photo-remove');
    const preview = document.getElementById('p-photo-preview'), save = document.getElementById('profile-save');
    let version = 0, active = true;
    const busy = value => { form.dataset.avatarBusy = String(value); save.disabled = value; };
    const setPreview = url => { preview.innerHTML = profileAvatar({ ...S().user, avatarUrl: url }, 'xl'); remove.hidden = !url; };
    choose.addEventListener('click', () => { if (!form.dataset.submitting) input.click(); });
    remove.addEventListener('click', () => {
      if (form.dataset.submitting) return;
      version++; input.value = ''; form.avatarChange = null; busy(false); setPreview('');
    });
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; if (!file || form.dataset.submitting) return;
      const currentVersion = ++version; busy(true);
      try {
        const photo = await window.IEBProfileImage.prepare(file);
        if (!active || currentVersion !== version || !form.isConnected) return;
        form.avatarChange = photo; setPreview(photo);
      } catch (error) {
        if (active && currentVersion === version && form.isConnected) toast(t(error.message || 'profile.photoInvalid'));
      } finally {
        if (active && currentVersion === version && form.isConnected) { busy(false); input.value = ''; }
      }
    });
    cleanup.push(() => { active = false; version++; });
  };

  V.settings = () => {
    const st = S(), s = st.settings;
    const tog = (k, label, desc) => `<div class="toggle-row"><span class="t"><span>${esc(label)}</span>${desc ? `<small>${esc(desc)}</small>` : ''}</span>
      <label class="switch"><input type="checkbox" data-setting="${k}" ${s[k] ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label></div>`;
    const row = (href, label, val = '', act = '') => `<${href ? `a href="${href}"` : `button type="button" data-act="${act}"`} class="menu-row"><span>${esc(label)}</span>${val ? `<span class="val">${esc(val)}</span>` : ''}${href ? icon('chevronRight') : ''}</${href ? 'a' : 'button'}>`;
    const acct = st.user ? (st.user.username || t('set.provider', { p: PROVIDERS[st.user.provider] || st.user.provider })) : t('set.guestNow');
    return `<main class="screen">${pageHeader(t('set.title'), { fallback: '#/my' })}
      <div class="menu-group-title">${esc(t('set.noti'))}</div><p class="pad muted" style="margin-top:0">${esc(t('set.notiHelp'))}</p>
      ${tog('comments', t('set.comments'), t('set.commentsDesc'))}${tog('likes', t('set.likes'))}${tog('newPlaces', t('set.newPlaces'), t('set.newPlacesDesc'))}${tog('events', t('set.events'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.app'))}</div>
      ${row('#/lang', t('set.language'), t('lang.name'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.account'))}</div>
      <div class="menu-row"><span>${esc(t('set.accountInfo'))}</span><span class="val">${st.user ? countryBadge(st.user.countryCode) : ''}${esc(acct)}</span></div>
      ${st.user || st.guest ? row('', t('set.logout'), '', 'logout') : row('#/login', t('my.login'))}
      <div class="band"></div><div class="menu-group-title">${esc(t('set.info'))}</div>
      ${row('#/terms', t('set.terms'))}${row('#/privacy', t('set.privacy'))}${row('#/credits', t('set.credits'))}
      <div class="menu-row"><span>${esc(t('set.version'))}</span><span class="val">1.0.0</span></div>
      ${st.user ? `<div class="danger-link"><button data-act="withdraw">${esc(t('set.withdraw'))}</button></div>` : ''}</main>`;
  };

  // Keep old bookmarked links usable; country editing now belongs to the profile form.
  V.accountPrivacy = () => V.profile();
  V.accountPrivacy.mount = V.profile.mount;

  V.notices = () => `<main class="screen">${pageHeader(t('notice.title'), { fallback: '#/my' })}${SEED.notices.map(n => {
    const [title, body] = n[lang()] || n.ko;
    return `<details class="faq"><summary><span>${esc(title)}<br><small class="muted">${esc(n.date)}</small></span></summary><p>${esc(body)}</p></details>`;
  }).join('')}</main>`;
  V.faq = () => `<main class="screen">${pageHeader(t('faq.title'), { fallback: '#/my' })}${(SEED.faq[lang()] || SEED.faq.ko).map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</main>`;
  V.contact = () => `<main class="screen">${pageHeader(t('contact.title'), { fallback: '#/my' })}<div class="prose"><p>${esc(t('contact.desc'))}</p>
    <p><b style="color:var(--ink);user-select:all">help@ieatbusan.example</b></p><button class="btn btn-outline btn-sm" data-act="copyText" data-text="help@ieatbusan.example">${esc(t('common.copy'))}</button></div></main>`;
  const LEGAL = {
    "terms": {
      "ko": [
        "이 서비스는 팀 프로젝트용 시안입니다.",
        "음식·식당 정보는 참고용이며 실제와 다를 수 있습니다.",
        "커뮤니티에 게시한 글·댓글·사진은 서버에 저장되며 다른 이용자에게 공개됩니다.",
        "타인을 비방하거나 광고성 글을 올리지 마세요."
      ],
      "en": [
        "This service is a team project prototype.",
        "Food and restaurant information is for reference and may differ from current conditions.",
        "Community posts, comments and photos are stored on the server and are visible to other users.",
        "Do not post abusive content, spam or advertisements."
      ],
      "zh": [
        "本服务是团队项目的原型。",
        "美食及餐厅信息仅供参考，可能与实际情况有所不同。",
        "社区帖子、评论和照片保存在服务器上，其他用户可以查看。",
        "请勿发布辱骂、垃圾信息或广告内容。"
      ],
      "ja": [
        "このサービスはチームプロジェクトの試作版です。",
        "料理・店舗情報は参考情報であり、実際の状況と異なる場合があります。",
        "コミュニティの投稿・コメント・写真はサーバーに保存され、他の利用者に公開されます。",
        "誹謗中傷、スパム、広告の投稿はお控えください。"
      ]
    },
    "privacy": {
      "ko": [
        "계정 인증은 Supabase Auth로 처리하며, 프로필·게시글·댓글·사진·찜과 회원 설정은 서버에 저장됩니다.",
        "이 브라우저에는 언어·정렬·게스트 이용 설정 등이 저장됩니다. 브라우저 데이터를 지워도 서버에 저장된 글은 삭제되지 않습니다.",
        "서비스 이용 통계를 위해 Google Analytics가 쿠키와 기기 정보, 방문 화면, 게시물 조회, 로그인 상태를 수집합니다. 로그인한 경우 내부 계정 식별자를 연결하며 로그아웃하면 연결을 해제합니다.",
        "아이디, 닉네임, 비밀번호, 게시물 본문과 검색어는 분석 이벤트에 포함하지 않습니다.",
        "현재 위치는 이용자가 허용할 때 지도 기능에 사용합니다. 앱은 현재 좌표를 계정 기록에 저장하지 않으며, 지도 표시에는 외부 지도 서비스가 사용됩니다.",
        "설정 > 회원 탈퇴에서 현재 계정과 그 계정의 게시글·댓글·사진·찜 등 연결된 데이터를 삭제할 수 있습니다."
      ],
      "en": [
        "Supabase Auth handles account authentication. Profiles, posts, comments, photos, saved items and member preferences are stored on the server.",
        "This browser stores preferences such as language, sorting and guest access. Clearing browser data does not delete posts stored on the server.",
        "Google Analytics collects cookies, device information, screen visits, post views and login status for service statistics. An internal account ID is linked while logged in and cleared on logout.",
        "Usernames, nicknames, passwords, post bodies and search terms are not included in analytics events.",
        "With your permission, your current location is used for map features. The app does not save your current coordinates to your account history. Maps use external map services.",
        "Settings > Delete account removes your current account and its associated data, including posts, comments, photos and saved items."
      ],
      "zh": [
        "账号认证由 Supabase Auth 处理。个人资料、帖子、评论、照片、收藏及会员设置保存在服务器上。",
        "本浏览器会保存语言、排序及游客访问等设置。清除浏览器数据不会删除服务器上的帖子。",
        "为统计服务使用情况，Google Analytics 会收集 Cookie、设备信息、访问页面、帖子浏览及登录状态。登录时会关联内部账号标识，退出登录后会解除关联。",
        "用户名、昵称、密码、帖子正文和搜索词不会包含在分析事件中。",
        "获得定位许可后，当前位置用于地图功能。应用不会将当前坐标保存到账号记录中。地图显示使用第三方地图服务。",
        "通过“设置 > 注销账号”可删除当前账号及其关联的帖子、评论、照片、收藏等数据。"
      ],
      "ja": [
        "アカウント認証にはSupabase Authを使用します。プロフィール・投稿・コメント・写真・お気に入り・会員設定はサーバーに保存されます。",
        "このブラウザーには言語・並び順・ゲスト利用などの設定を保存します。ブラウザーのデータを消去しても、サーバー上の投稿は削除されません。",
        "サービスの利用状況の集計にGoogle Analyticsを使用し、Cookie、端末情報、閲覧画面、投稿の閲覧、ログイン状態を収集します。ログイン中は内部アカウントIDを関連付け、ログアウト時に解除します。",
        "ユーザーID、ニックネーム、パスワード、投稿本文、検索語は分析イベントに含めません。",
        "位置情報の利用を許可した場合、現在地を地図機能に使用します。現在の座標はアカウントの履歴に保存しません。地図の表示には外部の地図サービスを使用します。",
        "「設定 > 退会する」から、現在のアカウントと、それに紐づく投稿・コメント・写真・お気に入りなどのデータを削除できます。"
      ]
    }
  };
  const legal = (k, title) => () => `<main class="screen">${pageHeader(title(), { fallback: '#/settings' })}<div class="prose"><ol>${(LEGAL[k][lang()] || LEGAL[k].en).map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></main>`;
  V.terms = legal('terms', () => t('set.terms'));
  V.privacy = legal('privacy', () => t('set.privacy'));
  V.credits = () => `<main class="screen">${pageHeader(t('credits.title'), { fallback: '#/settings' })}<p class="pad sub" style="font-size:14px">${esc(t('credits.desc'))}</p>
    ${FOODS.map(f => `<div class="credit"><img class="thumb sm" src="${img(f.id)}" alt=""><div><b>${esc(fname(f))}</b><br><span class="sub">${esc(f.credit.author)} · ${esc(f.credit.license)}</span><br><a href="${esc(f.credit.url)}" target="_blank" rel="noopener">${esc(f.credit.file)}</a></div></div>`).join('')}
    <div class="credit"><span class="sub">Map data © OpenStreetMap contributors · Icons: Lucide (ISC)</span></div></main>`;
  V.notFound = () => `<main class="screen">${pageHeader('404')}${empty(t('common.notFound'))}</main>`;

  /* ---------- router ---------- */
  const ROUTES = [
    [/^#\/login$/, 'login'], [/^#\/signup$/, 'signup'], [/^#\/lang$/, 'lang'], [/^#\/home$/, 'home'],
    [/^#\/food\/([\w-]+)$/, 'food', ['id']], [/^#\/place\/([\w-]+)\/(\d+)$/, 'place', ['id', 'i']],
    [/^#\/search$/, 'search'], [/^#\/results\/([^/]+)(?:\/(all|foods|places|posts))?$/, 'results', ['q', 'tab']],
    [/^#\/notifications$/, 'notifications'],
    ...window.IEBMapRoutes.definitions,
    [/^#\/community(?:\/(popular|latest|review|question|free))?$/, 'community', ['tab']],
    [/^#\/post\/([\w-]+)$/, 'post', ['id']], [/^#\/write$/, 'write'],
    [/^#\/saved(?:\/(foods|places))?$/, 'saved', ['tab']], [/^#\/my$/, 'my'], [/^#\/my\/posts$/, 'myPosts'],
    [/^#\/my\/comments$/, 'myComments'], [/^#\/my\/recent$/, 'myRecent'], [/^#\/profile$/, 'profile'],
    [/^#\/settings\/privacy$/, 'accountPrivacy'], [/^#\/settings$/, 'settings'], [/^#\/notices$/, 'notices'], [/^#\/faq$/, 'faq'], [/^#\/contact$/, 'contact'],
    [/^#\/terms$/, 'terms'], [/^#\/privacy$/, 'privacy'], [/^#\/credits$/, 'credits'],
  ];
  const MEMBER_ONLY = ['write', 'profile', 'accountPrivacy', 'myPosts', 'myComments', 'myRecent'];
  let cleanup = [];
  const stack = [];
  function route() {
    syncFoodCatalog();
    const hash = location.hash || '#/home';
    let name = 'notFound', params = {};
    for (const [re, n, keys] of ROUTES) {
      const m = hash.match(re);
      if (m) { name = n; (keys || []).forEach((k, i) => { if (m[i + 1] !== undefined) params[k] = decodeURIComponent(m[i + 1]); }); break; }
    }
    const st = S();
    if (!st.user && MEMBER_ONLY.includes(name)) { loginIntent = true; location.replace('#/login'); return; }
    if (name === 'login' && st.user && !loginIntent) { location.replace('#/home'); return; }
    loginIntent = false;
    if (stack[stack.length - 2] === hash) stack.pop(); else if (stack[stack.length - 1] !== hash) stack.push(hash);
    cleanup.forEach(fn => { try { fn(); } catch (e) {} }); cleanup = [];
    document.documentElement.lang = lang();
    app.innerHTML = V[name](params);
    const screen = app.querySelector('main');
    if (screen) {
      if (!screen.querySelector('.app-header, .page-header')) screen.insertAdjacentHTML('afterbegin', appHeader());
      if (!screen.querySelector('.tabbar')) {
        const active = ['food', 'search', 'results'].includes(name) ? 'home' : name === 'place' ? 'map' : ['post', 'write'].includes(name) ? 'community' : ['login', 'signup', 'lang'].includes(name) ? '' : 'my';
        screen.insertAdjacentHTML('beforeend', tabbar(active));
      }
    }
    const titleKeys = { map: 'tab.map', community: 'tab.community', search: 'search.placeholder' };
    const pageTitle = app.querySelector('h1')?.textContent || (titleKeys[name] ? t(titleKeys[name]) : '');
    document.title = name === 'home' || name === 'login' || !pageTitle ? 'I EAT BUSAN' : `${pageTitle} · I EAT BUSAN`;
    window.scrollTo(0, 0);
    if (V[name].mount) V[name].mount(params);
    const measuredPost = name === 'post' ? postById(params.id) : null;
    window.IEBAnalytics?.view(name, params, {
      validContent: name === 'post' ? !!measuredPost : !!FOOD[params.id],
      category: measuredPost?.cat,
    });
  }
  let loginIntent = false;
  function back(fallback) {
    if (stack.length > 1) history.back(); else location.hash = fallback || '#/home';
  }

  /* ---------- actions ---------- */
  function rerender() { const y = window.scrollY; route(); window.scrollTo(0, y); }
  const A = {
    back: el => back(el.dataset.fallback),
    guest: () => { Store.set({ guest: true }); go(S().langChosen ? '#/home' : '#/lang'); },
    pickLang: el => { const code = el.dataset.code; Store.set({ lang: code }); rerender(); app.querySelector(`[data-act="pickLang"][data-code="${code}"]`)?.focus(); },
    confirmLang: () => { Store.set({ langChosen: true }); if (stack.length > 1 && !stack[stack.length - 2].startsWith('#/login')) history.back(); else go('#/home'); },
    sort: () => { Store.set({ sort: S().sort === 'popular' ? 'name' : 'popular' }); rerender(); },
    saveFood: async el => {
      if (!requireLogin()) return;
      const id = el.dataset.id, on = !S().foodLikes?.[id];
      await Cloud.foodLike(id, on);
      // Keep the existing saved-food page in sync with newly pressed food hearts.
      Store.update(s => { s.savedFoods = on ? [id, ...s.savedFoods.filter(x => x !== id)] : s.savedFoods.filter(x => x !== id); });
      await Store.flush(); if (!app.contains(el)) return;
      toast(t(on ? 'food.saved' : 'food.unsaved')); rerender();
    },
    savePlace: async el => {
      if (!requireLogin()) return;
      const k = el.dataset.key; let on;
      Store.update(s => { on = !s.savedPlaces.includes(k); s.savedPlaces = on ? [k, ...s.savedPlaces] : s.savedPlaces.filter(x => x !== k); });
      await Store.flush(); if (!app.contains(el)) return; toast(t(on ? 'food.saved' : 'food.unsaved')); rerender();
    },
    jump: el => {
      const sec = document.getElementById('sec-' + el.dataset.sec); if (!sec) return;
      const chips = app.querySelector('.section-chips');
      const header = app.querySelector('.app-header, .page-header');
      const y = sec.getBoundingClientRect().top + window.scrollY - (chips ? chips.offsetHeight : 0) - (header ? header.offsetHeight : 0) - 8;
      window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      app.querySelectorAll('.section-chips .chip').forEach(c => c.classList.toggle('active', c === el));
    },
    share: async el => {
      const data = { title: `${el.dataset.title} · I EAT BUSAN`, url: location.href };
      try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(location.href); toast(t('toast.copied')); } catch (e) { toast(location.href); }
    },
    copyText: async el => { try { await navigator.clipboard.writeText(el.dataset.text); toast(t('toast.textCopied')); } catch (e) { toast(el.dataset.text); } },
    clearRecent: () => { Store.set({ recentSearches: [] }); rerender(); },
    removeRecent: el => { Store.update(s => { s.recentSearches = s.recentSearches.filter(x => x !== el.dataset.q); }); rerender(); },
    sheet: el => mapView.sheet(el),
    flyTo: (el, event) => mapView.flyTo(el, event),
    locate: () => mapView.locate(),
    needLogin: (el, e) => { if (!loggedIn()) { e.preventDefault(); requireLogin(); } },
    refreshCommunity: async el => { await Cloud.refresh(); if (app.contains(el)) rerender(); },
    likePost: async el => { if (!requireLogin()) return; await Cloud.like(el.dataset.id, !S().postLikes[el.dataset.id]); if (app.contains(el)) rerender(); },
    deletePost: async el => {
      if (!confirm(t('post.deleteConfirm'))) return;
      await Cloud.deletePost(el.dataset.id);
      if (!app.contains(el)) return;
      toast(t('post.deleted')); location.replace('#/community'); stack.pop();
    },
    rmPhoto: el => { draftPhotos.splice(Number(el.dataset.i), 1); renderPhotos(); },
    logout: async () => { await Store.signOut(); window.IEBAnalytics?.auth('logout'); toast(t('set.loggedOut')); stack.length = 0; location.replace('#/login'); },
    withdraw: async () => { if (!confirm(t('set.withdrawConfirm'))) return; await Store.removeCurrentAccount(); stack.length = 0; location.replace('#/login'); },
  };
  app.addEventListener('error', event => {
    if (event.target.matches?.('.avatar img')) event.target.hidden = true;
    const fallback = event.target.dataset?.imageFallback;
    if (fallback) { delete event.target.dataset.imageFallback; event.target.src = fallback; }
  }, true);
  app.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    const fn = A[el.dataset.act]; if (!fn) return;
    // Preserve native navigation for links inside actionable map rows.
    const link = e.target.closest('a');
    if (link && link !== el) return;
    if (el.dataset.act !== 'needLogin') e.preventDefault();
    if (el.dataset.saving) return;
    const result = fn(el, e);
    if (result?.then) {
      el.dataset.saving = 'true';
      el.setAttribute('aria-busy', 'true');
      result.catch(error => toast(t(error.message || 'db.failure'))).finally(() => { delete el.dataset.saving; el.removeAttribute('aria-busy'); });
    }
  });
  app.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); A[e.target.dataset.act](e.target, e); }
  });
  app.addEventListener('change', e => {
    const k = e.target.dataset.setting;
    if (k) Store.update(s => { s.settings[k] = e.target.checked; });
  });
  async function submitForm(e) {
    const f = e.target; e.preventDefault();
    const kind = f.dataset.form;
    if (kind === 'login' || kind === 'signup') {
      if (f.dataset.busy) return;
      const username = f.elements.username.value.trim(), password = f.elements.password.value;
      const error = f.querySelector('.auth-error'), submit = f.querySelector('[type="submit"]');
      f.dataset.busy = 'true';
      error.hidden = true;
      submit.disabled = true;
      submit.textContent = t('auth.processing');
      try {
        if (kind === 'signup') {
          await Auth.register(username, password, f.elements.countryCode.value);
          window.IEBAnalytics?.auth('sign_up');
          if (!f.isConnected) return;
          registeredId = username;
          f.elements.password.value = '';
          loginIntent = true;
          go('#/login');
          toast(t('auth.registered'));
        } else {
          const id = await Auth.verify(username, password);
          if (!f.isConnected) return;
          await Store.signIn(id);
          window.IEBAnalytics?.auth('login');
          f.elements.password.value = '';
          registeredId = '';
          stack.length = 0;
          go(S().langChosen ? '#/home' : '#/lang');
        }
      } catch (errorValue) {
        if (!f.isConnected) return;
        error.textContent = t(errorValue.message?.startsWith('auth.') ? errorValue.message : 'auth.failure');
        error.hidden = false;
        f.elements.password.value = '';
      } finally {
        delete f.dataset.busy;
        submit.disabled = false;
        submit.textContent = t(kind === 'signup' ? 'auth.signup' : 'auth.login');
      }
      return;
    } else if (kind === 'search') {
      const q = f.q.value.trim(); if (!q) return;
      Store.update(s => { s.recentSearches = [q, ...s.recentSearches.filter(x => x !== q)].slice(0, 10); });
      go('#/results/' + encodeURIComponent(q));
    } else if (kind === 'comment') {
      if (!requireLogin()) return;
      const text = f.text.value.trim(); if (!text) return;
      await Cloud.comment(f.dataset.id, text);
      if (!f.isConnected) return;
      toast(t('post.commented')); rerender(); window.scrollTo(0, document.body.scrollHeight);
    } else if (kind === 'write') {
      if (!requireLogin()) return;
      const title = f.title.value.trim(), body = f.body.value.trim();
      if (!title || !body) { toast(t('write.need')); return; }
      const id = await Cloud.createPost({ title, body, cat: f.cat.value, food: f.food.value || null, photos: draftPhotos.slice() });
      if (!f.isConnected) return;
      toast(t('write.done')); stack.pop(); location.replace('#/post/' + id);
    } else if (kind === 'profile') {
      if (!requireLogin()) return;
      const nick = f.nickname.value.trim();
      if (nick.length < 2 || nick.length > 10) { toast(t('profile.invalid')); return; }
      const countryCode = f.elements.countryCode.value;
      if (!Countries.isValid(countryCode)) { toast(t('profile.invalidCountry')); return; }
      if (f.dataset.avatarBusy === 'true') { toast(t('profile.photoBusy')); return; }
      const profileData = { nickname: nick, bio: f.bio.value.trim(), countryCode };
      if (Object.hasOwn(f, 'avatarChange')) profileData.avatar = f.avatarChange;
      await Cloud.profile(profileData);
      if (!f.isConnected) return;
      toast(t('profile.saved')); back('#/my');
    }
  }
  app.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.submitting) return;
    form.dataset.submitting = 'true';
    submitForm(event).catch(error => toast(t(error.message || 'db.failure')))
      .finally(() => { delete form.dataset.submitting; });
  });
  // 로그인 화면은 명시적으로 이동할 때만 다시 보이게 합니다.
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#/login"]'); if (a) loginIntent = true; });

  window.addEventListener('hashchange', route);
  if (!S().lang) {
    const nav = (navigator.language || 'ko').slice(0, 2);
    Store.set({ lang: ['ko', 'en', 'zh', 'ja'].includes(nav) ? nav : 'en' });
  }
  window.addEventListener('ieb:save-error', event => toast(t(event.detail || 'db.failure')));
  app.innerHTML = `<p class="pad" role="status">${esc(t('db.loading'))}</p>`;
  Store.load().then(route).catch(error => { route(); toast(t(error.message || 'db.failure')); });
})();
