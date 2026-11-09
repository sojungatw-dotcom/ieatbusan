/* Discovery groups only: a dish may appear in several groups. Source records stay intact. */
(function () {
  'use strict';
  const groups = [
    ['seafood', ['해산물','Seafood','海鲜','海鮮'], ['nakgopsae','jagalchi-hoe','cheongsapo-jogae','gijang-daege','kkomjangeo','dongnae-pajeon','bokguk','jobang-nakji','gijang-myeolchi','yeongdo-jeonbokjuk','pohang-mulhoe','gwamegi','andong-godeungeo','yeongdeok-uljin-daege','masan-bokguk','hadong-jaecheopguk','namhae-myeolchi-ssambap','masan-agujjim','chungmu-gimbap','meongge-bibimbap','dodari-ssukguk']],
    ['soups', ['국·탕','Soups','汤羹','スープ'], ['dwaeji-gukbap','nakgopsae','bokguk','jobang-nakji','multteok','yubu-jumeoni','sogogi-gukbap','busan-wandang','daegu-kongguk','masan-bokguk','hadong-jaecheopguk','dodari-ssukguk']],
    ['noodles', ['면 요리','Noodles','面食','麺料理'], ['milmyeon','bibim-dangmyeon','jinju-naengmyeon']],
    ['meat', ['고기 요리','Meat','肉类','肉料理'], ['dwaeji-gukbap','nakgopsae','haeundae-galbi','naengchae-jokbal','sogogi-gukbap','mungtigi','andong-jjimdak','cheongdo-minari-samgyeopsal','daegu-makchang','eonyang-bulgogi','gorae-gogi','jinju-naengmyeon','jinju-bibimbap']],
    ['rice', ['밥·죽','Rice','米饭·粥','ご飯・お粥'], ['dwaeji-gukbap','sogogi-gukbap','gijang-myeolchi','yeongdo-jeonbokjuk','namhae-myeolchi-ssambap','chungmu-gimbap','meongge-bibimbap','jinju-bibimbap']],
    ['grilled', ['구이','Grilled','烧烤','焼き物'], ['haeundae-galbi','cheongsapo-jogae','kkomjangeo','andong-godeungeo','cheongdo-minari-samgyeopsal','daegu-makchang','eonyang-bulgogi']],
    ['street', ['분식','Street food','街头小吃','軽食'], ['ssiat-hotteok','eomuk','bibim-dangmyeon','multteok','yubu-jumeoni','busan-wandang','daegu-napjak-mandu','chungmu-gimbap']],
    ['snacks', ['간식·디저트','Snacks','点心','おやつ'], ['ssiat-hotteok','eomuk','multteok','daegu-kongguk','daegu-napjak-mandu','uiryeong-manggaetteok']],
    ['dumplings', ['만두·완당','Dumplings','饺子·云吞','餃子・ワンタン'], ['busan-wandang','daegu-napjak-mandu','yubu-jumeoni']],
    ['spicy', ['매콤한 맛','Spicy','香辣','ピリ辛'], ['nakgopsae','kkomjangeo','jobang-nakji','masan-agujjim','sogogi-gukbap','pohang-mulhoe']],
  ].map(([id, names, foods]) => Object.freeze({ id, names: Object.freeze(names), foods: Object.freeze(foods), image: 'assets/categories/' + id + '.svg' }));
  const languageIndex = {ko:0,en:1,zh:2,ja:3};
  window.IEBFoodCategories = Object.freeze({
    groups: Object.freeze(groups),
    byId: id => groups.find(group => group.id === id),
    name: (group, language) => group.names[languageIndex[language] ?? 0],
    foods: (id, foods) => id === 'all' ? [...foods] : foods.filter(food => groups.find(group => group.id === id)?.foods.includes(food.id)),
  });
})();
