/* Local prototype auth checks: node tests/auth-regressions.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const storage = new Map();
let blocked = false;
const localStorage = {
  getItem: key => storage.get(key) || null,
  setItem(key, value) { if (blocked) throw new Error('quota'); storage.set(key, value); },
  removeItem: key => storage.delete(key),
};
function setup(crypto = webcrypto) {
  const context = vm.createContext({ crypto, TextEncoder, localStorage });
  context.window = context;
  vm.runInContext(read('js/store.js'), context);
  vm.runInContext(read('js/auth.js'), context);
  return context;
}
const expectError = (task, key) => assert.rejects(task, error => error.message === key);
(async () => {
  const view = vm.createContext({});
  view.window = view;
  vm.runInContext(read('js/i18n.js'), view);
  let language = 'ko';
  view.t = key => view.I18N[language][key];
  view.esc = value => String(value);
  view.icon = () => '';
  const appSource = read('js/app.js');
  vm.runInContext(appSource.slice(appSource.indexOf('  const V = {};'), appSource.indexOf('  V.lang =')), view);
  for (language of ['ko', 'en', 'zh', 'ja']) {
    for (const page of ['login', 'signup']) {
      const html = vm.runInContext(`V.${page}()`, view);
      assert.equal((html.match(/<input /g) || []).length, 2);
      assert.ok(html.includes('name="username"') && html.includes('name="password"'));
      assert.ok(!html.includes('undefined') && !html.includes('data-p="kakao"'));
    }
  }
  console.log('PASS login and signup have exactly two inputs in all four languages');
  let context = setup();
  let { Auth, Store } = context;
  const testPassword = 'Demo-only-Password-42';
  await expectError(() => Auth.register('abc', testPassword), 'auth.invalidId');
  await expectError(() => Auth.register('demo_one', 'short'), 'auth.invalidPassword');
  await expectError(() => Auth.register('demo_one', '        '), 'auth.invalidPassword');
  await Auth.register('Demo_One', testPassword);
  await expectError(() => Auth.register('DEMO_ONE', testPassword), 'auth.duplicate');
  await Auth.register('demo_two', testPassword);
  const accounts = Store.get().accounts;
  assert.equal(accounts.length, 2);
  assert.notEqual(accounts[0].salt, accounts[1].salt);
  assert.notEqual(accounts[0].hash, accounts[1].hash);
  assert.ok(!JSON.stringify(Store.get()).includes(testPassword));
  await expectError(() => Auth.verify('demo_one', 'incorrect-password'), 'auth.invalidCredentials');
  await expectError(() => Auth.verify('missing_user', testPassword), 'auth.invalidCredentials');
  assert.equal(await Auth.verify('DEMO_ONE', testPassword), 'demo_one');
  console.log('PASS signup validation, duplicate IDs, salted hashes, credentials');

  Store.set({ lang: 'en', langChosen: true });
  assert.ok(Store.signIn('demo_one'));
  Store.update(state => { state.savedFoods = ['milmyeon']; state.user.nickname = 'TesterOne'; });
  assert.ok(Store.signOut());
  assert.equal(Store.get().user, null);
  assert.equal(Store.get().savedFoods.length, 0);
  assert.ok(Store.signIn('demo_two'));
  assert.equal(Store.get().savedFoods.length, 0);
  Store.update(state => { state.savedFoods = ['ssiat-hotteok']; });
  assert.ok(Store.signOut());
  context = setup(); ({ Auth, Store } = context);
  assert.equal(await Auth.verify('demo_one', testPassword), 'demo_one');
  assert.ok(Store.signIn('demo_one'));
  assert.equal(Store.get().user.nickname, 'TesterOne');
  assert.equal(Store.get().savedFoods[0], 'milmyeon');
  assert.equal(Store.get().lang, 'en');
  assert.equal(Store.get().langChosen, true);
  console.log('PASS logout/reload/login preserves each account independently');

  blocked = true;
  assert.equal(Store.signOut(), false);
  assert.equal(Store.get().user.username, 'demo_one');
  await expectError(() => Auth.register('blocked_user', testPassword), 'auth.storage');
  assert.equal(Store.get().accounts.length, 2);
  blocked = false;
  assert.ok(Store.removeCurrentAccount());
  await expectError(() => Auth.verify('demo_one', testPassword), 'auth.invalidCredentials');
  assert.equal(await Auth.verify('demo_two', testPassword), 'demo_two');
  assert.ok(Store.signIn('demo_two'));
  assert.equal(Store.get().savedFoods[0], 'ssiat-hotteok');
  Store.signOut();
  Store.set({ guest: true, savedFoods: ['legacy-dish'] });
  Store.signOut();
  assert.equal(Store.get().legacyData.savedFoods[0], 'legacy-dish');
  const unsupported = setup({});
  await expectError(() => unsupported.Auth.register('crypto_missing', testPassword), 'auth.crypto');
  console.log('PASS storage failure rollback, account deletion isolation, unsupported crypto');
})().catch(error => { console.error(error); process.exitCode = 1; });
