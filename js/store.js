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
  let queuedPreferences = null, savingPreferences = false, loading = null, revision = 0, accountVersion = 0;
  const mutations = new Map();
  const preferenceData = () => JSON.parse(JSON.stringify(Object.fromEntries(fields.map(key => [key, state[key]]))));
  let confirmedPreferences = preferenceData(), lastPreferences = JSON.stringify(confirmedPreferences);
  const changed = key => window.dispatchEvent(new CustomEvent('ieb:change', { detail: key }));
  function persistUI() {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: state.lang, langChosen: state.langChosen, sort: state.sort, guest: state.guest })); }
    catch { /* A blocked local preference store must not fail a DB write. */ }
  }
  function save() {
    persistUI();
    if (state.user) {
      const data = preferenceData();
      const serialized = JSON.stringify(data);
      if (serialized === lastPreferences) return true;
      lastPreferences = serialized;
      queuedPreferences = data;
      revision++;
      if (!savingPreferences) {
        savingPreferences = true;
        const version = accountVersion;
        pending = Promise.resolve().then(async () => {
          while (queuedPreferences && version === accountVersion) {
            const next = queuedPreferences;
            queuedPreferences = null;
            try {
              await Cloud.call('preferences', { data: next });
              if (version === accountVersion) confirmedPreferences = next;
            } catch (error) {
              if (version !== accountVersion) return;
              // A newer complete snapshot can still save these edits. Otherwise
              // restore the last acknowledged state instead of showing false success.
              if (!queuedPreferences) {
                Object.assign(state, JSON.parse(JSON.stringify(confirmedPreferences)));
                lastPreferences = JSON.stringify(confirmedPreferences);
                persistUI(); changed('preferences');
              }
              window.dispatchEvent(new CustomEvent('ieb:save-error', { detail: error.message }));
            }
            revision++;
          }
        }).finally(() => { savingPreferences = false; });
      }
    }
    return true;
  }
  function clearUser() {
    accountVersion++; revision++; queuedPreferences = null;
    state = { ...defaults(), lang: state.lang, langChosen: state.langChosen, sort: state.sort };
    confirmedPreferences = preferenceData(); lastPreferences = JSON.stringify(confirmedPreferences);
    window.IEBAnalytics?.identity(null);
    persistUI();
  }
  async function flush() {
    // Writes may be added while another request is settling.
    do {
      const writes = [pending, ...mutations.values()];
      await Promise.allSettled(writes);
    } while (savingPreferences || mutations.size);
  }
  window.Store = {
    get: () => state,
    set(patch) { Object.assign(state, patch); return save(); },
    update(fn) { fn(state); return save(); },
    save,
    flush,
    isPending: key => mutations.has(key),
    mutate(key, apply, send, reconcile, rollback) {
      if (mutations.has(key)) return mutations.get(key);
      const version = accountVersion;
      revision++;
      const result = Promise.resolve().then(send).then(payload => {
        if (version === accountVersion) reconcile?.(state, payload);
        return payload;
      }, error => {
        if (version === accountVersion) rollback(state);
        throw error;
      }).finally(() => {
        mutations.delete(key); revision++;
        if (version === accountVersion) changed(key);
      });
      mutations.set(key, result);
      apply(state); changed(key);
      return result;
    },
    load() {
      if (loading) return loading;
      loading = (async () => {
        let payload;
        for (;;) {
          await flush();
          const before = revision;
          payload = await Cloud.call('bootstrap');
          if (before === revision) break; // Never overwrite a newer optimistic edit.
        }
        const preferences = Object.fromEntries(fields.filter(key => Object.hasOwn(payload.preferences, key)).map(key => [key, payload.preferences[key]]));
        state = { ...defaults(), lang: state.lang, langChosen: state.langChosen, sort: state.sort,
          guest: !payload.user && state.guest, ...preferences, user: payload.user,
          posts: payload.posts.map(post => {
            const seed = SEED.posts.find(item => item.id === post.id);
            return { ...post, photos: post.photos.length ? post.photos : seed?.img ? ['assets/food/' + seed.img + '.jpg'] : [] };
          }), comments: payload.comments, postLikes: payload.postLikes, foods: Array.isArray(payload.foods) ? payload.foods : null, foodLikes: payload.foodLikes || {} };
        persistUI();
        window.IEBAnalytics?.identity(state.user);
        confirmedPreferences = preferenceData(); lastPreferences = JSON.stringify(confirmedPreferences);
        return true;
      })().finally(() => { loading = null; });
      return loading;
    },
    async signIn() { return this.load(); },
    async signOut() { await flush(); await Cloud.call('logout', {}); clearUser(); return this.load(); },
    async removeCurrentAccount() { await flush(); await Cloud.call('deleteAccount', {}); clearUser(); return this.load(); },
    reset() { clearUser(); },
  };
})();
