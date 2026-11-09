# Google Maps integration

Run `node tests/google-maps.cjs`. Uses a fake Google SDK to verify lazy loading, configuration errors, authorization, advanced markers, camera/bounds, location replacement and cleanup. Real key/map loading requires the setup in [docs/google-maps.md](../docs/google-maps.md).

# Isolated browser checks

## Engagement latency checks

Run `node tests/engagement-latency.cjs` for immediate updates, rollback, duplicate suppression,
preference write coalescing, stale bootstrap protection and unrelated editor preservation.
Run `node tests/engagement-browser.cjs`, then open `http://127.0.0.1:8781/#/post/fixture-post`
for an isolated test account with an eight-second fake API delay and success/failure controls.
It never connects to Supabase. Stop the server after testing. See `docs/engagement-performance.md`
for observations, production measurements and the limits of the verification.
## Member country checks

Run `node tests/comment-country-migration.cjs` for the additive, nullable comment snapshot migration
without historical backfills. The member UI/API checks also verify atomic profile country editing,
preserved post/comment countries after changing profile, and missing badges on unsnapshotted legacy comments.
These checks do not execute SQL against PostgreSQL.

Run `node tests/member-country-migration.cjs` to check preservation of the existing signup function/RLS,
matching country allowlists/defaults and column grants. This is not a PostgreSQL execution/RLS test.

Run `node tests/public-entry.cjs` for anonymous home entry, the header login link, language confirmation
without forced login, explicit login access and protected member-only routes.

Run `node tests/member-country.cjs` and `node tests/member-country-api.cjs` for translated country names,
KR defaults, signup payloads, profile badges, country settings, stable community priority, guest activity
guards, server-side validation and own-user country updates. API responses are mocked.

Run `node tests/member-country-preview.cjs` to inspect the production UI at `http://127.0.0.1:8781/`
using synthetic in-memory accounts/posts. This fixture never calls Supabase. See docs/member-country.md
for the pending SQL migration and required real-DB verification before deployment.

## Map module checks

Run `node tests/map-integration.cjs` for the current main catalog: source-address district assignment,
preserved manuscript restaurant details, explicit region overrides and coordinate-less row navigation.
Run `node tests/food-manuscript.cjs` for the teammate's food detail content and map coordinate exclusion.

Run `node tests/map-contracts.cjs`, `node tests/map-loader.cjs` and `node tests/map-lifecycle.cjs`
for stable district/place IDs, validated map routes, coordinate/translation fallbacks, lazy SDK/CSS
loading, shared concurrent requests, retry/timeout and navigation during asynchronous initialization.
`map-context.cjs` is a fixture helper loading production scripts in the index.html order, not a standalone test.

Run `node tests/map-regressions.cjs` and `node tests/map-provider.cjs`.
Run `node tests/map-districts.cjs` for the local district SVG, region/food filtering, no-SDK overview,
four-language labels, empty-region notices and backwards-compatible map links.
These cover food/place projections, stable saved-place IDs and detail routes, four languages,
food filtering, list-to-pin selection, mini maps, stale/out-of-order location callbacks,
popup cancellation and map disposal. The SDK boundary is mocked; real map rendering and
provider keys/domains need browser verification. Map CSS is loaded separately in the browser fixture.

## Vercel deployment checks

Run `node tools/build-static.cjs`, then `node tests/deployment.cjs`. The build validates local HTML asset references and production JavaScript syntax. The check verifies that only runtime files are published and that all food images, scripts and styles are present. This does not replace checking a real Vercel deployment URL.

## Local account regression checks

Run `node tests/auth-regressions.cjs`. Checks the two-input screens, server auth calls, server session hydration, preference persistence and exclusion of credentials/posts/tokens from local UI storage. Uses isolated mocked API responses.

Run `node tests/api-regressions.cjs`. Checks the actual Vercel handler with mocked Supabase responses: CSRF, validation, signup, duplicate IDs, login errors, HttpOnly cookies, server-verified user identity, user JWT use for RLS, ownership checks, preference allowlist, token refresh, logout and missing environment settings. This test does not prove a live deployment is connected; check `/api/service?action=status` and real test-account flows separately.

## Home carousel regression checks

Autoplay checks use a fake clock to verify a full 4-second idle delay, wrapping, touch hold/release/cancel, manual timer reset, pause/resume, background visibility and cleanup without real-time waits.

Run `node tests/home-carousel.cjs`. Checks all four languages and both sorts, five featured slides and twenty list cards, scroll state, navigation boundaries, keyboard controls, restoring the selected food after rerender, resizing, and listener cleanup. Native touch gestures still require a device check.

Run `./tools/serve.ps1 -Port 8766 -Fixtures`, then open `http://localhost:8766/`. Fixture mode serves this browser harness at the server root so the app's native hash links and redirects keep the harness loaded. Do not use `/tests/browser.html` as the browser entry point because the production app's base-relative redirects may leave it.

Alternatively use the `127.0.0.1` hostname on a server that accepts it. Both test origins keep their localStorage separate from the user's `http://localhost:8765` demo.

The fixture loads the production app scripts and CSS directly. It adds test-only adapters before the app starts:

- **Confirmation:** choose 확인 or 취소 to exercise either branch without a browser-native modal blocking automation.
- **Location:** success uses the fixed synthetic coordinate `35.1796, 129.0756`; denial and timeout return standard error codes. A 1.5 or 5 second delay supports navigating away while a request is pending.
- **Storage quota:** the checkbox rejects localStorage writes containing image data. Non-image writes remain available to test the production photo-free fallback.
- **Photo delay:** delay each FileReader read by 1.5 seconds to leave the write screen while multiple photos are processing, then reopen it and check that the new draft stays empty.
- **Reset:** the explicit button removes only `ieatbusan.v1` on the isolated test origin, then reloads the fixture. It is blocked on other host/port combinations.

The visible status compares the production Store state with persisted storage and records confirmation, location, quota and runtime errors. The fixture does not request real location access or collect coordinates. Mocked success and denial establish application callback behavior, not native browser permission integration or device location accuracy.

Production `index.html` never loads these adapters. Keep native browser confirmation/permission checks and public deployment checks separate when reporting results.

## Asynchronous regression checks

Run `node tests/async-regressions.cjs`. No packages are required. The two checks extract the production photo handler into a VM fixture and test cancellation and overlapping uploads. Location lifetime checks moved to the map checks above because the location implementation is no longer inside app.js. Use `--source path/to/older-app.js` for the photo handler regression. These checks do not replace browser interaction tests.

## Two-hour featured foods

Run `node tests/featured-foods.cjs` for unique random sampling, stable two-hour windows, exact expiry, order/like independence and small catalogs.
Run `node tests/home-carousel.cjs` for live expiry, background-tab catch-up, cleanup, swiping and the existing four-second autoplay.
# 식당 주소 미니지도

`node tests/google-maps.cjs`, `node tests/map-lifecycle.cjs`, `node tests/member-country.cjs`에서 주소 좌표 조회·세션 내 재사용·부분 일치 거절·10초 제한·화면 이탈·상세 화면 Google 대체 링크를 검증합니다. 실제 Google 키/Geocoding 권한·지도 표시는 별도 확인이 필요합니다.

## Profile photos

Run `node tests/profile-avatar.cjs` for local image preparation, stale selection/navigation guards, authenticated private uploads, signed bootstrap reload, replacement/removal, failed-save cleanup and account cleanup. API/Storage responses are mocked; see [profile photo setup and DB verification](../docs/profile-photo.md).

## Restaurant master data

Run `node tests/restaurant-data.cjs` for shared restaurant records, stable food/place links, per-food menu preservation, full address/hour projection, explicit map links and real like counts. See [restaurant schema and import verification](../docs/restaurants.md).

The catalog now contains 43 visible foods and 164 food/place links. `node tests/food-manuscript.cjs` checks the four added Busan restaurant lists in the existing detail template. `node tests/api-regressions.cjs` also verifies that `content.catalogStatus: archived` removes a food from bootstrap while retaining legacy and ordinary rows and preserving the archived DB record for restoration. These API tests use mocked upstream responses.
