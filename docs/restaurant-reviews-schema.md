# 음식 글·식당 리뷰 저장 구조

2026-11-19 Supabase IEATBUSAN 프로젝트 확인 및 승인 후 적용.

- 기존 음식 글: ieb_posts.food → 음식 ID.
- 식당 리뷰: ieb_posts.restaurant_id (uuid, nullable) → ieb_restaurant.id.
- 공통 제목·내용·작성자·작성일: title, body, user_id, created_at. category=review.
- 일반 커뮤니티 글은 restaurant_id=null. 기존 데이터와 RLS 유지.
- 식당 삭제 시 restaurant_id만 null로 변경하여 글은 유지.
- 음식별/식당별 created_at,id 내림차순 인덱스. 목록 API는 6행 조회 후 5행과 hasMore 반환.
- 클라이언트가 보낸 작성자 ID를 사용하지 않으며 로그인 사용자의 서버 세션을 사용. 식당 ID, 연결 음식, 리뷰 카테고리를 검증.

원격 마이그레이션 이름: add_restaurant_post_reviews.
