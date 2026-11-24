'use strict';
const { randomUUID } = require('node:crypto');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fields = 'id,title,body,category,food,restaurant_id,photos,created_at,updated_at';
module.exports = async function drafts({ cfg, session, name, body, rest, upstream, fail }) {
  const token = session.token, uid = session.user.id;
  const id = body.id;
  const version = body.updatedAt || null;
  const checkedId = () => { if (typeof id !== 'string' || !uuid.test(id)) fail('db.validation'); };
  const checkedVersion = () => {
    if (version !== null && (typeof version !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(version) || !Number.isFinite(Date.parse(version)))) fail('db.validation');
  };
  async function present(row, tolerateSigningFailure = false) {
    let signed = [];
    try {
      if (row.photos.length) signed = await upstream(cfg, '/storage/v1/object/sign/ieb-community', {
        token, method: 'POST', body: { paths: row.photos, expiresIn: 3600 }
      });
    } catch (error) { if (!tolerateSigningFailure) throw error; }
    const urls = new Map((signed || []).filter(p => p.signedURL).map(p => [p.path,
      p.signedURL.startsWith('https://') ? p.signedURL : cfg.url + '/storage/v1' + p.signedURL]));
    return { id: row.id, title: row.title, body: row.body, cat: row.category, food: row.food || '',
      restaurantId: row.restaurant_id, photos: row.photos.map(path => ({ path, url: urls.get(path) || '' })),
      createdAt: row.created_at, updatedAt: row.updated_at };
  }
  async function rpc(functionName, args) {
    try { return await rest(cfg, 'rpc/' + functionName, '', { token, method: 'POST', body: args }); }
    catch (error) {
      if (['40001', '23505'].includes(error.upstreamCode)) fail('db.draftConflict', 409);
      if (error.upstreamCode === 'P0002') fail('db.draftNotFound', 404);
      if (['23514', '23503', '23502', '22P02'].includes(error.upstreamCode)) fail('db.validation');
      throw error;
    }
  }
  if (name === 'draftList') {
    const offset = body.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) fail('db.validation');
    const rows = await rest(cfg, 'ieb_post_drafts', '?user_id=eq.' + uid + '&select=id,title,category,updated_at&order=updated_at.desc,id&limit=21&offset=' + offset, { token });
    return { drafts: rows.slice(0, 20).map(row => ({ id: row.id, title: row.title, cat: row.category, updatedAt: row.updated_at })), hasMore: rows.length > 20 };
  }
  checkedId(); checkedVersion();
  if (name === 'draftPublish') {
    const result = await rpc('ieb_publish_post_draft', { target_id: id, expected_updated_at: version });
    return { id: result };
  }
  if (name === 'draftGet') {
    const rows = await rest(cfg, 'ieb_post_drafts', '?id=eq.' + id + '&user_id=eq.' + uid + '&select=' + fields, { token });
    if (!rows.length) fail('db.draftNotFound', 404);
    return { draft: await present(rows[0]) };
  }
  if (name !== 'draftSave') fail('db.notFound', 404);
  if (typeof body.title !== 'string' || body.title.length > 80 || typeof body.body !== 'string' || body.body.length > 2000
    || !['review', 'question', 'free'].includes(body.cat) || !Array.isArray(body.photos) || body.photos.length > 4) fail('db.validation');
  if (body.food && (typeof body.food !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(body.food))) fail('db.validation');
  if (body.restaurantId && (typeof body.restaurantId !== 'string' || !uuid.test(body.restaurantId) || body.cat !== 'review')) fail('db.validation');
  const prefix = uid + '/' + id + '/';
  const photoInputs = body.photos.map(photo => {
    if (typeof photo !== 'string') fail('db.validation');
    if (photo.startsWith(prefix) && uuid.test(photo.slice(prefix.length).replace(/\.(jpg|jpeg|png|webp)$/, '')) && /\.(jpg|jpeg|png|webp)$/.test(photo)) return { path: photo };
    const match = photo.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || match[1].length % 4 !== 0) fail('db.validation');
    const bytes = Buffer.from(match[1], 'base64');
    if (bytes.length > 1024 * 1024 || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) fail('db.photoSize');
    return { path: prefix + randomUUID() + '.jpg', bytes };
  });
  const uploaded = [];
  try {
    for (const photo of photoInputs) if (photo.bytes) {
      await upstream(cfg, '/storage/v1/object/ieb-community/' + photo.path, { token, method: 'POST', raw: true,
        body: photo.bytes, headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'false' } });
      uploaded.push(photo.path);
    }
  } catch (error) {
    if (uploaded.length) await upstream(cfg, '/storage/v1/object/ieb-community', { token, method: 'DELETE', body: { prefixes: uploaded } }).catch(() => {});
    throw error;
  }
  // Keep uploaded files on an uncertain RPC response: the transaction may already have committed.
  const saved = await rpc('ieb_save_post_draft', { target_id: id, draft_title: body.title, draft_body: body.body,
    draft_category: body.cat, draft_food: body.food || null, draft_restaurant_id: body.restaurantId || null,
    draft_photos: photoInputs.map(photo => photo.path), expected_updated_at: version });
  const row = Array.isArray(saved) ? saved[0] : saved;
  return { draft: await present(row, true) };
};

// Storage folders are virtual; account deletion must descend into draft folders.
module.exports.removeUserImages = async function removeUserImages({ cfg, session, bucket, upstream }) {
  async function empty(prefix) {
    for (;;) {
      const rows = await upstream(cfg, '/storage/v1/object/list/' + bucket, { admin: true, method: 'POST', body: { prefix, limit: 100 } });
      if (!rows.length) return;
      for (const row of rows) if (!row.name || row.name === '.' || row.name === '..' || /[\\/]/.test(row.name)) throw new Error('db.failure');
      for (const row of rows.filter(row => row.id === null)) await empty(prefix + '/' + row.name);
      const paths = rows.filter(row => row.id !== null).map(row => prefix + '/' + row.name);
      if (paths.length) await upstream(cfg, '/storage/v1/object/' + bucket, { admin: true, method: 'DELETE', body: { prefixes: paths } });
    }
  }
  await empty(session.user.id);
};
