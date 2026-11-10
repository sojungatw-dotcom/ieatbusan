'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function harness(host = 'ieatbusan-eight.vercel.app') {
  const scripts = [];
  const ctx = vm.createContext({ URL, location: { hostname: host, origin: 'https://' + host, hash: '#/home' },
    document: { referrer: 'https://example.org/start?email=private@example.org#secret',
      createElement: () => ({}), head: { appendChild: element => scripts.push(element) } } });
  ctx.window = ctx;
  vm.runInContext(read('js/analytics.js'), ctx);
  const commands = () => Array.from(ctx.dataLayer, command => Array.from(command));
  const events = name => commands().filter(command => command[0] === 'event' && (!name || command[1] === name));
  return { ctx, scripts, commands, events, analytics: ctx.IEBAnalytics };
}
(async () => {
  const h = harness(), { ctx, analytics } = h;
  analytics.view('home');
  assert.equal(h.events().length, 0, 'Wait for verified bootstrap rather than misclassifying a restored session');
  analytics.identity(null);
  analytics.view('home');
  assert.equal(h.events('page_view').length, 1);
  assert.equal(h.events()[0][2].login_status, 'guest');
  assert.equal(h.scripts.length, 1);
  assert.match(h.scripts[0].src, /G-8S5WRPX8S9$/);
  const config = h.commands().find(c => c[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(h.commands().find(c => c[0] === 'set')[1].page_referrer, 'https://example.org/start');
  assert.ok(!Object.hasOwn(config, 'user_id') && !Object.hasOwn(config, 'login_status'), 'Mutable identity uses global settings, not overriding config scope');
  analytics.view('home');
  assert.equal(h.events('page_view').length, 1, 'Rerenders are not visits');
  ctx.location.hash = '#/post/abc-123';
  analytics.view('post', { id: 'abc-123' }, { validContent: true, category: 'review' });
  analytics.view('post', { id: 'abc-123' }, { validContent: true, category: 'review' });
  assert.equal(h.events('post_view').length, 1, 'Like/comment rerenders must not add post views');
  assert.equal(h.events('post_view')[0][2].post_id, 'abc-123');
  assert.equal(h.events('post_view')[0][2].post_category, 'review');
  assert.equal(h.events('page_view').at(-1)[2].page_referrer, 'https://ieatbusan-eight.vercel.app/home');
  ctx.location.hash = '#/community'; analytics.view('community');
  ctx.location.hash = '#/post/abc-123'; analytics.view('post', { id: 'abc-123' }, { validContent: true });
  assert.equal(h.events('post_view').length, 2, 'Returning to a post counts a new visit');
  ctx.location.hash = '#/post/missing'; analytics.view('post', { id: 'missing' });
  assert.equal(h.events('post_view').length, 2, 'Missing posts do not count as content views');
  analytics.identity({ id: 'internal-uuid', username: 'PrivateUsername', nickname: 'PrivateNickname' });
  analytics.auth('login');
  assert.equal(h.events('login')[0][2].login_status, 'logged_in');
  const setting = h.commands().filter(c => c[0] === 'set' && Object.hasOwn(c[1], 'user_id')).at(-1);
  assert.equal(setting[1].user_id, 'internal-uuid');
  analytics.identity(null); analytics.auth('logout');
  assert.equal(h.commands().filter(c => c[0] === 'set' && Object.hasOwn(c[1], 'user_id')).at(-1)[1].user_id, null);
  assert.equal(h.events('logout')[0][2].login_status, 'guest');
  ctx.location.hash = '#/results/private@example.org'; analytics.view('results', { q: 'private@example.org', tab: 'posts' });
  assert.equal(h.events('page_view').at(-1)[2].page_location, 'https://ieatbusan-eight.vercel.app/results/posts');
  const serialized = JSON.stringify(h.commands());
  for (const secret of ['PrivateUsername', 'PrivateNickname', 'private@example.org', '#secret']) assert.ok(!serialized.includes(secret), 'Must not send ' + secret);
  const restored = harness();
  restored.analytics.identity({ id: 'restored-uuid' }); restored.analytics.view('home');
  assert.equal(restored.events('page_view')[0][2].login_status, 'logged_in');
  const local = harness('localhost'); local.analytics.identity(null); local.analytics.view('home'); local.analytics.auth('sign_up');
  assert.equal(local.events().length, 0, 'Local/preview visits must not pollute production KPIs');
  // Exercise real Store session hydration and clearing, including a failed post-logout refresh.
  let loggedIn = true, failBootstrap = false;
  ctx.localStorage = { getItem: () => null, setItem: () => {} };
  ctx.SEED = { posts: [] };
  ctx.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
  ctx.dispatchEvent = () => {};
  ctx.Cloud = { call: async action => {
    if (action === 'logout' || action === 'deleteAccount') loggedIn = false;
    if (action === 'bootstrap') {
      if (failBootstrap) throw new Error('offline');
      return { user: loggedIn ? { id: 'session-uuid' } : null, preferences: {}, posts: [], comments: {}, postLikes: {} };
    }
    return {};
  } };
  vm.runInContext(read('js/store.js'), ctx);
  await ctx.Store.load(); analytics.auth('login');
  assert.equal(h.events('login').at(-1)[2].login_status, 'logged_in');
  failBootstrap = true;
  await assert.rejects(ctx.Store.signOut(), /offline/);
  assert.equal(h.commands().filter(c => c[0] === 'set' && Object.hasOwn(c[1], 'user_id')).at(-1)[1].user_id, null);
  console.log('PASS GA4 restored sessions, anonymous/authenticated visits, logout identity clearing, post revisit/rerender/missing cases, sanitized URLs, single tag and production-only collection');
})().catch(error => { console.error(error); process.exitCode = 1; });
