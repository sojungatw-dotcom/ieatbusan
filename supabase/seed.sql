begin;
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p1','해운대 암소갈비 웨이팅 팁 공유해요','지난 주말에 해운대암소갈비집에 다녀왔어요. 주말 저녁엔 대기가 1시간 넘게 걸려서, 평일 오후 4시쯤 가는 걸 추천드려요.

양념갈비도 맛있지만 생갈비를 먼저 드셔보세요. 고기를 다 드신 뒤에 감자사리는 꼭 추가하시고요!','review','haeundae-galbi','부산토박이','해운대구',42,now()-interval '10 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p2','물밀면 vs 비빔밀면, 뭐가 더 맛있나요?','부산 여행은 처음인데 밀면집에 가서 뭘 시켜야 할지 고민이에요. 추천 부탁드려요.','question','milmyeon','밀면러버','남구',18,now()-interval '32 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p3','서면 돼지국밥 골목 3곳 비교해봤어요','국물이 진한 순서대로 정리해봤습니다. 개인적으로는 두 번째 집 수육백반이 최고였어요. 부추무침을 듬뿍 넣고 새우젓으로 간하면 끝!','review','dwaeji-gukbap','국밥한그릇','부산진구',87,now()-interval '60 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p4','부평 깡통시장 야시장 먹거리 동선','유부주머니 → 비빔당면 → 씨앗호떡 순서로 돌면 배부르지 않게 딱 좋아요. 저녁 7시 이후에 가면 야시장 노점이 다 열려 있어요.','free','yubu-jumeoni','깡통시장탐방','중구',64,now()-interval '120 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p5','청사포 조개구이 바다뷰 명당','해 질 무렵 창가 자리를 강력 추천합니다. 조개구이 세트에 라면사리는 꼭 추가하세요.','review','cheongsapo-jogae','광안리야경','해운대구',53,now()-interval '180 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p6','기장 대게 요즘 시세 어느 정도인가요?','주말에 가족이랑 가려고 하는데 대략적인 가격대가 궁금합니다.','question','gijang-daege','여행자J','기장군',9,now()-interval '300 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p7','비 오는 날엔 역시 부산 어묵탕','집에서 끓여봤는데 무를 많이 넣으니까 국물이 훨씬 시원하네요.','free','eomuk','오뎅조아','영도구',31,now()-interval '1440 minutes');
insert into public.ieb_posts(id,title,body,category,food,seed_author,seed_area,seed_likes,created_at) values('p8','범일동 낙곱새 원조집 다녀온 후기','볶음밥까지 먹어야 완성입니다. 세 명 이상이면 사리 추가는 필수!','review','nakgopsae','낙곱새장인','동구',47,now()-interval '1500 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p1-c1','p1','생갈비 진짜 맛있죠. 감자사리 강추합니다!','밀면러버',3,now()-interval '5 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p1-c2','p1','평일 4시 꿀팁 감사합니다. 다음 주에 가볼게요.','여행자J',1,now()-interval '8 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p1-c3','p1','주차는 어디에 하셨어요?','국밥한그릇',0,now()-interval '9 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p2-c4','p2','처음이면 물밀면이요! 식초랑 겨자 꼭 넣으세요.','부산토박이',5,now()-interval '20 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p2-c5','p2','저는 비빔파입니다 ㅎㅎ 온육수도 같이 드세요.','국밥한그릇',2,now()-interval '25 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p3-c6','p3','두 번째 집 어디인지 궁금해요!','낙곱새장인',4,now()-interval '40 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p4-c7','p4','물떡도 꼭 드세요~','오뎅조아',2,now()-interval '90 minutes');
insert into public.ieb_comments(id,post_id,body,seed_author,seed_likes,created_at) values('p6-c8','p6','시세는 매일 달라서 시장에서 무게 달고 꼭 확인하세요.','부산토박이',1,now()-interval '200 minutes');
commit;
