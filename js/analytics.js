/* GA4: only resolved screens and verified session state enter the measurement queue. */
(function () {
  'use strict';
  const ID = 'G-8S5WRPX8S9';
  const debug = window.IEB_ANALYTICS_DEBUG === true;
  const enabled = location.hostname === 'ieatbusan-eight.vercel.app' || debug;
  let ready = false, started = false, userId = null, lastView = null, previousLocation = '';
  const titles = {
    home: '홈', login: '로그인', signup: '회원가입', lang: '언어', food: '음식 상세',
    place: '식당 상세', search: '검색', results: '검색 결과', notifications: '알림',
    map: '지도', community: '커뮤니티', post: '게시물 상세', write: '글쓰기',
    saved: '찜', my: '마이', myPosts: '내 게시글', myComments: '내 댓글',
    myRecent: '최근 본 음식', profile: '프로필', accountPrivacy: '계정 설정',
    settings: '설정', notices: '공지', faq: 'FAQ', contact: '문의',
    terms: '이용약관', privacy: '개인정보 처리방침', credits: '출처', notFound: '404',
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const tag = (...args) => { try { window.gtag(...args); } catch { /* Measurement must never interrupt the app. */ } };
  const status = () => userId ? 'logged_in' : 'guest';
  const token = value => /^[\w-]{1,100}$/.test(String(value || '')) ? String(value) : '';
  function referrer() {
    try { const url = new URL(document.referrer); return url.origin + url.pathname; } catch { return ''; }
  }
  function page(name, params, validContent) {
    // Never copy raw hashes, search terms, user input or post titles into analytics URLs/titles.
    let path = '/' + (Object.hasOwn(titles, name) ? name : 'notFound');
    if (['post', 'food', 'place'].includes(name) && validContent && token(params.id)) {
      path += '/' + token(params.id);
      if (name === 'place' && /^\d+$/.test(String(params.i))) path += '/' + params.i;
    }
    if (['community', 'saved', 'results'].includes(name) && token(params.tab)) path += '/' + token(params.tab);
    return { page_location: location.origin + path, page_title: (titles[name] || '404') + ' · I EAT BUSAN' };
  }
  function start(fields) {
    if (started) return;
    started = true;
    tag('js', new Date());
    tag('set', { ...fields, page_referrer: referrer(), login_status: status(), ...(userId ? { user_id: userId } : {}) });
    tag('config', ID, { send_page_view: false,
      ...(debug ? { debug_mode: true } : {}) });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
  }
  window.IEBAnalytics = {
    identity(user) {
      const next = user?.id ? String(user.id) : null;
      ready = true;
      if (userId === next) return;
      userId = next;
      if (started) tag('set', { user_id: userId, login_status: status() });
    },
    view(name, params = {}, context = {}) {
      if (!enabled || !ready) return;
      const fields = page(name, params, context.validContent);
      // Raw route is used locally only, so separate searches count as visits without leaking their terms.
      const key = location.hash || '#/home';
      start(fields);
      if (lastView === key) return;
      lastView = key;
      tag('set', { ...fields, page_referrer: previousLocation || referrer(), login_status: status() });
      const event = { ...fields, page_referrer: previousLocation || referrer(),
        login_status: status(), page_type: name, send_to: ID };
      tag('event', 'page_view', event);
      previousLocation = fields.page_location;
      if (name === 'post' && context.validContent && token(params.id)) {
        tag('event', 'post_view', { ...event, post_id: token(params.id),
          ...(token(context.category) ? { post_category: token(context.category) } : {}) });
      }
    },
    auth(event) {
      if (!enabled || !ready || !['login', 'sign_up', 'logout'].includes(event)) return;
      tag('event', event, { method: 'password', login_status: status(), send_to: ID });
    },
  };
})();
