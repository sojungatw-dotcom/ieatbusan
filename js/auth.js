/* Passwords are verified by Supabase Auth through the Vercel server. */
(function () {
  'use strict';
  window.Auth = {
    async register(username, password, countryCode = 'KR') { return (await Cloud.call('signup', { username, password, countryCode })).username; },
    async verify(username, password) { await Cloud.call('login', { username, password }); return username.trim().toLowerCase(); },
  };
})();
