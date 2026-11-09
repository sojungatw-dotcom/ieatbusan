# 구조화 데이터와 음식 분류

검증일: 2026-11-09. 적용 파일: `js/structured-data.js`, `js/food-categories.js`.

## JSON-LD 생성 원칙

- `index.html`에 `WebSite`(무보소 / I EAT BUSAN / MUBOSO)를 정적으로 제공합니다.
- 라우터가 화면을 렌더링한 뒤 같은 `#ieb-structured-data` 스크립트 하나를 갱신합니다. 언어 변경·정렬·서버 데이터 반영 후에도 렌더링된 DOM에서 다시 읽습니다.
- 홈과 카테고리: `CollectionPage` + `ItemList`. 실제 카드 이름·설명·사진·링크·순서·개수를 사용합니다. 홈은 현재 추천 5종만 포함합니다.
- 음식 상세: `WebPage` + `Thing`. 실제 음식명·번역된 설명·원어명·대표 사진을 사용합니다. 먹는 방법을 조리법 `Recipe`로 표시하지 않습니다.
- 식당 상세: `WebPage` + `Restaurant`. 화면의 식당명·주소·사진을 사용합니다. 대체 사진으로 전환되면 구조화 데이터도 갱신합니다.
- 공개 안내 화면에는 제목과 언어의 `WebPage`만 제공합니다. 검색어·회원 정보·찜·게시글·글쓰기·로그인 화면의 내용은 구조화 데이터에 넣지 않습니다.
- 좋아요를 평점으로 바꾸지 않습니다. 가격·예약·영업시간·인증·작성자·운영 조직·비건 적합 여부를 추정하지 않습니다. 출처가 확인되지 않은 주소도 제외합니다.
- 이미지 URL은 공개 정적 음식·식당 자산에 한정합니다. 사용자 사진·서명 URL·검색 매개변수를 복사하지 않습니다. JSON 직렬화 시 `<` 등 스크립트 문맥 문자를 이스케이프합니다.

## 실제 음식 연결

43종 음식의 기존 레코드와 식당 연결은 보존합니다. 아래 분류는 실제 음식 ID를 통해 목록을 필터링하며 하나의 음식이 여러 분류에 연결될 수 있습니다.

| 분류 | 음식 수 | 연결 예 |
| --- | ---: | --- |
| 육류 | 13 | 돼지국밥, 안동찜닭, 언양불고기 |
| 해산물 | 22 | 대게, 복국, 아구찜, 물회 |
| 찜 | 4 | 기장 대게, 영덕·울진 대게, 안동찜닭, 마산아구찜 |
| 탕 | 11 | 돼지국밥, 복국, 재첩국, 도다리쑥국 |
| 면 요리 | 3 | 밀면, 비빔당면, 진주냉면 |
| 밥·죽 | 8 | 국밥, 전복죽, 멸치쌈밥, 비빔밥 |
| 분식 | 8 | 어묵, 물떡, 완당, 납작만두, 충무김밥 |
| 간식 | 6 | 씨앗호떡, 콩국, 망개떡 등 |
| 매운맛 | 8 | 낙곱새, 조방낙지, 아구찜, 찜닭 등 |
| 비건 | 0 | 현재 자료에는 원료와 조리가 확인된 비건 메뉴가 없음 |

비건 화면에는 확인 안내를 네 언어로 표시합니다. 쌀·팥·콩·채소가 기본 재료인 것만으로 비건 음식이나 비건 매장으로 확정하지 않습니다. 원료와 조리 확인 근거가 생기면 `vegan` 그룹에 음식 ID를 연결합니다.

## 검증 결과

- `node tests/structured-data.cjs`: 실제 화면 HTML의 음식 172건(43종 × 4언어), 식당 652건(163개 연결 × 4언어), 분류·정렬·언어 80건 대조 통과. 개인 화면 전환 시 이전 엔티티 제거, URL 제한, 직렬화 검사 통과.
- `node tests/food-categories.cjs`: 10개 분류 순서·43종 전체 포함·중복 연결 예·비건 미확인 상태·원본 데이터 보존 통과.
- 실제 브라우저 72개 화면·언어 조합: 제목, 언어, 음식 순서·개수, 사진, 식당 주소 일치. 실패 0건.
- 브라우저에서 추출한 JSON-LD 20개를 공식 Schema.org 현재 어휘 정의와 비교: 노드 136개·속성 510개에서 미등록 용어 및 객체 도메인/범위 오류 0건.
- Schema Markup Validator 웹 검사는 Google의 비정상 트래픽 확인 화면(CAPTCHA)에 막혀 완료하지 못했습니다. 외부 검사 통과나 검색 노출 승인을 의미하지 않습니다.

## 검색 색인 범위

현재 앱의 `#/food/...` 해시 라우팅은 그대로 유지합니다. JSON-LD가 현재 화면과 일치하더라도 Google이 각 해시 화면을 별도 페이지로 안정적으로 색인한다는 뜻은 아닙니다. 개별 음식·식당의 독립 색인이 필요하면 실제 경로와 서버 응답을 갖춘 URL 구조를 별도 작업으로 도입해야 합니다. 이번 작업은 URL 이동·UI 구조·운영 데이터·인증을 변경하지 않습니다.

공식 참고:

- [Google: 구조화 데이터 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google: 사이트 이름](https://developers.google.com/search/docs/appearance/site-names)
- [Google: JavaScript SEO와 해시 대신 History API 사용](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Schema.org: ItemList](https://schema.org/ItemList), [Restaurant](https://schema.org/Restaurant), [공식 어휘 다운로드](https://schema.org/docs/developers.html)
