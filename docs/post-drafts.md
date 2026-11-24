# Community post draft storage

Applied to the IEATBUSAN Supabase project on 2026-11-24. The local writing page and API support saving, listing, loading and publishing drafts. Frontend/API deployment is separate from the applied database migrations.

`public.ieb_post_drafts` stores `id`, `user_id`, `title`, `body`, `category`, `food`, `restaurant_id`, `photos`, `created_at`, and `updated_at`. Blank titles/bodies are allowed; completed posts still use the existing `ieb_posts` validation. Each member can hold multiple drafts. The owner is a required profile reference with account deletion cascade.

Images use the existing **private** `ieb-community` Storage bucket. `photos` holds at most four object paths, never image bytes, public URLs, or signed URLs:

```text
<user UUID>/<draft UUID>/<image UUID>.jpg
```

JPEG, PNG and WebP extensions are accepted. Create the draft first, upload the image through the Storage API, then update `photos`. The bucket's existing upload limits and owner-prefix policies apply. The draft trigger rejects paths outside its owner's and draft's folder and updates `updated_at` when edited.

RLS allows only the signed-in owner to select, insert, update and delete a draft. Anonymous users have no table grants. Client updates cannot change ownership, draft ID or timestamps. List drafts by `user_id`, ordered by `updated_at desc, id`.

`ieb_publish_post_draft` validates the stored revision, inserts the completed `ieb_posts` row with the same `photos` paths and deletes the draft in one transaction. The draft UUID is reused as the published post ID, making retries idempotent. The existing image read policy makes paths referenced by a published post readable to visitors. Publication never deletes image files. A failed publication preserves the draft and files. Removing abandoned images requires an explicit Storage API cleanup that excludes published references.

The member-only, CSRF-protected API actions are `draftSave`, `draftList`, `draftGet` and `draftPublish` in `server/drafts.cjs`. Each action uses the caller's verified JWT, never admin privileges. `draftSave` accepts new JPEG data URLs or existing paths within the same draft folder; files are uploaded before the atomic `ieb_save_post_draft` RPC. Both save and publication use optimistic revision checks plus a per-member/draft transaction lock. Private preview URLs are signed for one hour and never stored in the database. The legacy `post` API remains available for existing callers.

The editor compares its content with the last saved revision: saved drafts can leave safely, while unsaved changes still trigger the leave dialog. Loading another draft asks for confirmation before replacing unsaved work. New photo-conversion callbacks cannot leak into a subsequently loaded draft. Account deletion now descends into nested draft image folders.

If a storage upload fails before the RPC starts, files uploaded by that failed attempt are removed. If an RPC response is uncertain, uploaded files are retained because the save may already have committed. Removed/replaced draft images and failed-attempt orphans are private and can be reclaimed by a later reference-aware cleanup job; no unsafe image deletion trigger was added.

Database checks are in `tests/post-drafts-db.sql` and `tests/post-drafts-workflow-db.sql`: owner CRUD, second-member isolation, anonymous denial, immutable ownership, content limits, invalid photos, stale revisions, atomic publication and retry idempotency. They run in a transaction and roll back all test writes. API tests: `node tests/post-drafts-api.cjs`. Browser tests: `node tests/post-drafts-browser.cjs` with Playwright and Chrome; all API traffic is intercepted with synthetic data. Migration filenames match the remote migration history.
