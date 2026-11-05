/* Browser-restricted Google Maps key only. Never return server credentials. */
'use strict';
module.exports = function mapsConfig(req, res, env = process.env) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.statusCode = 405; res.end(JSON.stringify({ error: 'map.sdkUnavailable' })); return; }
  const apiKey = String(env.GOOGLE_MAPS_BROWSER_KEY || '').trim();
  if (!apiKey) { res.statusCode = 503; res.end(JSON.stringify({ error: 'map.keyMissing' })); return; }
  res.statusCode = 200;
  res.end(JSON.stringify({ apiKey, mapId: String(env.GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID').trim() || 'DEMO_MAP_ID' }));
};
