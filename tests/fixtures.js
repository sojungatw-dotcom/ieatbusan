/* Test-only browser adapters. Never loaded by the production index.html. */
(function () {
  'use strict';
  const key = 'ieatbusan.v1';
  const isolatedOrigin = location.hostname === '127.0.0.1' || (location.hostname === 'localhost' && location.port === '8766');
  const panel = document.getElementById('fixture-panel');
  const stateOutput = document.getElementById('fixture-state');
  const logOutput = document.getElementById('fixture-log');
  const events = [];
  let pendingLocations = 0;
  let quotaFailures = 0;
  function log(message) {
    events.push(message);
    logOutput.textContent = events.slice(-30).join('\n');
    refresh();
  }
  function refresh() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
    const live = window.Store ? window.Store.get() : stored;
    const counts = s => s ? `user=${!!s.user}, guest=${!!s.guest}, lang=${s.lang}, posts=${(s.posts || []).length}, comments=${Object.values(s.comments || {}).reduce((n, list) => n + list.length, 0)}, saved=${(s.savedFoods || []).length + (s.savedPlaces || []).length}, photos=${(s.posts || []).reduce((n, p) => n + (p.photos || []).length, 0)}` : 'empty';
    stateOutput.textContent = `origin=${location.origin}\nroute=${location.hash}\nmemory: ${counts(live)}\nstorage: ${counts(stored)}\npending locations=${pendingLocations}, quota failures=${quotaFailures}\nmap circles=${document.querySelectorAll('path.leaflet-interactive').length}`;
  }
  document.getElementById('fixture-collapse').addEventListener('click', event => {
    const collapsed = panel.dataset.collapsed !== 'true';
    panel.dataset.collapsed = String(collapsed);
    event.currentTarget.textContent = collapsed ? '검증 패널 펼치기' : '검증 패널 접기';
  });
  document.getElementById('fixture-refresh').addEventListener('click', refresh);
  document.getElementById('fixture-reset').addEventListener('click', () => {
    if (!isolatedOrigin) {
      log('RESET BLOCKED: use localhost:8766 or 127.0.0.1 to isolate user data');
      return;
    }
    localStorage.removeItem(key);
    location.replace(location.pathname + '#/login');
    location.reload();
  });
  if (!isolatedOrigin) {
    log('FIXTURES DISABLED: open http://localhost:8766/tests/browser.html');
    return;
  }
  // The base URL supplies production assets. Preserve this fixture document for
  // native hash links, after the app has had its chance to prevent navigation.
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    const href = anchor && anchor.getAttribute('href');
    if (!event.defaultPrevented && href && href.startsWith('#')) {
      event.preventDefault();
      location.hash = href;
    }
  });
  window.confirm = message => {
    const accepted = document.getElementById('fixture-confirm').value === 'yes';
    log(`confirm(${accepted ? 'yes' : 'no'}): ${String(message)}`);
    return accepted;
  };
  const NativeFileReader = window.FileReader;
  window.FileReader = class FixtureFileReader extends NativeFileReader {
    readAsDataURL(file) {
      const delay = Number(document.getElementById('fixture-photo-delay').value);
      if (delay) {
        log(`photo read requested: delay=${delay}`);
        setTimeout(() => { log('photo read delivered'); super.readAsDataURL(file); }, delay);
      } else super.readAsDataURL(file);
    }
  };
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition(success, error, options) {
        const mode = document.getElementById('fixture-geo').value;
        const delay = Number(document.getElementById('fixture-delay').value);
        pendingLocations++;
        log(`geo requested: ${mode}, delay=${delay}, timeout=${options && options.timeout}`);
        setTimeout(() => {
          pendingLocations--;
          if (mode === 'success') success({ coords: { latitude: 35.1796, longitude: 129.0756, accuracy: 10 }, timestamp: Date.now() });
          else if (error) error({ code: mode === 'denied' ? 1 : 3, message: mode });
          log(`geo delivered: ${mode}`);
        }, delay);
      },
    },
  });
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (storageKey, value) {
    if (this === localStorage && storageKey === key && document.getElementById('fixture-quota').checked && String(value).includes('data:image')) {
      quotaFailures++;
      log('photo persistence rejected: synthetic QuotaExceededError');
      throw new DOMException('Synthetic test quota exceeded', 'QuotaExceededError');
    }
    return originalSetItem.call(this, storageKey, value);
  };
  window.addEventListener('error', event => log(`ERROR: ${event.message}`));
  window.addEventListener('unhandledrejection', event => log(`REJECTION: ${String(event.reason)}`));
  window.addEventListener('hashchange', () => setTimeout(refresh, 0));
  new MutationObserver(() => refresh()).observe(document.getElementById('app'), { childList: true, subtree: true });
  log('Fixtures active. Coordinates, confirm and quota responses are synthetic.');
})();
