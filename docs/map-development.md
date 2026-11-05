# 지도 개발·협업 및 API 키 인수인계

기준: 2026-11-05, 작업 브랜치 `feature/map-renewal`.

사용자 승인으로 지도 브랜치 푸시와 PR 준비를 진행합니다. 아래 과거의 로컬 전용 지시를 대체합니다.
`main` 병합은 담당자 검토 후 진행하며 `max-branch`의 미병합 커밋은 포함하지 않습니다.
최신 main `703899d`를 지도 브랜치에 통합했습니다. 통합 전 복구 기준은 `1161d90`
(`backup/map-before-main-20261105` 로컬 브랜치), 파일 백업은 `../.local-backups/map-before-main-integration-20261105/`입니다.

## 현재 구현 범위

지도 모듈 분리 후, 로컬 임시 구역 SVG 지도와 지역별 음식 선택 화면을 추가했습니다.
첫 화면 `#/map`은 16개 구·군과 이름만 표시합니다. 지역 선택 시 음식 목록이 바뀌고,
음식 또는 상세 지도 버튼을 누르면 등록 식당 핀·목록을 표시합니다.
경계는 KOSTAT 2013 단순화 자료를 사용한 과거 경계 미리보기입니다. 출처는 `assets/maps/README.md` 참고.
카카오·네이버·Google 공급자는 아직 확정하거나 연결하지 않았습니다. 지금은 API 키가 필요 없는
Leaflet/OpenStreetMap 공급자로 메인 지도·식당 미니 지도를 유지합니다. 파일 더블클릭 대신 웹서버에서 실행하세요.

## 수정할 파일

| 파일 | 책임 |
|---|---|
| `js/map/map-catalog.js` | 고정 구·군 ID/경계 코드와 기존 식당 항목의 지역 연결 |
| `js/map/map-data.js` | 기존 FOODS를 화면용 정보로 변환. 지역/음식 필터와 좌표 검증 |
| `js/map/map-routes.js` | 지도 주소 정의·생성·선택값 검증, 기존 음식 지도 주소 호환 |
| `js/map/map-renderer.js` | 구역 SVG, 필터, 식당 목록, 팝업 HTML과 오류/빈 목록 표시 |
| `js/map/map-view.js` | 지도 초기화, 지역 변경, 목록 선택, 위치 요청과 화면 이탈 정리 |
| `js/map/map-loader.js` | 상세/미니 지도 진입 시 SDK·CSS 지연 로딩, 중복 요청 방지·실패 후 재시도 |
| `js/map/map-provider.js` | 외부 SDK 지도 생성·핀·팝업·확대·위치 원·제거 |
| `js/map/district-shapes.js` | 로컬 SVG 경계 경로와 이름 배치 좌표 (생성 파일) |
| `js/map/map-i18n.js` | 구역 지도 전용 4개 언어 문구 |
| `assets/maps/busan-districts.geojson` | 부산 16개 구·군 임시 경계 원본 |
| `tools/build-district-map.cjs` | 경계 원본을 SVG 경로 JS로 변환 |
| `css/map.css` | 메인 지도·미니 지도·핀·팝업 전용 CSS |
| `tests/map-regressions.cjs` | 실제 데이터/화면 모듈의 연결과 위치 응답 순서 검사 |
| `tests/map-provider.cjs` | 외부 SDK 경계, 팝업 타이머와 위치 원 관리 검사 |
| `tests/map-contracts.cjs` | 고정 ID, 지역 연결, 주소, 번역 누락 및 좌표 데이터 계약 검사 |
| `tests/map-loader.cjs` | SDK 지연 로딩·동시 요청·실패·시간 초과·재시도 검사 |
| `tests/map-lifecycle.cjs` | 로딩 중 이탈, 초기화 실패와 메인/미니 지도 정리 검사 |

`app.js`에는 모듈 생성과 화면/액션 연결만 남습니다. 미니 지도도 같은 공급자를 사용합니다.
새로운 SDK의 객체를 app.js나 Store에 넣지 마세요. 공급자 객체는 아래 인터페이스를 유지합니다.

```text
provider.available()
provider.load() → Promise<SDK>
provider.create(element, { interactive, center, zoom, onStatus })
  → addPlace(place, popupHtml, selected)
    fitPlaces(places)
    resize()
    focusPlace('foodId:index')
    showLocation([latitude, longitude])
    dispose()
```

화면 모듈은 `render`, `mount`, `mountMini`, `sheet`, `flyTo`, `locate`를 제공합니다.
`mount`와 `mountMini`의 반환값은 화면 이탈 때 실행하는 정리 함수입니다.
SDK는 구역 지도에서는 요청하지 않고 상세/미니 지도에서 처음 요청합니다. 로딩 후 화면이 살아 있는지
확인하고, 이탈 시 지도·이벤트·타이머를 정리합니다. SDK 실패는 지도 영역에, 타일 실패는 상태 안내에
표시하며 지역 선택과 식당 목록은 유지합니다. 좌표가 없는 식당은 목록에 남기고 핀에서 제외합니다.

## 변경하지 않는 데이터 계약

- `#/map`과 `#/map/:foodId`는 기존 주소를 유지합니다.
- `#/map`은 구역 선택 화면, 기존 `#/map/:foodId`는 해당 음식의 상세 지도로 연결됩니다.
- 구역 선택은 `#/map/region/:districtId`, 상세 지도는 `#/map/region/:districtId/detail/:foodId?`입니다.
- 부산 전체 상세 지도는 `#/map/detail/:foodId?`입니다. 지역 필터는 표시 문구 대신 고정 지역 ID를 사용합니다.
  기존 69개 음식별 식당 항목은 `map-catalog.js`의 `foodId:index` 연결표로 지역을 결정합니다.
  새 식당은 원본 `place.districtId`를 명시하는 방식을 권장하며 명시된 값이 연결표보다 우선합니다.
  지원하는 ID는 같은 파일의 districts 목록을 따릅니다. 현재 자료에 식당이 없는 지역은 빈 목록 안내를 표시합니다.
- main 원고 자료의 `place.research` 또는 `food.manuscript.restaurants[index]`는 상세 페이지로 그대로 전달합니다.
  이 자료는 `districtId`가 없으면 원본 research.area의 부산 주소에서 구·군을 연결합니다.
  새 데이터의 `place.address`도 같은 방식으로 지원합니다. 번역된 표시 문구는 지역 판별에 쓰지 않습니다.
  새 원고 자료에는 기존 순번의 지역을 재사용하지 않으며 부산 외/불명확 주소는 임의 배정하지 않습니다.
  권장 입력은 여전히 명시적인 `districtId`입니다.
- 현재 main 원본은 음식 45종/식당 항목 135개이며 100개 항목은 좌표 미확인입니다.
  구별 목록은 좌표 유무와 무관하게 표시합니다. 좌표가 없는 행을 누르면 상세로 이동합니다.
  식당이 없는 음식 6종은 지도 음식 목록에 표시하지 않습니다(홈 목록에는 유지).
- 잘못된 지역/음식 주소는 전체 식당으로 조용히 대체하지 않고 오류 화면을 표시합니다.
- 상세 지도 상단의 `구역 지도`는 선택 지역을 유지해 복귀하고, `부산 전체 지도`는 지역·음식 선택을
  모두 해제한 `#/map/detail`로 이동합니다.
- 상세 지도 우측 지역 드롭다운은 부산 전체와 16개 구·군을 제공합니다. 지역을 바꾸면 음식 필터는
  초기화하고 새 지역의 모든 등록 식당을 표시합니다. SDK가 없어도 드롭다운 이동은 동작합니다.
- `#/place/:foodId/:index`와 찜 키 `foodId:index`는 유지합니다.
- `foods[].places[index]`와 각 언어의 `restaurants[index]`는 같은 식당입니다.
- 식당 배열 순서/음식 ID를 바꾸지 않고 지역 ID나 새 식당 ID를 별도로 연결합니다.
- 음식 사진 경로는 `assets/food/{foodId}.jpg`입니다. 별도 사진 사본을 만들지 않습니다.
- 식당 좌표는 기존 근사치입니다. 같은 이름의 식당을 이름만으로 자동 병합하지 마세요.

현재 음식·식당·좌표의 원본은 `js/data/foods.js`입니다. Supabase의 계정·게시글·찜 데이터와는 별개입니다.
Supabase 테이블 구조나 인증/저장 흐름은 변경하지 않았습니다. 추후 음식·식당을 DB로 옮길 경우
`map-data.js` 입력에 맞추는 어댑터가 필요하며, 기존 ID·찜 키를 이어주는 변환 규칙을 먼저 정해야 합니다.
데이터 행 추가/수정과 스키마 변경은 구분해서 협의해야 합니다.

## 팀장님께 요청할 정보

1. 사용할 공급자: 카카오 / 네이버 / Google 중 하나
2. 해당 공급자의 **웹 지도 SDK용 키** 또는 Client ID
3. 키 소유 프로젝트와 무료량 적용 여부, 개발·운영 도메인 등록 담당자
4. 실제 운영 URL 및 Preview 배포에서 지도 테스트를 허용할지

| 공급자 | 브라우저 지도에 필요한 값 | 서버에만 둘 값 |
|---|---|---|
| 카카오 | JavaScript 키 | REST API 키, Admin 키 등 서버 작업용 키 |
| 네이버 | Web Dynamic Map용 Client ID | Client Secret |
| Google | Maps JavaScript API용 제한된 API 키 | 서비스 계정 키, 서버 전용 API 자격증명 |

브라우저용 키는 지도 SDK 요청에서 사용자에게 보입니다. 환경변수는 키를 Git에 커밋하지 않기 위한
수단이며, 브라우저에 전달한 키를 숨겨 주지는 않습니다. 허용 도메인·사용 API 제한을 함께 설정합니다.
Supabase 비밀 키와 지도용 서버 비밀 값은 브라우저 설정에 포함하지 않습니다.

## 키를 받은 후 적용할 방식 (다음 API 연결 단계)

현재 이 단계에서는 아래 환경변수를 **예약만** 합니다. 아직 읽거나 SDK에 전달하지 않습니다.
`.env.example`의 주석을 해제하는 것만으로 새 공급자로 전환되지 않습니다.

```dotenv
MAP_PROVIDER=kakao
MAP_BROWSER_KEY=팀장님에게_별도로_받은_웹용_키
```

1. 각 개발자의 `.env.local`에 위 값을 넣습니다. `.env.local`은 이미 `.gitignore`에 포함돼 있습니다.
2. Git에는 실제 값 대신 `.env.example`과 이 문서만 올립니다. 키는 GitHub 이슈·PR·커밋에 적지 않습니다.
3. 선택한 공급자 어댑터를 `map-provider.js` 또는 별도 공급자 파일로 구현합니다.
4. 별도 `/api/map-config` 서버 응답에 `provider`, `browserKey` 두 값만 명시적으로 포함하는 방식을 권합니다.
   인증용 `/api/service`와 분리하고, 로컬 dev-server에도 같은 경로를 연결합니다.
   환경변수 전체를 직렬화하거나 Supabase/서버용 키를 반환하지 않습니다.
5. 현재 `map-loader.js`의 Leaflet 로더를 선택한 SDK의 공개 설정/로딩 방식으로 교체합니다.
   단일 로딩 Promise, CSS 준비 확인, 시간 초과·재시도 및 `map-view.js`의 화면 이탈 처리를 유지합니다.
6. Vercel Project Settings의 Environment Variables에 같은 이름으로 등록하고 재배포합니다.
   Production/Preview/Development 적용 범위를 구분합니다. 팀장님 계정의 설정은 담당자가 수행합니다.
7. 키 등록 화면에는 `http://127.0.0.1:8779`, 필요 시 `http://localhost:8779`, 실제 운영 도메인을
   공급자 규칙에 맞춰 등록합니다. 허용하지 않은 임시 Preview 주소에서는 동작하지 않을 수 있습니다.
8. 별도 REST 검색/지오코딩 기능이 필요해지면 서버용 환경변수와 서버 API를 추가합니다.
   등록된 식당 좌표에 핀만 표시할 때에는 검색 API를 매번 호출할 필요가 없습니다.

공식 문서:
- 카카오: https://apis.map.kakao.com/web/guide/
- 네이버: https://guide.ncloud-docs.com/docs/maps-app
- Google: https://developers.google.com/maps/api-security-best-practices

## 협업 경계

- 지도 담당자는 `js/map/`, `css/map.css`와 지도 검사 파일을 수정합니다.
- 공통 연결부는 `app.js`, `index.html`, `tests/browser.html`입니다. 공급자 로딩 경로 변경 시 함께 확인합니다.
- `css/app.css`에서 지도 스타일을 옮겼습니다. 앞으로 지도 스타일은 map.css에서 수정합니다.
- 로그인·Store·Cloud·Supabase 스키마·기존 API handler는 이번 작업에서 수정하지 않습니다.
- 다른 기능 담당자는 음식/식당 ID와 배열 순서를 바꿔야 할 때 지도 담당자와 먼저 공유합니다.
- 별도 브랜치에 push하고 PR로 main에 병합합니다. 지도 브랜치는 푸시하며 main은 검토자가 병합합니다.

## 확인 명령

```text
node tests/map-regressions.cjs
node tests/map-districts.cjs
node tests/map-provider.cjs
node tests/map-contracts.cjs
node tests/map-loader.cjs
node tests/map-lifecycle.cjs
node tests/map-integration.cjs
node tests/food-manuscript.cjs
node tests/async-regressions.cjs
node tests/home-carousel.cjs
node tests/auth-regressions.cjs
node tests/api-regressions.cjs
node tools/build-static.cjs
node tests/deployment.cjs
```

API/인증 검사는 Supabase 모의 응답을 사용합니다. 실제 운영 DB 연결을 입증하지 않습니다.
새 공급자의 도메인 제한·키·요금·실제 SDK 동작은 키 인수 후 별도로 검증합니다.

## 비상시 최신 main을 받아야 할 때

통합 전 상태는 `1161d90` 커밋과 로컬 백업 브랜치/파일 사본으로 보관했습니다.
진행 중 작업을 되돌릴 때는 먼저 현재 변경을 보관하고 별도 복구 브랜치에서 해당 커밋을 확인하세요.
PR 병합 후 취소는 공유 main을 강제로 되감지 말고 revert PR을 사용합니다.
아래는 이전 미커밋 작업을 보관할 때의 일반 절차입니다.
최신 코드를 받아야 할 경우 먼저 아래 순서로 전체 로컬 변경(미추적 파일 포함)을 보관합니다.
일반 git pull만 실행하거나 reset/clean으로 로컬 시안을 삭제하지 마세요.

```text
git stash push --include-untracked -m "local district preview before main update"
git switch main
git pull --ff-only origin main
```

시안을 이어서 작업할 때는 main에서 작업 브랜치를 만든 뒤 해당 stash를 적용하고 충돌을 확인합니다.
stash는 적용 확인 전 삭제하지 않습니다. 현재 작업 전후의 패치와 새 파일은 저장소 밖
`../.local-backups/`에도 별도 보관합니다. 이 안내는 절차이며 이번 작업에서 pull이나 stash를 실행한 것은 아닙니다.
