'use strict';
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.UI_AUDIT_URL || 'http://127.0.0.1:8779';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      let published = false, failPost = false, failSave = false, saves = 0;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('ieatbusan.ui.v2', JSON.stringify({ lang: 'ko', langChosen: true })));
      // Synthetic member; all API traffic is intercepted, with no real DB writes.
      await page.route('**/api/service?*', route => {
        const action = new URL(route.request().url()).searchParams.get('action');
        if (action === 'draftSave') {
          saves++;
          return route.fulfill({ status: failSave ? 503 : 200, contentType: 'application/json', body: JSON.stringify(failSave
            ? { error: 'db.failure' }
            : { draft: { ...route.request().postDataJSON(), photos: [], updatedAt: '2026-11-24T00:00:00Z' } }) });
        }
        if (action === 'draftPublish') {
          if (!failPost) published = true;
          return route.fulfill({ status: failPost ? 503 : 200, contentType: 'application/json', body: JSON.stringify(failPost ? { error: 'db.failure' } : { id: 'fixture-post' }) });
        }
        return route.fulfill({ status: action === 'bootstrap' ? 200 : 503, contentType: 'application/json', body: JSON.stringify(action === 'bootstrap'
          ? { user: { id: 'fixture-only', nickname: '검증', username: 'fixture', countryCode: 'KR', area: 8, joined: '2026-11-24' }, preferences: {}, posts: published ? [{ id: 'fixture-post', author: '검증', countryCode: 'KR', title: '게시 검증', body: '게시 본문', cat: 'review', photos: [], likes: 0, mine: true, createdAt: Date.now() }] : [], comments: {}, postLikes: {}, foodLikes: {} }
          : { error: 'db.failure' }) });
      });
      const home = () => page.locator('.tabbar a.tab[href="#/home"]');
      const dialog = page.locator('.write-leave-dialog');
      const enter = async () => {
        await page.locator('a[href="#/community"]').first().click();
        await page.locator('a[href="#/write"]').first().click();
        await page.locator('#write-form').waitFor();
      };
      const cancel = async () => {
        await dialog.waitFor({ state: 'visible' });
        await dialog.getByRole('button', { name: '취소', exact: true }).click();
        await page.waitForFunction(() => location.hash === '#/write');
      };
      const confirm = async hash => {
        await dialog.waitFor({ state: 'visible' });
        await dialog.getByRole('button', { name: '확인', exact: true }).click();
        await page.waitForFunction(hash => location.hash === hash && !document.querySelector('#write-form'), hash);
      };
      await page.goto(base + '/#/community');
      await page.locator('a[href="#/write"]').first().click();
      await page.locator('#w-title').fill('작성하던 제목');
      await page.locator('#w-body').fill('작성하던 본문');
      await page.locator('#w-food').selectOption({ index: 1 });
      await page.evaluate(() => window.__originalWriteForm = document.querySelector('#write-form'));
      await home().click(); await cancel();
      assert.equal(await page.locator('#w-title').inputValue(), '작성하던 제목');
      assert.equal(await page.locator('#w-body').inputValue(), '작성하던 본문');
      assert.equal(await page.evaluate(() => __originalWriteForm === document.querySelector('#write-form')), true);
      await home().click(); await confirm('#/home');
      await enter();
      await home().click();
      await page.waitForFunction(() => location.hash === '#/home' && !document.querySelector('#write-form'));
      assert.equal(await dialog.isVisible(), false, 'An untouched editor leaves without a warning');
      await enter();
      await page.locator('#w-body').fill('뒤로가기 검증');
      await page.evaluate(() => history.back()); await cancel();
      assert.equal(await page.locator('#w-body').inputValue(), '뒤로가기 검증');
      await page.evaluate(() => history.back()); await confirm('#/community');
      await enter();
      await page.locator('#w-title').fill('닫기 버튼 검증');
      const closeEditor = () => page.getByRole('button', { name: '글쓰기 닫기' }).click();
      const saveAndLeave = () => dialog.getByRole('button', { name: '저장하고 나가기' }).click();
      await closeEditor();
      await dialog.getByText('임시저장하시겠습니까?').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#w-title').inputValue(), '닫기 버튼 검증');
      await closeEditor();
      await dialog.getByRole('button', { name: '저장 안 하고 나가기' }).click();
      await page.waitForFunction(() => location.hash === '#/community' && !document.querySelector('#write-form'));
      assert.equal(saves, 0);
      await page.locator('a[href="#/write"]').first().click();
      await page.locator('#w-title').fill('임시저장 후 닫기');
      failSave = true;
      await closeEditor(); await saveAndLeave();
      await page.waitForFunction(() => !document.querySelector('[data-act="closeWrite"]').dataset.saving);
      assert.equal(await page.locator('#w-title').inputValue(), '임시저장 후 닫기');
      failSave = false;
      await closeEditor(); await saveAndLeave();
      await page.waitForFunction(() => location.hash === '#/community' && !document.querySelector('#write-form'));
      assert.equal(saves, 2);
      await enter();
      await page.locator('#w-food').selectOption({ index: 1 });
      await home().click(); await cancel();
      assert.notEqual(await page.locator('#w-food').inputValue(), '', 'Keep food tags on cancel');
      await home().click(); await confirm('#/home');
      await enter();
      await page.locator('input[name="cat"][value="question"]').check({ force: true });
      await home().click(); await cancel();
      assert.equal(await page.locator('input[name="cat"][value="question"]').isChecked(), true);
      await home().click(); await confirm('#/home');
      await enter();
      await page.locator('#w-photos').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5XcAAAAASUVORK5CYII=', 'base64') });
      await page.locator('.photo-prev').waitFor();
      await home().click(); await cancel();
      assert.equal(await page.locator('.photo-prev').count(), 1, 'Photo-only drafts remain intact');
      await home().click(); await confirm('#/home');
      await enter();
      await page.locator('#w-title').fill('새로고침 검증');
      assert.equal(await page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event); return event.defaultPrevented;
      }), true, 'Reload and tab close invoke the browser leave warning');
      await home().click(); await dialog.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => location.hash === '#/write');
      assert.equal(await page.locator('#w-title').inputValue(), '새로고침 검증');
      await page.locator('#w-body').fill('게시 본문');
      failPost = true;
      await page.locator('.write-submit').click();
      await page.waitForFunction(() => !document.querySelector('#write-form').dataset.submitting);
      assert.equal(await page.locator('#w-body').inputValue(), '게시 본문', 'Failed publication preserves leave protection');
      failPost = false;
      await page.locator('.write-submit').click();
      await page.waitForFunction(() => location.hash === '#/post/fixture-post');
      assert.equal(await dialog.isVisible(), false, 'Successful publication does not ask to discard');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: menu/back/close, cancel/Escape, text/tags/category/photos, native unload warning, blank editor, failed and successful publication`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
