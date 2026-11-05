# Google 상세지도 연결

부산 구별 SVG 안내 지도는 기존대로 사용합니다. 상세지도 보기와 식당 상세 미니지도에서만
Google Maps JavaScript API를 지연 로드합니다. 지역/음식 필터, 식당 핀과 상세 팝업,
목록에서 핀 선택, 내 위치 및 화면 이탈 정리는 기존 지도 컨트롤러에 연결했습니다.
하단 목록을 열거나 닫을 때 지도 영역도 조절하여 Google 로고·저작권 표시를 가리지 않습니다.

## 로컬 키 입력

프로젝트 폴더에서 `python3 tools/configure-google-maps.py`를 실행합니다.
키 입력은 터미널에 표시되지 않으며 Git에서 제외되는 `.env.local`에 저장됩니다.
기존 설정값은 보존합니다. Google 지도 키는 `GOOGLE_MAPS_BROWSER_KEY`입니다.
자신의 지도 ID가 있으면 `GOOGLE_MAPS_MAP_ID`도 설정할 수 있으며 기본은 개발용 `DEMO_MAP_ID`입니다.
로컬 서버 `node tools/dev-server.cjs`는 지도 설정을 요청할 때마다 로컬 파일을 읽습니다.
키 입력 후 브라우저를 새로고침하면 되며 서버 재시작은 필요하지 않습니다.

이 키는 브라우저에서 Google SDK를 불러올 때 전달되는 브라우저용 키입니다.
Google Cloud에서 Maps JavaScript API를 활성화하고 결제 계정과 연결해야 합니다.
키의 웹사이트 제한에는 실제 사용 주소를 등록하세요.
로컬 예: `http://127.0.0.1:8765/*`, `http://localhost:8765/*`.
API 제한은 Maps JavaScript API로 설정합니다. 서버 전용 키나 Supabase 키를 입력하지 마세요.

## Vercel

Vercel 환경 변수에 `GOOGLE_MAPS_BROWSER_KEY`, 선택적으로 `GOOGLE_MAPS_MAP_ID`를 설정하고
재배포합니다. 로컬 `.env.local`은 Git으로 전달되지 않습니다.
`api/maps-config.js`는 이 두 지도 설정만 반환하고 Supabase 설정이나 서버 비밀 키는 반환하지 않습니다.
프로덕션 사이트 주소도 Google 키의 웹사이트 허용 목록에 추가해야 합니다.

## 확인

`node tests/google-maps.cjs`는 SDK 지연 로드/동시 요청 공유, 키 없음, 네트워크 오류·재시도·시간초과,
인증 오류, 지도 핀·화면 범위·팝업·내 위치·미니지도·정리와 설정 응답을 모의 SDK로 검사합니다.
기존 지도/인증/음식 상세 검사와 정적 빌드도 함께 실행합니다.
실제 Google 지도 타일과 실제 키 인증·할당량·결제 상태는 키 입력 후 별도 확인해야 합니다.

공식 문서: [SDK 로딩](https://developers.google.com/maps/documentation/javascript/load-maps-js-api),
[Advanced markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/add-marker).
