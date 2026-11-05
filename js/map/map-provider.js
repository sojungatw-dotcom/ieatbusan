/* External map SDK boundary. Screens never access Leaflet directly. */
(function () {
  'use strict';
  window.IEBMapProvider = {
    create({ getSDK = () => window.L, loader = window.IEBMapSDK?.create(), setTimeout: delay = window.setTimeout.bind(window),
      clearTimeout: cancel = window.clearTimeout.bind(window) } = {}) {
      return {
        available: () => !!getSDK() && (!loader || loader.ready()),
        load: () => loader ? loader.load() : Promise.reject(new Error('map.sdkUnavailable')),
        create(element, { interactive = true, center = [35.155, 129.07], zoom = 11, onStatus = () => {} } = {}) {
          const L = getSDK();
          let map;
          try {
            map = L.map(element, { zoomControl: false, zoomAnimation: false,
              ...(interactive ? {} : { dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
                touchZoom: false, boxZoom: false, keyboard: false }),
            });
            map.setView(center, zoom);
            const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin',
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            if (interactive) L.control.zoom({ position: 'topright' }).addTo(map);
            const markers = new Map();
            let locationMarker = null, popupTimer = null, disposed = false;
            let tileFailures = 0;
            tiles.on('loading', () => { tileFailures = 0; });
            tiles.on('tileerror', () => { if (!disposed) { tileFailures++; onStatus('tiles'); } });
            tiles.on('load', () => { if (!disposed && tileFailures === 0) onStatus(null); });
            function pinIcon(selected) {
              const fill = selected ? '#CC4936' : '#FFFFFF', dot = selected ? '#FFFFFF' : '#CC4936';
              return L.divIcon({ className: 'pin', iconSize: [30, 30], iconAnchor: [15, 28], popupAnchor: [0, -26],
                html: `<svg viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" fill="${fill}" stroke="#CC4936" stroke-width="1.6"/><circle cx="12" cy="10" r="3" fill="${dot}"/></svg>` });
            }
            return {
              addPlace(place, popup, selected) {
                const marker = L.marker([place.lat, place.lng], { icon: pinIcon(selected) }).addTo(map);
                if (popup) marker.bindPopup(popup);
                markers.set(`${place.food.id}:${place.i}`, marker);
              },
              fitPlaces(places) {
                if (places.length) map.fitBounds(L.latLngBounds(places.map(p => [p.lat, p.lng])).pad(0.15), { maxZoom: 15 });
              },
              resize() { if (!disposed) map.invalidateSize(); },
              focusPlace(key) {
                const marker = markers.get(key);
                if (!marker || disposed) return;
                cancel(popupTimer);
                map.flyTo(marker.getLatLng(), 16, { duration: 0.6 });
                popupTimer = delay(() => { popupTimer = null; if (!disposed) marker.openPopup(); }, 650);
              },
              showLocation(ll) {
                if (disposed) return;
                if (locationMarker) locationMarker.remove();
                locationMarker = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3,
                  fillColor: '#3A7291', fillOpacity: 1 }).addTo(map);
                map.flyTo(ll, 14);
              },
              dispose() {
                if (disposed) return;
                disposed = true; cancel(popupTimer); tiles.off(); markers.clear(); map.remove();
              },
            };
          } catch (error) { map?.remove(); throw error; }
        },
      };
    },
  };
})();
