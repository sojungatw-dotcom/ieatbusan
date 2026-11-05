'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/map/map-provider.js'), 'utf8'), ctx);
const timers = new Map(), maps = [], markers = [], activeLocations = new Set();
const tileEvents = {}, statuses = [];
let timerId = 0;
const sdk = {
  map(element, options) {
    const m = { element, options, removed: 0, positions: [],
      setView() { maps.push(this); return this; },
      fitBounds() {}, invalidateSize() {},
      flyTo(ll) { this.positions.push(ll); }, remove() { this.removed++; },
    }; return m;
  },
  tileLayer: () => ({ addTo() { return this; }, on(name,fn) { tileEvents[name]=fn; return this; },
    off() { for(const name of Object.keys(tileEvents)) delete tileEvents[name]; } }),
  control: { zoom: () => ({ addTo() {} }) },
  divIcon: () => ({}),
  marker(ll) {
    const marker = { ll, opened: 0, addTo() { markers.push(this); return this; },
      bindPopup() { return this; }, getLatLng() { return this.ll; }, openPopup() { this.opened++; },
    }; return marker;
  },
  circleMarker() {
    return { addTo() { activeLocations.add(this); return this; }, remove() { activeLocations.delete(this); } };
  },
  latLngBounds: () => ({ pad() { return this; } }),
};
const provider = ctx.window.IEBMapProvider.create({ getSDK: () => sdk,
  setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
});
const map = provider.create({}, { onStatus:code=>statuses.push(code) });
tileEvents.loading();tileEvents.tileerror();tileEvents.load();
assert.deepEqual(statuses,['tiles'],'Failed tiles must remain visible after the tile batch ends');
tileEvents.loading();tileEvents.load();
assert.equal(statuses.at(-1),null,'A fully successful later tile batch clears the warning');
const lateTileError=tileEvents.tileerror;
const place = { food: { id: 'milmyeon' }, i: 2, lat: 35.1525, lng: 129.0225 };
map.addPlace(place, 'popup', true);
map.focusPlace('milmyeon:2');
map.focusPlace('milmyeon:2');
assert.equal(timers.size, 1, 'A later focus must cancel the previous popup');
const [firedId, openPopup] = [...timers.entries()][0];
timers.delete(firedId);
openPopup(); assert.equal(markers[0].opened, 1);
map.showLocation([35.1, 129.1]); map.showLocation([35.2, 129.2]);
assert.equal(activeLocations.size, 1, 'Repeated location updates replace the old circle');
map.focusPlace('milmyeon:2');
const latePopup = [...timers.values()].at(-1);
map.dispose(); map.dispose();
assert.equal(maps[0].removed, 1);
lateTileError();assert.equal(statuses.length,2,'Removed maps cannot publish tile errors');
assert.equal(Object.keys(tileEvents).length,0);
assert.equal(timers.size, 0);
latePopup(); assert.equal(markers[0].opened, 1, 'Popup cannot open after map removal');
const positions = maps[0].positions.length;
map.focusPlace('milmyeon:2'); map.showLocation([0, 0]);
assert.equal(maps[0].positions.length, positions);
assert.equal(provider.available(), true);
const missing = ctx.window.IEBMapProvider.create({ getSDK: () => null, setTimeout() {}, clearTimeout() {} });
assert.equal(missing.available(), false);
sdk.control.zoom=()=>{throw new Error('SDK control failure');};
assert.throws(()=>provider.create({},{}));
assert.equal(maps[1].removed,1,'Partial SDK initialization must remove its map');
console.log('PASS map provider focus/popup cancellation, location circle, tile failure/recovery and partial initialization cleanup');
