begin;
set local lock_timeout='5s';
create table if not exists public.ieb_restaurant (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 1 and 200),
 address text not null default '',
 opening_hours text not null default '확인 필요',
 closed_days text not null default '확인 필요',
 phone text not null default '',
 naver_url text not null default '' check(naver_url='' or naver_url ~ '^https://'),
 latitude double precision check(latitude between -90 and 90),
 longitude double precision check(longitude between -180 and 180),
 menu_info jsonb not null default '[]' check(jsonb_typeof(menu_info)='array'),
 food_ids text[] not null default '{}',
 food_links jsonb not null default '[]' check(jsonb_typeof(food_links)='array'),
 source_urls text[] not null default '{}',
 verified_at timestamptz,
 liked_user_ids uuid[] not null default '{}' check(array_position(liked_user_ids,null) is null),
 like_count integer generated always as (cardinality(liked_user_ids)) stored,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ieb_restaurant_name_address_key unique(name,address)
);
comment on table public.ieb_restaurant is 'Restaurant master. Exact name/address duplicates share one row; food_links preserve all original food pages and place indices.';
comment on column public.ieb_restaurant.food_links is 'Original food_id/place_index, menu, place and localized information. Do not reorder source indices; existing saved links depend on them.';
comment on column public.ieb_restaurant.verified_at is 'Latest external source verification time. NULL after importing existing data; no fresh crawl implied.';
comment on column public.ieb_restaurant.like_count is 'Actual likes calculated from liked_user_ids. Initial 0; legacy savedPlaces bookmarks are not fabricated as likes.';
alter table public.ieb_restaurant enable row level security;
revoke all on public.ieb_restaurant from public,anon,authenticated;
grant select on public.ieb_restaurant to anon,authenticated;
grant all on public.ieb_restaurant to service_role;
drop policy if exists restaurants_read on public.ieb_restaurant;
create policy restaurants_read on public.ieb_restaurant for select to anon,authenticated using(true);
create index if not exists ieb_restaurant_food_ids_idx on public.ieb_restaurant using gin(food_ids);
create index if not exists ieb_restaurant_liked_users_idx on public.ieb_restaurant using gin(liked_user_ids);

with raw as (
 select f.id as food_id,e.ordinality-1 as place_index,e.value as place,
 f.content#>array['ko','restaurants',(e.ordinality-1)::text] as info,
 jsonb_build_object('ko',f.content#>array['ko','restaurants',(e.ordinality-1)::text],
 'en',f.content#>array['en','restaurants',(e.ordinality-1)::text],
 'zh',f.content#>array['zh','restaurants',(e.ordinality-1)::text],
 'ja',f.content#>array['ja','restaurants',(e.ordinality-1)::text]) as localized_info
 from public.ieb_foods f
 cross join lateral jsonb_array_elements(coalesce(f.content->'places','[]')) with ordinality e(value,ordinality)
), listings as (
 select food_id,place_index,place,localized_info,
 trim(place->>'name') as name,
 coalesce(nullif(place->>'address',''),nullif(place#>>'{research,area}',''),nullif(info->>'address',''),info->>'area','') as address,
 coalesce(nullif(place->>'hours',''),nullif(place#>>'{research,hours}',''),nullif(info->>'hours',''),'확인 필요') as hours,
 coalesce(nullif(place->>'holiday',''),nullif(place#>>'{research,holiday}',''),nullif(info->>'holiday',''),'확인 필요') as holiday,
 coalesce(nullif(place->>'phone',''),place#>>'{research,phone}','') as phone,
 coalesce(nullif(place->>'naverUrl',''),place#>>'{research,naverUrl}','') as naver_url,
 coalesce(nullif(place#>>'{research,signature}',''),info->>'signature','') as signature,
 case when jsonb_typeof(place->'lat')='number' then (place->>'lat')::double precision end as lat,
 case when jsonb_typeof(place->'lng')='number' then (place->>'lng')::double precision end as lng
 from raw
)
insert into public.ieb_restaurant(name,address,opening_hours,closed_days,phone,naver_url,latitude,longitude,menu_info,food_ids,food_links)
select name,address,
 case when count(distinct hours) filter(where hours not in ('','확인 필요'))>1 then '확인 필요' else coalesce(max(hours) filter(where hours not in ('','확인 필요')),'확인 필요') end,
 case when count(distinct holiday) filter(where holiday not in ('','확인 필요'))>1 then '확인 필요' else coalesce(max(holiday) filter(where holiday not in ('','확인 필요')),'확인 필요') end,
 coalesce(max(phone),''),coalesce(max(naver_url) filter(where naver_url ~ '^https://'),''),
 case when count(distinct lat)<=1 then max(lat) end,
 case when count(distinct lng)<=1 then max(lng) end,
 coalesce(jsonb_agg(distinct signature) filter(where signature<>''),'[]'::jsonb),
 array_agg(distinct food_id order by food_id),
 jsonb_agg(jsonb_build_object('food_id',food_id,'place_index',place_index,'signature',signature,'source_place',place,'localized_info',localized_info) order by food_id,place_index)
from listings group by name,address
on conflict(name,address) do nothing;

create or replace function ieb_private.set_restaurant_like(target_id uuid,is_liked boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); total integer;
begin
 if actor is null or not exists(select 1 from public.ieb_profiles where id=actor) then raise exception 'Authentication required' using errcode='42501'; end if;
 if is_liked is null then raise exception 'is_liked is required' using errcode='22023'; end if;
 update public.ieb_restaurant set liked_user_ids=case when is_liked then case when actor=any(liked_user_ids) then liked_user_ids else array_append(liked_user_ids,actor) end else array_remove(liked_user_ids,actor) end where id=target_id returning like_count into total;
 if not found then raise exception 'Restaurant not found' using errcode='P0002'; end if;
 return jsonb_build_object('id',target_id,'liked',is_liked,'like_count',total);
end $$;
revoke all on function ieb_private.set_restaurant_like(uuid,boolean) from public,anon,authenticated;
grant usage on schema ieb_private to authenticated;
grant execute on function ieb_private.set_restaurant_like(uuid,boolean) to authenticated;
create or replace function public.ieb_set_restaurant_like(target_id uuid,is_liked boolean) returns jsonb
language sql security invoker set search_path='' as $$select ieb_private.set_restaurant_like(target_id,is_liked)$$;
revoke all on function public.ieb_set_restaurant_like(uuid,boolean) from public,anon,authenticated;
grant execute on function public.ieb_set_restaurant_like(uuid,boolean) to authenticated;

create or replace function ieb_private.remove_account_restaurant_likes() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.ieb_restaurant set liked_user_ids=array_remove(liked_user_ids,old.id) where liked_user_ids @> array[old.id];
 return old;
end $$;
revoke all on function ieb_private.remove_account_restaurant_likes() from public,anon,authenticated;
drop trigger if exists ieb_remove_account_restaurant_likes on public.ieb_profiles;
create trigger ieb_remove_account_restaurant_likes before delete on public.ieb_profiles for each row execute function ieb_private.remove_account_restaurant_likes();
create or replace function ieb_private.touch_restaurant_updated_at() returns trigger
language plpgsql security invoker set search_path='' as $$begin new.updated_at=now(); return new; end $$;
revoke all on function ieb_private.touch_restaurant_updated_at() from public,anon,authenticated;
drop trigger if exists ieb_touch_restaurant_updated_at on public.ieb_restaurant;
create trigger ieb_touch_restaurant_updated_at before update on public.ieb_restaurant for each row execute function ieb_private.touch_restaurant_updated_at();
notify pgrst,'reload schema';
commit;
