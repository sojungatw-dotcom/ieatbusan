# HANDOFF — I EAT BUSAN (AI 작업 인수인계)

> 이 파일만 읽으면 어떤 AI든 바로 이어서 작업할 수 있도록 적었습니다. 마지막 갱신: 2026-11-13.
> 사용자에게는 **한국어로**, 짧고 바로 행동하는 방식으로 답하세요.

---

## 0. 현재 상태와 다음 작업

- **지도·Figma 아이콘 배포 요청 (2026-11-13):** 음식 카테고리 8종을 Figma에서 제작·SVG export하여 반영. 지도는 KOSTAT 2013 상세 TopoJSON에서 복원한 경계로 교체(최신 행정경계 아님), 제목/전체 지역 버튼 정렬, 우측 상단 지도 시작 배치, 구역 및 라벨 hover 채색 추가. 검색창 내부 입력창의 중복 곡률 제거, 카테고리 타일과 아이콘 여백 통일. 정적 빌드와 관련 검사 12개 통과. 사용자가 화면 검증 제한을 안내받은 뒤 배포를 명시 요청. 이번 수정의 실제 브라우저 시각 검증은 Computer Use URL 확인 실패로 미완료이며 전체 UI 검수 완료로 간주하지 않음. main push로 Vercel 자동 배포 진행. Figma: https://www.figma.com/design/2jTLllte3E3vg4fjrbvwj2


- **main 통합·배포 승인 (2026-11-13, 아래 미병합 기록보다 우선):** 사용자가 main 병합과 배포를 명시 승인. origin/main 7cba5c3의 DB 챗봇·다국어·방문 흐름·식당 목록 지도를 디자인 브랜치와 통합. index.html/챗봇 문서/위젯 충돌은 최신 기능과 공통 디자인을 함께 유지하도록 해결. 지도 생성 스크립트의 viewBox도 결과물과 동기화. 빌드 및 관련 검사 13개 통과(챗봇 시뮬레이션 4,643건 포함). 통합 로컬 지도 DOM 확인, 추가 화면 캡처는 채팅의 브라우저 접근 불가로 제한됨. 통합 커밋 dd09da4를 main에 push했고 Vercel 배포 성공 상태를 확인했다. https://ieatbusan-eight.vercel.app/ 의 HTML·공통 CSS·지도·챗봇 핵심 파일 7개가 HTTP 200이며 로컬 통합 코드와 일치함을 확인했다.

- **컴포넌트 곡률·간격 보완 (2026-11-13):** 이미지 행은 바깥 24px/안쪽 12px/패딩 12px로 정리. 정보표(데스크톱 2열 포함)·챗봇 조건 목록은 항목 사이에만 선 표시, 내 댓글의 잔여 인라인 밑줄 제거. 챗봇 로고/제목과 도구 행 분리, 내부/호스트 버튼 모두 44px·간격 8px·아이콘 24px로 통일. 입력창/전송 버튼 별도 열, 지원 브라우저에서 여러 줄 자동 확장. 지도 좌상단 안내 유지, SVG 외부 여백 축소와 넓은 화면 지도 열 확대. 좌측 검색 문구는 한국어에서 '음식이나 식당을 / 검색해 보세요' 두 줄 고정. 브라우저 320/390/1280/1440px 관련 화면 및 빌드·검사 6개 통과. 증거 `docs/verification/component-spacing/`, 상세 `docs/rounded-ui.md`. 기존 기능 브랜치에 push, 배포/병합 없음.

- **고정 메뉴 배경 보완 (2026-11-12):** 상단 바와 좌측 레일의 둥근 모서리/바깥 여백에 스크롤 본문이 보이는 문제 수정. `rounded-ui.css`에서 공통 고정 배경(z-index 990)을 메뉴(1000) 아래 배치하고 메뉴 표면을 불투명 처리. 모바일 하단에도 적용, 전체 화면 관리자 제외. 홈/해산물 목록 데스크톱 및 모바일 스크롤 화면 검증. 증거 `docs/verification/rounded-ui/nav-backdrop-*.png`.

- **라운드 UI 전면 개편 (2026-11-12):** feature/rounded-ui-20261112. 공통 디자인 토큰, 전체 화면 카드/버튼/입력창/탭, 모바일·데스크톱 내비게이션, 로컬 Pretendard, 투명 로고·첫 등장 모션, SVG 아이콘/카테고리, 관리자·챗봇 시각 규칙 적용. 116개 화면폭 조합 및 116개 다국어 조합 검사. 상세 범위·출처·검증 한계는 [docs/rounded-ui.md](docs/rounded-ui.md). 디자인 작업의 최신 기준은 이 문서이며 과거 Figma 디자인 계약보다 우선한다. 사용자 요청은 git push까지, Figma 수정/배포/병합은 미실행.

- **다국어 UI/UX 점검 (2026-11-06):** ko/en/zh/ja의 직역투·고정 언어 버튼·식당 조사 라벨·보조기술용 이름 교정, 중국어/일본어 이용·개인정보 안내 추가. FAQ·탈퇴·문의·알림 설명을 실제 서버/미제공 기능 상태에 맞춤. 언어 선택은 `aria-pressed`와 포커스 유지, 좁은 프로필/홈 카드 줄바꿈 보완. 음식/식당 데이터·사진·제외 상태는 유지하고 한국어 원문은 언어 안내와 `lang` 표시로 구분. `tests/i18n.cjs`의 270키/4언어/1,020렌더 및 기존 검사 포함 26개 검사·정적 빌드 통과. 320/430/1280px 주요 화면 108조합 브라우저 확인. 세부 범위와 제한은 `docs/research/i18n-review-20261106.md` 참고. 전체 음식 원고 번역이나 별도 원어민 감수는 수행하지 않음.

- **사용자 제공 음식 사진 25장 (2026-11-06):** `assets/food/`에 원본 바이트 그대로 25장 보관. 현재 노출 23종의 기본 카탈로그와 DB `image_asset`·`content.photo`·`content.credit`를 연결하고, 예천 용궁순대·안동 헛제삿밥은 사진만 보관하며 기존 `archived` 상태 유지. 의령 망개떡은 남천동망개떡 부산 판매처를 연결한 기존 상태 유지. 사진 경로·출처 외 음식/식당 데이터·기존 순번·레이아웃은 변경하지 않음. 제공 안내의 출처·권리 상태를 `CREDITS.md`와 출처 화면에 보존하며 재사용 허가를 새로 확보한 것은 아님. `tools/import-food-photos.cjs <제공 폴더>`로 재현. 기존 DB 파일명 제약의 허용 확장자에 GIF만 추가했으며 RLS는 변경하지 않음. `20261106070000_add_supplied_food_photos.sql`을 대시보드에서 ROLLBACK 검증 후 COMMIT: 매칭/변경 25행·노출 43종·제외 2종·대상 외 변경 0건. 원본 해시 25개, 브라우저 이미지 25개 및 출처 화면 이미지 43개 모두 정상 로딩 확인. 원고 재생성 후에는 사진 importer도 다시 실행할 것.

- **제공 운영정보·빈 지역 음식 목록 정리 (2026-11-06):** 첨부 81곳/84개 연결의 영업시간·영업일·휴무만 반영. 실제 DB에서 식당 41곳·음식 JSON 36개 변경, 대상 외 변경 0건을 트랜잭션에서 확인. 주소·메뉴·가격·사진·좋아요·기존 순번·UI/UX 유지. 빈 목록 6종은 부산 판매처를 재검토하여 4종에 식당 추가, 예천 용궁순대·안동 헛제삿밥은 `content.catalogStatus=archived`로 복구 가능하게 노출 제외. 서버 응답 필터 포함. 최종 노출 음식 43종·식당 159곳. 신규 SQL 2개는 대시보드에서 ROLLBACK 검증 후 COMMIT했으며 migration history 별도 등록은 하지 않음. 전체 24개 검사·정적 빌드 및 대상 외 데이터/UI 동일성 검사 통과. 상세 `docs/restaurants.md`, `docs/research/busan-empty-food-review-20261106.md`. 원고 재생성 시 이 날짜의 추가 식당·제외 항목도 유지할 것.

- **작성 국가 고정·프로필 국가 변경 (2026-11-05, feature/country-snapshots):** 사용자 요청으로 최신 main dfd5c16 pull 완료 후 새 브랜치. 글·댓글은 저장된 country_code로 배지 표시, 기존 댓글의 국가가 없으면 추정/백필 없이 숨김. 새 댓글 서버 국가 저장과 추가 SQL 20261105_comment_country_snapshot.sql 준비(실제 DB 미실행). 프로필 활동 지역 선택을 국가 변경으로 교체, 닉네임/소개/국가 단일 PATCH이며 기존 area 유지. 설정 국가 메뉴 제거, 이전 주소는 프로필 호환 뷰. 합성 데이터에서 JP 글/댓글 작성 후 프로필 US 변경에도 JP 배지 유지 확인. 기존 데이터 변경/commit/push 없음. 이전 archive 삭제 4개는 별도.

- **회원 국가 기능 브랜치 보관 승인 (2026-11-05, 아래 로컬 전용 기록보다 우선):** 사용자가 feature/member-country 푸시 승인. main은 지도 PR #4의 dd5c5bf이며 현재 기능 기준과 동일. 국가 가입·배지·설정·피드·활동 제한·메인 우선 진입과 상단 로그인, 엑셀 구조 대조 및 추가 SQL 포함. DB 적용/실제 계정 검증이 남아 있으므로 main 병합 금지. 이전 archive 이동에 따른 로컬 삭제 4개는 기능 커밋에서 제외. 기존 가입 함수/RLS 유지. 실제 DB 변경 없음. 상세 docs/member-country.md.

- **회원 국가 기능 로컬 구현 (2026-11-05, feature/member-country):** 사용자 승인으로 가입 국가명 선택/기본 KR, 이름 앞 코드 배지, 설정→개인정보 국가 변경, 같은 국가 글 우선, 비로그인 활동 메뉴/직접 접근 제한 구현. js/countries.js를 프론트/서버 허용값으로 공유. supabase/migrations/20261105_member_country.sql 준비했으나 실제 DB 구조를 사용자께서 요청 중이며 적용/운영 검증 대기. 합성 데이터 전용 확인 서버 tests/member-country-preview.cjs(8781), 관련 검사 2개. commit/push/DB 변경하지 않음. 상세 docs/member-country.md. 작업 전 사용자가 옮긴 archive 파일 4개 삭제는 별개이므로 커밋 시 분리할 것.

- **지도 브랜치 통합/PR 준비 (2026-11-05, 아래 로컬 전용 지시보다 우선):** 사용자가 별도 브랜치 push→최신 main 연결/검증→PR 준비를 승인. 지도 작업 복구 커밋 `1161d90`을 origin/feature/map-renewal에 먼저 push. origin/main `703899d`를 지도 브랜치에 통합하며 app.js 충돌 해결. 원본 foods.js와 팀원 원고 상세 UI 유지, map-data가 research/원본 주소를 연결하고 좌표 없는 행은 상세 이동. main의 45음식/135식당(100항목 좌표 미확인) 기준 검사·빌드 14개 및 브라우저 검증 통과. max-branch의 미병합 커밋은 미포함. main 직접 push/병합하지 않음. 로컬 백업 브랜치 backup/map-before-main-20261105와 ../.local-backups/map-before-main-integration-20261105/ 보관. 세부 내용 docs/map-development.md.

- **지도 코드 정리 (2026-11-04, 아래 과거 기록보다 우선):** `js/map/`를 catalog(고정 지역/식당 연결), data(변환·필터), routes(주소·검증), renderer(HTML), loader(SDK/CSS 지연 로딩), provider(외부 지도 조작), view(화면 수명·상호작용)로 분리. 구역 SVG에서는 Leaflet 요청 없음. 지역 판별은 표시 문구가 아닌 고정 ID 사용. SDK/타일 실패, 잘못된 주소·좌표, 비동기 로딩 중 이탈 처리. 음식/식당은 여전히 foods.js의 로컬 자료이며 Supabase 데이터 흐름은 미변경. 자세한 협업 범위와 확인 명령은 docs/map-development.md 참고. 사용자 지시로 commit/push/원격 변경 금지, HEAD ad60428 유지.

- **구역 지도 로컬 임시 시안 (2026-11-04):** 사용자 지시로 commit/push/원격 변경 금지. `#/map`을 도로 없는 부산 16개 구·군 SVG로 변경. 지역 선택→음식 목록→상세 지도 핀/식당 목록, 구역 지도 복귀 시 지역 유지. 상세 지도는 현재 Leaflet/OSM이며 새 API 미연결. KOSTAT 2013 단순화 경계를 로컬 에셋으로 사용(과거 경계 시안, 최신 경계 보증 아님). 전용 js/map 내부와 지도 라우트/로더만 확장. 원본 음식/식당 순번 유지. 저장소 밖 `../.local-backups/`에 패치와 새 파일 백업. 비상 pull 전 미추적 파일까지 stash하는 절차는 docs/map-development.md 참고. 새 화면 증거 docs/district-preview.png.

- **지도 모듈 분리 (2026-11-04, feature/map-renewal):** 최신 main `ad60428`에서 분리 작업. `js/map/map-data.js`(음식/식당 연결), `map-view.js`(화면·필터·목록·위치 수명), `map-provider.js`(현재 Leaflet SDK), `css/map.css`로 이동. app.js는 지도 연결부만 유지. 메인/미니 지도와 기존 `foodId:index`·해시 주소 보존. 지도 팝업 타이머 취소 보완. API 키는 팀장에게 받을 예정으로 공급자 교체·구역 SVG 화면은 아직 미구현. 환경변수 예시는 예약 단계이며 자동 전환되지 않음. 담당 범위·키 관리·다음 단계는 `docs/map-development.md` 참고. 자동 검사 8개 스크립트와 로컬 브라우저 지도→식당 상세→지도 복귀 확인. 아직 커밋/push하지 않음. 이 대화의 사용자 지시에 따라 앞으로 작업 브랜치와 PR을 사용하며, 아래 과거 기록의 main 직접 push 규칙은 적용하지 않음.

- **운영 배포 저장소 불일치 확인:** Vercel `ljg9809-7416/ieatbusan-wdra`가 `ljg9809-dotcom/ieatbusan`의 초기 커밋 `67bb052`를 배포하고 있어, 최신 `sojungatw-dotcom/ieatbusan` 연결 코드가 반영되지 않음. 환경변수 3개는 Production에 등록 확인. Git 연결 해제는 자동 검토에서 명시 승인 필요로 거부되어 취소했으며 기존 연결 유지. 저장소 연결 변경은 사용자 승인 대기. 로컬 전용 계정 제거 마이그레이션 추가.

- **Supabase + Vercel API 전환 (2026-11-03):** 사용자 환경변수 등록 후 연결 코드 추가 요청. 브라우저는 `/api/service`만 호출하고 서버에서 SUPABASE_URL/PUBLISHABLE_KEY/SECRET_KEY를 사용. 아이디+비밀번호 가입/로그인 유지, Supabase Auth 검증·HttpOnly 쿠키·갱신·로그아웃·본인 탈퇴, 게시글/댓글/좋아요/프로필/찜/설정 DB 저장, 사진 비공개 Storage 업로드·서명 URL. 기존 로컬 시안 계정은 재가입 필요하며 원래 저장소 데이터는 보존. 예시 커뮤니티 데이터를 DB에 초기 등록. 이번 구성은 이전에 거부된 JWT 검증 없는 공개 Edge Function을 배포하지 않고 Vercel 서버의 신원 검증·CSRF·요청 제한과 RLS를 사용함. `/api/service?action=status`로 배포 버전·DB 연결을 확인. 실제 배포 검증 상태는 docs/verification.md의 최신 항목 확인.
- **Vercel 배포 준비 (2026-11-03):** 사용자 요청으로 배포 설정을 추가하고 GitHub push 진행. `vercel.json` → `node tools/build-static.cjs` → `dist/`. 배포 파일은 index.html/css/js/assets만 포함. Vercel Import 시 Root Directory는 저장소 루트. 실제 Vercel 프로젝트 연결 및 공개 배포 확인은 별도. 현재 DB 연결은 미반영이며 로그인·게시글은 브라우저 저장 시안.

- **홈 자동 넘김 구현 (2026-11-03):** 상단 5개 캐러셀을 미조작 4초 후 자동 이동·반복하도록 변경. 터치 중 정지, 손을 떼거나 직접 이동한 뒤 4초 재대기. 자동 재생 멈춤/재생 버튼, 백그라운드 탭 정지, 화면 이탈 시 타이머·이벤트 해제. 로그인 수정과 함께 기존 main 커밋에 포함.
- **아이디 로그인 구현 (2026-11-03):** 초기에는 로컬 수정만 진행했으며 이후 main 커밋에 포함. 소셜 로그인 버튼을 아이디·비밀번호 로그인과 두 항목 회원가입으로 교체. `js/auth.js`는 브라우저 전용 PBKDF2-SHA-256 로컬 시안이며 서버 인증이 아님. 계정별 활동·프로필 분리, 로그아웃 후 재로그인, 현재 계정 탈퇴 연결. 이전 게스트·소셜 시안 데이터는 Store.legacyData에 보관. 로그인 계정 공유는 같은 브라우저에 한정. 당시 push 보류였으나, 이후 Vercel 배포 준비 및 push 요청으로 해제됨.
- **사이트맵 v1.1 최신화:** main의 7e34a93 구현 기준. 홈 인기 음식 5개 캐러셀·20개 목록, 전체 화면 고정 메뉴, 실제 ROUTES 25개와 화면 목록 25개 대응. 나의 활동/고객 지원을 실제 화면별로 분리하고 약관·개인정보·사진 출처를 추가. 전화 등 미구현 기능 및 검증하지 않은 Figma 프레임 집계를 제거. 접근 조건·로컬 저장·배포 보류를 구분. docs/sitemap.html 참고.

- **홈 스와이프 복구 (2026-11-03):** 새 clone의 전체 화면 고정 메뉴 코드를 보존하면서 상단 인기 음식 5개 캐러셀 추가. 하단 20개 음식 목록과 정렬·찜 유지. 가로 스와이프/스크롤, 이전·다음, 페이지 버튼, 좌우 방향키 지원. 정렬·찜 재렌더 시 선택 음식 복원. 4개 언어 안내, 창 크기 변경 대응, 이벤트 정리 포함. 회귀 검사: `node tests/home-carousel.cjs`. 이번 변경의 Git 상태는 실제 `git status`를 기준으로 확인할 것.
- **전체 화면 고정 메뉴 (사용자 요청):** 모든 main 화면에 상단 헤더·하단 5탭을 보장. 기존 화면 헤더는 유지하고 없을 때 공통 헤더를 추가. viewport top/bottom 0 고정. 상세 CTA·댓글창은 하단 탭 위, 섹션 칩·검색창은 상단 헤더 아래. 24개 화면 DOM 및 홈 끝 스크롤 검증. 증거 docs/verification-fixed-nav.jpg.

- **CTA 화살표 후속 확인:** 실제 표시 20×20px 및 지도 이동 확인. SVG에 기본 24×24 크기 명시, index.html의 CSS/icons.js 버전 갱신으로 이전 파일 캐시 회피. 증거: docs/verification-cta.jpg.

- **2026-11-03 로컬 검증 완료:** KO/EN/ZH/JA 각각 28개 화면, 총 112개 렌더 검사 통과. 지도 빠른 전환 30회도 콘솔 오류 0건.
- **추가 수정:** 데스크톱 섹션 칩 고정, CTA 아이콘 크기, 위치 마커 중복·이전 지도 응답 무시, 사진 처리 중 이탈 및 동시 첨부 4장 제한. 회귀 테스트 7/7 통과.
- **이전 수정:** 게스트 글쓰기의 로그인 리다이렉트, 지도 목록 상세 링크 클릭, 지도 제거 뒤 남은 초기화 타이머/확대 애니메이션, 지도·커뮤니티·검색의 빈 탭 제목.
- **실제 동작 확인:** 사진 게시글 작성, 댓글, 새로고침 후 유지, 프로필 저장, 찜 반영, 설정 토글 저장, 설정에서 언어 변경 후 복귀, 로그아웃. 테스트 게시글 삭제 후 커뮤니티에서 사라짐 확인.
- **추가 검증 완료:** 탈퇴 확인/취소 뒤 화면·저장소, 위치 성공/거부/시간초과/지연, 사진 4장 제한·삭제·용량초과 복구를 격리된 브라우저에서 확인. 확인창 응답과 위치는 테스트용 합성 응답이며 브라우저 고유 권한창·실제 기기 위치는 미검증.
- **GitHub 권한 해결:** kimjuncheol-ai 초대 수락 및 push=true 확인. 원격은 https://github.com/sojungatw-dotcom/ieatbusan.git, 브랜치는 main만 사용.
- **Git 반영 완료:** 수정 코드와 협업 문서를 main에 푸시함 (구현 커밋 aaaa106). 후속 문서 상태 커밋도 같은 브랜치에 포함.
- **GitHub Pages 사용 안 함 (사용자 결정, 2026-11-03):** 사용자가 "깃허브 페이지는 필요 없어"라고 함. Pages를 켜거나 배포 작업을 제안하지 말 것. 실행은 로컬 정적 서버로만 함.
- **재현 도구:** `tests/README.md`, `tests/async-regressions.cjs` (Node), `tools/serve.ps1 -Port 8766 -Fixtures` → http://localhost:8766/ (브라우저 격리 검증). 기본 실행은 `tools/serve.ps1 -Port 8765`.
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
