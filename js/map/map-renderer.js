/* Pure map markup. Navigation and SDK lifetimes are owned by map-view.js. */
(function () {
  'use strict';
  window.IEBMapRenderer = {
    create({ data, routes, shapes, messages, getLanguage, districtName, t, esc, fname, img, placeImg = p => img(p.food.id), icon,
      appHeader, tabbar, mapAvailable }) {
      const region = id => data.districtById[id];
      const localized = value => window.IEBFoodLocale?.text(value, getLanguage()) ?? value;
      const selection = id => data.hasFood(id) ? id : null;
      const selectedPlaces = (foodId, districtId) => data.placesForSelection({ foodId, districtId });
      const detailLink = routes.place, overviewLink = routes.overview, detailHref = routes.detail;
      function mt(key, vars = {}) {
        let value = messages[getLanguage()]?.[key] || messages.ko[key] || key;
        for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll('{' + name + '}', replacement);
        return value;
      }
      const areaName = district => region(district) ? districtName(region(district).index) : mt('all');
      const shapesByCode = new Map((shapes?.districts || []).map(shape => [shape.code, shape]));
      function districtMap(selected) {
        if (!shapes?.viewBox || !data.districts.every(d => shapesByCode.get(d.code)?.path)) {
          return `<p class="district-note">${esc(mt('boundaryFallback'))}</p><div class="map-region-list">${data.districts.map(d => `<a class="chip${selected?.id === d.id ? ' active' : ''}" href="${overviewLink(d.id)}">${esc(districtName(d.index))}</a>`).join('')}</div>`;
        }
        return `            <svg class="district-svg" viewBox="${shapes.viewBox}" preserveAspectRatio="xMidYMin meet" role="group" aria-label="${esc(mt('mapLabel'))}">
              ${data.districts.map(d => {
                const shape = shapesByCode.get(d.code), active = d.id === selected?.id;
                return `<a class="district-region${active ? ' is-selected' : ''}" href="${overviewLink(d.id)}" aria-label="${esc(districtName(d.index))}" ${active ? 'aria-current="true"' : ''}>
                  <title>${esc(districtName(d.index))}</title><path id="district-shape-${d.id}" d="${shape.path}" fill-rule="evenodd"/></a>`;
              }).join('')}
              ${data.districts.map(d => {
                const shape = shapesByCode.get(d.code), active = d.id === selected?.id;
                return `<a class="district-label${active ? ' is-selected' : ''}" data-district="${d.id}" href="${overviewLink(d.id)}" tabindex="-1" aria-hidden="true">
                  ${shape.anchor ? `<path class="district-leader" d="M${shape.anchor.join(',')}L${shape.label.join(',')}"/>` : ''}
                  <text x="${shape.label[0]}" y="${shape.label[1]}" text-anchor="middle" dominant-baseline="central"${getLanguage() === 'en' ? ' class="district-label-en"' : ''}>${esc(districtName(d.index))}</text></a>`;
              }).join('')}
            </svg>`;
      }
      function overview({ district } = {}) {
        const selected = region(district);
        const places = data.restaurantsForSelection({ districtId: district });
        return `<main class="screen map-overview">${appHeader()}
          <section class="district-card" aria-label="${esc(mt('mapLabel'))}">
            <div class="district-heading"><h1>${esc(mt('title'))}</h1><a href="#/map" class="district-reset">${esc(mt('clear'))}</a></div>
            <div class="district-stage"><div class="district-caption"><p>${esc(mt('hint'))}</p><span>${esc(selected ? districtName(selected.index) : mt('all'))}</span></div>
            ${districtMap(selected)}</div>
            <p class="district-note">${esc(mt('preview'))}</p>
          </section>
          <div class="district-detail-action"><a class="btn btn-primary btn-block" href="${detailHref(district)}">${icon('map')}${esc(mt('detail'))}${icon('arrowRight')}</a></div>
          <section class="district-food-section" aria-labelledby="map-restaurants-heading"><div class="district-food-heading"><h2 id="map-restaurants-heading">${esc(mt('places', { n: places.length }))}</h2></div>
            <div class="map-food-list map-restaurant-list" tabindex="0" role="region" aria-labelledby="map-restaurants-heading">${places.length ? places.map(p => `<a class="map-food-card map-restaurant-row" href="${detailLink(p)}"><img src="${esc(placeImg(p))}" data-image-fallback="${esc(img(p.food.id))}" alt="" loading="lazy"><span><b lang="${esc(getLanguage())}">${esc(localized(p.name))}</b><small lang="${esc(getLanguage())}">${esc(localized(p.address || p.area || fname(p.food)))}</small></span>${icon('chevronRight')}</a>`).join('') : `<div class="district-empty"><b>${esc(mt('emptyRestaurants'))}</b><p>${esc(mt('emptyHint'))}</p></div>`}</div>
          </section>${tabbar('map')}</main>`;
      }
      function detail({ id, district } = {}) {
        const selected = selection(id), places = selectedPlaces(selected, district);
        return `<main class="map-screen">${appHeader()}
          <div class="map-detail-tools">
            <button class="icon-btn map-back" type="button" data-act="back" data-fallback="${overviewLink(district)}" aria-label="${esc(t('common.back'))}">${icon('back')}</button>
            <label class="map-region-picker"><span class="sr-only">${esc(mt('chooseRegion'))}</span>
              <select data-map-region aria-label="${esc(mt('chooseRegion'))}">
                <option value="" ${!region(district) ? 'selected' : ''}>${esc(mt('all'))}</option>
                ${data.districts.map(d => `<option value="${d.id}" ${d.id === district ? 'selected' : ''}>${esc(districtName(d.index))}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="map-wrap"><div id="map">${mapAvailable() ? '' : `<div class="map-fallback">${esc(mt('loading'))}</div>`}</div>
            <div class="map-warning" id="map-warning" role="status" hidden></div>
            <button class="locate-btn" data-act="locate" style="bottom:calc(132px + 16px)" aria-label="${esc(t('map.locate'))}">${icon('locate')}</button>
            <section class="sheet collapsed" id="sheet"><button class="sheet-handle" data-act="sheet" aria-expanded="false"><span class="sheet-title">${esc(selected ? fname(data.byId[selected]) + ' · ' : '')}${esc(t('map.nearby', { n: places.length }))}</span></button>
              <div class="sheet-list">${places.map(p => `<div class="list-item" data-act="flyTo" data-key="${data.placeKey(p.food.id, p.i)}" role="button" tabindex="0"><img class="thumb sm" src="${esc(placeImg(p))}" data-image-fallback="${esc(img(p.food.id))}" alt="${esc(p.name)}" loading="lazy">
                <span class="li-body"><span class="li-title" lang="ko">${esc(p.name)}</span><span class="li-sub">${esc(p.area)}</span><span class="li-meta">${esc(fname(p.food))} · ${esc(p.signature)}</span></span>
                <a class="save-btn" href="${detailLink(p)}" aria-label="${esc(t('map.detail'))}">${icon('chevronRight')}</a></div>`).join('')}</div></section>
          </div>${tabbar('map')}</main>`;
      }
      function invalid() {
        return `<main class="screen">${appHeader()}<div class="empty"><h1>404</h1><p>${esc(mt('invalid'))}</p><a class="btn btn-outline" href="${overviewLink()}">${esc(mt('back'))}</a></div>${tabbar('map')}</main>`;
      }
      function popup(place) {
        return `<b lang="ko">${esc(place.name)}</b>${esc(fname(place.food))} · ${esc(place.area)}<br><a href="${detailLink(place)}">${esc(t('map.detail'))} →</a>`;
      }
      function render(state) {
        if (!state.valid) return invalid();
        const params = { id: state.foodId, district: state.districtId };
        return state.mode === 'detail' ? detail(params) : overview(params);
      }
      return { render, popup, mt };
    },
  };
})();
