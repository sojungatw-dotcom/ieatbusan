# HANDOFF — I EAT BUSAN (AI 작업 인수인계)

> 이 파일만 읽으면 어떤 AI든 바로 이어서 작업할 수 있도록 적었습니다. 마지막 갱신: 2026-11-03.
> 사용자에게는 **한국어로**, 짧고 바로 행동하는 방식으로 답하세요.

---

## 0. 현재 상태와 다음 작업

- **2026-11-03 로컬 검증 완료:** KO/EN/ZH/JA 각각 28개 화면, 총 112개 렌더 검사 통과. 지도 빠른 전환 30회도 콘솔 오류 0건.
- **이번 수정:** 게스트 글쓰기의 로그인 리다이렉트, 지도 목록 상세 링크 클릭, 지도 제거 뒤 남은 초기화 타이머/확대 애니메이션, 지도·커뮤니티·검색의 빈 탭 제목.
- **실제 동작 확인:** 사진 게시글 작성, 댓글, 새로고침 후 유지, 프로필 저장, 찜 반영, 설정 토글 저장, 설정에서 언어 변경 후 복귀, 로그아웃. 테스트 게시글 삭제 후 커뮤니티에서 사라짐 확인.
- **제한:** 회원 탈퇴는 확인창까지 확인했으나 브라우저 제어 중단으로 완료 후 화면을 검증하지 못함. Store.reset 로직은 별도 실행 검증 통과. 자동화가 멈춘 Chrome 테스트 탭에 확인창이 남아 있을 수 있음.
- **GitHub 권한 해결:** kimjuncheol-ai 초대 수락 및 push=true 확인. 원격은 https://github.com/sojungatw-dotcom/ieatbusan.git, 브랜치는 main만 사용.
- **Git 반영 완료:** 수정 코드와 협업 문서를 main에 푸시함 (구현 커밋 aaaa106). 후속 문서 상태 커밋도 같은 브랜치에 포함.
- **배포 보류 (사용자 결정, 2026-11-03):** 사용자가 "배포는 나중에 할게"라고 요청. 이번 작업에서 Pages를 활성화하지 않음. 다음 배포 시 저장소 소유자가 Settings → Pages → Deploy from a branch → main / (root) → Save. 공개 주소는 https://sojungatw-dotcom.github.io/ieatbusan/ 이며 아직 라이브 검증하지 않음. 현재 계정은 push 권한만 있고 Pages 활성화 API는 404로 거부됨.
- **상세 검증 기록:** [docs/verification.md](docs/verification.md).
- 로컬 서버: http://localhost:8765 (기존 임시 PowerShell HttpListener). 빌드 없는 정적 앱.

### 협업 문서 사용 규칙

- 현재 상태·막힌 점·바로 할 일은 이 파일의 0장에 유지.
- 실행한 검증과 한계는 docs/verification.md에 기록. 미검증 사항을 완료로 쓰지 않기.
- 디자인 계약은 docs/design-handoff.md, 실행법은 README.md, 출처는 CREDITS.md에서 관리.
- 작업 종료 시 코드와 문서를 함께 커밋·푸시하고, 문서의 상태와 원격 실제 상태를 일치시킬 것.

---

## 1. 프로젝트 요약

- **서비스:** I EAT BUSAN. 부산 향토 음식 20가지를 소개하는 모바일 웹/앱 시안입니다 (팀 프로젝트, 부산제작소 프로그램).
- **지원 언어:** 한국어 · English · 中文(简体) · 日本語. 음식·식당 이름은 모든 언어에서 한국어 원문을 함께 표기합니다.
- **팔레트 (사용자 지정):**

  | 색 | 값 | 비율 · 용도 |
  |---|---|---|
  | 한지 미색 | `#F5F2EC` | 배경 70% |
  | 베이지 | `#E5D5C2` | 보조 25% |
  | 다홍 | `#CC4936` | 강조 5% |
  | 백색 | `#FFFFFF` | 보조 |
  | 먹색 | `#282622` | 보조 |
  | 회갈색 | `#B69C82` | 보조 |
  | 분홍빛 미색 | `#F7E7DF` | 보조 |
  | 시맨틱 | Success `#3B7964` · Warning `#B87C24` · Error `#B64B4A` · Info `#3A7291` | |

- **사용자 요청 이력 (요약):**
  - 와이어프레임 → 1열 큰 사진 카드
  - 부산 음식 데이터로 교체
  - 하단 탭 5개 (홈 / 지도 / 커뮤니티 / 찜 / 마이)
  - 지도는 **음식별 칩** 필터
  - 음식 상세에 사진, 상세 정보, 먹는 방법, 알레르기, 식당 리스트를 넣고, 사진 아래에 섹션 이동 칩 (배달의민족 가게 상세처럼)
  - 찜·마이는 "번잡하지 않게"
  - "필요한 화면 다 만들어"
  - 팔레트와 레퍼런스 반영, 4개 국어
  - 사이트맵
  - GitHub에 올려서 "완전히 작동하게"
  - **음식 상세 페이지는 하나(템플릿)만 있어도 됨**
  - "시안이라 아주 정확할 필요 없음, 없는 건 넘어가"
- **사용자 성향:** 결과를 빨리 보고 싶어 합니다. 질문은 최소화하고 바로 실행하세요. 응답은 한국어로 합니다.

---

## 2. 파일 위치 (전부 로컬에 저장됨)

작업 폴더: `C:\Users\user\Desktop\팀프로젝트\ieatbusan` (git 저장소)

| 경로 | 내용 |
|---|---|
| `index.html` | 앱 진입점. 순서대로 불러오는 것: Leaflet 1.9.4(unpkg), Google Fonts, `js/i18n.js` → `js/data/foods.js` → `js/data/community.js` → `js/store.js` → `js/icons.js` → `js/app.js` |
| `css/app.css` | 전체 스타일. 상단 `:root`에 팔레트 토큰 |
| `js/app.js` | 해시 라우팅 SPA. 모든 화면(`V.*`), 동작(`A.*`), 폼 제출 처리 |
| `js/i18n.js` | UI 문구 4개 국어(`I18N`), `LANGS`, `DISTRICTS`(부산 16개 구·군) |
| `js/data/foods.js` | 음식 20종 (`ko`/`en`/`zh`/`ja` 콘텐츠 + `places` 좌표 + `credit`). **`tools/gen-foods.ps1`로 생성** |
| `js/data/community.js` | 예시 게시글, 댓글, 알림, 인기 검색어, 공지, FAQ (`window.SEED`) |
| `js/store.js` | localStorage `ieatbusan.v1` 상태 관리 |
| `js/icons.js` | Lucide 아이콘 SVG 패스 |
| `assets/food/{id}.jpg` | 음식 사진 20장 (Wikimedia Commons). `multteok`과 `yubu-jumeoni`는 같은 사진 |
| `assets/icon.svg` | 파비콘 |
| `docs/design-handoff.md` | **디자인 → 개발 핸드오프** (토큰, 컴포넌트, 화면 스펙, Figma node-id, 접근성) |
| `docs/sitemap.html` | 사이트맵 (구조도, 화면 목록, 동선) |
| `docs/research/foods-ko.json` | 음식 20종 한국어 원본 데이터 (리서치·검증 완료) |
| `docs/research/i18n-coords-output.json` | EN/ZH/JA 번역 + 식당 좌표 (워크플로 원본 결과) |
| `docs/research/food-research-output.json` | 음식 리서치 원본 (사진 URL, 출처, 노트) |
| `tools/gen-foods.ps1` | `foods-ko.json` + `i18n-coords-output.json`을 합쳐 `js/data/foods.js`를 만드는 PowerShell 스크립트 |
| `archive/codex-prototype/` | 팀원이 먼저 올린 이전 시안 (보관용, 수정 금지) |

`foods.js`를 다시 만들 때 (PowerShell):

```powershell
.\tools\gen-foods.ps1 -FoodsJson docs\research\foods-ko.json -I18nOutput docs\research\i18n-coords-output.json -OutFile js\data\foods.js
```

로컬 환경 주의:
- `node`가 없고, `python`은 Windows Store 스텁이라 실행되지 않습니다.
- 데이터 가공은 PowerShell로 하세요.
- 웹앱은 빌드 없는 순수 HTML/CSS/JS이고, 모듈이 아닌 일반 `<script>`라서 `file://`로 열어도 동작하도록 만들었습니다.

---

## 3. 웹앱 테스트 체크리스트 · 의심 지점

### 라우트
`#/login`, `#/lang`, `#/home`, `#/food/:id`, `#/place/:id/:i`, `#/search`, `#/results/:q/:tab?`, `#/notifications`, `#/map/:id?`, `#/community/:tab?`, `#/post/:id`, `#/write`, `#/saved/:tab?`, `#/my`, `#/my/posts`, `#/my/comments`, `#/my/recent`, `#/profile`, `#/settings`, `#/notices`, `#/faq`, `#/contact`, `#/terms`, `#/privacy`, `#/credits`

### 꼭 확인할 흐름
1. 첫 실행 → 로그인 → 카카오 → 언어 선택 → 확인 → 홈
2. 홈 하트 토글 → 찜 탭에 반영 / 정렬 전환
3. 음식 상세: 섹션 칩 클릭 스크롤, 스크롤 중 칩 활성 상태 변경, 칩 줄 sticky, 하단 CTA → 지도
4. 지도: 칩 필터, 핀 팝업, 바텀시트 펼치기/접기, 목록 줄 클릭 시 해당 핀으로 이동
5. 식당 상세: 미니 지도, 외부 링크 3개
6. 검색 → 결과 탭 / 최근 검색어 삭제
7. 커뮤니티 → 글쓰기(사진 첨부) → 게시글 상세 → 댓글 → 내 글 삭제
8. 마이 → 프로필 수정 저장 / 설정 → 토글, 언어 변경, 로그아웃, 회원 탈퇴
9. 언어를 EN·ZH·JA로 바꿔서 모든 화면 확인

### 점검 참고

2026-11-03 갱신: 아래의 클릭 기본 동작과 지도 초기화 타이밍 문제는 수정·회귀 검증 완료. loginIntent 및 언어 선택 복귀도 동작 확인. 남은 미검증 항목은 0장과 docs/verification.md를 우선 참고.
- **`app.addEventListener('click')`의 `preventDefault` 조건:** `data-act`가 붙은 `<a>`(글쓰기 FAB의 `needLogin`, 지도 시트의 `flyTo`)가 정상 이동하는지 확인하세요. 조건문이 복잡하니 단순하게 고치는 것을 권장합니다.
- **`loginIntent`:** 로그인 상태에서 `#/login` 링크를 누를 때만 로그인 화면을 허용하는 플래그입니다. 마이의 "로그인하기" 버튼이 동작하는지 확인하세요.
- **`A.confirmLang`:** 온보딩에서 확인을 누르면 홈으로, 설정에서 들어왔으면 뒤로 가야 합니다.
- **지도:** `V.map.mount`의 `invalidateSize` 타이밍, 펼친 시트와 내 위치 버튼이 겹치지 않는지.
- **`searchAll`:** `FOODS[i][lang]` 필드가 비어 있으면 `norm(undefined)`가 빈 문자열이 되는지 (지금은 `String(s||'')` 처리).
- **글쓰기 사진:** localStorage 용량을 넘기면 사진 없이 저장하는 분기.
- **`style="display:contents"`:** `<a>` 안의 목록 줄에 썼습니다. 클릭 영역과 하트 버튼의 이벤트 버블링을 확인하세요.

---

## 4. Figma 상태

| 항목 | 값 |
|---|---|
| 파일 | `https://www.figma.com/design/hknzex4jUhZaEaYOpkR7Us` (fileKey `hknzex4jUhZaEaYOpkR7Us`) |
| 페이지 | `Wireframe` (0:1) |
| 팀 | Starter 플랜 `team::1255829428770538200` |
| Figma MCP | **호출 한도 초과 상태** (Starter). 한도가 풀릴 때까지 쓰기 불가 |
| 색상 변수 | 컬렉션 `I EAT BUSAN / Color` (`VariableCollectionId:17:1015`), 변수 15개 (`bg/base` 17:1016 … `semantic/info` 17:1030) |

### 주요 프레임 node-id

| 구분 | 화면 (node-id) |
|---|---|
| 메인 탭 | 홈 2:14 · 지도 8:263 · 커뮤니티 9:327 · 찜 11:537 · 마이 11:649 |
| 서브 화면 | 로그인 13:686 · 검색 13:705 · 검색 결과 13:768 · 알림 14:774 · 게시글 상세 14:861 · 글쓰기 14:974 · 설정 15:914 · 프로필 수정 15:1002 · 식당 상세 16:975 · 언어 선택 24:1982 |
| 음식 상세 20개 | 19:1015, 19:1181, 19:1349, 19:1506, 19:1672, 20:1290, 20:1452, 20:1605, 20:1769, 20:1939, 21:1565, 21:1727, 21:1886, 21:2037, 21:2177, 22:1810, 22:1972, 22:2112, 22:2274, 22:2436 |
| 다국어 예시 | 홈 EN 25:2017 · ZH 25:2473 · JA 25:2929 / 상세 EN 25:2308 · ZH 25:2764 · JA 25:3220 |
| 컴포넌트 | Food Card 2:2 · App Header 7:222 · Tab Bar 7:361 · Chip 7:366 · Post Item 9:296 · Community Tab 9:326 · Status Bar 10:522 · Page Header 10:556 · Saved Item 11:527 · Menu Row 11:644 · Restaurant Item 13:675 · Notification Item 14:751 · Comment Item 14:760 · Toggle 15:899 · Toggle Row 15:900 · Text Field 15:907 · Language Option 24:1981 |

### Figma에 남은 일 (한도가 풀린 뒤)
- 음식 상세 프레임마다 `Section Chips`를 Prototype → Sticky로 설정 (API로는 불가해서 수동)
- `Sitemap` 페이지 만들기 (내용은 `docs/sitemap.html` 그대로)

---

## 5. 알려진 한계 (사용자가 "시안이라 괜찮다"고 함)

- **식당:** 이름·동은 공개 자료 기준입니다. 좌표는 동 단위 근사치이고, 영업시간·전화·가격은 없습니다 (화면에 "방문 전 확인" 안내).
- **번역:** EN/ZH/JA는 AI 번역 + 교차 검토만 거쳤고, 원어민 검수는 안 했습니다.
- **로그인·커뮤니티:** 데모입니다 (localStorage만 사용, 서버 없음).
- **색 대비:** `text/tertiary`와 `icon/muted`가 WCAG 기준에 못 미칩니다 (`docs/design-handoff.md` 9장).
- **사진:** 낙곱새와 기장 멸치쌈밥은 비슷한 다른 음식 사진을 씁니다.

---

## 6. 지켜야 할 것

- `archive/codex-prototype/`(팀원 작업)은 지우거나 덮어쓰지 마세요.
- 사진은 CC 라이선스라 출처 표기를 유지해야 합니다 (`#/credits`, `CREDITS.md`).
- 회사 기밀이나 보안이 필요한 코드는 올리지 마세요 (조직 정책).
- 푸시는 사용자가 요청한 저장소(`sojungatw-dotcom/ieatbusan`)의 `main`에만 합니다.
