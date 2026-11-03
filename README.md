# I EAT BUSAN

부산 향토 음식 20가지를 소개하는 모바일 웹앱 시안입니다. 음식 정보, 먹는 방법, 알레르기 정보, 식당 리스트, 맛집 지도, 커뮤니티를 담았습니다.

- **지원 언어:** 한국어 · English · 中文(简体) · 日本語
- **디자인:** [Figma 와이어프레임](https://www.figma.com/design/hknzex4jUhZaEaYOpkR7Us) · 팔레트 한지 미색 `#F5F2EC` / 베이지 `#E5D5C2` / 다홍 `#CC4936`

## 실행

빌드나 설치가 필요 없습니다.

- **온라인:** GitHub Pages를 켜면 `https://sojungatw-dotcom.github.io/ieatbusan/` 에서 열립니다. Settings → Pages → Branch `main` / `(root)`로 설정하세요.
- **로컬:** 폴더를 정적 서버로 열면 됩니다. 예: VS Code의 Live Server 확장, 또는 `npx serve .` 지도와 폰트는 인터넷 연결이 필요합니다.

## 기능

| 영역 | 기능 |
|---|---|
| 로그인 · 언어 | 카카오 · 네이버 · Apple 데모 로그인, 게스트 둘러보기, 4개 국어 선택 |
| 홈 | 인기순 / 이름순 정렬, 하트로 찜하기 |
| 음식 상세 | 사진 아래 섹션 칩(상세 정보 · 먹는 방법 · 알레르기 · 식당 리스트) — 누르면 해당 섹션으로 스크롤, 스크롤하면 칩 상태가 따라 바뀜 |
| 식당 상세 | 미니 지도, 네이버 지도 · 카카오맵 · 길찾기 연결, 식당 찜 |
| 지도 | 음식별 칩 필터, 식당 핀, 바텀시트 목록, 내 위치 |
| 검색 | 음식 · 식당 · 게시글 통합 검색, 최근 · 인기 검색어 |
| 커뮤니티 | 카테고리 탭, 글쓰기(사진 최대 4장), 댓글, 좋아요, 내 글 삭제 |
| 찜 · 마이 | 찜한 음식 · 식당, 프로필 수정, 나의 활동, 공지 · FAQ, 설정(알림 토글, 언어, 로그아웃, 탈퇴) |

데이터는 브라우저 localStorage에만 저장됩니다. 서버와 실제 소셜 로그인은 연결하지 않았습니다.

## 구조

```
index.html          진입점
css/app.css         스타일 (디자인 토큰은 :root)
js/app.js           라우터 · 화면 · 동작
js/i18n.js          UI 문구 4개 국어
js/data/foods.js    음식 20종 데이터 (tools/gen-foods.ps1로 생성)
js/data/community.js 예시 게시글 · 알림 · 공지
js/store.js         localStorage 상태
assets/food/        음식 사진 (출처: CREDITS.md)
docs/               디자인 핸드오프, 사이트맵, 리서치 원본
handoff.md          작업 인수인계 (다음 작업자용)
archive/            이전 시안 보관
```

## 문서

- [handoff.md](handoff.md): 작업 인수인계. 다음 작업자가 여기서부터 시작합니다.
- [docs/design-handoff.md](docs/design-handoff.md): 디자인 → 개발 핸드오프 (토큰, 컴포넌트, 화면 스펙)
- [docs/sitemap.html](docs/sitemap.html): 사이트맵
- [CREDITS.md](CREDITS.md): 사진 · 리소스 출처

## 주의

시안용 데이터입니다.
- 식당 좌표는 동 단위 근사치이고, 영업시간 · 가격은 확인되지 않았습니다.
- EN · ZH · JA 번역은 원어민 검수가 필요합니다.

## 검증 재현

[검증 도구와 실행법](tests/README.md) · [검증 결과와 한계](docs/verification.md). 프로덕션 index.html에는 테스트 응답이나 합성 위치가 포함되지 않습니다.
