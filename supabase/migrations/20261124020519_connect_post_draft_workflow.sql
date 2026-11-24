-- Atomic, member-scoped draft persistence and publication.
create function public.ieb_save_post_draft(
  target_id uuid, draft_title text, draft_body text, draft_category text,
  draft_food text, draft_restaurant_id uuid, draft_photos text[],
  expected_updated_at timestamptz default null
) returns public.ieb_post_drafts
language plpgsql security invoker set search_path = '' as $$
declare current_draft public.ieb_post_drafts; result public.ieb_post_drafts; member_id uuid := auth.uid();
begin
  if member_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(member_id::text || '/' || target_id::text,0));
  if exists(select 1 from public.ieb_posts where id=target_id::text and user_id=member_id)
  then raise exception 'Draft already published' using errcode='40001'; end if;
  select * into current_draft from public.ieb_post_drafts where id=target_id and user_id=member_id for update;
  if found then
    if expected_updated_at is null or current_draft.updated_at <> expected_updated_at
    then raise exception 'Draft changed; reload it first' using errcode='40001'; end if;
  elsif expected_updated_at is not null then
    raise exception 'Draft missing or published' using errcode='40001';
  end if;
  if exists(select 1 from unnest(draft_photos) photo where not exists(
    select 1 from storage.objects o where o.bucket_id='ieb-community' and o.name=photo
  )) then raise exception 'Draft image is missing' using errcode='23514'; end if;
  if current_draft.id is null then
    insert into public.ieb_post_drafts(id,user_id,title,body,category,food,restaurant_id,photos)
    values(target_id,member_id,draft_title,draft_body,draft_category,nullif(draft_food,''),draft_restaurant_id,draft_photos)
    returning * into result;
  else
    update public.ieb_post_drafts set title=draft_title,body=draft_body,category=draft_category,
      food=nullif(draft_food,''),restaurant_id=draft_restaurant_id,photos=draft_photos
    where id=target_id and user_id=member_id returning * into result;
  end if;
  return result;
end;
$$;
revoke all on function public.ieb_save_post_draft(uuid,text,text,text,text,uuid,text[],timestamptz) from public,anon;
grant execute on function public.ieb_save_post_draft(uuid,text,text,text,text,uuid,text[],timestamptz) to authenticated;

-- The existing review API already accepts restaurant_id; this grants only that insert column.
grant insert(restaurant_id) on public.ieb_posts to authenticated;
create function public.ieb_publish_post_draft(target_id uuid, expected_updated_at timestamptz)
returns text language plpgsql security invoker set search_path = '' as $$
declare draft public.ieb_post_drafts; member_id uuid := auth.uid(); member_country text;
begin
  if member_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(member_id::text || '/' || target_id::text,0));
  -- Repeating a request after a lost response returns the same post, never a duplicate.
  if exists(select 1 from public.ieb_posts where id=target_id::text and user_id=member_id) then return target_id::text; end if;
  select * into draft from public.ieb_post_drafts where id=target_id and user_id=member_id for update;
  if not found then raise exception 'Draft not found' using errcode='P0002'; end if;
  if expected_updated_at is null or draft.updated_at<>expected_updated_at
  then raise exception 'Draft changed; reload it first' using errcode='40001'; end if;
  if char_length(trim(draft.title))=0 or char_length(trim(draft.body))=0
  then raise exception 'Title and body required' using errcode='23514'; end if;
  if draft.restaurant_id is not null and (draft.category<>'review' or draft.food is null or not exists(
    select 1 from public.ieb_restaurant r where r.id=draft.restaurant_id and draft.food=any(r.food_ids)
  )) then raise exception 'Invalid restaurant tag' using errcode='23514'; end if;
  if exists(select 1 from unnest(draft.photos) photo where not exists(
    select 1 from storage.objects o where o.bucket_id='ieb-community' and o.name=photo
  )) then raise exception 'Draft image is missing' using errcode='23514'; end if;
  select country_code into strict member_country from public.ieb_profiles where id=member_id;
  insert into public.ieb_posts(id,user_id,title,body,category,food,restaurant_id,photos,country_code)
  values(target_id::text,member_id,trim(draft.title),trim(draft.body),draft.category,draft.food,draft.restaurant_id,draft.photos,member_country);
  delete from public.ieb_post_drafts where id=target_id and user_id=member_id;
  return target_id::text;
end;
$$;
revoke all on function public.ieb_publish_post_draft(uuid,timestamptz) from public,anon;
grant execute on function public.ieb_publish_post_draft(uuid,timestamptz) to authenticated;
