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
    listDrafts(offset = 0) { return this.call('draftList', { offset }); },
    getDraft(id) { return this.call('draftGet', { id }); },
    saveDraft(data) { return this.call('draftSave', data); },
    publishDraft(id, updatedAt) { return this.call('draftPublish', { id, updatedAt }); },
    comment(postId, text) {
      const user = Store.get().user;
      const temporary = { id: 'pending-' + crypto.randomUUID(), author: user.nickname, text,
        createdAt: Date.now(), likes: 0, mine: true, pending: true, countryCode: user.countryCode, authorCountryCode: user.countryCode };
      return Store.mutate('comment:' + postId,
        state => { (state.comments[postId] ||= []).push(temporary); },
        () => this.call('comment', { postId, text }),
        (state, result) => {
          const list = state.comments[postId] || [], index = list.findIndex(item => item.id === temporary.id);
          if (index >= 0) list[index] = { ...temporary, ...result.comment, pending: false };
        },
        state => { state.comments[postId] = (state.comments[postId] || []).filter(item => item.id !== temporary.id); });
    },
    editComment(postId, id, text) {
      const previous = Store.get().comments[postId]?.find(item => item.id === id)?.text;
      return Store.mutate('commentChange:' + id,
        state => { const item = state.comments[postId]?.find(item => item.id === id); if (item) item.text = text; },
        () => this.call('editComment', { postId, id, text }),
        (state, result) => { const item = state.comments[postId]?.find(item => item.id === id); if (item) item.text = result.text; },
        state => { const item = state.comments[postId]?.find(item => item.id === id); if (item) item.text = previous; });
    },
    deleteComment(postId, id) {
      const list = Store.get().comments[postId] || [], index = list.findIndex(item => item.id === id), previous = list[index];
      return Store.mutate('commentChange:' + id,
        state => { state.comments[postId] = (state.comments[postId] || []).filter(item => item.id !== id); },
        () => this.call('deleteComment', { postId, id }), null,
        state => { if (previous) (state.comments[postId] ||= []).splice(index, 0, previous); });
    },
    like(postId, on) {
      const previous = !!Store.get().postLikes[postId];
      return Store.mutate('like:' + postId,
        state => { state.postLikes[postId] = on; },
        () => this.call('like', { postId, on }), null,
        state => { state.postLikes[postId] = previous; });
    },
    foodLike(foodId, on) {
      const before = Store.get(), previous = !!before.foodLikes[foodId];
      const savedIndex = before.savedFoods.indexOf(foodId);
      const food = before.foods?.find(item => item.id === foodId) || window.FOODS?.find(item => item.id === foodId);
      const count = food?.likes || 0;
      return Store.mutate('foodLike:' + foodId,
        state => {
          if (on) state.foodLikes[foodId] = true; else delete state.foodLikes[foodId];
          if (food) food.likes = Math.max(0, count + (Number(on) - Number(previous)));
          state.savedFoods = on ? [foodId, ...state.savedFoods.filter(id => id !== foodId)] : state.savedFoods.filter(id => id !== foodId);
        },
        () => this.call('foodLike', { foodId, on }),
        () => Store.save(),
        state => {
          if (previous) state.foodLikes[foodId] = true; else delete state.foodLikes[foodId];
          if (food) food.likes = count;
          // Restore only this item's membership; keep unrelated in-flight edits.
          state.savedFoods = state.savedFoods.filter(id => id !== foodId);
          if (savedIndex >= 0) state.savedFoods.splice(savedIndex, 0, foodId);
          Store.save();
        });
    },
    restaurantLike(restaurantId, on) {
      const state=Store.get(), previous=!!state.restaurantLikes?.[restaurantId];
      const known=new Set(), refs=new Set();
      for(const food of [...(state.foods||[]).map(row=>({id:row.id,places:row.content?.places||[]})),...(window.FOODS||[])]) {
        (food.places||[]).forEach((place,index)=>{if(place.restaurantId===restaurantId){known.add(food.id+':'+index);refs.add(place);}});
      }
      const original=new Map([...refs].map(p=>[p,p.likes||0])), saved=new Set(state.savedPlaces);
      function count(value){for(const p of refs)p.likes=value;}
      return Store.mutate('restaurantLike:'+restaurantId,
        s=>{s.restaurantLikes||={};if(on)s.restaurantLikes[restaurantId]=true;else delete s.restaurantLikes[restaurantId];
          for(const [p,n] of original)p.likes=Math.max(0,n+Number(on)-Number(previous));
          s.savedPlaces=[...(on?known:[]),...s.savedPlaces.filter(k=>!known.has(k))];},
        ()=>this.call('restaurantLike',{restaurantId,on}),
        (s,result)=>{if(Number.isInteger(result?.likes))count(result.likes);Store.save();},
        s=>{if(previous)s.restaurantLikes[restaurantId]=true;else delete s.restaurantLikes[restaurantId];
          for(const [p,n] of original)p.likes=n;
          s.savedPlaces=[...[...known].filter(k=>saved.has(k)),...s.savedPlaces.filter(k=>!known.has(k))];Store.save();});
    },
    async deletePost(id) { await this.call('deletePost', { id }); await Store.load(); },
    async profile(data) { await this.call('profile', data); await Store.load(); },
    async country(countryCode) { await this.call('country', { countryCode }); await Store.load(); },
  };
})();
