'use strict';
const assert = require('node:assert/strict');
const handler = require('../api/service.js');
const draftService = require('../server/drafts.cjs');
const oldFetch = global.fetch, oldEnv = { ...process.env };
Object.assign(process.env, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-test-key' });
const uid = '11111111-1111-4111-8111-111111111111', id = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333', image = '44444444-4444-4444-8444-444444444444.jpg';
const calls = [];
let missing = false, rpcCode = null, uploadCount = 0, failUploadAt = 0;
const row = { id, user_id: uid, title: '', body: '', category: 'review', food: null, restaurant_id: null, photos: [], created_at: '2026-11-24T00:00:00Z', updated_at: '2026-11-24T00:01:00.123456Z' };
global.fetch = async (url, options = {}) => {
  const u = new URL(url), body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
  calls.push({ url: u, options, body });
  const reply = (value, status = 200) => new Response(JSON.stringify(value), { status });
  if (u.pathname === '/auth/v1/user') return reply({ id: uid });
  assert.equal(options.headers.Authorization, 'Bearer member-token', 'Draft data and files always use the member token');
  assert.equal(options.headers.apikey, 'public-test-key');
  if (u.pathname === '/rest/v1/ieb_post_drafts') {
    assert.equal(u.searchParams.get('user_id'), 'eq.' + uid);
    return reply(missing ? [] : [row]);
  }
  if (u.pathname === '/rest/v1/rpc/ieb_save_post_draft') {
    if (rpcCode) return reply({ code: rpcCode }, 400);
    Object.assign(row, { title: body.draft_title, body: body.draft_body, category: body.draft_category, photos: body.draft_photos });
    return reply(row);
  }
  if (u.pathname === '/rest/v1/rpc/ieb_publish_post_draft') return rpcCode ? reply({ code: rpcCode }, 400) : reply(id);
  if (u.pathname.startsWith('/storage/v1/object/ieb-community/')) {
    assert.ok(Buffer.isBuffer(body)); assert.equal(options.headers['x-upsert'], 'false');
    return ++uploadCount === failUploadAt ? reply({}, 500) : reply({ Key: u.pathname });
  }
  if (u.pathname === '/storage/v1/object/sign/ieb-community') return reply(body.paths.map(path => ({ path, signedURL: '/object/sign/ieb-community/' + path + '?token=test' })));
  if (u.pathname === '/storage/v1/object/ieb-community' && options.method === 'DELETE') return reply({});
  throw new Error('Unexpected upstream: ' + u.pathname);
};
async function request(action, body = {}, cookie = 'ieb_access=member-token', origin = 'https://app.test') {
  const res = { setHeader() {}, end(text) { this.data = JSON.parse(text); } };
  await handler({ url: '/api/service?action=' + action, method: 'POST', body,
    headers: { host: 'app.test', origin, cookie, 'content-type': 'application/json' } }, res);
  return res;
}
(async () => {
  try {
    for (const action of ['draftList', 'draftGet', 'draftSave', 'draftPublish']) {
      assert.equal((await request(action, {}, '')).statusCode, 401);
      const before = calls.length;
      assert.equal((await request(action, {}, 'ieb_access=member-token', 'https://attacker.test')).statusCode, 403);
      assert.equal(calls.length, before);
    }
    assert.equal((await request('draftList')).data.drafts.length, 1);
    assert.equal((await request('draftList', { offset: -1 })).statusCode, 400);
    assert.equal((await request('draftGet', { id: 'bad' })).statusCode, 400);
    row.photos = [uid + '/' + id + '/' + image];
    const loaded = await request('draftGet', { id });
    assert.equal(loaded.data.draft.photos[0].path, row.photos[0]);
    assert.match(loaded.data.draft.photos[0].url, /object\/sign/);
    missing = true; assert.equal((await request('draftGet', { id })).statusCode, 404); missing = false;
    const input = { id, title: '', body: '', cat: 'review', food: '', photos: [] };
    assert.equal((await request('draftSave', input)).statusCode, 200, 'Partial drafts are allowed');
    for (const photos of [[other + '/' + id + '/' + image], ['https://attacker.test/a.jpg'], [uid + '/../' + image], [null]]) {
      const before = uploadCount;
      assert.equal((await request('draftSave', { ...input, photos })).statusCode, 400);
      assert.equal(uploadCount, before);
    }
    const jpeg = 'data:image/jpeg;base64,' + Buffer.from([255,216,255,224,255,217]).toString('base64');
    const saved = await request('draftSave', { ...input, title: 'photo draft', photos: [jpeg] });
    assert.equal(saved.statusCode, 200);
    const path = saved.data.draft.photos[0].path;
    assert.ok(path.startsWith(uid + '/' + id + '/'));
    assert.ok(!JSON.stringify(calls.findLast(c => c.url.pathname.endsWith('/ieb_save_post_draft')).body).includes('base64'));
    assert.equal((await request('draftSave', { ...input, photos: [path], updatedAt: row.updated_at })).statusCode, 200);
    for (const [code, status, error] of [['40001',409,'db.draftConflict'], ['23514',400,'db.validation'], ['P0002',404,'db.draftNotFound']]) {
      rpcCode = code;
      const result = await request('draftPublish', { id, updatedAt: row.updated_at });
      assert.equal(result.statusCode, status); assert.equal(result.data.error, error);
    }
    rpcCode = null;
    const result = await request('draftPublish', { id, updatedAt: row.updated_at });
    assert.equal(result.data.id, id);
    assert.ok(!calls.some(c => c.url.pathname === '/rest/v1/ieb_posts'), 'Publication delegates to one atomic RPC');
    assert.ok(!calls.some(c => c.url.pathname === '/rest/v1/ieb_post_drafts' && c.options.method === 'DELETE'));
    failUploadAt = uploadCount + 2;
    assert.equal((await request('draftSave', { ...input, photos: [jpeg, jpeg] })).statusCode, 502);
    assert.equal(calls.findLast(c => c.options.method === 'DELETE').body.prefixes.length, 1, 'Partial upload failure cleans only new files');
    failUploadAt = 0; rpcCode = '40001';
    const beforeDelete = calls.filter(c => c.options.method === 'DELETE').length;
    await request('draftSave', { ...input, photos: [jpeg] });
    assert.equal(calls.filter(c => c.options.method === 'DELETE').length, beforeDelete, 'An uncertain save never removes possibly committed files');
    const paths = new Set([uid + '/old.jpg', uid + '/' + id + '/draft.jpg']);
    await draftService.removeUserImages({ cfg: {}, session: { user: { id: uid } }, bucket: 'ieb-community', upstream: async (_, endpoint, options) => {
      if (endpoint.includes('/list/')) return [...new Set([...paths].filter(path => path.startsWith(options.body.prefix + '/')).map(path => path.slice(options.body.prefix.length + 1).split('/')[0]))]
        .map(name => ({ name, id: [...paths].some(path => path === options.body.prefix + '/' + name) ? 'object' : null }));
      for (const path of options.body.prefixes) paths.delete(path);
      return [];
    } });
    assert.equal(paths.size, 0, 'Account deletion handles nested draft folders');
    console.log('PASS draft auth/CSRF, private loading, pagination, partial text, image uploads/paths, atomic publication, conflicts, safe upload failures and nested account cleanup');
  } finally { global.fetch = oldFetch; process.env = oldEnv; }
})().catch(error => { console.error(error); process.exitCode = 1; });
