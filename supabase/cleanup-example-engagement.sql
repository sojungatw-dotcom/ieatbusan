-- Only example comments; real user comments and actual like rows are preserved.
begin;
delete from public.ieb_comments where user_id is null and seed_author is not null
 and id in ('p1-c1','p1-c2','p1-c3','p2-c4','p2-c5','p3-c6','p4-c7','p6-c8');
update public.ieb_posts set seed_likes=0 where seed_likes<>0;
update public.ieb_comments set seed_likes=0 where seed_likes<>0;
commit;
