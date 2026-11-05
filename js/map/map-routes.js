/* Both the application router and map links use this module. */
(function () {
  'use strict';
  const definitions = [
    [/^#\/map\/region\/([\w-]+)(?:\/(detail)(?:\/([\w-]+))?)?$/, 'map', ['district', 'mode', 'id']],
    [/^#\/map\/(detail)(?:\/([\w-]+))?$/, 'map', ['mode', 'id']],
    [/^#\/map(?:\/([\w-]+))?$/, 'map', ['id']],
  ];
  window.IEBMapRoutes = {
    definitions,
    create(data) {
      const validDistrict = id => !id || data.hasDistrict(id);
      const validFood = id => !id || data.hasFood(id);
      function resolve(params = {}) {
        const districtId = params.district || null, foodId = params.id || null;
        return { mode: params.mode === 'detail' || foodId ? 'detail' : 'overview', districtId, foodId,
          valid: validDistrict(districtId) && validFood(foodId) && (!params.mode || params.mode === 'detail') };
      }
      function overview(districtId) {
        if (!validDistrict(districtId)) return null;
        return districtId ? `#/map/region/${districtId}` : '#/map';
      }
      function detail(districtId, foodId) {
        if (!validDistrict(districtId) || !validFood(foodId)) return null;
        return (districtId ? `#/map/region/${districtId}/detail` : '#/map/detail') + (foodId ? '/' + foodId : '');
      }
      function place(record) {
        if (!record || !data.placeOf(record.food?.id, record.i)) return null;
        return `#/place/${record.food.id}/${record.i}`;
      }
      return { resolve, overview, detail, place };
    },
  };
})();
