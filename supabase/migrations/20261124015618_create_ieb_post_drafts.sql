-- Draft text and image paths only. Image bytes stay in the existing private ieb-community bucket.
create table public.ieb_post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.ieb_profiles(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 80),
  body text not null default '' check (char_length(body) <= 2000),
  category text not null default 'review' check (category in ('review', 'question', 'free')),
  food text check (food is null or food ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  restaurant_id uuid references public.ieb_restaurant(id) on delete set null,
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ieb_post_drafts_restaurant_category check (restaurant_id is null or category = 'review'),
  constraint ieb_post_drafts_photos_dimension check (coalesce(array_ndims(photos), 1) = 1)
);
create index ieb_post_drafts_user_updated_idx on public.ieb_post_drafts(user_id, updated_at desc, id);

comment on table public.ieb_post_drafts is 'Private, unfinished community posts. Blank title/body are allowed. Publishing must insert into ieb_posts and delete the draft in one transaction; no automatic publication.';
comment on column public.ieb_post_drafts.photos is 'Up to 4 object paths in private bucket ieb-community, formatted user_id/draft_id/file_uuid.jpg (also jpeg/png/webp). No image bytes, public URLs or expiring signed URLs. Keep files when publishing reuses these paths.';

create function ieb_private.prepare_post_draft() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if exists (
    select 1 from unnest(new.photos) photo
    where photo is null
      or photo !~ ('^' || new.user_id::text || '/' || new.id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$')
  ) then
    raise exception 'Draft photos must be object paths belonging to this user and draft'
      using errcode = '23514', constraint = 'ieb_post_drafts_photos_paths';
  end if;
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function ieb_private.prepare_post_draft() from public, anon, authenticated;
create trigger ieb_prepare_post_draft before insert or update on public.ieb_post_drafts
for each row execute function ieb_private.prepare_post_draft();

alter table public.ieb_post_drafts enable row level security;
revoke all on public.ieb_post_drafts from public, anon, authenticated;
grant select, delete on public.ieb_post_drafts to authenticated;
grant insert(id, user_id, title, body, category, food, restaurant_id, photos) on public.ieb_post_drafts to authenticated;
grant update(title, body, category, food, restaurant_id, photos) on public.ieb_post_drafts to authenticated;
grant all on public.ieb_post_drafts to service_role;

create policy post_drafts_read_own on public.ieb_post_drafts for select to authenticated
using ((select auth.uid()) = user_id);
create policy post_drafts_insert_own on public.ieb_post_drafts for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy post_drafts_update_own on public.ieb_post_drafts for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy post_drafts_delete_own on public.ieb_post_drafts for delete to authenticated
using ((select auth.uid()) = user_id);

-- Existing storage policies already enforce owner-prefix uploads/deletes and owner-only
-- reads until an ieb_posts row references the object. Reuse this private bucket unchanged.
