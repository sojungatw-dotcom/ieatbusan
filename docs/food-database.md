## 2026-11-05 PR #7 통합 검증

- 최신 main의 Google 지도/미니지도 및 명시적 네이버 지도 링크를 보존했습니다. DB 음식 데이터 갱신 시 이전 스냅샷에 네이버 링크가 없어도 같은 식당의 지정 링크를 유지합니다.
- 게시글·댓글의 작성 당시 국가 스냅샷과 프로필 국가 편집 동작을 보존했습니다. 과거 댓글의 누락 국가를 현재 국가로 채우지 않습니다.
- 운영 DB에서 기존 ieb_post_likes 관계가 없고, ieb_foods 및 게시글/음식 좋아요 컬럼과 인증 RPC가 존재함을 직접 확인했습니다. 기존 운영 bootstrap은 이 제거된 관계를 조회하여 502가 발생했습니다.
- 운영 SQL Editor에서 임시 Auth 계정과 authenticated 역할로 게시글/음식 좋아요 추가·중복·취소를 검사했습니다. 전체 검증 변경은 SAVEPOINT로 되돌렸고 프로필 3개·게시글 9개·댓글 2개·음식 45개를 보존했습니다. DB 스키마 변경은 실행하지 않았습니다.
- 로컬 정적 빌드 및 자동 검사 22개 통과. 국가 스냅샷·Google 지도·실제 Cloud/API/Store 좋아요 흐름과 2시간 추천 갱신을 포함합니다.
- 운영 웹 API와 Google 지도 화면의 최종 확인은 배포 뒤 진행합니다.

# 음식 정보와 좋아요 통합 DB

2026-11-05, IEATBUSAN (`lfmaunvekxzytfejuxgw`)에 적용했습니다.

## 저장 구조

- `public.ieb_posts`: 커뮤니티 게시글과 실제 사용자 좋아요를 같은 행에 저장합니다.
- `public.ieb_foods`: 메인 음식 게시물 45개, 음식 상세 내용, 이미지 파일명 및 좋아요를 같은 행에 저장합니다.
- `public.ieb_post_likes` 호환 뷰와 관련 쓰기 트리거 함수는 사용자 요청으로 삭제했습니다. 좋아요 데이터는 `ieb_posts`와 `ieb_foods`에서만 관리합니다.

음식 테이블 컬럼:

| 컬럼 | 의미 |
|---|---|
| id | 기존 음식 ID. URL과 찜·지도 연결에 사용하므로 유지 |
| name / summary / category | 한국어 음식명 / 간단 소개 / 분류 |
| image_asset | `dwaeji-gukbap.jpg` 같은 이미지 파일명 |
| content | 상세 정보, 먹는 방법, 알레르기, 식당, 번역, 사진 출처 JSON |
| display_order | 메인 목록의 기본 순서 |
| liked_user_ids | 좋아요를 누른 실제 사용자 UUID 배열. 일반 사용자는 직접 편집 불가 |
| like_count | 사용자 배열 길이로 자동 계산되는 좋아요 수 |
| created_at / updated_at | 생성 / 수정 일시 |

`image_asset`에는 경로·URL·이미지 바이너리를 넣지 않습니다. 실제 사진 파일은 `assets/food/`에 두며, 준비 중 이미지 `food-placeholder.svg`는 공용 `assets/food-placeholder.svg`를 사용합니다. 사진이 없던 25개 음식은 기존 준비 중 이미지를 유지합니다.

`content`에는 기존 음식 데이터 구조를 보존합니다. 원고 음식의 소개는 `manuscript.introduction`, 상세 표는 `manuscript.infoRows`, 먹는 방법은 `manuscript.sections[1]`, 알레르기는 `manuscript.allergenInfo`, 식당 상세는 `places[].research`에 있습니다. 상단 `name/summary/category/image_asset` 컬럼이 표시 기준입니다. 해당 컬럼을 바꾸면 다음 웹 데이터 조회에 반영됩니다.

## 웹 API

- bootstrap: DB 음식 목록, 이미지 파일명, 실제 좋아요 수, 현재 사용자의 선택 상태를 반환합니다. 사용자 UUID 배열은 웹 응답에 포함하지 않습니다.
- like: `public.ieb_set_post_like(target_id,is_liked)` 호출.
- foodLike: `public.ieb_set_food_like(target_id,is_liked)` 호출.
- 공개 함수는 SECURITY INVOKER이며, 내부 쓰기는 비공개 스키마의 함수가 수행합니다. 내부 함수는 auth.uid()와 프로필 존재를 확인하고 한 행을 원자적으로 수정합니다.
- 중복 요청은 좋아요를 중복 추가하지 않습니다. 비회원은 호출할 수 없으며, 회원은 본인의 선택만 변경할 수 있습니다.
- 새로 누른 음식 하트는 기존 찜 목록에도 동기화합니다. 과거 찜 기록을 전체 좋아요 수에 임의 합산하지 않습니다.
- 회원 탈퇴 시 해당 UUID를 게시글·음식의 좋아요에서 제거합니다.

기존 seed_likes는 과거 SQL과의 호환을 위해 남아 있으나 실제 수에 가산하지 않습니다. 관리할 실제 숫자는 like_count입니다.

## 적용 이력과 검증

Supabase migration history:

- consolidate_post_likes_and_create_foods
- isolate_like_mutations_private
- remove_legacy_post_likes_view

기존 회원 3명, 게시글 9건, 댓글 2건을 보존했습니다. DB 변경 전후 기존 게시글·댓글 내용 해시가 일치했습니다. 음식 45건과 파일명 형식을 확인했습니다.

DB에서 기존 API 호환 뷰의 INSERT ON CONFLICT/DELETE, 중복 클릭, 두 사용자별 집계, 본인 취소, 비회원 차단, 직접 카운터 수정 차단, 회원 탈퇴 정리를 검증했습니다. 임시 검증 데이터는 정리합니다.

전체 회귀 검사에서는 서버 역할인 `tests/member-country-preview.cjs`를 제외합니다. `node tests/post-like-flow.cjs`는 실제 Cloud/API/Store 코드에 대해 게시글·음식 좋아요 및 DB 음식명·이미지 파일명 로딩을 검증합니다.

DB는 적용 완료이며 웹 변경은 별도 커밋·push·배포 전까지 로컬 상태입니다.

## 메인 추천 음식 2시간 교체

`js/featured-foods.js`가 현재 음식 목록에서 중복 없이 최대 5개를 선정합니다. 같은 2시간 구간과 같은 음식 ID 목록에서는 새로고침·언어·정렬·좋아요 변경과 무관하게 추천을 유지하고, 다음 시간 구간에는 다시 섞습니다. 음식 원본 배열과 하단 전체 목록은 변경하지 않습니다.

메인 화면을 계속 열어둬도 교체 시점에 다시 표시하며, 백그라운드 탭은 복귀할 때 만료된 추천을 교체합니다. 슬라이드의 4초 자동 넘김과 터치 조작, 자동 넘김 일시정지는 유지합니다. 별도 DB 예약 작업은 필요하지 않습니다.
