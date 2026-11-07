'use strict';
const { randomUUID, createHash } = require('node:crypto');
const countries = require('../js/countries.js');
const accessCookie = 'ieb_access', refreshCookie = 'ieb_refresh';
const fail = (code, status = 400) => { const error = new Error(code); error.status = status; throw error; };
const districts = ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'];
const allowedPreferences = ['savedFoods','savedPlaces','recentSearches','recentFoods','notiReadAt','settings','sort','lang','langChosen'];
function config() {
  const values = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY };
  const missing = Object.keys(values).filter(key => !values[key]);
  if (missing.length) fail('db.configuration', 503);
  const url = values.SUPABASE_URL.replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) fail('db.configuration', 503);
  return { url, key: values.SUPABASE_PUBLISHABLE_KEY, secret: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, timings: [] };
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
}
function setSession(req, res, session) {
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  const suffix = `; Path=/api; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', [
    `${accessCookie}=${session?.access_token || ''}; Max-Age=${session ? session.expires_in || 3600 : 0}${suffix}`,
    `${refreshCookie}=${session?.refresh_token || ''}; Max-Age=${session ? 60 * 60 * 24 * 30 : 0}${suffix}`,
  ]);
}
async function upstream(cfg, endpoint, { token, admin = false, method = 'GET', body, headers = {}, raw = false } = {}) {
  const started = performance.now();
  try { return await upstreamRequest(cfg, endpoint, { token, admin, method, body, headers, raw }); }
  finally {
    const name = endpoint.startsWith('/auth/') ? 'auth' : endpoint.startsWith('/storage/') ? 'storage' : 'db';
    cfg.timings.push({ name, duration: performance.now() - started });
  }
}
async function upstreamRequest(cfg, endpoint, { token, admin, method, body, headers, raw }) {
  if (admin && !cfg.secret) fail('db.configuration', 503);
  const response = await fetch(cfg.url + endpoint, {
    method, signal: AbortSignal.timeout(15000),
    headers: { apikey: admin ? cfg.secret : cfg.key,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const code = data?.error_code || data?.code;
    if (code === 'email_exists' || code === 'user_already_exists') fail('auth.duplicate', 409);
    if (response.status === 429) fail('db.rateLimit', 429);
    if (response.status === 401 || ['invalid_credentials','bad_jwt','session_not_found','user_not_found','refresh_token_not_found','refresh_token_already_used'].includes(code) || (endpoint.includes('grant_type=refresh_token') && response.status === 400)) fail('auth.invalidCredentials', 401);
    if (response.status === 403 || code === '42501') fail('db.forbidden', 403);
    const error = new Error('db.failure'); error.status = 502; error.upstreamCode = code; throw error;
  }
  return data;
}
async function identity(cfg, req, res, required = false) {
  const saved = cookies(req);
  let token = saved[accessCookie];
  if (token) {
    try { return { token, user: await upstream(cfg, '/auth/v1/user', { token }) }; }
    catch (error) { if (error.status !== 401) throw error; }
  }
  if (saved[refreshCookie]) {
    let session;
    try { session = await upstream(cfg, '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: saved[refreshCookie] } }); }
    catch (error) { if (error.status !== 401) throw error; }
    if (session?.access_token) {
      const user = await upstream(cfg, '/auth/v1/user', { token: session.access_token });
      setSession(req, res, session);
      return { token: session.access_token, user };
    }
  }
  if (token || saved[refreshCookie]) setSession(req, res, null);
  if (required) fail('auth.invalidCredentials', 401);
  return { token: null, user: null };
}
const rest = (cfg, table, query = '', options) => upstream(cfg, '/rest/v1/' + table + query, options);
const checkedText = (value, min, max, code = 'db.validation') => {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(code);
  return value.trim();
};
function checkedCountry(value = 'KR') {
  if (value === null || (typeof value === 'string' && value.trim() === '')) return 'KR';
  if (!countries.isValid(value)) fail('profile.invalidCountry');
  return value;
}
const savedCountry = value => countries.isValid(value) ? value : null;
async function postingCountry(cfg, session) {
  const rows = await rest(cfg, 'ieb_profiles', '?id=eq.' + session.user.id + '&select=country_code', { token: session.token });
  if (!rows[0]) fail('db.forbidden', 403);
  return checkedCountry(rows[0].country_code);
}
function credentials(body) {
  const username = String(body.username || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{4,20}$/.test(username)) fail('auth.invalidId');
  if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 72 || !body.password.trim()) fail('auth.invalidPassword');
  return { username, password: body.password, email: username + '@accounts.ieatbusan.invalid' };
}
function applyRestaurantData(foods, restaurants) {
  const byId = new Map(foods.map(food => [food.id, food]));
  for (const row of restaurants) {
    for (const link of Array.isArray(row.food_links) ? row.food_links : []) {
      const food = byId.get(link.food_id), index = link.place_index;
      if (!food || !Number.isInteger(index) || index < 0) continue;
      const place = food.content?.places?.[index]; if (!place) continue;
      Object.assign(place, { restaurantId: row.id, name: row.name, address: row.address,
        hours: row.opening_hours, holiday: row.closed_days, phone: row.phone,
        lat: row.latitude, lng: row.longitude, likes: row.like_count || 0, imageAsset: row.image_asset || null,
        naverUrl: row.naver_url || place.naverUrl || '' });
      if (place.research) Object.assign(place.research, { name: row.name, area: row.address, hours: row.opening_hours, holiday: row.closed_days });
      for (const language of ['ko', 'en', 'zh', 'ja']) {
        const info = food.content[language]?.restaurants?.[index];
        if (info) info.area = row.address;
      }
    }
  }
}
async function snapshot(cfg, session) {
  const opts = { token: session.token };
  const [profile, preferences] = await Promise.all([
    session.user ? rest(cfg, 'ieb_profiles', '?id=eq.' + session.user.id + '&select=*', opts) : [],
    session.user ? rest(cfg, 'ieb_preferences', '?user_id=eq.' + session.user.id + '&select=data', opts) : [],
  ]);
  const current = profile[0], country = countries.normalize(current?.country_code);
  const query = '?select=*,ieb_profiles!ieb_posts_user_id_fkey(nickname,area)&order=created_at.desc&limit=500';
  const feed = current ? Promise.all([
    rest(cfg, 'ieb_posts', query + '&country_code=eq.' + country, opts),
    rest(cfg, 'ieb_posts', query + '&country_code=neq.' + country, opts),
  ]).then(([same, other]) => [...same, ...other].slice(0, 500)) : rest(cfg, 'ieb_posts', query, opts);
  const [posts, comments, foods, restaurants] = await Promise.all([
    feed,
    rest(cfg, 'ieb_comments', '?select=*,ieb_profiles(nickname)&order=created_at.asc&limit=5000', opts),
    rest(cfg, 'ieb_foods', '?select=*&order=display_order.asc,id.asc&limit=1000', opts),
    rest(cfg, 'ieb_restaurant', '?select=id,name,address,opening_hours,closed_days,phone,naver_url,latitude,longitude,food_links,like_count,image_asset&limit=1000', opts),
  ]);
  applyRestaurantData(foods, restaurants);
  const paths = [...new Set(posts.flatMap(post => post.photos))];
  let signed = [];
  if (paths.length) signed = await upstream(cfg, '/storage/v1/object/sign/ieb-community', { ...opts, method: 'POST', body: { paths, expiresIn: 3600 } });
  const images = Object.fromEntries((signed || []).filter(item => item.signedURL).map(item => [item.path, item.signedURL.startsWith('https://') ? item.signedURL : cfg.url + '/storage/v1' + item.signedURL]));
  let avatarUrl = '';
  if (current?.avatar_path) {
    try {
      const signedAvatar = await upstream(cfg, '/storage/v1/object/sign/ieb-avatars/' + current.avatar_path, { ...opts, method: 'POST', body: { expiresIn: 3600 } });
      const url = signedAvatar?.signedURL || signedAvatar?.signedUrl;
      if (url) avatarUrl = url.startsWith('https://') ? url : cfg.url + '/storage/v1' + url;
    } catch { /* A missing image must not prevent account/feed loading. */ }
  }
  const uid = session.user?.id;
  const postLikes = Object.fromEntries(posts.filter(post => uid && post.liked_user_ids?.includes(uid)).map(post => [post.id, true]));
  const foodLikes = Object.fromEntries(foods.filter(food => uid && food.liked_user_ids?.includes(uid)).map(food => [food.id, true]));
  return {
    user: current ? { id: current.id, username: current.username, provider: 'supabase', avatarUrl, nickname: current.nickname, countryCode: country, area: current.area, bio: current.bio, joined: current.created_at.slice(0, 10).replaceAll('-', '.') } : null,
    preferences: preferences[0]?.data || {}, postLikes, foodLikes,
    foods: foods.filter(food => food.content?.catalogStatus !== 'archived').map(food => ({ id: food.id, name: food.name, summary: food.summary, category: food.category, imageAsset: food.image_asset, content: food.content, likes: food.like_count })),
    posts: posts.map(post => ({ id: post.id, title: post.title, body: post.body, cat: post.category, food: post.food,
      author: post.ieb_profiles?.nickname || post.seed_author || '', area: districts[post.ieb_profiles?.area] || post.seed_area || '',
      countryCode: savedCountry(post.country_code), authorCountryCode: savedCountry(post.country_code),
      createdAt: Date.parse(post.created_at), mine: !!uid && post.user_id === uid,
      photos: post.photos.map(photo => images[photo]).filter(Boolean),
      likes: Math.max(0, (post.like_count || 0) - (postLikes[post.id] ? 1 : 0)) })),
    comments: comments.reduce((result, comment) => {
      (result[comment.post_id] ||= []).push({ id: comment.id, author: comment.ieb_profiles?.nickname || comment.seed_author || '',
        countryCode: savedCountry(comment.country_code), authorCountryCode: savedCountry(comment.country_code),
        text: comment.body, createdAt: Date.parse(comment.created_at), likes: 0, mine: !!uid && comment.user_id === uid });
      return result;
    }, {}),
  };
}
async function signup(cfg, req, body) {
  if (!cfg.secret) fail('db.configuration', 503);
  const login = credentials(body);
  const countryCode = checkedCountry(body.countryCode);
  // Fail before creating an account if the country migration has not been applied.
  await rest(cfg, 'ieb_profiles', '?select=country_code&limit=0');
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown');
  const hash = createHash('sha256').update(ip).digest('hex');
  for (const [bucket_key, max_attempts] of [['global', 60], ['ip:' + hash, 10]]) {
    const allowed = await rest(cfg, 'rpc/ieb_allow_signup', '', { admin: true, method: 'POST', body: { bucket_key, max_attempts } });
    if (!allowed) fail('db.rateLimit', 429);
  }
  await upstream(cfg, '/auth/v1/admin/users', { admin: true, method: 'POST', body: { email: login.email, password: login.password, email_confirm: true, user_metadata: { country_code: countryCode } } });
  return { username: login.username };
}
async function createPost(cfg, session, body) {
  const title = checkedText(body.title, 1, 80), text = checkedText(body.body, 1, 2000);
  if (!['review','question','free'].includes(body.cat)) fail('db.validation');
  if (body.food && (typeof body.food !== 'string' || !/^[\w-]{1,80}$/.test(body.food))) fail('db.validation');
  if (!Array.isArray(body.photos) || body.photos.length > 4) fail('db.validation');
  const countryCode = await postingCountry(cfg, session);
  const photos = [];
  try {
    for (const photo of body.photos) {
      const match = typeof photo === 'string' && photo.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
      if (!match) fail('db.validation');
      const bytes = Buffer.from(match[1], 'base64');
      if (bytes.length > 1024 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8) fail('db.photoSize');
      const name = session.user.id + '/' + randomUUID() + '.jpg';
      await upstream(cfg, '/storage/v1/object/ieb-community/' + name, { token: session.token, method: 'POST', raw: true, body: bytes, headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'false' } });
      photos.push(name);
    }
    const id = randomUUID();
    await rest(cfg, 'ieb_posts', '', { token: session.token, method: 'POST', body: { id, user_id: session.user.id, country_code: countryCode, title, body: text, category: body.cat, food: body.food || null, photos } });
    return { id };
  } catch (error) {
    if (photos.length) await upstream(cfg, '/storage/v1/object/ieb-community', { token: session.token, method: 'DELETE', body: { prefixes: photos } }).catch(() => {});
    throw error;
  }
}
async function saveProfile(cfg, session, body) {
  const nickname = checkedText(body.nickname, 2, 10, 'profile.invalid');
  if (typeof body.bio !== 'string' || body.bio.length > 30) fail('db.validation');
  const patch = { nickname, bio: body.bio }, token = session.token, uid = session.user.id;
  if (Object.hasOwn(body, 'area')) {
    if (!Number.isInteger(body.area) || body.area < 0 || body.area > 15) fail('db.validation');
    patch.area = body.area;
  }
  if (Object.hasOwn(body, 'countryCode')) patch.country_code = checkedCountry(body.countryCode);
  const changed = Object.hasOwn(body, 'avatar');
  let bytes, previous = null, uploaded = null;
  if (changed) {
    if (body.avatar !== null) {
      if (typeof body.avatar !== 'string' || body.avatar.length > 350000) fail('profile.photoInvalid');
      const match = body.avatar.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match || match[1].length % 4 !== 0) fail('profile.photoInvalid');
      bytes = Buffer.from(match[1], 'base64');
      if (bytes.length > 262144 || bytes.length < 5 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) fail('profile.photoInvalid');
    }
    const rows = await rest(cfg, 'ieb_profiles', '?id=eq.' + uid + '&select=avatar_path', { token });
    if (!rows.length) fail('db.forbidden', 403);
    previous = rows[0].avatar_path || null;
    patch.avatar_path = null;
    if (bytes) {
      uploaded = uid + '/' + randomUUID() + '.jpg';
      try {
        await upstream(cfg, '/storage/v1/object/ieb-avatars/' + uploaded, { token, method: 'POST', raw: true, body: bytes, headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'false' } });
      } catch (error) {
        await upstream(cfg, '/storage/v1/object/ieb-avatars', { token, method: 'DELETE', body: { prefixes: [uploaded] } }).catch(() => {});
        throw error;
      }
      patch.avatar_path = uploaded;
    }
  }
  try {
    await rest(cfg, 'ieb_profiles', '?id=eq.' + uid, { token, method: 'PATCH', body: patch });
  } catch (error) {
    if (uploaded) await upstream(cfg, '/storage/v1/object/ieb-avatars', { token, method: 'DELETE', body: { prefixes: [uploaded] } }).catch(() => {});
    throw error;
  }
  if (changed && previous && previous !== uploaded && previous.startsWith(uid + '/')) {
    await upstream(cfg, '/storage/v1/object/ieb-avatars', { token, method: 'DELETE', body: { prefixes: [previous] } }).catch(() => {});
  }
  return { saved: true };
}
async function action(cfg, req, res, name, body) {
  if (name === 'status') {
    await rest(cfg, 'ieb_profiles', '?select=id&limit=1');
    return { database: 'connected', signupConfigured: !!cfg.secret, version: '20261105-unified-likes' };
  }
  if (name === 'signup') return signup(cfg, req, body);
  if (name === 'login') {
    const login = credentials(body);
    const session = await upstream(cfg, '/auth/v1/token?grant_type=password', { method: 'POST', body: { email: login.email, password: login.password } });
    setSession(req, res, session);
    return { signedIn: true };
  }
  const session = await identity(cfg, req, res, !['bootstrap','logout'].includes(name));
  if (name === 'bootstrap') return snapshot(cfg, session);
  if (name === 'logout') {
    if (session.token) await upstream(cfg, '/auth/v1/logout?scope=local', { token: session.token, method: 'POST' });
    setSession(req, res, null); return { signedOut: true };
  }
  const token = session.token, uid = session.user.id;
  if (name === 'post') return createPost(cfg, session, body);
  if (name === 'comment') {
    const post_id = checkedText(body.postId, 1, 80), text = checkedText(body.text, 1, 300);
    const countryCode = await postingCountry(cfg, session);
    const rows = await rest(cfg, 'ieb_comments', '?select=id,body,created_at,country_code', { token, method: 'POST',
      headers: { Prefer: 'return=representation' }, body: { id: randomUUID(), user_id: uid, post_id, body: text, country_code: countryCode } });
    const comment = rows[0];
    return { saved: true, comment: { id: comment.id, text: comment.body, createdAt: Date.parse(comment.created_at), countryCode: savedCountry(comment.country_code), authorCountryCode: savedCountry(comment.country_code) } };
  }
  if (name === 'like') {
    const postId = checkedText(body.postId, 1, 80);
    if (typeof body.on !== 'boolean') fail('db.validation');
    await rest(cfg, 'rpc/ieb_set_post_like', '', { token, method: 'POST', body: { target_id: postId, is_liked: body.on } });
    return { saved: true };
  }
  if (name === 'foodLike') {
    const foodId = checkedText(body.foodId, 1, 80);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(foodId) || typeof body.on !== 'boolean') fail('db.validation');
    await rest(cfg, 'rpc/ieb_set_food_like', '', { token, method: 'POST', body: { target_id: foodId, is_liked: body.on } });
    return { saved: true };
  }
  if (name === 'deletePost') {
    const id = checkedText(body.id, 1, 80);
    const rows = await rest(cfg, 'ieb_posts', '?id=eq.' + encodeURIComponent(id) + '&user_id=eq.' + uid + '&select=photos', { token });
    if (!rows.length) fail('db.forbidden', 403);
    await rest(cfg, 'ieb_posts', '?id=eq.' + encodeURIComponent(id) + '&user_id=eq.' + uid, { token, method: 'DELETE' });
    if (rows[0].photos.length) await upstream(cfg, '/storage/v1/object/ieb-community', { token, method: 'DELETE', body: { prefixes: rows[0].photos } });
    return { deleted: true };
  }
  if (name === 'preferences') {
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) fail('db.validation');
    const data = Object.fromEntries(allowedPreferences.filter(key => Object.hasOwn(body.data, key)).map(key => [key, body.data[key]]));
    if (JSON.stringify(data).length > 100000) fail('db.validation');
    for (const key of ['savedFoods','savedPlaces','recentSearches','recentFoods']) {
      if (Object.hasOwn(data, key) && (!Array.isArray(data[key]) || data[key].length > 500 || data[key].some(value => typeof value !== 'string' || value.length > 200))) fail('db.validation');
    }
    if (data.lang && !['ko','en','zh','ja'].includes(data.lang)) fail('db.validation');
    if (data.sort && !['popular','name'].includes(data.sort)) fail('db.validation');
    if (Object.hasOwn(data, 'notiReadAt') && (typeof data.notiReadAt !== 'number' || !Number.isFinite(data.notiReadAt))) fail('db.validation');
    if (Object.hasOwn(data, 'langChosen') && typeof data.langChosen !== 'boolean') fail('db.validation');
    if (Object.hasOwn(data, 'settings') && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings) || Object.values(data.settings).some(value => typeof value !== 'boolean'))) fail('db.validation');
    await rest(cfg, 'ieb_preferences', '?on_conflict=user_id', { token, method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: { user_id: uid, data, updated_at: new Date().toISOString() } });
    return { saved: true };
  }
  if (name === 'profile') return saveProfile(cfg, session, body);
  if (name === 'country') {
    if (body.countryCode === undefined) fail('profile.invalidCountry');
    const countryCode = checkedCountry(body.countryCode);
    await rest(cfg, 'ieb_profiles', '?id=eq.' + uid, { token, method: 'PATCH', body: { country_code: countryCode } });
    return { saved: true };
  }
  if (name === 'deleteAccount') {
    if (!cfg.secret) fail('db.configuration', 503);
    // Verify identity above; never accept a user ID from request data.
    await upstream(cfg, '/auth/v1/logout?scope=global', { token, method: 'POST' });
    for (const bucket of ['ieb-community', 'ieb-avatars']) {
      for (;;) {
        const files = await upstream(cfg, '/storage/v1/object/list/' + bucket, { admin: true, method: 'POST', body: { prefix: uid, limit: 100 } });
        if (!files.length) break;
        await upstream(cfg, '/storage/v1/object/' + bucket, { admin: true, method: 'DELETE', body: { prefixes: files.map(file => uid + '/' + file.name) } });
      }
    }
    await upstream(cfg, '/auth/v1/admin/users/' + uid, { admin: true, method: 'DELETE' });
    setSession(req, res, null); return { deleted: true };
  }
  fail('db.notFound', 404);
}
module.exports = async function handler(req, res) {
  const started = performance.now();
  let cfg;
  function timing() {
    const entries = (cfg?.timings || []).map((entry, i) => `${entry.name}${i};dur=${entry.duration.toFixed(1)}`);
    res.setHeader('Server-Timing', [...entries, `total;dur=${(performance.now() - started).toFixed(1)}`].join(', '));
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const parsed = new URL(req.url, 'https://' + req.headers.host);
    const name = parsed.searchParams.get('action') || 'bootstrap';
    const readOnly = ['bootstrap','status'].includes(name);
    if (req.method !== (readOnly ? 'GET' : 'POST')) fail('db.notFound', 405);
    let body = {};
    if (!readOnly) {
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail('db.forbidden', 403);
      let origin;
      try { origin = new URL(req.headers.origin).host; } catch { fail('db.forbidden', 403); }
      if (origin !== req.headers.host) fail('db.forbidden', 403);
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (Buffer.byteLength(JSON.stringify(body)) > 4000000) fail('db.photoSize', 413);
    }
    cfg = config();
    const result = await action(cfg, req, res, name, body);
    timing();
    res.statusCode = 200; res.end(JSON.stringify(result));
  } catch (error) {
    timing();
    res.statusCode = error.status || 503;
    const code = /^(db|auth|profile)\./.test(error.message) ? error.message : 'db.failure';
    // Deliberately exclude credentials, tokens, upstream payloads and env values.
    res.end(JSON.stringify({ error: code }));
  }
};
