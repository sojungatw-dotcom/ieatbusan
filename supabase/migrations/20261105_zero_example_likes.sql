-- Remove fabricated example counters only. Preserve real user like rows,
-- accounts, posts and comments. Safe to run again.
begin;
alter table public.ieb_posts alter column seed_likes set default 0;
alter table public.ieb_comments alter column seed_likes set default 0;
update public.ieb_posts set seed_likes = 0 where seed_likes <> 0;
update public.ieb_comments set seed_likes = 0 where seed_likes <> 0;
commit;
