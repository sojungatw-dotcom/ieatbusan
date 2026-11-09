-- IEATBUSAN: Supabase Auth + RLS-protected application data.
begin;
create schema if not exists ieb_private;
revoke all on schema ieb_private from public, anon, authenticated;

create table public.ieb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{4,20}$'),
  nickname text not null check (char_length(nickname) between 2 and 10),
  area integer not null default 8 check (area between 0 and 15),
  bio text not null default '' check (char_length(bio) <= 30),
  created_at timestamptz not null default now()
);
create table public.ieb_posts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references public.ieb_profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  category text not null check (category in ('review','question','free')),
  food text check (food is null or char_length(food) <= 80),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  seed_author text,
  seed_area text,
  seed_likes integer not null default 0,
  created_at timestamptz not null default now()
);
create index ieb_posts_user_idx on public.ieb_posts(user_id);
create index ieb_posts_created_idx on public.ieb_posts(created_at desc);
create index ieb_posts_photos_idx on public.ieb_posts using gin(photos);
create table public.ieb_comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references public.ieb_posts(id) on delete cascade,
  user_id uuid references public.ieb_profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 300),
  seed_author text,
  seed_likes integer not null default 0,
  created_at timestamptz not null default now()
);
create index ieb_comments_post_idx on public.ieb_comments(post_id, created_at);
create index ieb_comments_user_idx on public.ieb_comments(user_id);
create table public.ieb_post_likes (
  post_id text not null references public.ieb_posts(id) on delete cascade,
  user_id uuid not null references public.ieb_profiles(id) on delete cascade,
  primary key (post_id,user_id)
);
create index ieb_post_likes_user_idx on public.ieb_post_likes(user_id);
create table public.ieb_preferences (
  user_id uuid primary key references public.ieb_profiles(id) on delete cascade,
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 100000),
  updated_at timestamptz not null default now()
);
-- No public access: only the account Edge Function can consume registration quotas.
create table public.ieb_signup_limits (
  key text primary key,
  started_at timestamptz not null default now(),
  attempts integer not null default 1
);

alter table public.ieb_profiles enable row level security;
alter table public.ieb_posts enable row level security;
alter table public.ieb_comments enable row level security;
alter table public.ieb_post_likes enable row level security;
alter table public.ieb_preferences enable row level security;
alter table public.ieb_signup_limits enable row level security;

revoke all on public.ieb_profiles, public.ieb_posts, public.ieb_comments, public.ieb_post_likes, public.ieb_preferences, public.ieb_signup_limits from anon, authenticated;
grant select on public.ieb_profiles, public.ieb_posts, public.ieb_comments, public.ieb_post_likes to anon, authenticated;
grant update(nickname,area,bio) on public.ieb_profiles to authenticated;
grant insert(id,user_id,title,body,category,food,photos) on public.ieb_posts to authenticated;
grant delete on public.ieb_posts to authenticated;
grant insert(id,post_id,user_id,body) on public.ieb_comments to authenticated;
grant delete on public.ieb_comments to authenticated;
grant update(body) on public.ieb_comments to authenticated;
grant insert,delete on public.ieb_post_likes to authenticated;
grant select,insert,update on public.ieb_preferences to authenticated;
grant all on public.ieb_profiles, public.ieb_posts, public.ieb_comments, public.ieb_post_likes, public.ieb_preferences, public.ieb_signup_limits to service_role;

create policy profiles_read on public.ieb_profiles for select to anon, authenticated using (true);
create policy profiles_update_own on public.ieb_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy posts_read on public.ieb_posts for select to anon, authenticated using (true);
create policy posts_insert_own on public.ieb_posts for insert to authenticated with check ((select auth.uid())=user_id and not exists (select 1 from unnest(photos) p where p not like (select auth.uid())::text || '/%'));
create policy posts_delete_own on public.ieb_posts for delete to authenticated using ((select auth.uid())=user_id);
create policy comments_read on public.ieb_comments for select to anon, authenticated using (true);
create policy comments_insert_own on public.ieb_comments for insert to authenticated with check ((select auth.uid())=user_id);
create policy comments_update_own on public.ieb_comments for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy comments_delete_own on public.ieb_comments for delete to authenticated using ((select auth.uid())=user_id);
create policy likes_read on public.ieb_post_likes for select to anon, authenticated using (true);
create policy likes_insert_own on public.ieb_post_likes for insert to authenticated with check ((select auth.uid())=user_id);
create policy likes_delete_own on public.ieb_post_likes for delete to authenticated using ((select auth.uid())=user_id);
create policy preferences_read_own on public.ieb_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy preferences_insert_own on public.ieb_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy preferences_update_own on public.ieb_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Trigger-only definer, inaccessible through the Data API. The auth service
-- creates the account first, so auth.uid() is not populated at signup time.
create function ieb_private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.email like '%@accounts.ieatbusan.invalid' then
    insert into public.ieb_profiles(id,username,nickname)
    values(new.id,split_part(new.email,'@',1),left(split_part(new.email,'@',1),10));
  end if;
  return new;
end;
$$;
revoke all on function ieb_private.create_profile() from public,anon,authenticated;
create trigger ieb_new_auth_user after insert on auth.users for each row execute function ieb_private.create_profile();

create function public.ieb_allow_signup(bucket_key text, max_attempts integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  insert into public.ieb_signup_limits(key) values(bucket_key)
  on conflict(key) do update set
    attempts=case when ieb_signup_limits.started_at < now()-interval '1 hour' then 1 else ieb_signup_limits.attempts+1 end,
    started_at=case when ieb_signup_limits.started_at < now()-interval '1 hour' then now() else ieb_signup_limits.started_at end
  returning attempts into n;
  return n<=max_attempts;
end;
$$;
revoke all on function public.ieb_allow_signup(text,integer) from public,anon,authenticated;
grant execute on function public.ieb_allow_signup(text,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ieb-community','ieb-community',false,3145728,array['image/jpeg','image/png','image/webp']);
create policy ieb_image_read on storage.objects for select to anon,authenticated using (
  bucket_id='ieb-community' and ((select auth.uid())::text=(storage.foldername(name))[1] or exists(select 1 from public.ieb_posts p where p.photos @> array[name]))
);
create policy ieb_image_insert on storage.objects for insert to authenticated with check (
  bucket_id='ieb-community' and (select auth.uid())::text=(storage.foldername(name))[1] and exists(select 1 from public.ieb_profiles p where p.id=(select auth.uid()))
);
create policy ieb_image_delete on storage.objects for delete to authenticated using (bucket_id='ieb-community' and (select auth.uid())::text=(storage.foldername(name))[1]);
commit;
