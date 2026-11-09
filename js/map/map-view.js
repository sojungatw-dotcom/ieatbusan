/* Controller only: route state, screen lifetime, SDK initialization and interactions. */
(function () {
  'use strict';
  window.IEBMapView = {
    create({ data, provider, root, document, navigator, t, esc, fname, img, placeImg, icon,
      appHeader, tabbar, toast, setTimeout: delay, clearTimeout: cancel,
      shapes = window.IEBDistrictShapes, messages = window.IEBMapText,
      getLanguage = () => document.documentElement?.lang || 'ko',
      navigate = href => { window.location.hash = href; },
      districtName = index => data.districts[index].name }) {
      let current = null;
      const routes = window.IEBMapRoutes.create(data);
      const renderer = window.IEBMapRenderer.create({ data, routes, shapes, messages, getLanguage,
        districtName, t, esc, fname, img, placeImg, icon, appHeader, tabbar, mapAvailable: provider.available });
      const render = params => renderer.render(routes.resolve(params));

      function startMap(element, places, options, { warning, release = () => {}, mini = false } = {}) {
        let ownsWarning = false;
        if (mini && element.insertAdjacentElement) {
          warning = document.createElement('p'); warning.className = 'map-inline-status';
          warning.hidden = true; warning.setAttribute('role', 'status');
          element.insertAdjacentElement('afterend', warning); ownsWarning = true;
        }
        const session = { map: null, request: 0, disposed: false, timer: null };
        const validPlaces = places.filter(data.hasCoordinates);
        const missingCoordinates = validPlaces.length !== places.length;
        session.dispose = () => {
          if (session.disposed) return;
          session.disposed = true; cancel(session.timer); release();
          session.map?.dispose();
          if (ownsWarning) warning.remove();
          if (current === session) current = null;
        };
        const showMessage = message => {
          element.textContent = message;
          element.classList?.toggle('map-status', !!message);
        };
        const onStatus = code => {
          if (session.disposed || !warning) return;
          const status = code || (missingCoordinates ? 'coordinates' : null);
          warning.hidden = !status;
          warning.textContent = status === 'coordinates' ? renderer.mt('noCoordinates') : status === 'authorization' ? t('map.googleAuthError') : status ? t('map.offline') : '';
        };
        function failed(error) {
          if (session.disposed) return;
          session.map?.dispose(); session.map = null;
          if (warning) warning.hidden = true;
          showMessage(t(['map.keyMissing', 'map.googleAuthError'].includes(error?.message) ? error.message : 'map.offline'));
        }
        function initialize() {
          if (session.disposed) return;
          try {
            if (!provider.available()) { failed(); return; }
            showMessage('');
            const map = provider.create(element, { ...options, onStatus });
            session.map = map;
            for (const place of validPlaces) map.addPlace(place, mini ? '' : renderer.popup(place), mini || !!options.selected);
            if (!mini) map.fitPlaces(validPlaces);
            onStatus(null);
            session.timer = delay(() => { if (!session.disposed) map.resize(); }, 60);
          } catch { failed(); }
        }
        if (provider.available()) initialize();
        else if (provider.load) {
          showMessage(renderer.mt('loading'));
          try { Promise.resolve(provider.load()).then(() => { if (!session.disposed) initialize(); }).catch(failed); }
          catch { failed(); }
        } else failed();
        return session;
      }
      function mount(params = {}) {
        current?.dispose();
        const state = routes.resolve(params);
        if (!state.valid || state.mode !== 'detail') return () => {};
        const picker = root.querySelector('[data-map-region]');
        const onRegionChange = () => {
          if (picker.value && !data.hasDistrict(picker.value)) return;
          navigate(routes.detail(picker.value));
        };
        picker?.addEventListener('change', onRegionChange);
        let sheetControl = null;
        const release = () => {
          picker?.removeEventListener('change', onRegionChange);
          sheetControl?.dispose();
        };
        const element = document.getElementById('map');
        if (!element) return release;
        const { foodId, districtId } = state;
        const places = data.placesForSelection({ foodId, districtId });
        const district = data.districtById[districtId];
        const shape = shapes?.districts.find(item => item.code === district?.code);
        current = startMap(element, places, { interactive: true, selected: !!foodId,
          ...(shape ? { center: shape.center, zoom: 12 } : {}) },
        { warning: document.getElementById('map-warning'), release });
        sheetControl = window.IEBMapSheet.create({
          panel: document.getElementById('sheet'), handle: root.querySelector('.sheet-handle'),
          canvas: element, locate: root.querySelector('.locate-btn'), onResize: () => current?.map?.resize(),
        });
        current.sheet = sheetControl;
        return current.dispose;
      }
      function mountMini({ id, i }) {
        const place = data.placeOf(id, i), element = document.getElementById('mini-map');
        if (!place || !element) return () => {};
        if (!data.hasCoordinates(place)) {
          let disposed = false, stop = () => {};
          element.classList?.add('map-status');
          const unavailable = error => {
            if (disposed) return;
            element.textContent = ['map.keyMissing', 'map.googleAuthError'].includes(error?.message)
              ? t(error.message) : renderer.mt('addressUnavailable');
          };
          if (place.address && provider.resolvePlace) {
            element.textContent = renderer.mt('loading');
            Promise.resolve().then(() => disposed ? null : provider.resolvePlace(place)).then(located => {
              if (disposed) return;
              if (!data.hasCoordinates(located)) { unavailable(); return; }
              stop = startMap(element, [located], { interactive: false, center: [located.lat, located.lng], zoom: 15 }, { mini: true }).dispose;
            }).catch(unavailable);
          } else unavailable();
          return () => { disposed = true; stop(); };
        }
        return startMap(element, [place], { interactive: false, center: [place.lat, place.lng], zoom: 15 }, { mini: true }).dispose;
      }
      function sheet() {
        current?.sheet?.toggle();
      }
      function flyTo(element, event) {
        if (event.target.closest('a')) return;
        const [foodId, index] = element.dataset.key.split(':');
        const place = data.placeOf(foodId, index);
        if (place && !data.hasCoordinates(place)) { navigate(routes.place(place)); return; }
        if (!current?.map) return;
        current.map.focusPlace(element.dataset.key);
        current.sheet?.collapse();
      }
      function locate() {
        if (!navigator.geolocation || !current?.map) { toast(t('map.locFail')); return; }
        const session = current, request = ++session.request;
        const active = () => current === session && !session.disposed && request === session.request;
        navigator.geolocation.getCurrentPosition(position => {
          const ll = [position.coords.latitude, position.coords.longitude];
          if (active() && data.hasCoordinates({ lat: ll[0], lng: ll[1] })) session.map.showLocation(ll);
        }, () => { if (active()) toast(t('map.locFail')); }, { timeout: 8000 });
      }
      return { render, mount, mountMini, sheet, flyTo, locate };
    },
  };
})();
