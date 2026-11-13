# 챗봇: 4개 언어와 DB 전용 추천

`로컬 실행.cmd`를 실행한 뒤 http://127.0.0.1:8779/ 에 접속합니다. 실제 추천을 보려면 기존 `.env.example` 안내에 따라 Supabase 환경변수를 `.env.local`에 설정해야 합니다. 환경변수나 DB 연결이 없으면 **챗봇은 로컬 예시 메뉴로 대체하지 않습니다.**

## 사용 방법

- 오른쪽 아래 `무` 아이콘으로 엽니다. 모바일(740px 이하)은 `#/chatbot` 전용 화면, 웹은 기본 480px / 확대 약 693px 팝업입니다.
- 앱의 언어 설정(한국어·영어·중국어 간체·일본어)을 따릅니다. 대화 중 언어를 바꿔도 식단·알레르기·취향은 유지됩니다.
- 식단·알레르기 여부 → 해당 시 항목 복수 선택 → 비건 후보 표시 여부 → 한 끼 종류 → 주재료·맵기 → 확인 → DB 음식 후보 순서입니다.
- DB에 음식이 없는 카테고리 및 등록 수가 0인 세부 항목은 표시하지 않습니다. DB에 추가된 뒤 목록을 갱신하면 다시 나타납니다.
- 음식 둘러보기 또는 이용 안내에서 **DB 음식 목록 새로고침**을 누르면 앱의 bootstrap API를 다시 읽습니다. 소스 수정·빌드는 필요하지 않습니다. DB 실시간 구독/자동 폴링 방식은 아닙니다.
- 없는 음식을 직접 입력하면 조건 확인 및 완화 동의 후 식단·알레르기·추가 제외·낮은 맵기를 유지한 채 DB 안에서 대안을 최대 3개 찾습니다. 제한에 맞는 음식이 없으면 없는 그대로 안내합니다.
- 닫기/재열기 시 해당 탭의 대화가 유지됩니다. 새로고침 시 기본적으로 초기화하며, 이용자가 복구용 저장을 켠 경우에만 복구 버튼을 제공합니다. 새 대화는 저장본도 삭제합니다. DB 목록이 바뀌면 과거 음식 카드는 비우고 조건을 유지하여 다시 확인합니다.

## DB 전용 데이터 흐름

`/api/service?action=bootstrap` → `Store.foods` → `js/chatbot-catalog.js`의 공개 음식 필드 투영 → 챗봇 프레임 → 분류/검색.

- bootstrap 응답에 있는 음식 ID만 전달합니다. 로컬 파일에만 있는 ID를 합치거나 추천하지 않습니다.
- DB가 비어 있으면 빈 목록을 유지합니다. 연결 실패 시에도 목록과 추천을 비우고 연결 안내를 표시합니다.
- 회원 ID, 프로필, 게시글, 계정 설정, 세션 토큰은 프레임에 전달하지 않습니다. 대화는 외부 AI/API로 보내지 않습니다.
- `content.catalogStatus: archived` 음식은 제외합니다. 공개 API의 보관 음식 제외 규칙도 그대로 적용됩니다.
- 음식 사진은 DB의 검증된 `imageAsset`를 사용하며, 사진이 없으면 현재 언어의 준비 중 안내를 표시합니다.

## 새 음식은 어떻게 분류되나요?

DB의 `category`, `content.ko.category`, `content.ko.ingredients`, `content.manuscript.infoRows` 및 선택적인 구조화된 `content.classification`을 읽습니다. 기존 음식 ID 목록을 하드코딩하여 추천하지 않습니다.

기본 카테고리는 `meat` 육류 / `seafood` 해산물 / `stew` 찜탕 / `rice` 밥류 / `noodle` 면류 / `snack` 분식 / `dessert` 디저트입니다. 앱의 `soups`, `noodles`, `street` 등 별칭도 지원합니다. 원문에 알려진 주재료·음식 형태가 있으면 여러 종류에 함께 속할 수 있습니다.

분류 정보나 알려진 표현이 없으면 임의로 추정하지 않고 `other`(기타·확인 필요)로 둡니다. 아무 텍스트나 완전히 이해하는 생성형 AI 방식이 아니므로 새로운 표현/새 분류 체계는 관리자가 `content.classification`으로 지정하거나 `chatbot/db-rules.js`의 규칙을 보완해야 합니다.

새 음식 레코드의 구성 예(실제 DB 수정 명령이 아닙니다):

```json
{
  "id": "fruit-cup",
  "name": "과일컵",
  "category": "dessert",
  "image_asset": "fruit-cup.jpg",
  "content": {
    "ko": {
      "ingredients": "딸기 · 바나나",
      "allergens": [],
      "allergenNote": "실제 재료 및 교차 접촉을 식당에 확인하세요."
    },
    "en": { "name": "Fruit cup", "ingredients": "Strawberry and banana" },
    "zh": { "name": "水果杯", "ingredients": "草莓及香蕉" },
    "ja": { "name": "フルーツカップ", "ingredients": "いちご・バナナ" },
    "classification": {
      "categories": ["dessert"],
      "ingredients": ["fruit"],
      "possibleIngredients": [],
      "spicy": false,
      "plantCandidate": true
    },
    "dietary": { "veganVerified": false }
  }
}
```

`allergens: []`는 확인 없이 안전하다는 뜻으로 사용하지 마세요. 주재료·알레르기 정보가 부족한 음식은 알레르기/제외/식단 제한이 있는 검색에서 보류합니다. `veganVerified`는 실제 확인 자료가 있을 때만 설정하고, 식물성 기본 재료라는 이유만으로 자동 확정하지 않습니다. 실제 재료·육수·양념·교차 접촉은 식당 확인이 필요합니다.

외국어 음식 이름·설명·재료는 DB의 `content.en`, `content.zh`, `content.ja`를 우선 사용합니다. 기존 음식은 앱의 번역 사전을 함께 사용합니다. 새 음식에 번역이 없으면 한국어 원문임을 표시하며, 임의의 번역을 생성하지 않습니다.

## 코드 및 검증

- `chatbot/locales.js`, `chatbot/bot-localization.js`, `chatbot/scenario-locales.js`: 4개 언어 UI·대화·예시
- `chatbot/db-rules.js`, `chatbot/db-bot.js`: 자동 분류, 제한 조건, DB 후보 검색
- `js/chatbot-catalog.js`, `js/chatbot-widget.js`: DB 공개 데이터와 언어/화면 상태 전달
- `chatbot/app.js`: 목록 갱신, 조건 보존, 대화 재표시
- `tests/chatbot-live.cjs`: DB 추가/삭제/실패, 4언어 × 44시나리오, 미등록 항목 숨김/재노출, 직접 입력 대안, 공개 필드 제한

```text
node --preserve-symlinks --preserve-symlinks-main tools/build-static.cjs
node --preserve-symlinks --preserve-symlinks-main tests/chatbot.cjs
node --preserve-symlinks --preserve-symlinks-main --test tests/chatbot-live.cjs
node --preserve-symlinks --preserve-symlinks-main tools/preview-chatbot-fixture.cjs
```

마지막 명령은 **실제 Supabase에 접속하지 않는 가상 DB 브라우저 검증**입니다. http://127.0.0.1:8783/ 와 `/fixture-control`에서 음식 추가/삭제/연결 실패를 시험합니다. 운영 데이터 수정 없이 검증하며 도구/테스트 파일은 정적 배포에 포함하지 않습니다.

챗봇 소스는 앱의 `chatbot/` 폴더에서 직접 관리합니다. 이전 독립 시안 복사 스크립트는 제거했습니다. SQL 실행·환경변수 변경은 이번 작업에 포함하지 않습니다.


## 2026-11-12 외국인 이용 흐름 개선

상세 반영표는 [개선 내역과 검증](chatbot-visitor-review-20261112.md)을 참고하세요.

- 영어·중국어·일본어·한국어의 식단·알레르기·재료 제외를 독립 추출합니다. 범주가 모호하면 구체 항목을 질문합니다.
- 예산·위치·할랄 인증·현재 영업은 필터로 적용하지 않고 미확인 항목으로 알립니다.
- 음식 상세에서 한국어 메뉴명과 로마자 표기, 주의사항의 공통 번역, 식당 상세·앱 지도·외부 길찾기, 한·영 주소 복사(등록/기존 번역이 있을 때)를 제공합니다.
- 주문 카드는 한국어로 선택 조건과 원료·교차 접촉 확인 문장을 보여 주며 복사/지원 기기 공유가 가능합니다. 공유 버튼을 누르기 전에는 외부로 전송하지 않습니다.
- 내 조건에서 기기 저장을 선택한 경우에만 입력을 브라우저에 저장합니다. 24시간 이후 다음 읽기에서 삭제하며, 100턴 초과 또는 저장 실패 시 저장을 중단합니다. 복구는 최신 DB에 입력을 다시 적용하므로 과거 음식 카드를 그대로 되살리지 않습니다.
- `js/data/food-safety-locales.js`는 동일한 원문에만 43개 기존 음식의 공통 주의사항 번역을 적용합니다. 새로 수정된 정보가 번역되지 않았으면 원문임을 표시합니다.
