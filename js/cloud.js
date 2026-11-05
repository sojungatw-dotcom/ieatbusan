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
    async comment(postId, text) { await this.call('comment', { postId, text }); await Store.load(); },
    async like(postId, on) { await this.call('like', { postId, on }); await Store.load(); },
    async foodLike(foodId, on) { await this.call('foodLike', { foodId, on }); await Store.load(); },
    async deletePost(id) { await this.call('deletePost', { id }); await Store.load(); },
    async profile(data) { await this.call('profile', data); await Store.load(); },
    async country(countryCode) { await this.call('country', { countryCode }); await Store.load(); },
  };
})();
