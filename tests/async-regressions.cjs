/* Dependency-free checks against exact production function source, using VM fakes.
 * Run: node tests/async-regressions.cjs [--source path/to/app.js]
 * Photo lifetimes only. Location/SDK cases now live in map-regressions.cjs and map-provider.cjs.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function extract(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `Cannot extract production ${label}; update the test boundary after refactoring.`);
  return match[1];
}
const tick = () => new Promise(resolve => setImmediate(resolve));

function photoHarness(mountSource, fileCount = 2) {
  const pending = [];
  let handler;
  let renderCalls = 0;
  const input = {
    files: Array.from({ length: fileCount }, (_, i) => ({ name: `photo-${i}.jpg` })),
    value: 'photos selected',
    addEventListener(type, listener) { if (type === 'change') handler = listener; },
  };
  const context = vm.createContext({
    document: { getElementById: () => input },
    app: { querySelectorAll: () => [] },
    cleanup: [],
    draftPhotos: [],
    resizeImage: file => new Promise((resolve, reject) => pending.push({ file, resolve, reject })),
    renderPhotos: () => { renderCalls++; },
    toast: () => {},
    t: key => key,
  });
  vm.runInContext(`var mount = ${mountSource}; mount();`, context);
  return {
    context, pending, input,
    change: () => handler(),
    get renderCalls() { return renderCalls; },
    async finish(promises) {
      let settled = false;
      const result = Promise.all(promises).then(() => { settled = true; });
      for (let turns = 0; turns < 30 && !settled; turns++) {
        for (const item of pending.splice(0)) item.resolve(`data:image/jpeg;${item.file.name}`);
        await tick();
      }
      assert.ok(settled, 'Photo processing did not settle after all mocked reads were completed.');
      await result;
    },
  };
}

async function run(source, { quiet = false } = {}) {
  const mountSource = extract(source, /V\.write\.mount = (\(\) => \{[\s\S]*?\r?\n  \});/, 'V.write.mount');
  const results = [];
  async function test(name, fn) {
    try { await fn(); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error.message }); }
  }
  await test('cancelled photo session cannot contaminate a new draft', async () => {
    const h = photoHarness(mountSource);
    const task = h.change();
    h.context.cleanup.forEach(fn => fn());
    h.context.draftPhotos = [];
    await h.finish([task]);
    assert.equal(h.context.draftPhotos.length, 0, 'An old upload added photos to the new draft.');
    assert.equal(h.renderCalls, 0, 'An inactive upload rendered the new screen.');
  });
  await test('overlapping uploads preserve the four-photo limit', async () => {
    const h = photoHarness(mountSource, 3);
    await h.finish([h.change(), h.change()]);
    assert.equal(h.context.draftPhotos.length, 4);
  });
  const failed = results.filter(result => !result.passed);
  if (!quiet) {
    for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ': ' + result.error : ''}`);
    console.log(`${results.length - failed.length}/${results.length} passed`);
  }
  return { total: results.length, passed: results.length - failed.length, failed };
}

module.exports = { run };
if (require.main === module) {
  const sourceFlag = process.argv.indexOf('--source');
  const filename = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : path.join(__dirname, '..', 'js', 'app.js');
  run(fs.readFileSync(filename, 'utf8')).then(result => { process.exitCode = result.failed.length ? 1 : 0; }).catch(error => { console.error(error); process.exitCode = 1; });
}
