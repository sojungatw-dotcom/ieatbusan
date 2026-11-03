/* 브라우저 저장소(localStorage) 기반 앱 상태. 저장이 막힌 환경에서도 메모리로 동작합니다. */
(function () {
  const KEY = 'ieatbusan.v1';
  const defaults = () => ({
    lang: null,
    user: null,            // { provider, nickname, area, bio, joined }
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
  window.Store = {
    get: () => state,
    set(patch) { Object.assign(state, patch); return save(); },
    update(fn) { fn(state); return save(); },
    reset() { state = defaults(); try { localStorage.removeItem(KEY); } catch (e) {} },
    save,
  };
})();
