/* Stable map identifiers. Index matches the existing profile/i18n district order. */
(function () {
  'use strict';
  const districts = [
    ['jung', '중구', '21010'], ['seo', '서구', '21020'], ['dong', '동구', '21030'],
    ['yeongdo', '영도구', '21040'], ['busanjin', '부산진구', '21050'], ['dongnae', '동래구', '21060'],
    ['nam', '남구', '21070'], ['buk', '북구', '21080'], ['haeundae', '해운대구', '21090'],
    ['saha', '사하구', '21100'], ['geumjeong', '금정구', '21110'], ['gangseo', '강서구', '21120'],
    ['yeonje', '연제구', '21130'], ['suyeong', '수영구', '21140'], ['sasang', '사상구', '21150'],
    ['gijang', '기장군', '21310'],
  ].map(([id, name, code], index) => Object.freeze({ id, name, code, index }));
  // Explicit bindings for existing foodId:index records. Future data supplies place.districtId.
  const legacyDistricts = {
    'dwaeji-gukbap': ['suyeong', 'nam', 'nam', 'dong'],
    milmyeon: ['nam', 'busanjin', 'busanjin', 'yeonje'],
    'ssiat-hotteok': ['jung', 'jung', 'jung'],
    nakgopsae: ['dong', 'busanjin', 'dongnae', 'jung'],
    'jagalchi-hoe': ['jung', 'jung', 'jung', 'jung'],
    eomuk: ['yeongdo', 'haeundae', 'jung', 'dong'],
    'haeundae-galbi': ['haeundae', 'haeundae', 'haeundae'],
    'cheongsapo-jogae': ['haeundae', 'haeundae', 'haeundae', 'haeundae'],
    'naengchae-jokbal': ['jung', 'jung', 'jung', 'seo'],
    'gijang-daege': ['gijang', 'gijang', 'gijang', 'gijang'],
    kkomjangeo: ['seo', 'seo', 'gijang', 'gijang'],
    'dongnae-pajeon': ['dongnae', 'dongnae', 'dongnae'],
    bokguk: ['haeundae', 'haeundae', 'haeundae'],
    'bibim-dangmyeon': ['jung', 'jung'],
    'jobang-nakji': ['dong', 'busanjin', 'dongnae', 'jung'],
    multteok: ['jung', 'haeundae', 'dongnae', 'jung'],
    'yubu-jumeoni': ['jung', 'jung'],
    'sogogi-gukbap': ['haeundae', 'seo', 'gijang', 'yeonje'],
    'gijang-myeolchi': ['gijang', 'gijang', 'gijang', 'gijang'],
    'yeongdo-jeonbokjuk': ['yeongdo'],
  };
  const placeDistricts = Object.fromEntries(Object.entries(legacyDistricts)
    .flatMap(([foodId, ids]) => ids.map((districtId, index) => [`${foodId}:${index}`, districtId])));
  window.IEBMapCatalog = Object.freeze({ districts: Object.freeze(districts), placeDistricts: Object.freeze(placeDistricts) });
})();
