/* Google SDK is loaded only when a detailed map or restaurant mini-map is opened. */
(function () {
  'use strict';
  window.IEBGoogleMapSDK = {
    create({ document = window.document, host = window, getSDK = () => window.google?.maps,
      fetchConfig = () => window.fetch('/api/maps-config', { cache: 'no-store', credentials: 'omit', signal: window.AbortSignal.timeout(10000) }),
      setTimeout: delay = window.setTimeout.bind(window), clearTimeout: cancel = window.clearTimeout.bind(window) } = {}) {
      let pending = null, config = null, authFailed = false, sequence = 0;
      const listeners = new Set();
      const ready = () => !!config && !authFailed && !!getSDK()?.Map && !!getSDK()?.marker?.AdvancedMarkerElement;
      const previousAuthFailure = host.gm_authFailure;
      host.gm_authFailure = () => {
        authFailed = true;
        for (const notify of listeners) notify('authorization');
        if (typeof previousAuthFailure === 'function') previousAuthFailure();
      };
      function load() {
        if (ready()) return Promise.resolve(getSDK());
        if (authFailed) return Promise.reject(new Error('map.googleAuthError'));
        if (pending) return pending;
        pending = (async () => {
          const response = await fetchConfig();
          const data = await response.json();
          if (!response.ok || !data.apiKey) throw new Error(data.error === 'map.keyMissing' ? 'map.keyMissing' : 'map.sdkUnavailable');
          config = { apiKey: data.apiKey, mapId: data.mapId || 'DEMO_MAP_ID' };
          if (ready()) return getSDK();
          await new Promise((resolve, reject) => {
            const script = document.createElement('script'), callback = '__iebGoogleMapsReady' + (++sequence);
            let settled = false, timer;
            function finish(error) {
              if (settled) return;
              settled = true; cancel(timer); script.onerror = null; listeners.delete(authError);
              if (error) { script.remove(); host[callback] = () => {}; reject(error); }
              else { delete host[callback]; resolve(); }
            }
            const authError = () => finish(new Error('map.googleAuthError'));
            listeners.add(authError);
            host[callback] = () => finish(ready() ? null : new Error(authFailed ? 'map.googleAuthError' : 'map.sdkUnavailable'));
            const url = new URL('https://maps.googleapis.com/maps/api/js');
            for (const [key, value] of Object.entries({ key: config.apiKey, callback, loading: 'async', libraries: 'marker', v: 'weekly' })) url.searchParams.set(key, value);
            script.src = url.href; script.async = true;
            script.onerror = () => finish(new Error('map.sdkUnavailable'));
            timer = delay(() => finish(new Error('map.sdkUnavailable')), 15000);
            try { document.head.appendChild(script); } catch { finish(new Error('map.sdkUnavailable')); }
          });
          return getSDK();
        })().catch(error => { pending = null; throw error; });
        return pending;
      }
      return { ready, load, mapId: () => config?.mapId || 'DEMO_MAP_ID',
        onError(notify) { listeners.add(notify); return () => listeners.delete(notify); } };
    },
  };
})();
