/* Dependency-free carousel regression checks. Run: node tests/home-carousel.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('js/app.js');
const ctx = vm.createContext({ console });
ctx.window = ctx;
vm.runInContext(read('js/data/foods.js'), ctx);
vm.runInContext(read('js/i18n.js'), ctx);
ctx.state = { lang: 'ko', sort: 'popular', savedFoods: [] };
ctx.S = () => ctx.state;
ctx.lang = () => ctx.state.lang;
ctx.t = key => ctx.I18N[ctx.state.lang][key];
ctx.L = food => food[ctx.state.lang] || food.ko;
ctx.fname = food => ctx.L(food).name;
ctx.esc = value => String(value).replaceAll('<', '&lt;');
ctx.img = id => 'assets/food/' + id + '.jpg';
ctx.foodLikes = food => food.likes;
ctx.icon = ctx.appHeader = ctx.tabbar = () => '';
const helperStart = source.indexOf('  const V = {};');
const homeStart = source.indexOf('  V.home =');
assert.ok(helperStart >= 0 && homeStart >= 0, 'Home implementation not found');
vm.runInContext(source.slice(helperStart, source.indexOf('  V.login =')), ctx);
vm.runInContext(source.slice(homeStart, source.indexOf('  V.food =')), ctx);

for (const language of ['ko', 'en', 'zh', 'ja']) {
  ctx.state.lang = language;
  for (const sort of ['popular', 'name']) {
    ctx.state.sort = sort;
    const html = vm.runInContext('V.home()', ctx);
    assert.equal((html.match(/class="food-card home-slide"/g) || []).length, 5);
    assert.equal((html.match(/class="food-card"/g) || []).length, 20);
    assert.equal((html.match(/data-slide=/g) || []).length, 5);
    assert.ok(!html.includes('undefined'), 'Missing translation or data');
  }
}
console.log('PASS 4 languages and both sorts retain 5 slides and 20 food cards');

class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.events = {}; this.attrs = {}; }
  addEventListener(key, fn) { this.events[key] = fn; }
  removeEventListener(key) { delete this.events[key]; }
  setAttribute(key, value) { this.attrs[key] = value; }
}
const slides = Array.from({ length: 5 }, (_, i) => new Element({ foodId: 'f' + i }));
const pages = Array.from({ length: 5 }, () => new Element());
const track = new Element();
Object.assign(track, { children: slides, clientWidth: 358, scrollLeft: 0 });
track.scrollTo = ({ left }) => { track.scrollLeft = left; track.events.scroll?.(); };
const prev = new Element(), next = new Element(), counter = new Element();
const elements = { '.home-track': track, '.home-prev': prev, '.home-next': next, '.home-count': counter };
ctx.app = { querySelector: selector => elements[selector], querySelectorAll: () => pages };
ctx.cleanup = [];
ctx.matchMedia = () => ({ matches: false });
const windowEvents = {};
ctx.addEventListener = (key, fn) => { windowEvents[key] = fn; };
ctx.removeEventListener = key => { delete windowEvents[key]; };
const mount = () => vm.runInContext('V.home.mount()', ctx);
const unmount = () => { ctx.cleanup.forEach(fn => fn()); ctx.cleanup = []; };
mount();
assert.equal(counter.textContent, '1 / 5');
assert.ok(prev.disabled);
next.events.click();
assert.equal(counter.textContent, '2 / 5');
track.scrollLeft = track.clientWidth * 4;
track.events.scroll();
assert.equal(counter.textContent, '5 / 5');
assert.ok(next.disabled);
assert.equal(pages[4].attrs['aria-current'], 'true');
track.events.keydown({ key: 'ArrowLeft', preventDefault() {} });
assert.equal(counter.textContent, '4 / 5');
pages[0].events.click();
assert.equal(counter.textContent, '1 / 5');
pages[3].events.click();
unmount();
assert.equal(Object.keys(windowEvents).length, 0);
assert.equal(Object.keys(track.events).length, 0);
mount();
assert.equal(counter.textContent, '4 / 5', 'Rerender must restore the selected food');
track.clientWidth = 398;
windowEvents.resize();
assert.equal(track.scrollLeft, 398 * 3);
unmount();
console.log('PASS native scroll state, navigation, boundaries, rerender, resize, and cleanup');
