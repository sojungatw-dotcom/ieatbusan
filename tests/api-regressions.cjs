'use strict';
const assert = require('node:assert/strict');
const handler = require('../api/service.js');
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-value';
process.env.SUPABASE_SECRET_KEY = 'server-secret-test-value';
const uid = '11111111-1111-4111-8111-111111111111';
const calls = [];
let wrongPassword = false, duplicate = false, expired = false, foreignPost = false;
global.fetch = async (url, options = {}) => {
  const path = new URL(url).pathname;
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
  calls.push({ path, url, ...options, parsed: body });
  const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
  if (path === '/auth/v1/user') {
    if (!options.headers.Authorization || (expired && options.headers.Authorization === 'Bearer expired')) return reply({}, 401);
    return reply({ id: uid });
  }
  if (path === '/auth/v1/token') {
    if (wrongPassword) return reply({ code: 'invalid_credentials' }, 400);
    return reply({ access_token: 'verified-access', refresh_token: 'verified-refresh', expires_in: 3600 });
  }
  if (path === '/auth/v1/admin/users') return duplicate ? reply({ code: 'email_exists' }, 422) : reply({ user: { id: uid } });
  if (path === '/rest/v1/rpc/ieb_allow_signup') return reply(true);
  if (path === '/rest/v1/ieb_profiles') return reply([{ id: uid, username: 'tester', nickname: 'Tester', area: 8, bio: '', created_at: '2026-11-03T00:00:00Z' }]);
  if (path === '/rest/v1/ieb_preferences') return reply([]);
  if (path === '/rest/v1/ieb_posts' && options.method === 'GET') {
    const select = new URL(url).searchParams.get('select');
    // Likes also link posts to profiles; an implicit author join is ambiguous.
    if (select?.includes('ieb_profiles(')) return reply({ code: 'PGRST201' }, 300);
    return reply([]);
  }
  if (path === '/rest/v1/ieb_comments' || path === '/rest/v1/ieb_foods') return reply([]);
  if (path === '/auth/v1/logout' || path.startsWith('/rest/v1/')) return reply({});
  throw new Error('Unexpected upstream endpoint: ' + path);
};
async function request(action, body, { cookie = '', origin = 'https://site.vercel.app' } = {}) {
  const headers = {};
  const res = { setHeader(key, value) { headers[key] = value; }, end(value) { this.body = JSON.parse(value); } };
  await handler({ url: '/api/service?action=' + action, method: body === undefined ? 'GET' : 'POST', body,
    headers: { host: 'site.vercel.app', origin, cookie, 'content-type': 'application/json', 'x-forwarded-proto': 'https' } }, res);
  return { status: res.statusCode, data: res.body, headers };
}
(async () => {
  const before = calls.length;
  assert.equal((await request('signup', { username: 'tester', password: 'test-password' }, { origin: 'https://attacker.invalid' })).status, 403);
  assert.equal(calls.length, before);
  assert.equal((await request('comment', { postId: 'p1', text: 'hi' })).status, 401);
  assert.equal((await request('signup', { username: 'x', password: 'test-password' })).status, 400);
  assert.equal((await request('signup', { username: 'tester', password: 'short' })).status, 400);
  const registration = await request('signup', { username: 'TESTER', password: 'test-password' });
  assert.equal(registration.status, 200);
  const create = calls.find(call => call.path === '/auth/v1/admin/users');
  assert.equal(create.parsed.email, 'tester@accounts.ieatbusan.invalid');
  assert.equal(create.headers.apikey, process.env.SUPABASE_SECRET_KEY);
  assert.ok(!JSON.stringify(registration).includes('test-password'));
  duplicate = true;
  assert.equal((await request('signup', { username: 'tester', password: 'test-password' })).status, 409);
  duplicate = false;
  wrongPassword = true;
  assert.equal((await request('login', { username: 'tester', password: 'test-password' })).status, 401);
  wrongPassword = false;
  const login = await request('login', { username: 'tester', password: 'test-password' });
  assert.equal(login.status, 200);
  assert.ok(login.headers['Set-Cookie'].every(cookie => cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax') && cookie.includes('Secure')));
  assert.ok(!JSON.stringify(login.data).includes('verified-access'));
  const cookie = 'ieb_access=verified-access; ieb_refresh=verified-refresh';
  const data = await request('bootstrap', undefined, { cookie });
  assert.equal(data.data.user.id, uid);
  assert.ok(!JSON.stringify(data.data).includes('server-secret'));
  assert.equal(data.headers['Cache-Control'], 'no-store');
  await request('post', { user_id: 'spoofed', title: 'Test', body: 'body', cat: 'review', photos: [] }, { cookie });
  const post = calls.find(call => call.path === '/rest/v1/ieb_posts' && call.method === 'POST');
  assert.equal(post.parsed.user_id, uid);
  assert.equal(post.headers.Authorization, 'Bearer verified-access');
  assert.equal(post.headers.apikey, process.env.SUPABASE_PUBLISHABLE_KEY);
  assert.equal((await request('deletePost', { id: 'someone-elses-post' }, { cookie })).status, 403);
  await request('preferences', { data: { savedFoods: ['milmyeon'], user: { id: 'spoofed' }, password: 'never-save' } }, { cookie });
  const prefs = calls.find(call => call.path === '/rest/v1/ieb_preferences' && call.method === 'POST');
  assert.equal(prefs.parsed.user_id, uid);
  assert.deepEqual(Object.keys(prefs.parsed.data), ['savedFoods']);
  expired = true;
  const renewed = await request('bootstrap', undefined, { cookie: 'ieb_access=expired; ieb_refresh=verified-refresh' });
  assert.equal(renewed.status, 200);
  assert.ok(renewed.headers['Set-Cookie'][0].includes('verified-access'));
  assert.equal((await request('logout', {}, { cookie })).headers['Set-Cookie'][0].includes('Max-Age=0'), true);
  delete process.env.SUPABASE_URL;
  assert.equal((await request('status')).data.error, 'db.configuration');
  console.log('PASS CSRF, validation, signup, duplicate ID, login, HttpOnly cookies, verified identity, RLS tokens, owner checks, preferences allowlist, refresh, logout, missing env');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.fetch = originalFetch;
  for (const name of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) {
    if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name];
  }
});
