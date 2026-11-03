/* Passwords are verified by Supabase Auth through the Vercel server. */
(function () {
  'use strict';
  window.Auth = {
    async register(username, password) { return (await Cloud.call('signup', { username, password })).username; },
    async verify(username, password) { await Cloud.call('login', { username, password }); return username.trim().toLowerCase(); },
  };
})();
