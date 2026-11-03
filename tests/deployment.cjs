/* Run after node tools/build-static.cjs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
assert.equal(config.framework, null);
assert.equal(config.outputDirectory, 'dist');
assert.equal(config.buildCommand, 'node tools/build-static.cjs');
assert.deepEqual(fs.readdirSync(out).sort(), ['assets', 'css', 'index.html', 'js']);
assert.equal(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(out, 'js/data/foods.js'), 'utf8'), context);
for (const food of context.window.FOODS) {
  assert.ok(fs.statSync(path.join(out, 'assets/food', food.id + '.jpg')).size > 0, food.id + ' photo missing');
}
for (const file of ['js/auth.js', 'js/store.js', 'js/app.js', 'css/app.css', 'assets/icon.svg']) {
  assert.ok(fs.statSync(path.join(out, file)).size > 0, file + ' missing');
}
console.log('PASS Vercel config, production file allowlist, script/style assets and all food images');
