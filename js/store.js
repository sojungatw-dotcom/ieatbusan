/* 브라우저 저장소(localStorage) 기반 앱 상태. 저장이 막힌 환경에서도 메모리로 동작합니다. */
(function () {
  const KEY = 'ieatbusan.v1';
  const defaults = () => ({
    lang: null,
    user: null,            // { provider, nickname, area, bio, joined }
    accounts: [],          // 로컬 시안 계정: 비밀번호 검증값과 계정별 활동 데이터
    legacyData: null,      // 아이디 도입 전 게스트·소셜 데모 데이터 보관
    guest: false,
    likes: {},             // foodId -> true
    savedFoods: [],        // [foodId]
    savedPlaces: [],       // ['foodId:index']
    recentSearches: [],
    recentFoods: [],
    posts: [],             // 사용자가 쓴 글
    deletedPosts: [],
    postLikes: {},         // postId -> true
    comments: {},          // postId -> [사용자 댓글]
    notiReadAt: 0,
    settings: { comments: true, likes: true, newPlaces: true, events: false },
    sort: 'popular',
    seededAt: Date.now(),
  });
  let state;
  try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { state = defaults(); }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }
  function replace(next) {
    const previous = state;
    state = next;
    if (save()) return true;
    state = previous;
    return false;
  }
  function accountSnapshot() {
    const { accounts, legacyData, lang, langChosen, guest, ...personal } = state;
    return JSON.parse(JSON.stringify(personal));
  }
  function archivedAccounts() {
    const accounts = JSON.parse(JSON.stringify(state.accounts || []));
    const current = accounts.find(account => account.id === state.user?.username);
    if (current) current.data = accountSnapshot();
    return accounts;
  }
  function signedOut(accounts) {
    const legacyData = !state.user?.username && (state.user || state.guest) ? accountSnapshot() : state.legacyData;
    return { ...defaults(), accounts, legacyData, lang: state.lang, langChosen: state.langChosen };
  }
  window.Store = {
    get: () => state,
    set(patch) { Object.assign(state, patch); return save(); },
    update(fn) { fn(state); return save(); },
    commit(patch) { return replace({ ...state, ...patch }); },
    signIn(id) {
      const accounts = archivedAccounts();
      const account = accounts.find(item => item.id === id);
      if (!account) return false;
      const user = account.data?.user || { provider: 'local', username: id,
        nickname: account.displayId.slice(0, 10), area: 8, bio: '', joined: account.joined };
      return replace({ ...signedOut(accounts), ...(account.data || {}), accounts,
        user: { ...user, provider: 'local', username: id }, guest: false });
    },
    signOut() { return replace(signedOut(archivedAccounts())); },
    removeCurrentAccount() {
      const next = signedOut((state.accounts || []).filter(account => account.id !== state.user?.username));
      if (!state.user?.username) next.legacyData = null;
      return replace(next);
    },
    reset() { state = defaults(); try { localStorage.removeItem(KEY); } catch (e) {} },
    save,
  };
})();
