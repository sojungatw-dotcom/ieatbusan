# I EAT BUSAN — 디자인 핸드오프 (Figma → 개발)

| 항목 | 내용 |
|---|---|
| 버전 | v1.0 (시안) · 2026-11-03 |
| Figma | [음식 리스트 앱 - 와이어프레임](https://www.figma.com/design/hknzex4jUhZaEaYOpkR7Us) · 페이지 `Wireframe` |
| 웹 구현 | 이 저장소 (`index.html` + `css/` + `js/`, 빌드 없음) |
| 사이트맵 | [`sitemap.html`](sitemap.html) |
| 지원 언어 | 한국어 · English · 中文(简体) · 日本語 |
| 기준 해상도 | 390 × 844 (iPhone 14/15 기준), 모바일 웹 우선 |

> Figma 링크 뒤에 `?node-id=` 값을 붙이면 해당 프레임으로 바로 이동합니다. 예: `...hknzex4jUhZaEaYOpkR7Us?node-id=2-14` (홈).

---

## 1. Figma 파일 구성

`Wireframe` 페이지는 다섯 줄로 정리되어 있습니다.

| 줄 | 위치 (x, y) | 내용 |
|---|---|---|
| 00 Components | (0, 0) 왼쪽 세로 열 | 모든 컴포넌트·아이콘 원본 |
| 사진 원본 | (-1200, 0) | `Photo Assets (Wikimedia Commons)` 20장, `Image Credits` |
| 01 메인 탭 | (480, 0) | 홈 · 지도 · 커뮤니티 · 찜 · 마이 |
| 02 서브 화면 | (480, 6000) | 로그인, 검색, 검색 결과, 알림, 게시글 상세, 글쓰기, 설정, 프로필 수정, 식당 상세, 언어 선택 |
| 03 음식 상세 | (480, 7700) | 음식 상세 20개 (템플릿 1종에 데이터만 다름) |
| 04 다국어 예시 | (480, 10300) | 홈·돼지국밥 상세의 EN / ZH / JA 버전 |

프로토타입 시작점은 `Login / 로그인` 프레임이며, 플로우 이름은 **I EAT BUSAN**입니다.

---

## 2. 화면 목록

| ID | 화면 | Figma 프레임 (node-id) | 웹 라우트 | 상태 |
|---|---|---|---|---|
| 0.1 | 로그인 | `Login / 로그인` (13:686) | `#/login` | 완료 |
| 0.2 | 언어 선택 | `Language Select / 언어 선택` (24:1982) | `#/lang` | 완료 |
| 1.0 | 홈 | `Home / 음식 리스트` (2:14) | `#/home` | 완료 |
| 1.1 | 음식 상세 (템플릿) | `Food Detail / 01 돼지국밥` (19:1015) 외 19개 | `#/food/:foodId` | 완료 |
| 1.1.1 | 식당 상세 | `Restaurant Detail / 식당 상세` (16:975) | `#/place/:foodId/:index` | 완료 |
| 1.2 | 검색 | `Search / 검색` (13:705) | `#/search` | 완료 |
| 1.2.1 | 검색 결과 | `Search Results / 검색 결과` (13:768) | `#/results/:q/:tab?` | 완료 |
| 1.3 | 알림 | `Notifications / 알림` (14:774) | `#/notifications` | 완료 |
| 2.0 | 지도 | `Map / 지도` (8:263) | `#/map/:foodId?` | 완료 |
| 3.0 | 커뮤니티 | `Community / 커뮤니티` (9:327) | `#/community/:tab?` | 완료 |
| 3.1 | 게시글 상세 | `Post Detail / 게시글 상세` (14:861) | `#/post/:postId` | 완료 |
| 3.2 | 글쓰기 | `Write Post / 글쓰기` (14:974) | `#/write` | 완료 |
| 4.0 | 찜 | `Favorites / 찜` (11:537) | `#/saved/:tab?` | 완료 |
| 5.0 | 마이 | `My / 마이` (11:649) | `#/my` | 완료 |
| 5.1 | 프로필 수정 | `Profile Edit / 프로필 수정` (15:1002) | `#/profile` | 완료 |
| 5.2 | 설정 | `Settings / 설정` (15:914) | `#/settings` | 완료 |
| 5.3 | 나의 활동 | Figma 없음 (마이 메뉴만) | `#/my/posts` · `#/my/comments` · `#/my/recent` | 웹만 구현 |
| 5.4 | 고객 지원 | Figma 없음 (마이 메뉴만) | `#/notices` · `#/faq` · `#/contact` | 웹만 구현 |
| — | 약관 · 개인정보 · 사진 출처 | 없음 | `#/terms` · `#/privacy` · `#/credits` | 웹만 구현 |

다국어 예시 프레임: 홈 EN (25:2017) · ZH (25:2473) · JA (25:2929), 돼지국밥 상세 EN (25:2308) · ZH (25:2764) · JA (25:3220).

---

## 3. 디자인 토큰

### 3.1 색상

Figma 변수 컬렉션 `I EAT BUSAN / Color` (모드 1개: `Default`). 모든 화면의 채우기·선 색이 이 변수에 연결되어 있습니다. 웹은 `css/app.css`의 `:root` 변수로 같은 값을 씁니다.

| Figma 변수 | CSS 변수 | 값 | 비율 · 용도 |
|---|---|---|---|
| `bg/base` | `--bg` | `#F5F2EC` | 한지 미색 · 전체 배경, 헤더, 탭바 (기본 70%) |
| `surface/white` | `--surface` | `#FFFFFF` | 카드, 입력창, 바텀시트, 원형 버튼 |
| `surface/beige` | `--beige` | `#E5D5C2` | 이미지 자리, 지도, 언어 버튼, 구분 띠 (보조 25%) |
| `surface/blush` | `--blush` | `#F7E7DF` | 카테고리 배지, 알레르기 카드, 안 읽은 알림, 단계 번호 |
| `border/default` | `--border` | `#E5D5C2` | 구분선, 테두리 |
| `text/primary` | `--ink` | `#282622` | 먹색 · 본문, 기본 아이콘 |
| `text/secondary` | `--ink-2` | `#5F5850` | 보조 텍스트·아이콘 |
| `text/tertiary` | `--ink-3` | `#8F8377` | 시간, 메타 정보 |
| `icon/muted` | `--muted` | `#B69C82` | 회갈색 · 비활성 탭, 이미지 아이콘, 토글 꺼짐 |
| `accent/primary` | `--accent` | `#CC4936` | 다홍 · 로고, 주요 버튼, 선택 칩, 활성 탭, 하트, 지도 핀 (강조 5%) |
| `text/on-accent` | `--on-accent` | `#FFFFFF` | 다홍 위 글자 |
| `semantic/success` | `--success` | `#3B7964` | 완료 |
| `semantic/warning` | `--warning` | `#B87C24` | 주의 |
| `semantic/error` | `--error` | `#B64B4A` | 오류 |
| `semantic/info` | `--info` | `#3A7291` | 안내, 내 위치 점 |

구분 띠(`Section Gap`, 8px)는 `surface/beige`에 불투명도 60%를 씁니다. 그림자는 `rgba(40,38,34,.12~.18)`, blur 8~12px입니다.

### 3.2 타이포그래피

| 용도 | 폰트 | 크기 / 굵기 |
|---|---|---|
| 로고 `I EAT BUSAN` | Inter Extra Bold | 20 (헤더) · 32~34 (로그인) |
| 화면 제목 (음식 상세) | 본문 폰트 Bold | 26 |
| 페이지 헤더 제목 | Bold | 17 |
| 섹션 제목 | Bold | 17~19 |
| 카드 제목 · 목록 제목 | Medium / Bold | 15 |
| 본문 | Regular | 14~15, 행간 150~175% |
| 메타 · 캡션 | Regular | 11~13 |
| 탭 라벨 | Regular / Bold(활성) | 11 |

언어별 본문 폰트:

| 언어 | 폰트 |
|---|---|
| ko, en | Noto Sans KR |
| zh | Noto Sans SC |
| ja | Noto Sans JP |

웹은 `<html lang>` 값에 따라 `--font`를 바꿉니다. Google Fonts에서 불러옵니다.

### 3.3 간격 · 모서리 · 크기

- **간격:** 4의 배수를 기본으로 씁니다 (4, 6, 8, 10, 12, 14, 16, 20, 24, 28). 화면 좌우 여백은 16 (목록·카드), 상세 화면 본문은 20.
- **모서리:** 4 (배지) · 8 (썸네일) · 10 (사진 카드, 입력) · 12 (버튼, 카드) · 14 (정보 카드) · 16 (바텀시트 위쪽) · 999 (칩, 알약형 버튼).
- **고정 높이:** 상태바 44 · 헤더 56 · 탭바 64 + 하단 안전 영역 · 하단 CTA 영역 84 · 주요 버튼 52 · 칩 34 · 원형 버튼 40.
- **사진 비율:** 홈 카드 16:10 (358×224), 음식 상세 히어로 390×300, 식당 상세 히어로 390×260~280, 썸네일 72·64 정사각형.

### 3.4 아이콘

[Lucide](https://lucide.dev) (ISC 라이선스), 24px 기준, 선 굵기 2. Figma `Icon/*` 컴포넌트와 웹 `js/icons.js`가 같은 패스를 씁니다.

`back`, `chevron-right`, `chevron-down`, `settings`, `more`, `share`, `close`, `heart`, `heart-filled`, `comment`, `bell`, `search`, `globe`, `pin`, `navigation`, `locate`, `camera`, `pencil`, `home`, `map`, `community`, `user`, `utensils`, `clock`, `trash`, `megaphone`, `arrow-right`

---

## 4. 컴포넌트

| Figma 컴포넌트 (node-id) | 속성 · 변형 | 웹 구현 |
|---|---|---|
| `Food Card` (2:2) | TEXT `음식 이름`, `좋아요 수` | `.food-card` |
| `App Header` (7:222) | 로고 · 언어 버튼 · 검색 · 알림 | `appHeader()` |
| `Tab Bar` (7:361) | VARIANT `Active` = 홈/지도/커뮤니티/찜/마이 | `tabbar(active)` |
| `Chip` (7:366) | VARIANT `State` = Selected/Default, TEXT `라벨` | `.chip`, `.chip.active` |
| `Community Tab` (9:326) | VARIANT `State` = Selected/Default, TEXT `라벨` | `.seg` 탭 |
| `Post Item` (9:296) | TEXT 닉네임·메타·카테고리·제목·본문·좋아요 수·댓글 수, BOOLEAN `사진` | `postCard()` |
| `Status Bar` (10:522) | — | 브라우저가 처리 (웹에는 없음) |
| `Page Header` (10:556) | TEXT `제목`, BOOLEAN `뒤로가기`·`오른쪽 버튼`, INSTANCE_SWAP `오른쪽 아이콘` | `pageHeader()` |
| `Saved Item` (11:527) | TEXT 이름·설명·메타 | `foodRow()` |
| `Menu Row` (11:644) | TEXT `메뉴` | `.menu-row` |
| `Restaurant Item` (13:675) | TEXT 식당 이름·위치·대표 메뉴·좋아요 수 | `placeRow()` |
| `Notification Item` (14:751) | TEXT 메시지·시간, BOOLEAN `안 읽음`, INSTANCE_SWAP `아이콘` | `.noti` |
| `Comment Item` (14:760) | TEXT 닉네임·시간·내용·좋아요 수 | `.comment` |
| `Toggle` (15:899) | VARIANT `State` = On/Off | `.switch` |
| `Toggle Row` (15:900) | TEXT 라벨·설명, BOOLEAN `설명 표시` | `.toggle-row` |
| `Text Field` (15:907) | TEXT 라벨·값·도움말, BOOLEAN `도움말 표시`·`드롭다운` | `.field` + `.input` / `.select` |
| `Language Option` (24:1981) | VARIANT `State` = Selected/Default, TEXT `언어`·`영문` | `.option[aria-checked]` |
| `Icon/*` (10:526 등) | 24px 단일 아이콘 | `icon(name, filled)` |

---

## 5. 화면별 동작 규칙

### 공통
- **진입 제한:** 로그인하지 않았고 게스트도 아니면 로그인 화면으로 보냅니다. 약관·개인정보·사진 출처·언어 선택은 예외입니다.
- **글쓰기·댓글·게시글 좋아요:** 로그인이 필요합니다. 게스트가 누르면 "로그인 후 이용할 수 있어요" 토스트를 띄우고 로그인 화면으로 보냅니다.
- **뒤로가기:** 앱 안에서 이동해 온 기록이 있으면 이전 화면으로, 없으면 지정된 상위 화면으로 갑니다.
- **토스트:** 하단 탭바 위에 2.2초 동안 표시합니다.

### 0.1 로그인
- 카카오 · 네이버 · Apple 버튼은 데모 로그인입니다. 누르면 기본 닉네임으로 계정이 만들어집니다 (ko `부산토박이`, en `Busan Foodie`, zh `釜山吃货`, ja `釜山グルメ`).
- 처음 로그인하면 언어 선택(0.2)을 거친 뒤 홈으로 갑니다.

### 0.2 언어 선택
- 옵션을 누르면 바로 그 언어로 화면이 바뀌어 미리 볼 수 있습니다. [확인]을 누르면 확정됩니다.
- 첫 실행 기본값은 브라우저 언어(ko/en/zh/ja)이고, 그 밖의 언어는 en으로 시작합니다.

### 1.0 홈
- 정렬은 인기순(좋아요 많은 순, 순위 배지 표시)과 이름순을 오갑니다.
- 카드의 하트를 누르면 찜 목록에 들어가고 숫자가 1 올라갑니다. 다시 누르면 빠집니다.
- 한국어가 아니면 음식 이름 아래에 한국어 원문을 함께 표시합니다.

### 1.1 음식 상세 (템플릿 하나, 음식 20개)
- **섹션 칩:** 히어로 사진 바로 아래에 `상세 정보 / 먹는 방법 / 알레르기 / 식당 리스트`가 있습니다. 누르면 해당 섹션으로 부드럽게 스크롤합니다.
- **칩 고정:** 스크롤해도 화면 위에 붙어 있습니다 (`position: sticky`). 지금 보고 있는 섹션의 칩이 선택 상태로 바뀝니다 (IntersectionObserver).
  - Figma에서는 API 제한 때문에 칩 줄이 고정되지 않았습니다. 각 상세 프레임의 `Section Chips`를 Prototype 패널에서 **Sticky**로 바꿔야 합니다.
- **히어로 버튼:** 뒤로가기, 공유(Web Share API, 안 되면 링크 복사), 찜.
- **하단 고정 CTA:** `지도에서 식당 찾기` → `#/map/:foodId` (해당 음식 식당만 표시).
- **식당 리스트:** 줄을 누르면 식당 상세로, 하트를 누르면 식당 찜으로 동작합니다.
- 들어온 음식은 "최근 본 음식"에 최대 20개까지 쌓입니다.

### 1.1.1 식당 상세
- 버튼 3개:
  - 네이버 지도: `https://map.naver.com/p/search/{식당명}`
  - 카카오맵: `https://map.kakao.com/?q={식당명}`
  - 길찾기: Google 지도 `dir/?api=1&destination={lat},{lng}`
- 미니 지도는 움직이지 않는 Leaflet 지도에 핀 하나만 표시합니다.
- 영업시간·휴무일·가격은 확인되지 않아 "방문 전 확인" 안내 문구로 대신했습니다.
- "이 식당 이야기"에는 같은 음식이 태그된 커뮤니티 글을 보여줍니다.

### 1.2 검색 / 1.2.1 검색 결과
- **검색 대상:** 음식(4개 언어의 이름·설명·분류·재료), 식당(이름·지역·대표 메뉴), 게시글(제목·본문). 공백과 `· - ( )`는 무시합니다.
- **최근 검색어:** 최대 10개. 하나씩 지우거나 전체 삭제할 수 있습니다.
- **인기 검색어:** 고정 10개이고, 현재 언어의 음식 이름으로 보여줍니다.
- **결과 탭:** 전체(유형별 3개씩 + 모두 보기) / 음식 / 식당 / 게시글.

### 1.3 알림
- 이 화면에 들어오면 모든 알림을 읽음 처리합니다.
- 헤더의 종 아이콘 빨간 점은 안 읽은 알림이 있을 때만 보입니다.

### 2.0 지도
- 지도는 Leaflet 1.9.4 + OpenStreetMap 타일입니다.
- **칩:** `전체` + 음식 20개. 칩을 고르면 그 음식의 식당만 핀으로 표시합니다.
- **바텀시트:** 접힌 상태 높이 132, 펼치면 화면의 62%까지 올라옵니다. 손잡이를 누르면 접고 펼칩니다.
  - 목록 줄을 누르면 지도가 그 핀으로 이동하고 팝업을 엽니다.
  - 오른쪽 화살표를 누르면 식당 상세로 갑니다.
- **내 위치:** Geolocation 권한이 있으면 파란 점을 찍고 그 위치로 이동합니다. 실패하면 안내 토스트를 띄웁니다.
- **좌표:** 식당 좌표는 동(洞) 단위 근사치입니다 (`js/data/foods.js` → `places[].lat/lng`).

### 3.0 커뮤니티 / 3.1 게시글 상세 / 3.2 글쓰기
- **탭:** 인기(좋아요순) · 최신 · 맛집 후기 · 질문 · 자유.
- **게시글 상세:** 좋아요를 토글할 수 있고, 댓글은 최대 300자입니다. 내가 쓴 글이면 오른쪽 위에 삭제 버튼이 나옵니다 (확인 창을 거침).
- **글쓰기 입력 항목:**
  - 카테고리 (기본값: 맛집 후기)
  - 제목 (최대 60자) · 본문 (최대 2,000자). 둘 다 필수입니다.
  - 사진 최대 4장. 긴 변 1,080px, JPEG 품질 0.78로 줄여서 저장합니다.
  - 음식 태그 (선택)
- 저장 공간이 부족하면 사진을 빼고 글만 저장합니다.

### 4.0 찜 · 5.x 마이
- **찜:** `음식 n / 식당 n` 탭으로 나뉩니다. 비어 있으면 홈이나 지도로 가는 버튼을 보여줍니다.
- **마이:** 게스트면 프로필 대신 로그인 카드를 보여줍니다. 활동 요약 숫자(내가 쓴 글·댓글·찜)를 누르면 각 목록으로 갑니다.
- **프로필 수정:** 닉네임 2~10자, 활동 지역(부산 16개 구·군), 한 줄 소개 최대 30자(글자 수 표시).
- **설정:**
  - 알림 토글 4개 (기본값: 이벤트·혜택 알림만 꺼짐)
  - 언어
  - 계정 정보 (로그인한 서비스 표시)
  - 로그아웃
  - 약관 · 개인정보 · 사진 출처 · 버전
  - 회원 탈퇴 (확인 후 이 기기의 데이터를 모두 삭제)

---

## 6. 데이터 구조

### `js/data/foods.js` → `window.FOODS` (20개)

```js
{
  id: 'dwaeji-gukbap',            // 라우트와 사진 파일명(assets/food/{id}.jpg)에 사용
  likes: 512,                     // 기본 좋아요 수 (찜하면 +1)
  credit: { file, author, license, url },   // Wikimedia Commons 출처
  ko: {                           // 원문. en / zh / ja도 같은 구조
    name, gloss, summary, category, ingredients, taste, price, calories, origin,
    steps: [..],                  // 먹는 방법 3~4단계
    tip,
    allergens: [..],              // 식약처 알레르기 표시 대상 기준
    allergenNote,
    restaurants: [{ area, signature }]   // places와 같은 순서
  },
  places: [{ name, lat, lng }]    // 식당 이름은 모든 언어에서 한국어 원문을 씀
}
```

### `js/data/community.js` → `window.SEED`
- `posts`, `comments`, `notifications`, `popular`, `notices`, `faq`가 들어 있습니다.
- 시간은 `minutesAgo`(몇 분 전)로 적어 두고, 처음 실행한 시각(`seededAt`)을 기준으로 계산합니다.

### `js/store.js` → localStorage `ieatbusan.v1`

| 키 | 내용 |
|---|---|
| `lang`, `langChosen` | 현재 언어, 언어를 확정했는지 |
| `user`, `guest` | 데모 계정 정보, 게스트 여부 |
| `savedFoods`, `savedPlaces` | 찜한 음식 id, 찜한 식당 (`'foodId:index'`) |
| `recentSearches`, `recentFoods` | 최근 검색어, 최근 본 음식 |
| `posts`, `deletedPosts`, `postLikes`, `comments` | 사용자가 쓴 글, 삭제한 글, 좋아요, 댓글 |
| `notiReadAt` | 알림을 마지막으로 읽은 시각 |
| `settings` | 알림 토글 값 |
| `sort` | 홈 정렬 방식 |

실제 서비스로 바꿀 때는 이 키들을 그대로 API 리소스로 옮기면 됩니다: `/foods`, `/places`, `/posts`, `/posts/:id/comments`, `/me/saved`, `/me/settings`.

---

## 7. 다국어(i18n) 규칙

- **UI 문구:** `js/i18n.js` → `I18N[lang][key]`. 키가 없으면 한국어로 대체합니다.
- **음식 콘텐츠:** `FOODS[i][lang]`. 없으면 `ko`를 씁니다.
- **원문 함께 표기:** 음식·식당 이름은 모든 언어에서 한국어 원문을 함께 보여줍니다 (현지에서 간판·메뉴판과 맞춰 볼 수 있도록).
- **글자 길이:** 영어는 라벨이 길어서 상세 정보 표의 라벨 칸을 96px로 넓혔습니다 (ko 76px). 버튼과 칩은 가로 크기를 글자에 맞추고, 칩 줄은 가로 스크롤합니다.
- **Figma:** Starter 플랜은 변수 모드가 1개뿐이라 언어별 프레임을 따로 두었습니다 (04 줄). 플랜을 올리면 문자열 변수 모드(KO/EN/ZH/JA)로 합치는 것을 권장합니다.
- **커뮤니티 글:** 사용자가 쓴 그대로 두고 번역하지 않습니다.

---

## 8. 에셋 · 라이선스

| 에셋 | 위치 | 라이선스 |
|---|---|---|
| 음식 사진 20장 | `assets/food/{id}.jpg` (긴 변 960px) | Wikimedia Commons (CC BY / CC BY-SA / 공공누리 1유형). **출처 표기 필수.** 앱의 `#/credits`와 [`CREDITS.md`](../CREDITS.md) 참고 |
| 아이콘 | `js/icons.js` | Lucide (ISC) |
| 지도 타일 | OpenStreetMap | © OpenStreetMap contributors (지도 오른쪽 아래에 표기) |
| 앱 아이콘 | `assets/icon.svg` | 자체 제작 |

사진 관련 참고 사항:
- 물떡과 유부주머니는 같은 시장 노점 사진을 같이 씁니다.
- 낙곱새는 낙지볶음 사진, 기장 멸치쌈밥은 멸치보쌈 사진으로 대신했습니다.
- 실서비스 전에 직접 찍은 사진으로 바꾸는 것을 권장합니다.

---

## 9. 접근성 점검

| 조합 | 대비 | 판정 |
|---|---|---|
| 다홍 `#CC4936` 위 흰 글자 | 4.6 : 1 | 일반 텍스트 AA 통과 |
| 먹색 `#282622` / 한지 미색 `#F5F2EC` | 13 : 1 이상 | 통과 |
| `text/tertiary` `#8F8377` / `#F5F2EC` | 약 3.3 : 1 | **작은 글자 기준 미달.** 메타 정보에만 쓰고, 실서비스 전에 `#756A5F` 정도로 어둡게 조정 권장 |
| `icon/muted` `#B69C82` / `#F5F2EC` | 약 2.3 : 1 | **비텍스트 3 : 1 기준 미달.** 비활성 탭 아이콘은 `#8F8377` 이상으로 조정 권장 |

이 밖에 웹 구현에서 적용한 것:
- 모든 아이콘 버튼에 `aria-label`
- 탭바는 `aria-current="page"`, 언어 선택은 `role="radio"`, 토글은 실제 `checkbox`
- 키보드 포커스 표시(`:focus-visible`), `prefers-reduced-motion` 대응

---

## 10. 남은 이슈 · 결정 필요

1. **Figma 섹션 칩 고정:** 음식 상세 20개 프레임의 `Section Chips`를 Prototype > Position: Sticky로 수동 설정해야 합니다.
2. **Figma 사이트맵 페이지:** MCP 호출 한도 때문에 Figma에는 만들지 못했습니다. 대신 [`sitemap.html`](sitemap.html)을 기준 문서로 씁니다.
3. **번역 검수:** EN·ZH·JA 번역은 AI가 1차 번역하고 교차 검토만 했습니다. 원어민 검수가 필요합니다.
4. **식당 정보:** 이름·지역은 공개 자료 기준입니다. 좌표는 동 단위 근사치이고, 영업시간·전화·가격은 비어 있습니다.
5. **로그인·커뮤니티:** 데모입니다. 서버, 실제 소셜 로그인(OAuth), 사용자 간 글 공유는 연결하지 않았습니다.
6. **색 대비:** 9장의 두 가지 색 조정 여부를 디자인에서 결정해야 합니다.
7. **나의 활동·고객 지원(5.3·5.4):** 웹에만 있고 Figma 화면이 없습니다.

---

## 11. 로컬 실행 · 배포

- **로컬:** `index.html`을 브라우저로 열면 바로 동작합니다. 빌드와 설치가 필요 없고, 지도와 폰트만 인터넷 연결이 필요합니다.
- **GitHub Pages:** 저장소 Settings → Pages → Branch `main` / `(root)`로 설정하면 `https://sojungatw-dotcom.github.io/ieatbusan/`에서 열립니다.
- **이전 시안:** 팀원이 먼저 올린 Codex 시안은 [`archive/codex-prototype/`](../archive/codex-prototype/)에 그대로 보관했습니다.
