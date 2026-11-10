/* Vercel static deployment: no dependencies or framework installation. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const entries = ['index.html', 'admin.html', 'css', 'js', 'assets', 'chatbot'];
// Validate source files before replacing an existing generated directory.
const html = ['index.html','admin.html'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  if (/^(?:https?:|data:|#)/.test(url)) continue;
  const relative = url.split(/[?#]/)[0];
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
    throw new Error('Missing or invalid local asset: ' + relative);
  }
}
function verifyScripts(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) verifyScripts(file);
    else if (entry.name.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  }
}
verifyScripts(path.join(root, 'js'));
verifyScripts(path.join(root, 'api'));
verifyScripts(path.join(root, 'chatbot'));
for (const file of ['server/backend.cjs','server/admin.cjs']) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'));
if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('Refusing to replace a directory outside the project dist folder.');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const entry of entries) fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
console.log('Static site ready: dist/ (index.html, css/, js/, assets/)');
