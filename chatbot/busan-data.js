/* The chatbot reads the same local catalog as the application. */
(function(root){'use strict';root.BusanData={source:'앱 공용 js/data/foods.js',syncedAt:"2026-11-10T00:25:24.106Z",sha256:"dd020a224f0c74e096d1d2645834e6cb48f0bf09be93a446c7ddc11a3e0250ee",foods:root.FOODS.map(food=>({...food,photo:'../'+(food.photo||'assets/food/'+food.id+'.jpg')}))};})(globalThis);
