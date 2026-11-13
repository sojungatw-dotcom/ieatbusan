/* Short interface wording; canonical condition keys and food facts stay unchanged. */
(function(){
 'use strict';
 const rows=[
 ['stage.profile','식단·알레르기','Diet and allergies','饮食与过敏','食事制限・アレルギー'],['stage.category','음식 종류','Food category','食物类别','料理の種類'],['stage.wanted','재료·맵기','Ingredients and spice','食材与辣度','食材・辛さ'],['stage.confirm','조건 확인','Review choices','确认条件','条件の確認'],['stage.results','추천 음식','Recommendations','推荐美食','おすすめ'],
 ['msg.profile','식단과 알레르기를 알려 주세요.','Choose your diet and allergy status.','请选择饮食方式和过敏情况。','食事スタイルとアレルギーの有無を選んでください。'],
 ['msg.allergies','어떤 알레르기가 있으신가요?','Which foods are you allergic to?','您对哪些食物过敏？','どの食物アレルギーがありますか？'],
 ['msg.category','어떤 음식이 좋으세요?','What would you like to eat?','您想吃哪类食物？','どんな料理がよいですか？'],
 ['msg.wanted','원하는 재료와 맵기를 골라 주세요.','Choose ingredients and spice level.','请选择食材和辣度。','食材と辛さを選んでください。'],
 ['msg.confirm','이 조건으로 추천해 드릴까요?\n{summary}','Recommend food with these choices?\n{summary}','按这些条件推荐吗？\n{summary}','この条件で探しますか？\n{summary}'],
 ['msg.results','추천 음식 {n}개예요.','Recommendations: {n}','为您推荐 {n} 道菜。','おすすめは {n} 件です。'],
 ['msg.empty','조건에 맞는 음식이 없어요.\n식단·알레르기·제외 조건은 유지했어요.','No matching food found.\nYour diet, allergies and exclusions are unchanged.','暂无符合条件的食物。\n饮食、过敏和排除条件均已保留。','条件に合う料理がありません。\n食事制限・アレルギー・除外は保持しています。'],
 ['msg.veganReview','비건 확인 기록 {verified}개 · 확인 필요 후보 {n}개\n확인이 필요한 후보도 보시겠어요?','Verified vegan records: {verified} · Unverified candidates: {n}\nShow candidates needing verification too?','已确认纯素记录 {verified} 个，待确认候选 {n} 个。\n也查看待确认候选吗？','確認済み {verified} 件・要確認の候補 {n} 件。\n要確認の候補も表示しますか？'],
 ['msg.conflict','{ingredient}: 식단·알레르기·제외 조건과 충돌해요.\n어떻게 할까요?','{ingredient} conflicts with your restrictions.\nWhat would you like to change?','{ingredient} 与限制条件冲突。\n您想如何调整？','{ingredient} は制限条件と矛盾しています。\nどうしますか？'],
 ['msg.relax','맞는 음식이 없어요.\n식단·알레르기·제외·순한맛은 유지하고, 다른 종류·재료도 찾아볼까요?','No exact match. Try other categories or ingredients?\nDiet, allergies, exclusions and mild spice stay required.','没有精确匹配。要换类别或食材找找吗？\n饮食、过敏、排除项和低辣度仍保留。','完全一致がありません。種類や食材を広げますか？\n食事制限・アレルギー・除外・辛さ控えめは保持します。'],
 ['msg.alternatives','동의하신 대안 {n}개를 찾았어요.\n식단·알레르기·제외·순한맛은 유지했어요.','Found {n} alternatives with your consent.\nDiet, allergies, exclusions and mild spice were retained.','经您同意，找到 {n} 个替代候选。\n饮食、过敏、排除项和低辣度均已保留。','同意いただいた代替候補は {n} 件です。\n食事制限・アレルギー・除外・辛さ控えめは保持しました。'],
 ['warning.allergy','알레르기 안전은 보장되지 않아요. 원료·교차 접촉을 식당에 확인해 주세요.','Allergy safety is unverified. Check ingredients and cross-contact with the restaurant.','不保证过敏安全，请向餐厅确认原料及交叉接触。','アレルギーへの安全性は未確認です。原材料と交差接触を店舗に確認してください。'],
 ['warning.vegan','비건 여부는 식당에 확인해 주세요.','Confirm vegan suitability with the restaurant.','请向餐厅确认是否适合纯素。','ヴィーガンに適しているか店舗に確認してください。'],
 ['request.applied','입력한 조건을 확인해 주세요.','Please review your choices.','请确认输入的条件。','入力した条件をご確認ください。'],['request.clarify','알레르기 범위가 모호해요. 해당 항목을 골라 주세요.','Please select the exact allergens.','请选择具体的过敏原。','該当するアレルゲンを選んでください。'],['request.unsupported','반영하지 못한 조건:','Not applied:','未应用的条件：','未反映の条件：'],
 ['unsupported.budget','예산·현재 가격','budget / current prices','预算／当前价格','予算・現在の価格'],['unsupported.location','위치·거리','location / distance','位置／距离','場所・距離'],['unsupported.halal','할랄 인증','halal certification','清真认证','ハラール認証'],
 ['choice.vegan:review','확인 필요 후보도 보기','Include unverified candidates','也看待确认候选','要確認の候補も見る'],['choice.vegan:strict','확인된 비건만 보기','Verified vegan only','仅看已确认纯素','確認済みのみ'],['choice.alternatives:accept','네, 대안도 볼게요','Yes, show alternatives','好的，查看替代候选','はい、代替候補を見る'],['choice.confirm','추천 보기','Show recommendations','查看推荐','おすすめを見る'],['choice.conflict:remove-wanted','제외 유지 · 선호 빼기','Keep exclusion · remove preference','保留排除项 · 移除偏好','除外を保持・希望を外す'],['choice.conflict:profile','조건 다시 설정','Review restrictions','重新设置条件','制限を見直す'],
 ['기본 식단','식단','Diet','饮食方式','食事スタイル'],['피해야 하는 알레르기 항목 · 복수 선택','알레르기 (복수 선택)','Allergens (select multiple)','过敏原（可多选）','アレルゲン（複数選択）'],['먹고 싶은 주재료·음식 · 복수 선택','재료·음식 (복수 선택)','Ingredients / foods (select multiple)','食材／食物（可多选）','食材・料理（複数選択）'],
 ['알레르기와 별개로 피하고 싶은 재료·음식 (선택)','피할 재료·음식 (선택)','Other exclusions (optional)','排除食材／食物（选填）','避ける食材・料理（任意）'],['추가로 피할 재료·음식','피할 재료·음식 (복수 선택)','Exclusions (select multiple)','排除项（可多选）','除外項目（複数選択）'],
 ['있어요 · 다음 질문에서 선택','있어요','Yes','有','あります'],['모르겠어요 / 미확인','모르겠어요','Not sure','不确定','わかりません'],['알레르기 항목 저장','저장하고 다음으로','Save and continue','保存并继续','保存して次へ'],
 ['여러 항목을 선택했다면','포함 방식','Match ingredients','食材匹配方式','食材の含め方'],['선택한 항목 모두 포함','모두 포함','Include all','全部包含','すべて含む'],['선택한 항목 중 하나 이상','하나 이상 포함','Include any','包含任一项','いずれかを含む'],
 ['맵기도 함께 골라 주세요','맵기','Spice level','辣度','辛さ'],['맵기 상관없어요','상관없음','Any','不限','こだわらない'],['기본 맵기가 낮은 음식','순한맛','Mild','不辣／微辣','辛さ控えめ'],['매운 음식','매운맛','Spicy','辣','辛い'],['원문상 기본 맵기 낮음','순한맛','Mild','不辣／微辣','辛さ控えめ'],['맵기 상관없음','맵기 무관','Any spice level','辣度不限','辛さ不問'],
 ['이 취향으로 찾기','이 조건으로 찾기','Find food','查找美食','この条件で探す'],['식단과 알레르기 다시 설정','식단·알레르기 수정','Edit diet / allergies','修改饮食／过敏','食事制限・アレルギーを変更'],
 ['해당하는 항목을 모두 선택해 주세요. 실제 원료·육수·양념과 교차 접촉 여부는 식당에 확인해야 합니다.','원료·육수·교차 접촉은 식당에 확인해 주세요.','Check ingredients, broth and cross-contact with the restaurant.','请向餐厅确认原料、汤底及交叉接触。','原材料・だし・交差接触を店舗に確認してください。'],
 ['spice.retained','실제 맵기는 가게마다 달라요.','Spice levels vary by restaurant.','各餐厅的辣度可能不同。','辛さは店舗により異なります。'],
 ['order.note','직원에게 원료·조리 환경을 확인하는 카드예요. 안전 보증은 아니에요.','Show staff this card to check ingredients and preparation. It is not a safety guarantee.','请出示此卡确认原料及烹饪环境，不代表安全保证。','原材料・調理環境をスタッフに確認するカードです。安全の保証ではありません。'],
 ['recovery.enable','대화 저장 (24시간)','Save chat (24 hours)','保存对话（24小时）','対話を保存（24時間）'],['recovery.note','선택하면 식단·알레르기를 포함한 대화를 이 기기에 저장해요. 복구할 때 음식 목록을 다시 확인해요.','If enabled, chat including diet and allergies is saved on this device. Recovery rechecks the food catalog.','启用后，会在此设备保存含饮食和过敏信息的对话；恢复时会重新检查食物目录。','有効にすると食事制限・アレルギーを含む対話を端末に保存します。復元時に料理一覧を再確認します。']
 ];
 for(const row of rows)ChatLocale.add(...row);
})();
