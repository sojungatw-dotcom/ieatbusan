/* Load the current map SDK once, on demand. No external request on the SVG overview. */
(function () {
  'use strict';
  window.IEBMapSDK = {
    create({ document = window.document, getSDK = () => window.L,
      setTimeout: delay = window.setTimeout.bind(window), clearTimeout: cancel = window.clearTimeout.bind(window) } = {}) {
      let pending = null, styled = false;
      const ready = () => styled && !!getSDK();
      function load() {
        if (ready()) return Promise.resolve(getSDK());
        if (pending) return pending;
        pending = new Promise((resolve, reject) => {
          const nodes = [];
          const needsScript = !getSDK();
          let remaining = needsScript ? 2 : 1, settled = false, timer;
          function finish(error) {
            if (settled) return;
            settled = true; cancel(timer);
            for (const node of nodes) { node.onload = null; node.onerror = null; if (error) node.remove(); }
            if (error) { styled = false; reject(new Error('map.sdkUnavailable')); }
            else resolve(getSDK());
          }
          function loaded() {
            if (--remaining === 0) finish(getSDK() ? null : new Error('map.sdkUnavailable'));
          }
          const style = document.createElement('link');
          style.rel = 'stylesheet'; style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          style.crossOrigin = 'anonymous';
          style.onload = () => { styled = true; loaded(); };
          style.onerror = () => finish(new Error('map.sdkUnavailable'));
          nodes.push(style);
          if (needsScript) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true;
            script.crossOrigin = 'anonymous'; script.onload = loaded;
            script.onerror = () => finish(new Error('map.sdkUnavailable'));
            nodes.push(script);
          }
          timer = delay(() => finish(new Error('map.sdkUnavailable')), 12000);
          try { for (const node of nodes) document.head.appendChild(node); }
          catch { finish(new Error('map.sdkUnavailable')); }
        }).catch(error => { pending = null; throw error; });
        return pending;
      }
      return { load, ready };
    },
  };
})();
