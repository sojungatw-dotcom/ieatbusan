/* Execute map modules in the same dependency order as the production HTML. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
module.exports = function createMapContext() {
  const root = path.resolve(__dirname, '..');
  const ctx = vm.createContext({ console }); ctx.window = ctx;
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    const file = src.split('?')[0];
    if (file === 'js/data/foods.js' || file === 'js/i18n.js' || file.startsWith('js/map/')) {
      vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
    }
  }
  return ctx;
};
