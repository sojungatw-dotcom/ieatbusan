'use strict';
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.UI_AUDIT_URL || 'http://127.0.0.1:8779';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], drafts = new Map(), posts = new Map(), objects = new Map();
      let failSave = false, failPublish = false, sequence = 0, saveCalls = 0;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('ieatbusan.ui.v2', JSON.stringify({ lang: 'ko', langChosen: true })));
      // All API traffic stays inside this synthetic fixture; never writes to Supabase.
      await page.route('**/api/service?*', async route => {
        const action = new URL(route.request().url()).searchParams.get('action');
        const input = route.request().postDataJSON() || {};
        const reply = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
        if (action === 'bootstrap') return reply({ user: { id: 'fixture', nickname: '검증', countryCode: 'KR', area: 8, joined: '2026-11-24' }, preferences: {}, posts: [...posts.values()], comments: {}, postLikes: {}, foodLikes: {} });
        if (action === 'draftList') {
          const list = [...drafts.values()].reverse();
          return reply({ drafts: list.slice(input.offset, input.offset + 20), hasMore: list.length > input.offset + 20 });
        }
        if (action === 'draftGet') return drafts.has(input.id) ? reply({ draft: drafts.get(input.id) }) : reply({ error: 'db.draftNotFound' }, 404);
        if (action === 'draftSave') {
          saveCalls++;
          if (failSave) return reply({ error: 'db.failure' }, 503);
          const previous = drafts.get(input.id);
          if (previous && previous.updatedAt !== input.updatedAt) return reply({ error: 'db.draftConflict' }, 409);
          const draft = { ...input, photos: input.photos.map((photo, i) => {
            const path = photo.startsWith('data:') ? 'fixture/' + input.id + '/' + i + '.jpg' : photo;
            if (photo.startsWith('data:')) objects.set(path, photo);
            return { path, url: objects.get(path) };
          }), updatedAt: new Date(1795478400000 + ++sequence * 1000).toISOString() };
          drafts.set(input.id, draft); return reply({ draft });
        }
        if (action === 'draftPublish') {
          if (failPublish) return reply({ error: 'db.failure' }, 503);
          if (posts.has(input.id)) return reply({ id: input.id });
          const draft = drafts.get(input.id);
          if (!draft || draft.updatedAt !== input.updatedAt) return reply({ error: 'db.draftConflict' }, 409);
          posts.set(input.id, { ...draft, author: '검증', countryCode: 'KR', area: '부산', createdAt: Date.now(), mine: true, likes: 0, photos: draft.photos.map(photo => photo.url) });
          drafts.delete(input.id); return reply({ id: input.id });
        }
        return reply({ error: 'db.failure' }, 503);
      });
      const save = () => page.locator('[data-act="saveWriteDraft"]');
      const load = () => page.locator('[data-act="listWriteDrafts"]');
      const home = () => page.locator('.tabbar a.tab[href="#/home"]');
      const enter = async () => { await page.locator('a[href="#/community"]').first().click(); await page.locator('a[href="#/write"]').first().click(); await page.locator('#write-form').waitFor(); };
      const waitIdle = () => page.waitForFunction(() => !document.querySelector('#write-form').inert && !document.querySelector('[data-act="saveWriteDraft"]').dataset.saving && !document.querySelector('#write-form').dataset.submitting);
      await page.goto(base + '/#/write');
      await save().click(); await waitIdle();
      assert.equal(drafts.size, 1, 'Blank drafts can be saved');
      await page.locator('#w-title').fill('<draft title>');
      await page.locator('#w-body').fill('사진이 있는 본문');
      await page.locator('input[name="cat"][value="free"]').check({ force: true });
      await page.locator('#w-food').selectOption({ index: 1 });
      await page.locator('#w-photos').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5XcAAAAASUVORK5CYII=', 'base64') });
      await page.locator('.photo-prev').waitFor();
      await save().click(); await waitIdle();
      assert.equal(drafts.size, 1, 'Saving an existing draft updates the same ID');
      const id = [...drafts.keys()][0];
      assert.equal(drafts.get(id).photos.length, 1);
      assert.ok(!drafts.get(id).photos[0].path.includes('base64'));
      await home().click(); await page.waitForFunction(() => location.hash === '#/home');
      assert.equal(await page.locator('.write-leave-dialog').isVisible(), false, 'A saved draft can leave safely');
      await enter(); await load().click();
      if (process.env.DRAFT_SCREENSHOT_DIR) {
        require('node:fs').mkdirSync(process.env.DRAFT_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: require('node:path').join(process.env.DRAFT_SCREENSHOT_DIR, 'draft-list-' + width + '.png'), animations: 'disabled' });
      }
      await page.locator('.write-draft-row').first().click();
      await page.waitForFunction(() => document.querySelector('#w-title').value === '<draft title>');
      assert.equal(await page.locator('#w-body').inputValue(), '사진이 있는 본문');
      assert.equal(await page.locator('.photo-prev').count(), 1);
      assert.equal(await page.locator('input[name="cat"][value="free"]').isChecked(), true);
      assert.equal(await page.locator('[data-cat-chip].active').count(), 1);
      assert.equal(await page.locator('[data-cat-chip].active input').inputValue(), 'free');
      assert.notEqual(await page.locator('#w-food').inputValue(), '');
      if (process.env.DRAFT_SCREENSHOT_DIR) await page.screenshot({ path: require('node:path').join(process.env.DRAFT_SCREENSHOT_DIR, 'draft-editor-' + width + '.png'), animations: 'disabled' });
      await page.locator('#w-body').fill('저장하지 않은 변경');
      await load().click(); await page.locator('.write-draft-row').first().click();
      let confirm = page.locator('.write-leave-dialog');
      await confirm.getByRole('button', { name: '취소', exact: true }).click();
      assert.equal(await page.locator('#w-body').inputValue(), '저장하지 않은 변경');
      await page.locator('.write-draft-row').first().click();
      await confirm.getByRole('button', { name: '확인', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#w-body').value === '사진이 있는 본문');
      failSave = true; await page.locator('#w-body').fill('저장 실패 후 보존');
      await save().click(); await waitIdle();
      assert.equal(drafts.get(id).body, '사진이 있는 본문');
      assert.equal(await page.locator('#w-body').inputValue(), '저장 실패 후 보존');
      failSave = false; failPublish = true;
      await page.locator('.write-submit').click(); await waitIdle();
      assert.equal(drafts.get(id).body, '저장 실패 후 보존');
      assert.equal(posts.size, 0, 'Failed publication keeps its saved draft');
      const callsBeforeRetry = saveCalls;
      failPublish = false; await page.locator('.write-submit').click();
      await page.waitForFunction(id => location.hash === '#/post/' + id, id);
      assert.equal(saveCalls, callsBeforeRetry, 'Publication retries reuse the saved revision');
      assert.equal(posts.size, 1); assert.equal(drafts.size, 0); assert.equal(objects.size, 1, 'Published image is retained');
      assert.equal(await page.locator('.write-leave-dialog').isVisible(), false);
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No page overflow');
      console.log(`PASS ${width}px: partial/update save, stored image paths, loading text/photo/category/tag, replace cancel/confirm, failed save/publication preservation, retry and publish cleanup`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
