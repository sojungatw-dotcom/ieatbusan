/* Schema.org descriptions of the rendered public screen, never a second catalog. */
(function () {
  'use strict';
  const ORIGIN = 'https://ieatbusan-eight.vercel.app/';
  const SITE_ID = ORIGIN + '#website';
  const SCRIPT_ID = 'ieb-structured-data';
  const PUBLIC = new Set(['home', 'category', 'food', 'place', 'map', 'faq', 'contact', 'terms', 'privacy', 'credits', 'notices']);
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const text = (root, selector) => clean(root?.querySelector(selector)?.textContent);
  function internalUrl(value) {
    if (!value) return undefined;
    try {
      const url = new URL(value, ORIGIN);
      // Only public app routes, never current-location query strings or signed/user photos.
      if (url.origin !== new URL(ORIGIN).origin || url.pathname !== '/' || url.search) return undefined;
      if (url.hash && !/^#\/(?:home|category\/[\w-]+|food\/[\w-]+|place\/[\w-]+\/\d+|map(?:\/[\w-]+)*|faq|contact|terms|privacy|credits|notices)$/.test(url.hash)) return undefined;
      return url.href;
    } catch { return undefined; }
  }
  function assetUrl(value) {
    if (!value) return undefined;
    try {
      const url = new URL(value, ORIGIN);
      if (url.origin !== new URL(ORIGIN).origin || !/^\/assets\/(?:food|restaurant)\/[\w.-]+\.(?:jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname)) return undefined;
      return url.origin + url.pathname;
    } catch { return undefined; }
  }
  function read({ name, root, language }) {
    const snapshot = { name, language, url: internalUrl(location.hash || '#/home') };
    if (!PUBLIC.has(name) || !root) return snapshot;
    snapshot.title = text(root, 'h1');
    if (name === 'home' || name === 'category') {
      const selector = name === 'home' ? '.home-track .home-slide' : '.food-list .food-card';
      snapshot.valid = name === 'home' ? !!root.querySelector('.home-intro') : root.matches('.category-screen');
      snapshot.description = name === 'home' ? text(root, '.home-intro p') : text(root, '.category-note');
      snapshot.listName = text(root, name === 'home' ? '#home-featured-title' : 'h1');
      snapshot.items = [...root.querySelectorAll(selector)].map(card => ({
        name: text(card, '.name'), alternateName: text(card, '.orig'),
        description: text(card, '.home-summary'),
        url: internalUrl(card.querySelector('a.names')?.getAttribute('href')),
        image: assetUrl(card.querySelector('.photo img')?.getAttribute('src')),
      }));
    } else if (name === 'food' || name === 'place') {
      snapshot.valid = !!root.querySelector(name === 'food' ? '.section-chips' : '.place-info');
      snapshot.title = text(root, '.title-block h1');
      snapshot.description = name === 'food' ? text(root, '.title-block .summary') : '';
      snapshot.alternateName = name === 'food' ? text(root, '.title-block .orig-line') : '';
      snapshot.image = assetUrl(root.querySelector('.hero img')?.getAttribute('src'));
      if (name === 'place') snapshot.address = text(root, '.place-info .row span');
    } else snapshot.valid = !!snapshot.title;
    return snapshot;
  }
  function build(snapshot = {}) {
    const site = { '@type': 'WebSite', '@id': SITE_ID, url: ORIGIN, name: '무보소', alternateName: ['I EAT BUSAN', 'MUBOSO'], inLanguage: ['ko', 'en', 'zh', 'ja'] };
    const graph = [site];
    const url = internalUrl(snapshot.url);
    const title = clean(snapshot.title);
    if (!PUBLIC.has(snapshot.name) || !snapshot.valid || !url || !title) return { '@context': 'https://schema.org', '@graph': graph };
    const page = { '@type': ['home', 'category'].includes(snapshot.name) ? 'CollectionPage' : 'WebPage', '@id': url, url, name: title, inLanguage: ['ko', 'en', 'zh', 'ja'].includes(snapshot.language) ? snapshot.language : 'ko', isPartOf: { '@id': SITE_ID } };
    if (clean(snapshot.description)) page.description = clean(snapshot.description);
    if (['home', 'category'].includes(snapshot.name)) {
      const items = (snapshot.items || []).filter(item => clean(item.name) && internalUrl(item.url)).map((item, i) => {
        const entry = { '@type': 'Thing', name: clean(item.name), url: internalUrl(item.url) };
        if (clean(item.alternateName)) entry.alternateName = clean(item.alternateName);
        if (clean(item.description)) entry.description = clean(item.description);
        if (assetUrl(item.image)) entry.image = assetUrl(item.image);
        return { '@type': 'ListItem', position: i + 1, item: entry };
      });
      page.mainEntity = { '@type': 'ItemList', name: clean(snapshot.listName) || title, numberOfItems: items.length, itemListElement: items };
    } else if (snapshot.name === 'food' || snapshot.name === 'place') {
      const entity = { '@type': snapshot.name === 'place' ? 'Restaurant' : 'Thing', name: title, url };
      if (clean(snapshot.description)) entity.description = clean(snapshot.description);
      if (clean(snapshot.alternateName)) entity.alternateName = clean(snapshot.alternateName);
      if (assetUrl(snapshot.image)) entity.image = assetUrl(snapshot.image);
      // Address is copied verbatim from the restaurant's visible information row.
      if (snapshot.name === 'place' && clean(snapshot.address) && !/확인|unconfirmed|未確認|未确认/i.test(snapshot.address)) entity.address = { '@type': 'PostalAddress', streetAddress: clean(snapshot.address) };
      page.mainEntity = entity;
    }
    graph.push(page);
    return { '@context': 'https://schema.org', '@graph': graph };
  }
  const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  let currentContext;
  function update(context) {
    currentContext = context;
    const script = document.getElementById(SCRIPT_ID);
    if (script) script.textContent = serialize(build(read(context)));
  }
  window.IEBStructuredData = Object.freeze({ read, build, serialize, update, refresh: () => { if (currentContext) update(currentContext); } });
})();
