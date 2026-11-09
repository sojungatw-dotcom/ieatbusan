/* Discovery groups only: a dish may appear in several groups. Source records stay intact. */
(function () {
  'use strict';
  const groups = [
    ['meat', ['육류','Meat','肉类','肉料理'], ['dwaeji-gukbap','nakgopsae','haeundae-galbi','naengchae-jokbal','sogogi-gukbap','mungtigi','andong-jjimdak','cheongdo-minari-samgyeopsal','daegu-makchang','eonyang-bulgogi','gorae-gogi','jinju-naengmyeon','jinju-bibimbap']],
    ['seafood', ['해산물','Seafood','海鲜','海鮮'], ['nakgopsae','jagalchi-hoe','cheongsapo-jogae','gijang-daege','kkomjangeo','dongnae-pajeon','bokguk','jobang-nakji','gijang-myeolchi','yeongdo-jeonbokjuk','pohang-mulhoe','gwamegi','andong-godeungeo','yeongdeok-uljin-daege','masan-bokguk','hadong-jaecheopguk','namhae-myeolchi-ssambap','masan-agujjim','chungmu-gimbap','meongge-bibimbap','dodari-ssukguk','gorae-gogi']],
    ['steamed', ['찜','Steamed & braised','蒸炖','蒸し物・煮込み'], ['gijang-daege','yeongdeok-uljin-daege','andong-jjimdak','masan-agujjim']],
    ['soups', ['국·탕','Soups & stews','汤羹','スープ・鍋'], ['dwaeji-gukbap','nakgopsae','bokguk','jobang-nakji','multteok','yubu-jumeoni','sogogi-gukbap','busan-wandang','masan-bokguk','hadong-jaecheopguk','dodari-ssukguk']],
    ['noodles', ['면 요리','Noodles','面食','麺料理'], ['milmyeon','bibim-dangmyeon','jinju-naengmyeon']],
    ['rice', ['밥·죽','Rice','米饭·粥','ご飯・お粥'], ['dwaeji-gukbap','sogogi-gukbap','gijang-myeolchi','yeongdo-jeonbokjuk','namhae-myeolchi-ssambap','chungmu-gimbap','meongge-bibimbap','jinju-bibimbap']],
    ['street', ['분식·간식','Street food & snacks','小吃·点心','軽食・おやつ'], ['ssiat-hotteok','eomuk','bibim-dangmyeon','multteok','yubu-jumeoni','busan-wandang','daegu-napjak-mandu','chungmu-gimbap','daegu-kongguk','uiryeong-manggaetteok']],
    ['spicy', ['매운맛','Spicy','香辣','辛い料理'], ['nakgopsae','kkomjangeo','jobang-nakji','masan-agujjim','sogogi-gukbap','pohang-mulhoe','andong-jjimdak','chungmu-gimbap']],
  ].map(([id, names, foods]) => Object.freeze({ id, names: Object.freeze(names), foods: Object.freeze(foods), image: 'assets/categories/' + id + '.svg?v=20261109-eight-categories' }));
  const languageIndex = {ko:0,en:1,zh:2,ja:3};
  window.IEBFoodCategories = Object.freeze({
    groups: Object.freeze(groups),
    byId: id => groups.find(group => group.id === id),
    name: (group, language) => group.names[languageIndex[language] ?? 0],
    foods: (id, foods) => id === 'all' ? [...foods] : foods.filter(food => groups.find(group => group.id === id)?.foods.includes(food.id)),
  });
})();
