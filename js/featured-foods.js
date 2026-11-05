/* A shared two-hour random selection, independent of likes and display sorting. */
(function (root) {
  'use strict';
  const intervalMs = 2 * 60 * 60 * 1000;
  const periodAt = now => Math.floor(now / intervalMs);
  function select(foods, now = Date.now()) {
    const unique = new Map(foods.filter(food => food && typeof food.id === 'string').map(food => [food.id, food]));
    const pool = [...unique.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    let seed = 2166136261;
    const key = 'ieatbusan-featured:' + periodAt(now) + ':' + pool.map(food => food.id).join(',');
    for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619) >>> 0;
    const random = () => {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let value = seed;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 5);
  }
  const api = { intervalMs, periodAt: (now = Date.now()) => periodAt(now), nextRefreshAt: (now = Date.now()) => (periodAt(now) + 1) * intervalMs, select };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IEBFeaturedFoods = api;
})(typeof window === 'object' ? window : null);
