/* Verify the map projection against the current main catalog, not legacy counts. */
'use strict';
const assert = require('node:assert/strict');
const ctx = require('./map-context.cjs')();
const data = ctx.IEBMapData.create(ctx.FOODS, () => 'ko');
const records = data.allPlaces();
assert.equal(records.length, ctx.FOODS.reduce((n, food) => n + food.places.length, 0));
for (const food of ctx.FOODS.filter(food => food.manuscript)) {
  food.places.forEach((source, i) => {
    const record = data.placeOf(food.id, i), research = food.manuscript.restaurants[i];
    assert.equal(record.research, research, 'Preserve teammate restaurant detail content');
    const name = research.area.match(/^부산(?:광역시|시)?\s+(\S+)/)?.[1];
    const district = data.districts.find(item => item.name === name);
    assert.equal(record.districtId, district?.id || null, food.id + ':' + i + ' must use its new source address');
    assert.equal(data.hasCoordinates(record), false, 'Never invent research coordinates');
  });
}
const moved = { id: 'milmyeon', manuscript: { restaurants: [{area: '부산광역시 수영구 수영로 1'}] },
  ko: {name: '밀면', restaurants: [{area: '표시 문구'}]}, places: [{name: '새 식당', lat: null, lng: null}] };
const adapted = ctx.IEBMapData.create([moved], () => 'en');
assert.equal(adapted.placeOf('milmyeon', 0).districtId, 'suyeong', 'Replaced records must not inherit a legacy district');
moved.manuscript.restaurants[0].area = '서울 중구 세종대로 1';
assert.equal(adapted.placeOf('milmyeon', 0).districtId, null, 'Other cities cannot match a Busan district');
moved.places[0].districtId = 'nam';
assert.equal(adapted.placeOf('milmyeon', 0).districtId, 'nam', 'Explicit region always wins');
const navigations = [];
const view = ctx.IEBMapView.create({data, provider: {available: () => false}, root: {querySelector: () => null},
  document: {getElementById: () => null}, navigator: {}, getLanguage: () => 'ko',
  t: key => ctx.I18N.ko[key] || key, esc: String, fname: food => food.ko.name,
  img: id => id, icon: () => '', appHeader: () => '', tabbar: () => '', toast() {},
  setTimeout: () => 1, clearTimeout() {}, navigate: href => navigations.push(href)});
const withoutCoordinates = records.find(record => !data.hasCoordinates(record));
view.flyTo({dataset: {key: withoutCoordinates.key}}, {target: {closest: () => null}});
assert.equal(navigations.at(-1), '#/place/' + withoutCoordinates.food.id + '/' + withoutCoordinates.i,
  'A coordinate-less list row opens detail even when the map SDK is unavailable');
view.flyTo({dataset: {key: withoutCoordinates.key}}, {target: {closest: () => ({})}});
assert.equal(navigations.length, 1, 'The nested detail link retains native navigation');
console.log('PASS current-main catalog, research details, source-address districts, explicit overrides and coordinate-less row navigation');
