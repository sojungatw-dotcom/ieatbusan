/* EN / Simplified Chinese / Japanese translations of the current Korean food summaries. */
(function () {
  'use strict';
  const summaries = {
  "dwaeji-gukbap": [
    "A signature Busan meal of rice served with hot pork soup.",
    "釜山代表性的一餐，将米饭与热腾腾的猪肉汤搭配享用。",
    "豚肉入りの熱いスープにご飯を添えた、釜山を代表する一食。"
  ],
  "milmyeon": [
    "A Busan wheat-noodle dish served in chilled broth or mixed with a spicy sauce.",
    "釜山特色小麦面，可配冰凉高汤，也可拌上香辣酱料享用。",
    "小麦麺を冷たいスープ、または辛いタレで味わう釜山の麺料理。"
  ],
  "ssiat-hotteok": [
    "A sweet Busan street snack: a hotteok pancake split open and filled with seeds and nuts.",
    "将甜馅糖饼切开，填入种子和坚果的釜山街头小吃。",
    "甘いホットクを開いて種やナッツを詰めた、釜山の屋台おやつ。"
  ],
  "nakgopsae": [
    "A spicy Busan stew of small octopus, beef offal and shrimp, served with rice.",
    "将章鱼、牛内脏和虾一起煮成香辣炖菜，配米饭享用的釜山料理。",
    "テナガダコ・牛もつ・エビを辛く煮込み、ご飯と味わう釜山料理。"
  ],
  "naengchae-jokbal": [
    "Chilled cooked pork trotters served with jellyfish and vegetables in a sharp mustard sauce.",
    "将煮熟的猪蹄与海蜇、蔬菜搭配，拌上辛香芥末酱的凉菜。",
    "ゆでた豚足をクラゲや野菜とともに、ツンとした辛さのからしソースで味わう冷菜。"
  ],
  "kkomjangeo": [
    "A Busan grilled hagfish dish seasoned with salt or a spicy sauce.",
    "以盐或香辣酱料调味后烤制的釜山盲鳗料理。",
    "ヌタウナギを塩や辛いタレで焼いて味わう、釜山の焼き物料理。"
  ],
  "dongnae-pajeon": [
    "Dongnae's thick, moist scallion pancake, made with scallions and assorted seafood.",
    "加入小葱和多种海鲜，煎得厚实湿润的东莱葱饼。",
    "青ネギとさまざまな海鮮を入れ、厚くしっとりと焼き上げる東莱のチヂミ。"
  ],
  "jobang-nakji": [
    "A Busan-style small-octopus dish simmered with vegetables in a rich sauce, served with rice.",
    "将章鱼和蔬菜以少量酱汁炖煮，配米饭享用的釜山式章鱼料理。",
    "テナガダコと野菜を少なめのタレで煮て、ご飯と味わう釜山式タコ料理。"
  ],
  "multteok": [
    "A Busan market snack of long rice cakes on skewers, warmed in fish-cake broth.",
    "将条状年糕串在竹签上，放入鱼饼汤中加热享用的釜山市场小吃。",
    "棒状の餅を串に刺し、練り物のスープで温めて食べる釜山の市場おやつ。"
  ],
  "busan-wandang": [
    "A Busan dish of small, thin-skinned wontons served in a clear broth.",
    "将薄皮小馄饨盛入清汤中享用的釜山料理。",
    "薄い皮で包んだ小さなワンタンを、澄んだスープで味わう釜山料理。"
  ],
  "pohang-mulhoe": [
    "Finely sliced raw fish and vegetables served with a spicy, tangy sauce and chilled broth.",
    "将细切生鱼片和蔬菜搭配酸辣酱料与冰凉汤汁享用的水拌生鱼片。",
    "細かく切った刺身と野菜を、辛酸っぱいタレや冷たいスープで味わうムルフェ。"
  ],
  "gwamegi": [
    "A winter delicacy of semi-dried Pacific saury or herring wrapped in seaweed and vegetables.",
    "将半风干的秋刀鱼或鲱鱼用海藻、蔬菜包着吃的冬季美食。",
    "半干しのサンマやニシンを海藻や野菜で包んで食べる、冬の味覚。"
  ],
  "mungtigi": [
    "Thick slices of raw beef dipped in a sauce of garlic, chili powder and sesame oil.",
    "将厚切生牛肉蘸蒜、辣椒粉和芝麻油调成的酱料享用。",
    "厚切りの生牛肉を、ニンニク・唐辛子粉・ごま油のタレにつけて味わう料理。"
  ],
  "andong-jjimdak": [
    "Chicken simmered with glass noodles, potatoes and vegetables in a soy-based sauce.",
    "将鸡肉、粉条、土豆和蔬菜以酱油酱汁焖煮而成的料理。",
    "鶏肉・春雨・ジャガイモ・野菜を醤油ベースのタレで煮込んだ料理。"
  ],
  "andong-godeungeo": [
    "Salted mackerel grilled or braised and served with rice, reflecting Andong's tradition of preserved foods.",
    "将盐渍鲭鱼烤制或炖煮后配米饭享用，体现安东的食物保存传统。",
    "塩漬けのサバを焼いたり煮たりしてご飯と食べる、安東の保存食文化を伝える料理。"
  ],
  "yeongdeok-uljin-daege": [
    "A delicacy of steamed snow crab from Korea's east coast, enjoyed for its leg and body meat.",
    "将韩国东海岸雪蟹蒸熟，剥取蟹腿与蟹身肉享用的美食。",
    "韓国東海岸のズワイガニを蒸し、脚や胴の身を取り出して味わう料理。"
  ],
  "daegu-kongguk": [
    "A Daegu snack of warm soy milk soup served with fried dough and other toppings.",
    "在温热豆浆汤中搭配油炸面食等配料的大邱小吃。",
    "温かい豆乳スープに揚げパンなどを添えて味わう、大邱のおやつ。"
  ],
  "cheongdo-minari-samgyeopsal": [
    "A Cheongdo specialty pairing fragrant Hanjae minari with grilled pork belly.",
    "将清香的寒斋水芹与五花肉一起烤着吃的清道特色料理。",
    "香り豊かなハンジェのセリを豚バラ肉と一緒に焼いて楽しむ、清道の食文化。"
  ],
  "daegu-makchang": [
    "A Daegu specialty of grilled beef or pork offal dipped in a special sauce.",
    "将牛或猪的肠胃部位烤熟后，蘸特制酱料享用的大邱烧烤料理。",
    "牛や豚の内臓を焼き、特製のタレにつけて食べる大邱の焼き物料理。"
  ],
  "daegu-napjak-mandu": [
    "Flat, lightly filled pan-fried dumplings topped with soy sauce, scallions and other garnishes.",
    "馅料较少、煎得扁平的饺子，淋上酱油并撒上葱等配料享用。",
    "具を少なめにして平たく焼いた餃子に、醤油やネギなどをのせて食べるおやつ。"
  ],
  "eonyang-bulgogi": [
    "Eonyang-style bulgogi made with thinly sliced, seasoned beef grilled on a wire rack or similar grill.",
    "将薄切牛肉调味后放在烤网上等烤制的彦阳式烤牛肉。",
    "薄切りの牛肉に味をつけ、焼き網などで焼いて食べる彦陽式プルコギ。"
  ],
  "gorae-gogi": [
    "An introduction to whale-meat food culture and its connection to the whaling history of Jangsaengpo, Ulsan.",
    "介绍与蔚山长生浦捕鲸历史相关的鲸肉饮食文化。",
    "蔚山・長生浦の捕鯨の歴史と結びついた、鯨肉の食文化に関する紹介。"
  ],
  "jinju-naengmyeon": [
    "Jinju-style chilled noodles featuring seafood broth and a topping of pan-fried, egg-coated beef.",
    "以海鲜高汤和裹蛋煎牛肉配料为特色的晋州式冷面。",
    "海鮮だしと、牛肉に卵を絡めて焼いたユクチョンのトッピングが特徴の晋州式冷麺。"
  ],
  "masan-bokguk": [
    "A signature soup from Masan's pufferfish restaurant street, made by simmering pufferfish with vegetables.",
    "将河豚与蔬菜一起煮成的汤，是马山河豚料理街的代表性美食。",
    "フグと野菜を煮込んだ、馬山のフグ料理通りを代表するスープ料理。"
  ],
  "hadong-jaecheopguk": [
    "A clear soup made with small freshwater clams, served with chives and other garnishes.",
    "用小型淡水蚬煮成清汤，搭配韭菜等配料享用。",
    "小さなシジミを煮出した澄んだスープに、ニラなどを添えて味わう料理。"
  ],
  "namhae-myeolchi-ssambap": [
    "Large anchovies braised with vegetables and seasonings, wrapped in greens with rice.",
    "将大鳀鱼与蔬菜、调料一起炖煮，再用菜叶包着米饭享用。",
    "大ぶりのカタクチイワシを野菜や調味料と煮て、ご飯と一緒に葉野菜で包んで食べる料理。"
  ],
  "masan-agujjim": [
    "A Masan dish of monkfish and bean sprouts steamed in a spicy sauce.",
    "将鮟鱇鱼和豆芽等拌入香辣酱料后蒸制的马山料理。",
    "アンコウや豆もやしなどを辛いタレで和えて蒸した、馬山の料理。"
  ],
  "chungmu-gimbap": [
    "Small, unfilled seaweed rice rolls served with spicy squid salad and radish kimchi.",
    "小份无馅紫菜饭卷，搭配香辣拌鱿鱼和萝卜泡菜享用。",
    "具なしの小さな海苔巻きを、辛いイカの和え物や大根キムチと食べる料理。"
  ],
  "meongge-bibimbap": [
    "Rice mixed with sea squirt, vegetables and seaweed for a taste of the sea.",
    "将海鞘、蔬菜和紫菜等拌入米饭，品尝海洋风味的料理。",
    "ホヤや野菜、海苔などをご飯に混ぜ、磯の香りを楽しむ料理。"
  ],
  "dodari-ssukguk": [
    "A Tongyeong soup of white fish and tender mugwort, celebrating the fragrance of spring.",
    "将白肉鱼与嫩艾草一起煮成的统营汤品，充满春日清香。",
    "白身魚と若いヨモギを一緒に煮込み、春の香りを楽しむ統営のスープ。"
  ],
  "jinju-bibimbap": [
    "Jinju-style bibimbap with beautifully arranged vegetables and meat, mixed with rice before eating.",
    "将蔬菜、肉等配料精美摆放，再拌匀享用的晋州拌饭。",
    "ナムルや肉などを彩りよく盛りつけ、混ぜて食べる晋州のビビンバ。"
  ],
  "uiryeong-manggaetteok": [
    "A Uiryeong rice cake filled with red bean paste and wrapped in greenbrier leaves for their delicate aroma.",
    "将包有红豆馅的米糕用菝葜叶裹起，增添叶香的宜宁特色米糕。",
    "あんこ入りの米粉の餅をサルトリイバラの葉で包み、葉の香りを添えた宜寧の餅。"
  ]
};
  function apply(food) {
    const translated = summaries[food.id];
    if (!translated) return;
    for (const [i, language] of ['en', 'zh', 'ja'].entries()) {
      food[language] = { ...food[language], summary: food.editorSummaries?.[language] ?? translated[i] };
    }
  }
  window.IEBFoodSummaries = { apply };
  for (const food of window.FOODS || []) apply(food);
})();
