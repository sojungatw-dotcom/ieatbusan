/* Account data lives in Supabase. Only UI preferences are kept locally. */
(function () {
  'use strict';
  const KEY = 'ieatbusan.ui.v2';
  const fields = ['savedFoods','savedPlaces','recentSearches','recentFoods','notiReadAt','settings','sort','lang','langChosen'];
  const defaults = () => ({ lang: null, langChosen: false, user: null, guest: false,
    savedFoods: [], savedPlaces: [], recentSearches: [], recentFoods: [], posts: [], comments: {}, postLikes: {}, foods: null, foodLikes: {}, deletedPosts: [],
    notiReadAt: 0, settings: { comments: true, likes: true, newPlaces: true, events: false }, sort: 'popular', seededAt: Date.now() });
  let saved = {};
  try {
    const old = JSON.parse(localStorage.getItem('ieatbusan.v1') || '{}');
    // Remove all legacy browser-only credentials and cached local login data.
    // Keep non-account content/settings; Supabase accounts are unaffected.
    const hasLocalAccounts = Object.hasOwn(old, 'accounts') || Object.hasOwn(old, 'user') || old.legacyData?.user;
    if (hasLocalAccounts) {
      delete old.accounts;
      delete old.user;
      if (old.legacyData && typeof old.legacyData === 'object') {
        delete old.legacyData.user;
        delete old.legacyData.accounts;
      }
      localStorage.setItem('ieatbusan.v1', JSON.stringify(old));
    }
    saved = { lang: old.lang, langChosen: old.langChosen, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch { /* Storage may be unavailable; the online account still works. */ }
  let state = { ...defaults(), ...saved, user: null };
  let pending = Promise.resolve();
  function persistUI() {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: state.lang, langChosen: state.langChosen, sort: state.sort, guest: state.guest })); }
    catch { /* A blocked local preference store must not fail a DB write. */ }
  }
  function save() {
    persistUI();
    if (state.user) {
      const data = JSON.parse(JSON.stringify(Object.fromEntries(fields.map(key => [key, state[key]]))));
      pending = pending.catch(() => {}).then(() => Cloud.call('preferences', { data }));
      pending.catch(error => window.dispatchEvent(new CustomEvent('ieb:save-error', { detail: error.message })));
    }
    return true;
  }
  function clearUser() {
    state = { ...defaults(), lang: state.lang, langChosen: state.langChosen, sort: state.sort };
    persistUI();
  }
  window.Store = {
    get: () => state,
    set(patch) { Object.assign(state, patch); return save(); },
    update(fn) { fn(state); return save(); },
    save,
    flush: () => pending,
    async load() {
      await pending.catch(() => {});
      const payload = await Cloud.call('bootstrap');
      const preferences = Object.fromEntries(fields.filter(key => Object.hasOwn(payload.preferences, key)).map(key => [key, payload.preferences[key]]));
      state = { ...defaults(), lang: state.lang, langChosen: state.langChosen, sort: state.sort,
        guest: !payload.user && state.guest, ...preferences, user: payload.user,
        posts: payload.posts.map(post => {
          const seed = SEED.posts.find(item => item.id === post.id);
          return { ...post, photos: post.photos.length ? post.photos : seed?.img ? ['assets/food/' + seed.img + '.jpg'] : [] };
        }), comments: payload.comments, postLikes: payload.postLikes, foods: Array.isArray(payload.foods) ? payload.foods : null, foodLikes: payload.foodLikes || {} };
      persistUI();
      return true;
    },
    async signIn() { return this.load(); },
    async signOut() { await pending.catch(() => {}); await Cloud.call('logout', {}); clearUser(); return this.load(); },
    async removeCurrentAccount() { await pending.catch(() => {}); await Cloud.call('deleteAccount', {}); clearUser(); return this.load(); },
    reset() { clearUser(); },
  };
})();
