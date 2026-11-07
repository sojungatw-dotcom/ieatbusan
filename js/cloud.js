/* Same-origin Vercel API. No Supabase secret or session token reaches JS. */
(function () {
  'use strict';
  window.Cloud = {
    async call(action, data) {
      if (location.protocol === 'file:') throw new Error('db.localServer');
      let response;
      try {
        response = await fetch('/api/service?action=' + encodeURIComponent(action), {
          method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
          headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
          ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        });
      } catch { throw new Error('db.failure'); }
      let result;
      try { result = await response.json(); } catch { throw new Error('db.configuration'); }
      if (!response.ok) throw new Error(result.error || 'db.failure');
      return result;
    },
    async refresh() { return Store.load(); },
    async createPost(data) { const result = await this.call('post', data); await Store.load(); return result.id; },
    comment(postId, text) {
      const user = Store.get().user;
      const temporary = { id: 'pending-' + crypto.randomUUID(), author: user.nickname, text,
        createdAt: Date.now(), likes: 0, mine: true, pending: true };
      return Store.mutate('comment:' + postId,
        state => { (state.comments[postId] ||= []).push(temporary); },
        () => this.call('comment', { postId, text }),
        (state, result) => {
          const list = state.comments[postId] || [], index = list.findIndex(item => item.id === temporary.id);
          if (index >= 0) list[index] = { ...temporary, ...result.comment, pending: false };
        },
        state => { state.comments[postId] = (state.comments[postId] || []).filter(item => item.id !== temporary.id); });
    },
    like(postId, on) {
      const previous = !!Store.get().postLikes[postId];
      return Store.mutate('like:' + postId,
        state => { state.postLikes[postId] = on; },
        () => this.call('like', { postId, on }), null,
        state => { state.postLikes[postId] = previous; });
    },
    async deletePost(id) { await this.call('deletePost', { id }); await Store.load(); },
    async profile(data) { await this.call('profile', data); await Store.load(); },
  };
})();
