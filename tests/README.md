# Isolated browser checks

## Vercel deployment checks

Run `node tools/build-static.cjs`, then `node tests/deployment.cjs`. The build validates local HTML asset references and production JavaScript syntax. The check verifies that only runtime files are published and that all food images, scripts and styles are present. This does not replace checking a real Vercel deployment URL.

## Local account regression checks

Run `node tests/auth-regressions.cjs`. Uses real Node Web Crypto and isolated in-memory storage to check ID/password validation, duplicate IDs, salted password verification (no plaintext), failed login, account-specific data, logout/reload/login, storage failure rollback, account deletion, and unavailable crypto. Production auth is a browser-local prototype, not server authentication.

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

Run `node tests/async-regressions.cjs`. No packages are required. The checks extract the exact production photo handler and location action into small VM fakes, then test cancellation, overlapping uploads, stale map callbacks, repeated markers, request ordering and failure notices. Use `--source path/to/older-app.js` to verify that an earlier implementation fails the regression cases. These checks do not replace browser interaction tests.
