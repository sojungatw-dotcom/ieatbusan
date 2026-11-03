# I EAT BUSAN

부산 향토 음식 20가지를 소개하는 모바일 웹앱 시안입니다. 음식 정보, 먹는 방법, 알레르기 정보, 식당 리스트, 맛집 지도, 커뮤니티를 담았습니다.

- **지원 언어:** 한국어 · English · 中文(简体) · 日本語
- **디자인:** [Figma 와이어프레임](https://www.figma.com/design/hknzex4jUhZaEaYOpkR7Us) · 팔레트 한지 미색 `#F5F2EC` / 베이지 `#E5D5C2` / 다홍 `#CC4936`

## 실행

프레임워크나 외부 패키지를 설치할 필요가 없습니다. 인증·DB 기능은 Vercel 서버 API와 함께 실행합니다.

- **로컬:** `.env.example`을 `.env.local`로 복사하고 값을 입력한 뒤 Node.js 22 이상에서 `node tools/dev-server.cjs`를 실행합니다. `http://127.0.0.1:8779/`에서 확인할 수 있습니다. 단순 file://나 정적 서버에서는 인증·DB API가 실행되지 않습니다.

## Vercel 배포

1. Vercel의 **Add New → Project**에서 `sojungatw-dotcom/ieatbusan` 저장소를 Import합니다.
2. **Root Directory는 저장소 루트(`./`)**, **Production Branch는 `main`**으로 선택합니다.
3. Deploy를 누릅니다. 저장소의 `vercel.json`이 아래 설정을 적용합니다.

| 설정 | 값 |
|---|---|
| Framework Preset | Other |
| Install Command | 없음 |
| Build Command | `node tools/build-static.cjs` |
| Output Directory | `dist` |
| Environment Variables | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |

추가 패키지를 설치하지 않고 HTML·CSS·JS·이미지만 `dist/`에 복사합니다. `api/service.js`는 별도의 Vercel Node.js Function으로 실행되며 `server/backend.cjs`를 사용합니다. 서버 비밀 키와 세션 토큰은 공개 JS 파일에 포함되지 않습니다. 작업 문서, 테스트, 이전 시안도 정적 배포 결과물에 포함하지 않습니다. `#/home`, `#/signup` 같은 기존 해시 주소는 유지합니다. Vercel의 Git 자동 배포가 활성화된 경우 `main` push로 배포됩니다.

배포 전 로컬 확인:

```text
node tools/build-static.cjs
node tests/deployment.cjs
node tests/home-carousel.cjs
node tests/auth-regressions.cjs
node tests/api-regressions.cjs
node tests/async-regressions.cjs
```

Vercel 환경변수는 Production에 등록하고 재배포해야 적용됩니다. `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 기존 키 이름의 호환용 대안입니다. 브라우저 환경변수 접두어를 붙이지 않습니다. `/api/service?action=status`에서 `database: connected`, `signupConfigured: true`인지 확인할 수 있습니다. 비밀 키 값은 이 응답에 표시되지 않습니다.

## Supabase 저장 구조

| 저장 위치 | 내용 |
|---|---|
| `auth.users` | Supabase Auth 계정과 비밀번호 해시 |
| `public.ieb_profiles` | 아이디·닉네임·지역·소개 |
| `public.ieb_posts` | 공유 게시글 |
| `public.ieb_comments` | 공유 댓글 |
| `public.ieb_post_likes` | 게시글 좋아요 |
| `public.ieb_preferences` | 계정별 찜·최근 검색·최근 음식·설정 |
| Storage `ieb-community` | 게시글 사진, 비공개 버킷·서명 URL |

아이디·비밀번호 두 입력칸을 유지하기 위해 서버에서 아이디를 내부 인증 주소로 변환합니다. 실제 이메일은 수집하지 않으므로 이메일을 이용한 비밀번호 복구는 현재 제공하지 않습니다. 회원가입은 서버에서 입력 검증과 IP별/전체 가입 요청 제한 후 Supabase Auth에 계정을 생성합니다. 비밀번호는 앱 테이블이나 브라우저에 저장하지 않습니다. 세션은 HttpOnly·SameSite 쿠키로 관리하고, 데이터 변경 시 Supabase에서 사용자 신원을 검증한 후 사용자 JWT와 RLS로 접근합니다. 관리자 키는 가입·탈퇴 등 서버 관리 작업에만 사용합니다.

기존 로컬 시안 계정은 자동 이관하지 않습니다. 처음 한 번 다시 회원가입해야 합니다. 기존 localStorage의 `ieatbusan.v1` 데이터는 삭제하지 않으며, 새 코드에서는 로그인·게시글의 저장 근거로 사용하지 않습니다. 언어 등 화면 설정만 `ieatbusan.ui.v2`에 저장합니다. 게스트는 공개 글을 읽을 수 있고 작성·댓글·찜은 로그인 후 사용합니다. 커뮤니티의 새로고침 버튼으로 다른 사용자의 최신 글을 불러옵니다.

`supabase/schema.sql`과 `supabase/seed.sql`은 현재 DB의 초기 구성 기록입니다. 이미 적용된 프로젝트에 그대로 재실행하지 마세요. 공개 글/프로필은 읽기 가능하며, 쓰기·삭제는 본인 데이터만 허용합니다. 가입 요청 제한 테이블은 서버 전용으로 일반 사용자 접근을 차단합니다. 현재 피드는 최근 게시글 최대 500개를 조회합니다.

## 기능

| 영역 | 기능 |
|---|---|
| 로그인 · 언어 | 아이디·비밀번호 로그인, 아이디·비밀번호 두 항목 회원가입, 중복 아이디·로그인 오류 안내, 계정별 기록 저장, 게스트 둘러보기, 4개 국어 선택 |
| 홈 | 상단 추천 음식 5개 좌우 스와이프·이전/다음·페이지 버튼, 4초 미조작 시 자동 이동(마지막 → 첫 음식 반복), 터치 중 정지·조작 후 재시작, 자동 넘김 멈춤/재생, 하단 음식 목록 세로 스크롤, 인기순 / 이름순 정렬, 하트로 찜하기 |
| 음식 상세 | 사진 아래 섹션 칩(상세 정보 · 먹는 방법 · 알레르기 · 식당 리스트) — 누르면 해당 섹션으로 스크롤, 스크롤하면 칩 상태가 따라 바뀜 |
| 식당 상세 | 미니 지도, 네이버 지도 · 카카오맵 · 길찾기 연결, 식당 찜 |
| 지도 | 음식별 칩 필터, 식당 핀, 바텀시트 목록, 내 위치 |
| 검색 | 음식 · 식당 · 게시글 통합 검색, 최근 · 인기 검색어 |
| 커뮤니티 | 카테고리 탭, 글쓰기(사진 최대 4장), 댓글, 좋아요, 내 글 삭제 |
| 찜 · 마이 | 찜한 음식 · 식당, 프로필 수정, 나의 활동, 공지 · FAQ, 설정(알림 토글, 언어, 로그아웃, 탈퇴) |

계정과 사용자 데이터는 Supabase에 저장됩니다. 회원가입은 영문·숫자·밑줄 4~20자의 아이디(대소문자 구분 없음)와 8~72자의 비밀번호만 입력합니다.

## 구조

```
index.html          진입점
css/app.css         스타일 (디자인 토큰은 :root)
js/app.js           라우터 · 화면 · 동작
js/i18n.js          UI 문구 4개 국어
js/data/foods.js    음식 20종 데이터 (tools/gen-foods.ps1로 생성)
js/data/community.js 예시 게시글 · 알림 · 공지
js/store.js         서버 데이터 상태와 화면 설정 캐시
js/auth.js          서버 회원가입·로그인 호출
js/cloud.js         서버 데이터 읽기·쓰기 호출
api/service.js      Vercel API 진입점
server/backend.cjs  Supabase Auth·DB·Storage 연동 (서버 전용)
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
