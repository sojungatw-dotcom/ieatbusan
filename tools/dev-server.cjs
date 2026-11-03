/* Local API + static server. Optional secrets belong in ignored .env.local. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(root, '.env.local'))) process.loadEnvFile(path.join(root, '.env.local'));
const handler = require('../api/service.js');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/service') {
    let body = '';
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4000000) { res.writeHead(413); res.end(); return; } }
    req.body = body || undefined;
    await handler(req, res);
    return;
  }
  let name;
  try { name = decodeURIComponent(pathname); } catch { res.writeHead(400).end(); return; }
  if (name === '/') name = '/index.html';
  if (!/^\/(index\.html|(?:js|css|assets)\/)/.test(name)) { res.writeHead(404).end(); return; }
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 8779), '127.0.0.1', () => console.log('http://127.0.0.1:' + (process.env.PORT || 8779)));
