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
const prev = new Element(), next = new Element(), counter = new Element(), carousel = new Element(), autoplay = new Element();
const elements = { '.home-track': track, '.home-prev': prev, '.home-next': next, '.home-count': counter,
  '.home-carousel': carousel, '.home-autoplay': autoplay };
ctx.app = { querySelector: selector => elements[selector], querySelectorAll: () => pages };
ctx.cleanup = [];
ctx.matchMedia = () => ({ matches: false });
const documentEvents = {};
ctx.document = { hidden: false, addEventListener: (key, fn) => { documentEvents[key] = fn; },
  removeEventListener: key => { delete documentEvents[key]; } };
let now = 0, timerId = 0;
const timers = new Map();
ctx.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, due: now + delay }); return id; };
ctx.clearTimeout = id => timers.delete(id);
function advance(milliseconds) {
  const end = now + milliseconds;
  for (;;) {
    const next = [...timers].filter(([, timer]) => timer.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
    if (!next) break;
    now = next[1].due;
    timers.delete(next[0]);
    next[1].fn();
  }
  now = end;
}
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

mount();
pages[0].events.click();
advance(3999);
assert.equal(counter.textContent, '1 / 5');
advance(1);
assert.equal(counter.textContent, '2 / 5');
pages[4].events.click();
advance(4000);
assert.equal(counter.textContent, '1 / 5', 'Autoplay wraps after the last slide');
carousel.events.pointerdown({ pointerId: 1 });
advance(12000);
assert.equal(counter.textContent, '1 / 5', 'Must not move while the finger is down');
windowEvents.pointerup({ pointerId: 1 });
advance(3999);
assert.equal(counter.textContent, '1 / 5');
advance(1);
assert.equal(counter.textContent, '2 / 5');
advance(3500);
next.events.click();
advance(500);
assert.equal(counter.textContent, '3 / 5', 'Manual move restarts the full four-second delay');
advance(3500);
assert.equal(counter.textContent, '4 / 5');
carousel.events.pointerdown({ pointerId: 2 });
windowEvents.pointercancel({ pointerId: 2 });
advance(4000);
assert.equal(counter.textContent, '5 / 5');
carousel.events.touchstart();
carousel.events.pointerdown({ pointerId: 3 });
windowEvents.pointercancel({ pointerId: 3 });
advance(8000);
assert.equal(counter.textContent, '5 / 5', 'Native pan cancellation must not end the physical touch pause');
windowEvents.touchend({ touches: [] });
advance(4000);
assert.equal(counter.textContent, '1 / 5');
autoplay.events.click();
advance(12000);
assert.equal(counter.textContent, '1 / 5', 'Pause button stops autoplay');
assert.equal(autoplay.attrs['aria-pressed'], 'true');
autoplay.events.click();
advance(4000);
assert.equal(counter.textContent, '2 / 5');
ctx.document.hidden = true;
documentEvents.visibilitychange();
advance(12000);
assert.equal(counter.textContent, '2 / 5', 'Background tabs must not rotate');
ctx.document.hidden = false;
documentEvents.visibilitychange();
advance(4000);
assert.equal(counter.textContent, '3 / 5');
unmount();
assert.equal(timers.size, 0);
assert.equal(Object.keys(documentEvents).length, 0);
assert.equal(Object.keys(windowEvents).length, 0);
assert.equal(Object.keys(carousel.events).length, 0);
advance(12000);
assert.equal(counter.textContent, '3 / 5', 'Leaving home must cancel autoplay');
console.log('PASS four-second delay, wrap, touch pause/resume, manual reset, pause button, visibility, timer cleanup');
