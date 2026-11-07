/* Exact translations of the eight manuscript information rows. Korean source stays intact. */
(function () {
  'use strict';
  const phrases = {
  "국밥": [
    "Rice soup",
    "汤饭",
    "クッパ"
  ],
  "차가운 면": [
    "Cold noodles",
    "冷面",
    "冷たい麺"
  ],
  "길거리 간식": [
    "Street snack",
    "街头小吃",
    "屋台のおやつ"
  ],
  "전골·볶음": [
    "Hot pot / stir-fry",
    "火锅·炒菜",
    "鍋・炒め物"
  ],
  "족발 냉채": [
    "Chilled pork trotter salad",
    "凉拌猪蹄",
    "豚足の冷菜"
  ],
  "수산물 구이": [
    "Grilled seafood",
    "烤海鲜",
    "海鮮の焼き物"
  ],
  "해물파전": [
    "Seafood scallion pancake",
    "海鲜葱饼",
    "海鮮ネギチヂミ"
  ],
  "낙지 전골·볶음": [
    "Small-octopus hot pot / stir-fry",
    "章鱼火锅·炒章鱼",
    "テナガダコの鍋・炒め物"
  ],
  "떡꼬치·시장 간식": [
    "Skewered rice cakes / market snack",
    "年糕串·市场小吃",
    "串餅・市場のおやつ"
  ],
  "완당국": [
    "Wonton soup",
    "馄饨汤",
    "ワンタンスープ"
  ],
  "생선회·찬 국물": [
    "Raw fish in chilled broth",
    "生鱼片·冷汤",
    "刺身・冷たいスープ"
  ],
  "반건조 생선": [
    "Semi-dried fish",
    "半风干鱼",
    "半干しの魚"
  ],
  "생소고기": [
    "Raw beef",
    "生牛肉",
    "生牛肉"
  ],
  "닭고기 조림": [
    "Braised chicken",
    "炖鸡",
    "鶏肉の煮込み"
  ],
  "염장 생선·구이": [
    "Salted / grilled fish",
    "盐渍鱼·烤鱼",
    "塩漬け魚・焼き魚"
  ],
  "갑각류 찜": [
    "Steamed shellfish",
    "清蒸甲壳类",
    "甲殻類の蒸し物"
  ],
  "따뜻한 콩국": [
    "Warm soybean soup",
    "热豆汤",
    "温かい豆乳スープ"
  ],
  "돼지고기 구이": [
    "Grilled pork",
    "烤猪肉",
    "豚肉の焼き物"
  ],
  "내장 구이": [
    "Grilled offal",
    "烤内脏",
    "ホルモン焼き"
  ],
  "만두·분식": [
    "Dumplings / casual snacks",
    "饺子·小吃",
    "餃子・軽食"
  ],
  "소고기 구이": [
    "Grilled beef",
    "烤牛肉",
    "牛肉の焼き物"
  ],
  "식문화 조사·보류": [
    "Food-culture research / on hold",
    "饮食文化调查·暂缓",
    "食文化調査・保留"
  ],
  "복어국": [
    "Pufferfish soup",
    "河豚汤",
    "フグのスープ"
  ],
  "조개국": [
    "Clam soup",
    "贝类汤",
    "貝のスープ"
  ],
  "생선 조림·쌈밥": [
    "Braised fish / rice in leafy wraps",
    "炖鱼·包饭",
    "魚の煮付け・葉野菜の包みご飯"
  ],
  "생선찜": [
    "Steamed fish",
    "蒸鱼",
    "魚の蒸し物"
  ],
  "김밥·분식": [
    "Seaweed rice rolls / casual snacks",
    "紫菜饭卷·小吃",
    "海苔巻き・軽食"
  ],
  "해산물 비빔밥": [
    "Seafood bibimbap",
    "海鲜拌饭",
    "海鮮ビビンバ"
  ],
  "생선국·봄 메뉴": [
    "Fish soup / spring specialty",
    "鱼汤·春季菜品",
    "魚のスープ・春の料理"
  ],
  "비빔밥": [
    "Bibimbap",
    "拌饭",
    "ビビンバ"
  ],
  "떡·간식": [
    "Rice cakes / snacks",
    "米糕·小吃",
    "餅・おやつ"
  ],
  "부산": [
    "Busan",
    "釜山",
    "釜山"
  ],
  "부산 남포동": [
    "Nampo-dong, Busan",
    "釜山南浦洞",
    "釜山・南浦洞"
  ],
  "부산 부평동": [
    "Bupyeong-dong, Busan",
    "釜山富平洞",
    "釜山・富平洞"
  ],
  "부산 자갈치·기장·동래": [
    "Jagalchi / Gijang / Dongnae, Busan",
    "釜山札嘎其·机张·东莱",
    "釜山・チャガルチ・機張・東莱"
  ],
  "부산 동래": [
    "Dongnae, Busan",
    "釜山东莱",
    "釜山・東莱"
  ],
  "부산 범일동·동래": [
    "Beomil-dong / Dongnae, Busan",
    "釜山凡一洞·东莱",
    "釜山・凡一洞・東莱"
  ],
  "부산 남포동·부용동": [
    "Nampo-dong / Buyong-dong, Busan",
    "釜山南浦洞·芙蓉洞",
    "釜山・南浦洞・芙蓉洞"
  ],
  "경북 포항": [
    "Pohang, Gyeongsangbuk-do",
    "庆尚北道浦项",
    "慶尚北道・浦項"
  ],
  "경북 포항 구룡포": [
    "Guryongpo, Pohang, Gyeongsangbuk-do",
    "庆尚北道浦项九龙浦",
    "慶尚北道・浦項・九龍浦"
  ],
  "대구": [
    "Daegu",
    "大邱",
    "大邱"
  ],
  "경북 안동": [
    "Andong, Gyeongsangbuk-do",
    "庆尚北道安东",
    "慶尚北道・安東"
  ],
  "경북 영덕·울진": [
    "Yeongdeok / Uljin, Gyeongsangbuk-do",
    "庆尚北道盈德·蔚珍",
    "慶尚北道・盈徳・蔚珍"
  ],
  "경북 청도 한재": [
    "Hanjae, Cheongdo, Gyeongsangbuk-do",
    "庆尚北道清道寒斋",
    "慶尚北道・清道・ハンジェ"
  ],
  "울산 울주 언양": [
    "Eonyang, Ulju, Ulsan",
    "蔚山蔚州彦阳",
    "蔚山・蔚州・彦陽"
  ],
  "울산 장생포": [
    "Jangsaengpo, Ulsan",
    "蔚山长生浦",
    "蔚山・長生浦"
  ],
  "경남 진주": [
    "Jinju, Gyeongsangnam-do",
    "庆尚南道晋州",
    "慶尚南道・晋州"
  ],
  "경남 창원 마산": [
    "Masan, Changwon, Gyeongsangnam-do",
    "庆尚南道昌原马山",
    "慶尚南道・昌原・馬山"
  ],
  "경남 하동 섬진강": [
    "Seomjin River, Hadong, Gyeongsangnam-do",
    "庆尚南道河东蟾津江",
    "慶尚南道・河東・蟾津江"
  ],
  "경남 남해": [
    "Namhae, Gyeongsangnam-do",
    "庆尚南道南海",
    "慶尚南道・南海"
  ],
  "경남 통영": [
    "Tongyeong, Gyeongsangnam-do",
    "庆尚南道统营",
    "慶尚南道・統営"
  ],
  "경남 의령": [
    "Uiryeong, Gyeongsangnam-do",
    "庆尚南道宜宁",
    "慶尚南道・宜寧"
  ],
  "돼지고기 · 쌀 · 대파 · 돼지육수": [
    "Pork · rice · scallions · pork broth",
    "猪肉·大米·大葱·猪肉高汤",
    "豚肉・米・長ネギ・豚だし"
  ],
  "밀가루 · 육수 · 오이 · 양념장": [
    "Wheat flour · broth · cucumber · seasoning sauce",
    "小麦粉·高汤·黄瓜·调味酱",
    "小麦粉・だし・キュウリ・合わせダレ"
  ],
  "밀가루 · 설탕 · 씨앗 · 식용유": [
    "Wheat flour · sugar · seeds · cooking oil",
    "小麦粉·糖·种子·食用油",
    "小麦粉・砂糖・種・食用油"
  ],
  "낙지 · 소곱창 또는 소대창 · 새우 · 채소 · 고춧가루": [
    "Small octopus · beef small or large intestine · shrimp · vegetables · chili powder",
    "章鱼·牛小肠或大肠·虾·蔬菜·辣椒粉",
    "テナガダコ・牛の小腸または大腸・エビ・野菜・唐辛子粉"
  ],
  "돼지족발 · 해파리 · 오이 · 겨자소스": [
    "Pork trotters · jellyfish · cucumber · mustard sauce",
    "猪蹄·海蜇·黄瓜·芥末酱",
    "豚足・クラゲ・キュウリ・からしソース"
  ],
  "먹장어 · 소금 또는 매운양념 · 채소": [
    "Hagfish · salt or spicy seasoning · vegetables",
    "盲鳗·盐或辣味调料·蔬菜",
    "ヌタウナギ・塩または辛いタレ・野菜"
  ],
  "쪽파 · 쌀가루 · 해산물 · 달걀": [
    "Scallions · rice flour · seafood · eggs",
    "小葱·米粉·海鲜·鸡蛋",
    "青ネギ・米粉・海鮮・卵"
  ],
  "낙지 · 대파 · 양파 · 고춧가루 · 육수": [
    "Small octopus · scallions · onion · chili powder · broth",
    "章鱼·大葱·洋葱·辣椒粉·高汤",
    "テナガダコ・長ネギ・タマネギ・唐辛子粉・だし"
  ],
  "가래떡 · 어묵육수": [
    "Long rice cakes · fish-cake broth",
    "条状年糕·鱼饼高汤",
    "棒状の餅・練り物のだし"
  ],
  "밀가루 만두피 · 고기소 · 육수": [
    "Wheat-flour wrappers · meat filling · broth",
    "小麦面皮·肉馅·高汤",
    "小麦粉の皮・肉のあん・だし"
  ],
  "날생선 · 오이 · 배 · 고추장 · 찬물 또는 육수": [
    "Raw fish · cucumber · pear · gochujang · cold water or broth",
    "生鱼·黄瓜·梨·韩式辣椒酱·冷水或高汤",
    "生魚・キュウリ・梨・コチュジャン・冷水またはだし"
  ],
  "꽁치 또는 청어 · 김 · 미역 · 쪽파": [
    "Pacific saury or herring · dried seaweed · wakame · scallions",
    "秋刀鱼或鲱鱼·紫菜·裙带菜·小葱",
    "サンマまたはニシン・海苔・ワカメ・青ネギ"
  ],
  "날소고기 · 마늘 · 고춧가루 · 참기름": [
    "Raw beef · garlic · chili powder · sesame oil",
    "生牛肉·蒜·辣椒粉·芝麻油",
    "生牛肉・ニンニク・唐辛子粉・ごま油"
  ],
  "닭고기 · 당면 · 감자 · 양파 · 간장 · 고추": [
    "Chicken · glass noodles · potatoes · onion · soy sauce · chili peppers",
    "鸡肉·粉条·土豆·洋葱·酱油·辣椒",
    "鶏肉・春雨・ジャガイモ・タマネギ・醤油・唐辛子"
  ],
  "고등어 · 소금": [
    "Mackerel · salt",
    "鲭鱼·盐",
    "サバ・塩"
  ],
  "대게": [
    "Snow crab",
    "雪蟹",
    "ズワイガニ"
  ],
  "대두 · 물 · 튀긴 반죽": [
    "Soybeans · water · fried dough",
    "大豆·水·油炸面食",
    "大豆・水・揚げた生地"
  ],
  "미나리 · 돼지삼겹살": [
    "Minari (water dropwort) · pork belly",
    "水芹·五花肉",
    "セリ・豚バラ肉"
  ],
  "소막창 또는 돼지막창 · 된장소스": [
    "Beef or pork offal · soybean-paste dipping sauce",
    "牛或猪的肠胃部位·大酱蘸料",
    "牛または豚のホルモン・味噌ダレ"
  ],
  "밀가루 만두피 · 당면 · 부추 · 간장": [
    "Wheat-flour wrappers · glass noodles · chives · soy sauce",
    "小麦面皮·粉条·韭菜·酱油",
    "小麦粉の皮・春雨・ニラ・醤油"
  ],
  "소고기 · 간장 · 마늘 · 참기름": [
    "Beef · soy sauce · garlic · sesame oil",
    "牛肉·酱油·蒜·芝麻油",
    "牛肉・醤油・ニンニク・ごま油"
  ],
  "고래고기": [
    "Whale meat",
    "鲸肉",
    "鯨肉"
  ],
  "메밀 포함 면 · 해물육수 · 소고기육전 · 달걀": [
    "Noodles containing buckwheat · seafood broth · egg-coated pan-fried beef · eggs",
    "含荞麦的面条·海鲜高汤·裹蛋煎牛肉·鸡蛋",
    "そば粉入りの麺・海鮮だし・牛肉の卵焼き（ユクチョン）・卵"
  ],
  "식용 복어 · 콩나물 · 미나리 · 마늘": [
    "Edible pufferfish · soybean sprouts · minari · garlic",
    "食用河豚·豆芽·水芹·蒜",
    "食用フグ・豆もやし・セリ・ニンニク"
  ],
  "재첩 · 물 · 부추 · 소금": [
    "Small freshwater clams · water · chives · salt",
    "淡水蚬·水·韭菜·盐",
    "シジミ・水・ニラ・塩"
  ],
  "멸치 · 시래기 · 된장 또는 매운양념 · 쌈채소 · 쌀": [
    "Anchovies · dried radish greens · soybean paste or spicy seasoning · leafy greens · rice",
    "鳀鱼·干萝卜叶·大酱或辣味调料·包饭蔬菜·大米",
    "カタクチイワシ・干した大根の葉・味噌または辛いタレ・葉野菜・米"
  ],
  "아귀 · 콩나물 · 미나리 · 고춧가루": [
    "Monkfish · soybean sprouts · minari · chili powder",
    "鮟鱇鱼·豆芽·水芹·辣椒粉",
    "アンコウ・豆もやし・セリ・唐辛子粉"
  ],
  "쌀 · 김 · 오징어 · 무 · 매운양념": [
    "Rice · dried seaweed · squid · radish · spicy seasoning",
    "大米·紫菜·鱿鱼·萝卜·辣味调料",
    "米・海苔・イカ・大根・辛いタレ"
  ],
  "멍게 · 쌀 · 채소 · 김 · 참기름": [
    "Sea squirt · rice · vegetables · dried seaweed · sesame oil",
    "海鞘·大米·蔬菜·紫菜·芝麻油",
    "ホヤ・米・野菜・海苔・ごま油"
  ],
  "도다리로 판매하는 가자미류 · 쑥 · 육수": [
    "Flatfish sold as dodari · mugwort · broth",
    "以“多达里”出售的鲽鱼类·艾草·高汤",
    "ドダリとして販売されるカレイ類・ヨモギ・だし"
  ],
  "쌀 · 나물 · 소고기 · 고추장": [
    "Rice · seasoned vegetables · beef · gochujang",
    "大米·拌蔬菜·牛肉·韩式辣椒酱",
    "米・ナムル・牛肉・コチュジャン"
  ],
  "멥쌀 · 팥소 · 망개잎": [
    "Non-glutinous rice · red bean paste · greenbrier leaves",
    "粳米·红豆馅·菝葜叶",
    "うるち米・あんこ・サルトリイバラの葉"
  ],
  "고기와 육수를 끓여 밥과 제공": [
    "Meat is simmered in broth and served with rice",
    "将肉与高汤煮好后配米饭供应",
    "肉とだしを煮込み、ご飯とともに提供"
  ],
  "면을 삶아 찬물에 식혀 육수나 양념과 제공": [
    "Noodles are boiled, cooled in cold water and served with broth or sauce",
    "面条煮熟后用冷水冷却，搭配高汤或酱料供应",
    "麺をゆでて冷水で冷やし、だしやタレとともに提供"
  ],
  "반죽을 기름에 익힌 뒤 씨앗 등을 채움": [
    "Dough is cooked in oil, then filled with seeds and other toppings",
    "面团用油煎熟后填入种子等配料",
    "生地を油で焼いてから、種などを詰める"
  ],
  "양념과 육수를 넣고 자작하게 끓임": [
    "Simmered with seasoning and a small amount of broth",
    "加入调料和少量高汤炖煮",
    "タレと少なめのだしを加えて煮込む"
  ],
  "삶은 족발을 식혀 썰고 채소·소스와 버무림": [
    "Cooked pork trotters are cooled, sliced and mixed with vegetables and sauce",
    "煮熟的猪蹄冷却切片后，与蔬菜和酱汁拌匀",
    "ゆでた豚足を冷まして切り、野菜やソースと和える"
  ],
  "숯불·연탄·팬 등에 구움": [
    "Grilled over charcoal or coal briquettes, or cooked in a pan",
    "使用炭火、蜂窝煤或平底锅等烤制",
    "炭火・練炭・フライパンなどで焼く"
  ],
  "반죽과 파·해물을 팬에 부침": [
    "Batter, scallions and seafood are pan-fried together",
    "将面糊、葱和海鲜放入平底锅煎制",
    "生地とネギ、海鮮をフライパンで焼く"
  ],
  "팬에 육수와 양념을 넣어 끓이듯 조리": [
    "Cooked in a pan with broth and seasoning until simmering",
    "在锅中加入高汤和调料，以炖煮方式烹制",
    "鍋にだしとタレを加えて、煮るように調理する"
  ],
  "떡꼬치를 뜨거운 국물에 데움": [
    "Rice-cake skewers are warmed in hot broth",
    "将年糕串放入热汤中加热",
    "串に刺した餅を熱いスープで温める"
  ],
  "완당을 빚어 국물에 익혀 냄": [
    "Small wontons are shaped and cooked in broth",
    "包好小馄饨后放入汤中煮熟供应",
    "ワンタンを包み、スープで煮て提供"
  ],
  "생선회·채소에 양념과 찬 국물을 곁들임": [
    "Raw fish and vegetables are served with seasoning and chilled broth",
    "生鱼片和蔬菜搭配酱料与冷汤享用",
    "刺身と野菜にタレと冷たいスープを添える"
  ],
  "생선을 반건조해 썰어 제공": [
    "Fish is semi-dried, sliced and served",
    "鱼半风干后切片供应",
    "魚を半干しにし、切って提供"
  ],
  "소고기를 날로 두툼하게 썰어 제공": [
    "Raw beef is cut into thick slices and served",
    "将生牛肉厚切后供应",
    "生の牛肉を厚切りにして提供"
  ],
  "간장 양념으로 닭과 채소·당면을 졸임": [
    "Chicken, vegetables and glass noodles are braised in a soy-based sauce",
    "将鸡肉、蔬菜和粉条用酱油调味汁焖煮",
    "鶏肉と野菜、春雨を醤油ダレで煮詰める"
  ],
  "염장 후 굽거나 조림": [
    "Salted, then grilled or braised",
    "盐渍后烤制或炖煮",
    "塩漬けにしてから焼く、または煮る"
  ],
  "통째 찐 뒤 손질": [
    "Steamed whole, then prepared for eating",
    "整只蒸熟后处理",
    "丸ごと蒸してから食べやすくさばく"
  ],
  "콩을 갈아 끓인 국에 반죽을 곁들임": [
    "Ground soybeans are cooked into a soup and served with dough pieces",
    "将大豆磨碎煮汤，搭配面食享用",
    "豆をすりつぶして煮たスープに、生地を使った具を添える"
  ],
  "삼겹살과 미나리를 불판에서 구움": [
    "Pork belly and minari are grilled together on a hot plate",
    "将五花肉与水芹一起放在烤盘上烤制",
    "豚バラ肉とセリを鉄板で焼く"
  ],
  "손질·초벌 후 불판에 구움": [
    "Cleaned and partially cooked before grilling on a hot plate",
    "处理并预烤后放在烤盘上烤制",
    "下処理と下焼きをしてから鉄板で焼く"
  ],
  "납작한 만두를 기름에 지짐": [
    "Flat dumplings are pan-fried in oil",
    "将扁平饺子用油煎制",
    "平たい餃子を油で焼く"
  ],
  "얇은 고기를 양념해 석쇠·불판에 구움": [
    "Thinly sliced meat is seasoned and grilled on a wire rack or hot plate",
    "将薄切肉调味后放在烤网或烤盘上烤制",
    "薄切り肉に味をつけ、焼き網や鉄板で焼く"
  ],
  "수육·부위별 조리, 업소 확인 필요": [
    "Boiled meat and cuts prepared in different ways; check with the restaurant",
    "可煮制或按部位分别烹调，需向店家确认",
    "ゆで肉や部位別の調理。店舗への確認が必要"
  ],
  "면을 삶아 식히고 육수·육전과 제공": [
    "Noodles are boiled, cooled and served with broth and egg-coated pan-fried beef",
    "面条煮熟冷却后，搭配高汤和裹蛋煎牛肉供应",
    "麺をゆでて冷やし、だしとユクチョンを添えて提供"
  ],
  "적절히 손질된 복어를 채소와 끓임": [
    "Properly prepared pufferfish is simmered with vegetables",
    "将妥善处理的河豚与蔬菜一起煮制",
    "適切に下処理したフグを野菜と煮る"
  ],
  "재첩을 해감해 끓여 국물을 냄": [
    "Clams are purged of sand, then simmered to make the broth",
    "将蚬吐沙后煮制取汤",
    "シジミを砂抜きし、煮出してスープを作る"
  ],
  "굵은 생멸치를 양념에 자작하게 조림": [
    "Large fresh anchovies are braised in a small amount of seasoned sauce",
    "将大鲜鳀鱼以少量调味汁炖煮",
    "大ぶりの生のカタクチイワシを少なめのタレで煮る"
  ],
  "아귀와 채소를 익혀 양념에 찜": [
    "Monkfish and vegetables are cooked and steamed in seasoning",
    "将鮟鱇鱼和蔬菜煮熟后拌调料蒸制",
    "アンコウと野菜に火を通し、タレで蒸す"
  ],
  "김에 밥만 말고 무침·김치를 따로 제공": [
    "Only rice is rolled in seaweed; seasoned side dishes and kimchi are served separately",
    "紫菜中只卷米饭，拌菜和泡菜另行供应",
    "海苔でご飯だけを巻き、和え物やキムチは別添えで提供"
  ],
  "손질 멍게와 밥·채소를 담아 비빔": [
    "Prepared sea squirt is served with rice and vegetables to mix together",
    "将处理好的海鞘与米饭、蔬菜盛在一起拌食",
    "下処理したホヤとご飯、野菜を盛り、混ぜて食べる"
  ],
  "손질 생선과 쑥을 맑게 끓임": [
    "Prepared fish and mugwort are simmered in a clear broth",
    "将处理好的鱼与艾草煮成清汤",
    "下処理した魚とヨモギを澄んだスープで煮る"
  ],
  "밥에 나물·고기·양념을 올림": [
    "Rice is topped with seasoned vegetables, meat and sauce",
    "在米饭上摆放拌蔬菜、肉和调料",
    "ご飯にナムル・肉・タレをのせる"
  ],
  "쌀가루를 쪄 팥소를 넣고 잎으로 포장": [
    "Rice flour is steamed, filled with red bean paste and wrapped in leaves",
    "将米粉蒸熟，包入红豆馅后用叶子包裹",
    "米粉を蒸してあんこを詰め、葉で包む"
  ],
  "고소한 국물과 부드러운 고기": [
    "Rich, savory broth and tender meat",
    "醇香汤汁与软嫩肉质",
    "コクのあるスープと柔らかな肉"
  ],
  "차갑고 쫄깃하며 새콤달콤함": [
    "Cold and chewy, with a sweet-and-tangy flavor",
    "冰凉劲道，酸甜可口",
    "冷たく弾力があり、甘酸っぱい味"
  ],
  "달고 고소하며 겉과 씨앗이 씹힘": [
    "Sweet and nutty, with a textured crust and crunchy seeds",
    "香甜醇厚，外皮和种子富有嚼感",
    "甘く香ばしく、皮や種の歯ごたえがある"
  ],
  "매콤하고 기름진 감칠맛, 쫄깃한 낙지": [
    "Spicy, rich and savory, with chewy small octopus",
    "香辣浓郁、油润鲜美，章鱼富有嚼劲",
    "辛く脂のコクがあり、タコは弾力のある食感"
  ],
  "쫄깃·아삭하고 새콤달콤하며 겨자가 톡 쏨": [
    "Chewy and crisp, sweet and tangy, with a sharp mustard kick",
    "软韧爽脆、酸甜可口，带芥末的辛冲感",
    "もちもち・シャキシャキした食感に甘酸っぱさとからしの刺激"
  ],
  "탱글하고 쫄깃하며 고소함": [
    "Springy, chewy and savory",
    "弹牙有嚼劲，味道醇香",
    "ぷりっと弾力があり、香ばしい"
  ],
  "바삭함보다 두툼하고 촉촉한 식감": [
    "Thick and moist rather than crisp",
    "口感厚实湿润，而非酥脆",
    "カリカリというより、厚みがあってしっとりした食感"
  ],
  "매콤한 양념과 부드럽고 쫄깃한 낙지": [
    "Spicy seasoning with tender, chewy small octopus",
    "香辣调味，章鱼软嫩有嚼劲",
    "辛いタレと、柔らかく弾力のあるタコ"
  ],
  "부드럽고 쫀득하며 국물 맛이 배어 있음": [
    "Soft and pleasantly chewy, infused with broth",
    "软糯有嚼劲，吸收了汤汁的鲜味",
    "柔らかくもちもちして、だしが染みている"
  ],
  "매우 얇고 부드러운 피, 담백한 국물": [
    "Very thin, tender wrappers and a light broth",
    "面皮极薄柔软，汤汁清淡",
    "とても薄く柔らかな皮と、あっさりしたスープ"
  ],
  "차갑고 새콤달콤하며 회가 쫄깃함": [
    "Cold, sweet and tangy, with chewy raw fish",
    "冰凉酸甜，生鱼片富有嚼劲",
    "冷たく甘酸っぱく、刺身は弾力のある食感"
  ],
  "기름지고 쫀득하며 생선 향이 뚜렷함": [
    "Rich and chewy, with a pronounced fish flavor",
    "油润软韧，鱼香浓郁",
    "脂がのってもちっとし、魚の風味がはっきりしている"
  ],
  "찰지고 부드러우며 양념은 매콤·고소함": [
    "Supple and tender, with spicy, nutty seasoning",
    "软韧细嫩，调料香辣醇厚",
    "もっちり柔らかく、タレは辛く香ばしい"
  ],
  "달짝지근·짭짤하고 고추에 따라 매움": [
    "Sweet and savory; heat varies with the chili peppers",
    "微甜咸香，辣度取决于辣椒",
    "甘じょっぱく、唐辛子によって辛さが変わる"
  ],
  "짭짤하고 기름진 생선살": [
    "Salty, rich fish flesh",
    "咸香油润的鱼肉",
    "塩気があり、脂ののった魚の身"
  ],
  "달고 섬세한 살, 단단한 껍질": [
    "Sweet, delicate meat inside a hard shell",
    "蟹肉鲜甜细嫩，外壳坚硬",
    "甘く繊細な身と硬い殻"
  ],
  "고소하고 걸쭉하며 곁들임이 쫀득함": [
    "Nutty and thick, with chewy accompaniments",
    "醇香浓稠，配料软韧",
    "香ばしくとろみがあり、添え物はもちっとした食感"
  ],
  "기름진 고기와 아삭하고 향긋한 미나리": [
    "Rich pork with crisp, fragrant minari",
    "油润的肉搭配爽脆清香的水芹",
    "脂のある肉と、シャキッと香り豊かなセリ"
  ],
  "겉은 고소하고 속은 쫄깃함": [
    "Savory outside and chewy inside",
    "外层香醇，内里有嚼劲",
    "外は香ばしく、中は弾力がある"
  ],
  "담백하고 부드러우며 가장자리는 바삭함": [
    "Mild and soft, with crisp edges",
    "清淡柔软，边缘酥脆",
    "あっさり柔らかく、縁はカリッとしている"
  ],
  "짭짤달콤하고 고소하며 불향": [
    "Sweet, savory and nutty, with a smoky grilled aroma",
    "咸甜醇香，带炭烤香气",
    "甘じょっぱく香ばしく、焼き目の香りがある"
  ],
  "부위별 지방과 조직 차이, 일반화 보류": [
    "Fat content and texture vary by cut; no general description given",
    "各部位脂肪和组织不同，暂不作统一描述",
    "部位によって脂や組織が異なり、一律の説明は保留"
  ],
  "차갑고 감칠맛이 나며 육전은 고소함": [
    "Cold and savory, with richly flavored pan-fried beef",
    "冰凉鲜美，煎牛肉香醇",
    "冷たくうま味があり、ユクチョンは香ばしい"
  ],
  "맑고 시원한 국물, 탄력 있는 살": [
    "Clear, refreshing broth and springy fish flesh",
    "汤汁清爽，鱼肉富有弹性",
    "澄んですっきりしたスープと、弾力のある身"
  ],
  "시원하고 담백하며 조갯살이 작음": [
    "Light and refreshing, with small pieces of clam meat",
    "清爽淡雅，贝肉细小",
    "すっきりあっさりしており、貝の身は小さい"
  ],
  "구수하고 진하며 생선 향이 뚜렷함": [
    "Rich and hearty, with a pronounced fish flavor",
    "醇厚浓郁，鱼香鲜明",
    "コクが深く、魚の風味がはっきりしている"
  ],
  "매콤하고 아귀는 쫄깃, 콩나물은 아삭함": [
    "Spicy, with chewy monkfish and crisp soybean sprouts",
    "香辣可口，鮟鱇鱼有嚼劲，豆芽爽脆",
    "辛く、アンコウは弾力があり、豆もやしはシャキシャキ"
  ],
  "담백한 김밥과 매콤·새콤한 반찬": [
    "Mild rice rolls with spicy, tangy side dishes",
    "清淡饭卷搭配香辣酸爽的小菜",
    "あっさりした海苔巻きと、辛く酸味のあるおかず"
  ],
  "짭짤한 바다 향과 쌉싸름함, 부드러운 멍게": [
    "Briny and slightly bitter, with tender sea squirt",
    "带海洋的咸鲜与微苦，海鞘柔嫩",
    "磯の塩気とほろ苦さがあり、ホヤは柔らかい"
  ],
  "담백한 생선과 향긋하고 쌉싸름한 쑥": [
    "Mild fish with fragrant, slightly bitter mugwort",
    "清淡鱼肉搭配清香微苦的艾草",
    "あっさりした魚と、香り豊かでほろ苦いヨモギ"
  ],
  "나물 식감과 고소한 고기, 매콤달콤함": [
    "Textured vegetables and savory meat, with a sweet-and-spicy flavor",
    "蔬菜富有口感，肉香醇厚，甜辣可口",
    "ナムルの食感と香ばしい肉に、甘辛い味"
  ],
  "쫄깃하고 부드러우며 팥소가 달콤함": [
    "Soft and chewy, with sweet red bean filling",
    "软糯有嚼劲，红豆馅香甜",
    "もちもち柔らかく、あんこが甘い"
  ],
  "기본 낮음, 다대기 추가 시 상승": [
    "Mild by default; adding spicy seasoning increases the heat",
    "默认辣度低，加入辣味调料后提升",
    "基本は辛さ控えめ。辛い薬味を加えると辛さが増す"
  ],
  "물밀면도 양념이 맵다. 조절은 업소 확인": [
    "Even broth-based milmyeon has spicy seasoning; ask about adjustments",
    "汤冷面的酱料也可能很辣，能否调整需向店家确认",
    "スープ入りのミルミョンもタレは辛い。調整は店舗に確認"
  ],
  "기본 맵지 않음": [
    "Not spicy by default",
    "默认不辣",
    "基本は辛くない"
  ],
  "높음, 순한맛 제공은 업소 확인": [
    "Hot; ask whether a mild version is available",
    "辣度高，是否提供微辣需向店家确认",
    "辛さは強め。辛さ控えめの提供は店舗に確認"
  ],
  "고추 매움은 낮으나 겨자 자극 강함": [
    "Little chili heat, but a strong mustard kick",
    "辣椒辣度低，但芥末刺激较强",
    "唐辛子の辛さは控えめだが、からしの刺激は強い"
  ],
  "소금 낮음, 양념 높음": [
    "Salt-grilled: mild; spicy-seasoned: hot",
    "盐烤辣度低，辣酱调味辣度高",
    "塩焼きは辛さ控えめ、タレ味は辛め"
  ],
  "기본 낮음, 소스는 매울 수 있음": [
    "Mild by default; the sauce may be spicy",
    "默认辣度低，蘸酱可能较辣",
    "基本は辛さ控えめ。ソースは辛い場合がある"
  ],
  "높음, 조절은 업소 확인": [
    "Hot; ask the restaurant about adjustments",
    "辣度高，能否调整需向店家确认",
    "辛さは強め。調整は店舗に確認"
  ],
  "기본 낮음, 양념에 따라 다름": [
    "Mild by default; varies with the seasoning",
    "默认辣度低，视调料而异",
    "基本は辛さ控えめ。薬味によって異なる"
  ],
  "기본 낮음, 땡초 메뉴는 별도": [
    "Mild by default; hot-chili versions are separate menu items",
    "默认辣度低，特辣辣椒版本为另设菜品",
    "基本は辛さ控えめ。激辛唐辛子入りは別メニュー"
  ],
  "중간 이상, 조절은 업소 확인": [
    "Medium or hotter; ask about adjustments",
    "中辣以上，能否调整需向店家确认",
    "中辛以上。調整は店舗に確認"
  ],
  "본체 낮음, 초고추장은 매움": [
    "Fish itself is mild; the vinegared chili sauce is spicy",
    "鱼本身辣度低，醋辣椒酱较辣",
    "魚自体は辛さ控えめ。酢コチュジャンは辛い"
  ],
  "고기 맵지 않음, 양념 매움": [
    "Meat is not spicy; the seasoning is hot",
    "肉本身不辣，调料较辣",
    "肉は辛くないが、タレは辛い"
  ],
  "간장색이어도 매울 수 있음": [
    "May be spicy even though the sauce looks soy-based",
    "即使是酱油色泽，也可能较辣",
    "醤油色でも辛い場合がある"
  ],
  "구이 낮음, 조림은 양념별 차이": [
    "Grilled: mild; braised: depends on the seasoning",
    "烤制辣度低，炖煮视调料而异",
    "焼き物は辛さ控えめ。煮物は味付けによる"
  ],
  "기본 낮음": [
    "Mild by default",
    "默认辣度低",
    "基本は辛さ控えめ"
  ],
  "기본 낮음, 쌈장에 따라 다름": [
    "Mild by default; varies with the dipping paste",
    "默认辣度低，视包饭酱而异",
    "基本は辛さ控えめ。サムジャンによって異なる"
  ],
  "기본 낮음, 양념막창은 높음": [
    "Mild by default; spicy-seasoned versions are hot",
    "默认辣度低，辣酱调味版本辣度高",
    "基本は辛さ控えめ。辛いタレ味は辛め"
  ],
  "만두 기본 낮음, 양념·무침은 높음": [
    "Dumplings are mild; sauces and mixed side dishes can be hot",
    "饺子默认辣度低，酱料和拌菜辣度高",
    "餃子は基本的に辛さ控えめ。タレや和え物は辛め"
  ],
  "조리법에 따라 차이": [
    "Varies by preparation",
    "视烹调方式而异",
    "調理法によって異なる"
  ],
  "물 낮음~중간, 비빔 높음": [
    "Broth version: mild to medium; mixed version: hot",
    "汤面为低辣至中辣，拌面辣度高",
    "スープ入りは控えめ〜中辛、混ぜ麺は辛め"
  ],
  "지리 낮음, 매운탕 높음": [
    "Clear soup: mild; spicy soup: hot",
    "清汤辣度低，辣汤辣度高",
    "澄んだスープは辛さ控えめ、辛い鍋は辛め"
  ],
  "중간 이상, 업소별 차이": [
    "Medium or hotter; varies by restaurant",
    "中辣以上，因店而异",
    "中辛以上。店舗によって異なる"
  ],
  "높음, 맵기 조절은 업소 확인": [
    "Hot; ask the restaurant about spice-level adjustments",
    "辣度高，能否调整辣度需向店家确认",
    "辛さは強め。辛さの調整は店舗に確認"
  ],
  "김밥 낮음, 반찬 높음": [
    "Rice rolls: mild; side dishes: hot",
    "饭卷辣度低，配菜辣度高",
    "海苔巻きは辛さ控えめ、おかずは辛め"
  ],
  "기본 낮음, 고추장 추가 시 상승": [
    "Mild by default; adding gochujang increases the heat",
    "默认辣度低，加入韩式辣椒酱后提升",
    "基本は辛さ控えめ。コチュジャンを加えると辛くなる"
  ],
  "기본 낮음, 고추 추가는 업소별": [
    "Mild by default; added chili varies by restaurant",
    "默认辣度低，是否加辣椒因店而异",
    "基本は辛さ控えめ。唐辛子の追加は店舗による"
  ],
  "중간, 고추장량 조절 문의": [
    "Medium; ask about adjusting the amount of gochujang",
    "中辣，可询问是否调整韩式辣椒酱用量",
    "中辛。コチュジャンの量の調整は要相談"
  ],
  "연중 판매 사례 확인": [
    "Year-round sales have been documented",
    "已查到全年销售的案例",
    "通年販売の事例を確認"
  ],
  "연중 판매 사례, 여름 수요 높음": [
    "Year-round sales documented; especially popular in summer",
    "有全年销售案例，夏季需求较高",
    "通年販売の事例あり。夏は需要が高い"
  ],
  "여름 수요 높음, 연중 판매 사례": [
    "Especially popular in summer; year-round sales documented",
    "夏季需求较高，有全年销售案例",
    "夏に需要が高く、通年販売の事例もある"
  ],
  "주로 겨울, 판매 기간 업소 확인": [
    "Mainly winter; check each restaurant's sales period",
    "主要在冬季供应，销售时间需向店家确认",
    "主に冬。販売期間は店舗に確認"
  ],
  "연중 사례, 수급·도축일에 따라 결품 가능": [
    "Year-round sales documented; availability depends on supply and slaughter dates",
    "有全年销售案例，可能因供货或屠宰日期而缺货",
    "通年販売の事例あり。仕入れやと畜日によって品切れの場合あり"
  ],
  "연중 유통 사례, 업소 판매 확인": [
    "Year-round distribution documented; confirm restaurant availability",
    "有全年流通案例，店内是否供应需确认",
    "通年流通の事例あり。店舗での販売は要確認"
  ],
  "국내산은 계절·금어기 영향, 수입산 연중 사례": [
    "Korean crab availability depends on season and fishing bans; imported crab sold year-round in some cases",
    "韩国产受季节和禁捕期影响，进口产品有全年销售案例",
    "韓国産は季節・禁漁期の影響あり。輸入品は通年販売の事例あり"
  ],
  "연중 판매 사례, 부산 판매처 미확인": [
    "Year-round sales documented; Busan sellers not confirmed",
    "有全年销售案例，釜山销售地点尚未确认",
    "通年販売の事例あり。釜山の販売店は未確認"
  ],
  "봄 중심, 하우스 재배·업소별 차이": [
    "Mainly spring; varies with greenhouse cultivation and the restaurant",
    "以春季为主，因温室种植和店家而异",
    "春が中心。ハウス栽培や店舗によって異なる"
  ],
  "연중 사례, 부산 노점 운영은 확인 필요": [
    "Year-round sales documented; Busan street-stall operation needs confirmation",
    "有全年销售案例，釜山摊位营业情况需确认",
    "通年販売の事例あり。釜山の屋台営業は要確認"
  ],
  "수급·법적 유통 확인 필요": [
    "Supply and lawful distribution need confirmation",
    "需确认货源及合法流通情况",
    "供給状況・合法的な流通の確認が必要"
  ],
  "연중 사례, 부산의 마산식 판매처 미확인": [
    "Year-round sales documented; Masan-style sellers in Busan not confirmed",
    "有全年销售案例，釜山马山式料理销售地点尚未确认",
    "通年販売の事例あり。釜山の馬山式の提供店は未確認"
  ],
  "연중 사례, 재료 수급·산지 확인": [
    "Year-round sales documented; confirm ingredient supply and origin",
    "有全年销售案例，需确认原料供应及产地",
    "通年販売の事例あり。原料の供給状況・産地は要確認"
  ],
  "봄·가을 수급, 냉동 원료 연중 사례": [
    "Fresh supply in spring and autumn; frozen ingredients used year-round in some cases",
    "春秋供货，冷冻原料有全年使用案例",
    "春・秋に仕入れ。冷凍原料は通年使用の事例あり"
  ],
  "제철·가공 보관에 따라 판매, 당일 수급 확인": [
    "Sales depend on season and processing/storage; check daily availability",
    "供应取决于时令和加工储存情况，需确认当天货源",
    "旬や加工・保存状況によって販売。当日の仕入れは要確認"
  ],
  "봄 중심, 현재 11월 판매는 별도 확인": [
    "Mainly spring; November availability requires separate confirmation",
    "以春季为主，11月是否供应需另行确认",
    "春が中心。11月の販売は別途確認が必要"
  ],
  "연중 사례, 부산의 진주식 판매는 추가 확인": [
    "Year-round sales documented; Jinju-style availability in Busan needs further confirmation",
    "有全年销售案例，釜山晋州式料理供应情况需进一步确认",
    "通年販売の事例あり。釜山の晋州式の提供状況は追加確認が必要"
  ],
  "연중 생산 사례, 부산 상시 판매처 미확인": [
    "Year-round production documented; regular sellers in Busan not confirmed",
    "有全年生产案例，釜山常年销售地点尚未确认",
    "通年生産の事例あり。釜山の常設販売店は未確認"
  ],
  "식당별 메뉴 가격 참고": [
    "See each restaurant's menu prices",
    "参考各店菜单价格",
    "各店舗のメニュー価格を参照"
  ]
};
  window.IEBFoodInfo = {
    rows(food, language) {
      const index = ['en', 'zh', 'ja'].indexOf(language);
      return (food.manuscript?.infoRows || []).map(row => index < 0 ? row[1] : (phrases[row[1]]?.[index] || row[1]));
    }
  };
})();
