/* Map contracts: real data/view modules, fake external SDK boundary. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = require('./map-context.cjs')();
let language = 'ko';
const data = context.IEBMapData.create(context.FOODS, () => language);
assert.equal(data.allPlaces().length, context.FOODS.reduce((n, food) => n + food.places.length, 0));
assert.equal(data.placeKey('jagalchi-hoe', 2), 'jagalchi-hoe:2');
assert.equal(data.placeOf('jagalchi-hoe', 2).name, '달봉이횟집');
assert.equal(data.placeOf('jagalchi-hoe', 2).lat, 35.0964);
assert.equal(data.placeOf('jagalchi-hoe', 2).areaKo, '중구 남포동');
assert.equal(data.placeOf('missing', 0), null);
assert.equal(data.placeOf('jagalchi-hoe', 99), null);
language = 'en';
assert.equal(data.placeOf('jagalchi-hoe', 2).area, data.byId['jagalchi-hoe'].en.restaurants[2].area);
assert.equal(data.placeOf('jagalchi-hoe', 2).areaKo, '중구 남포동');

function harness(available = true, overrides = {}) {
  const maps = [], requests = [], toasts = [], timers = new Map();
  let timerId = 0;
  const nodes = { map: {}, 'mini-map': {}, 'map-warning': { hidden: true } };
  const provider = {
    available: () => available,
    create(element, options) {
      const map = { element, options, places: [], locations: [], focused: [], disposed: 0, resized: 0,
        addPlace(place, popup, selected) { this.places.push({ place, popup, selected }); },
        fitPlaces(places) { this.fitted = places; },
        resize() { this.resized++; },
        focusPlace(key) { this.focused.push(key); },
        showLocation(ll) { this.locations = [Array.from(ll)]; },
        dispose() { this.disposed++; },
      };
      maps.push(map); return map;
    },
  };
  const view = context.IEBMapView.create({
    data, provider, root: { querySelector: () => null },
    getLanguage: () => language, districtName: index => context.DISTRICTS[language][index],
    document: { getElementById: id => nodes[id] },
    navigator: { geolocation: { getCurrentPosition: (success, error) => requests.push({ success, error }) } },
    t: (key, vars) => (context.I18N[language][key] || key).replace('{n}', vars?.n),
    esc: value => String(value).replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    fname: food => (food[language] || food.ko).name,
    img: id => 'assets/food/' + id + '.jpg',
    icon: () => '', appHeader: () => '', tabbar: () => '',
    toast: value => toasts.push(value),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    ...overrides,
  });
  return { view, maps, requests, toasts, timers, nodes,
    success: (i, lat = 35.18, lng = 129.08) => requests[i].success({ coords: { latitude: lat, longitude: lng } }),
  };
}
for (language of ['ko', 'en', 'zh', 'ja']) {
  const h = harness();
  const html = h.view.render({ id: 'jagalchi-hoe' });
  assert.equal((html.match(/data-act="flyTo"/g) || []).length, 4);
  assert.ok(html.includes('href="#/place/jagalchi-hoe/2"'));
  assert.ok(html.includes('data-key="jagalchi-hoe:2"'));
  assert.ok(!html.includes('undefined'));
  const dispose = h.view.mount({ id: 'jagalchi-hoe' });
  assert.equal(h.maps[0].places.length, 4);
  assert.equal(h.maps[0].places[2].place.name, '달봉이횟집');
  assert.ok(h.maps[0].places[2].popup.includes('#/place/jagalchi-hoe/2'));
  assert.equal(h.maps[0].fitted.length, 4);
  h.view.flyTo({ dataset: { key: 'jagalchi-hoe:2' } }, { target: { closest: () => null } });
  assert.deepEqual(h.maps[0].focused, ['jagalchi-hoe:2']);
  h.view.flyTo({ dataset: { key: 'jagalchi-hoe:2' } }, { target: { closest: () => ({}) } });
  assert.equal(h.maps[0].focused.length, 1, 'Detail link must not move the map');
  dispose(); dispose();
  assert.equal(h.maps[0].disposed, 1);
  assert.equal(h.timers.size, 0);
}
language = 'ko';
{
  const h = harness();
  const disposeA = h.view.mount({ mode: 'detail' });
  h.view.locate();
  const disposeB = h.view.mount({ id: 'jagalchi-hoe' });
  disposeA();
  h.success(0);
  assert.equal(h.maps[1].locations.length, 0, 'Old location cannot affect a replacement map');
  assert.equal(h.maps[0].disposed, 1);
  h.view.locate(); h.view.locate();
  h.success(2, 35.2, 129.2); h.success(1, 35.1, 129.1);
  assert.deepEqual(h.maps[1].locations, [[35.2, 129.2]]);
  h.view.locate(); h.success(3);
  assert.equal(h.maps[1].locations.length, 1);
  h.view.locate(); h.requests[4].error({ code: 1 });
  assert.equal(h.toasts.length, 1);
  h.view.locate(); disposeB(); h.requests[5].error({ code: 3 });
  assert.equal(h.toasts.length, 1, 'Disposed map failures stay silent');
}
{
  const h = harness();
  const dispose = h.view.mountMini({ id: 'jagalchi-hoe', i: '2' });
  assert.equal(h.maps[0].options.interactive, false);
  assert.equal(h.maps[0].places.length, 1);
  assert.equal(h.maps[0].places[0].place.name, '달봉이횟집');
  dispose(); assert.equal(h.maps[0].disposed, 1);
  h.view.mountMini({ id: 'missing', i: '0' });
  assert.equal(h.maps.length, 1);
}
{
  const h = harness(false);
  assert.ok(h.view.render({ mode: 'detail' }).includes('map-fallback'));
  h.view.mount({ mode: 'detail' })();
  assert.equal(h.maps.length, 0);
  assert.equal(h.timers.size, 0);
  h.view.mountMini({ id: 'jagalchi-hoe', i: '0' })();
  assert.ok(h.nodes['mini-map'].textContent.includes('지도를 불러오지 못했어요'));
}
{
  const h = harness(true, { shapes: { districts: [] } });
  const html = h.view.render({});
  assert.ok(html.includes('map-region-list'), 'Missing boundary data falls back to selectable district links');
  assert.ok(html.includes('#/map/region/suyeong'));
  assert.ok(h.view.render({ district: 'constructor' }).includes('<h1>404</h1>'));
  h.view.mount({ district: 'constructor', mode: 'detail' })();
  assert.equal(h.maps.length, 0, 'Invalid addresses must not open the whole-city map');
}
{
  const foods = JSON.parse(JSON.stringify(context.FOODS));
  foods.find(food => food.id === 'jagalchi-hoe').places[0].lat = null;
  const altered = context.IEBMapData.create(foods, () => 'ko');
  const h = harness(true, { data: altered });
  assert.equal((h.view.render({id:'jagalchi-hoe'}).match(/data-act="flyTo"/g)||[]).length,4,'Places without coordinates remain in the list');
  h.view.mount({id:'jagalchi-hoe'});
  assert.equal(h.maps[0].places.length,3,'Invalid coordinates are not passed to the SDK');
  assert.equal(h.maps[0].fitted.length,3);
  assert.equal(h.nodes['map-warning'].hidden,false);
  h.view.mountMini({id:'jagalchi-hoe',i:'0'})();
  assert.ok(h.nodes['mini-map'].textContent.includes('Google'),'Missing coordinates without address lookup support retain Google search guidance');
}
console.log('PASS map data/legacy IDs, four-language routes, food filtering, list/pin links, mini map, location ordering, disposal and SDK fallback');
