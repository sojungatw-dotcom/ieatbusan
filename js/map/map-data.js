/* Shared food/place projection. Keep foodId:index stable for saved items and routes. */
(function () {
  'use strict';
  window.IEBMapData = {
    create(foods, getLanguage, catalog = window.IEBMapCatalog) {
      const byId = Object.assign(Object.create(null), Object.fromEntries(foods.map(food => [food.id, food])));
      const districts = catalog.districts;
      const districtById = Object.assign(Object.create(null), Object.fromEntries(districts.map(d => [d.id, d])));
      const hasFood = id => typeof id === 'string' && Object.hasOwn(byId, id);
      const hasDistrict = id => typeof id === 'string' && Object.hasOwn(districtById, id);
      const placeKey = (foodId, index) => `${foodId}:${index}`;
      const hasCoordinates = place => Number.isFinite(place?.lat) && Number.isFinite(place?.lng)
        && Math.abs(place.lat) <= 90 && Math.abs(place.lng) <= 180;
      // Adapt source addresses from main's manuscript data; never parse translated display labels.
      function addressDistrict(address) {
        const name = String(address || '').trim().match(/^부산(?:광역시|시)?\s+(\S+)/)?.[1];
        return districts.find(district => district.name === name)?.id || null;
      }
      function placeOf(foodId, value) {
        const index = Number(value);
        if (!hasFood(foodId) || !Number.isInteger(index) || index < 0) return null;
        const food = byId[foodId], place = food.places?.[index];
        if (!place) return null;
        const original = food.ko?.restaurants?.[index] || {};
        const content = food[getLanguage()] || food.ko || {};
        const restaurant = content.restaurants?.[index] || original;
        const research = place.research || (food.manuscript?.placeRecordsMerged ? undefined : food.manuscript?.restaurants?.[index]);
        const candidate = Object.hasOwn(place, 'districtId') ? place.districtId
          : research || place.address ? addressDistrict(place.address || research?.area)
          : catalog.placeDistricts[placeKey(foodId, index)];
        return { food, i: index, key: placeKey(foodId, index), districtId: hasDistrict(candidate) ? candidate : null,
          research, imageAsset: place.imageAsset, restaurantId: place.restaurantId || null, likes: place.likes || 0, naverUrl: place.naverUrl || '',
          name: place.name || '', lat: place.lat, lng: place.lng, area: restaurant.area || original.area || '',
          signature: restaurant.signature || original.signature || '', areaKo: original.area || '',
          address: place.address || research?.area || original.address || restaurant.address || '',
          hours: place.hours || research?.hours || original.hours || restaurant.hours || '',
          holiday: place.holiday || research?.holiday || original.holiday || restaurant.holiday || '' };
      }
      const placesFor = id => hasFood(id) ? (byId[id].places || []).map((_, i) => placeOf(id, i)).filter(Boolean) : [];
      const allPlaces = () => foods.flatMap(food => placesFor(food.id));
      function placesForSelection({ foodId, districtId } = {}) {
        if ((foodId && !hasFood(foodId)) || (districtId && !hasDistrict(districtId))) return [];
        const places = foodId ? placesFor(foodId) : allPlaces();
        return districtId ? places.filter(place => place.districtId === districtId) : places;
      }
      function foodCounts(districtId) {
        const counts = new Map();
        for (const place of placesForSelection({ districtId })) counts.set(place.food.id, (counts.get(place.food.id) || 0) + 1);
        return foods.filter(food => counts.has(food.id)).map(food => ({ food, count: counts.get(food.id) }));
      }
      return { foods, byId, hasFood, placeKey, placeOf, placesFor, allPlaces, hasCoordinates,
        districts, districtById, hasDistrict, placesForSelection, foodCounts };
    },
  };
})();
