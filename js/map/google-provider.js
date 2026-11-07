/* Google adapter preserves the shared map controller's place/lifetime contract. */
(function () {
  'use strict';
  window.IEBGoogleMapProvider = {
    create({ getSDK = () => window.google?.maps, loader = window.IEBGoogleMapSDK.create(), document = window.document,
      setTimeout: delay = window.setTimeout, clearTimeout: cancel = window.clearTimeout } = {}) {
      const addresses = new Map();
      return {
        available: () => loader.ready(),
        load: () => loader.load(),
        async resolvePlace(place) {
          const address = String(place.address || '').trim();
          if (!address) return null;
          if (!addresses.has(address)) {
            const request = (async () => {
              await loader.load();
              const maps = getSDK();
              const { Geocoder } = maps.Geocoder ? maps : await maps.importLibrary('geocoding');
              const response = await new Promise((resolve, reject) => {
                const timer = delay(() => reject(new Error('map.addressUnavailable')), 10000);
                Promise.resolve().then(() => new Geocoder().geocode({ address, componentRestrictions: { country: 'KR' } }))
                  .then(resolve, reject).finally(() => cancel(timer));
              });
              const result = response.results?.find(item => !item.partial_match && item.geometry?.location_type !== 'APPROXIMATE');
              const location = result?.geometry?.location;
              const lat = location?.lat(), lng = location?.lng();
              return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
            })();
            addresses.set(address, request);
          }
          try {
            const coordinates = await addresses.get(address);
            if (!coordinates) addresses.delete(address);
            return coordinates ? { ...place, ...coordinates } : null;
          } catch (error) { addresses.delete(address); throw error; }
        },
        create(element, { interactive = true, center = [35.155, 129.07], zoom = 11, onStatus = () => {} } = {}) {
          const maps = getSDK(), markers = new Map(), handles = [];
          let map, popup, locationCircle, unsubscribe = () => {}, disposed = false;
          const position = ll => ({ lat: ll[0], lng: ll[1] });
          function dispose() {
            if (disposed) return;
            disposed = true; unsubscribe();
            for (const handle of handles) handle.remove();
            popup?.close(); locationCircle?.setMap(null);
            for (const marker of markers.values()) marker.map = null;
            markers.clear();
            if (map) maps.event.clearInstanceListeners(map);
            element.replaceChildren(); map = null;
          }
          try {
            map = new maps.Map(element, { center: position(center), zoom, mapId: loader.mapId(),
              disableDefaultUI: true, zoomControl: interactive, clickableIcons: false,
              zoomControlOptions: { position: maps.ControlPosition?.TOP_RIGHT },
              gestureHandling: interactive ? 'cooperative' : 'none', keyboardShortcuts: interactive,
              draggable: interactive, scrollwheel: interactive, disableDoubleClickZoom: !interactive,
            });
            popup = new maps.InfoWindow();
            unsubscribe = loader.onError(onStatus);
            return {
              addPlace(place, html, selected) {
                if (disposed) return;
                const key = `${place.food.id}:${place.i}`, pin = document.createElement('div');
                pin.className = 'google-place-pin';
                pin.innerHTML = `<svg width="30" height="36" viewBox="0 0 24 28" aria-hidden="true"><path d="M20 10c0 5-8 15-8 15S4 15 4 10a8 8 0 0 1 16 0" fill="${selected ? '#CC4936' : '#FFFFFF'}" stroke="#CC4936" stroke-width="1.6"/><circle cx="12" cy="10" r="3" fill="${selected ? '#FFFFFF' : '#CC4936'}"/></svg>`;
                const marker = new maps.marker.AdvancedMarkerElement({ map, position: { lat: place.lat, lng: place.lng }, title: place.name, content: pin });
                const open = () => { if (!disposed && html) { popup.setContent(html); popup.open({ map, anchor: marker, shouldFocus: false }); } };
                if (html) handles.push(marker.addListener('click', open));
                markers.set(key, marker); marker.iebOpen = open;
              },
              fitPlaces(places) {
                if (disposed || !places.length) return;
                if (places.length === 1) { map.setCenter({ lat: places[0].lat, lng: places[0].lng }); map.setZoom(15); return; }
                const bounds = new maps.LatLngBounds();
                places.forEach(place => bounds.extend({ lat: place.lat, lng: place.lng }));
                map.fitBounds(bounds, { top: 40, right: 40, bottom: 160, left: 40 });
                let handle;
                handle = maps.event.addListenerOnce(map, 'idle', () => { if (!disposed && map.getZoom() > 15) map.setZoom(15); });
                handles.push(handle);
              },
              resize() { if (!disposed) maps.event.trigger(map, 'resize'); },
              focusPlace(key) {
                const marker = markers.get(key);
                if (!marker || disposed) return;
                map.panTo(marker.position); map.setZoom(16); marker.iebOpen();
              },
              showLocation(ll) {
                if (disposed) return;
                locationCircle?.setMap(null);
                locationCircle = new maps.Circle({ map, center: position(ll), radius: 25,
                  strokeColor: '#FFFFFF', strokeWeight: 3, fillColor: '#3A7291', fillOpacity: 1 });
                map.panTo(position(ll)); map.setZoom(14);
              },
              dispose,
            };
          } catch (error) { dispose(); throw error; }
        },
      };
    },
  };
})();
