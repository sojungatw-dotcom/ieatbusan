begin;
do $test$
declare
  member_id uuid;
  other_id uuid;
  target uuid := gen_random_uuid();
  missing_image_target uuid := gen_random_uuid();
  draft public.ieb_post_drafts;
  previous_stamp timestamptz;
  post_id text;
begin
  select id into strict member_id from public.ieb_profiles order by id limit 1;
  select id into strict other_id from public.ieb_profiles where id<>member_id order by id limit 1;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  select * into draft from public.ieb_save_post_draft(target,'','','review',null,null,'{}',null);
  begin
    perform public.ieb_publish_post_draft(target,draft.updated_at);
    raise exception 'Blank draft published';
  exception when check_violation then null; end;
  if not exists(select 1 from public.ieb_post_drafts where id=target) then raise exception 'Failed publication deleted draft'; end if;
  previous_stamp := draft.updated_at;
  select * into draft from public.ieb_save_post_draft(target,'Atomic test','Valid body','free',null,null,'{}',previous_stamp);
  begin
    perform public.ieb_save_post_draft(target,'Stale overwrite','Valid body','free',null,null,'{}',previous_stamp);
    raise exception 'Stale save accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.ieb_publish_post_draft(target,previous_stamp);
    raise exception 'Stale publication accepted';
  exception when serialization_failure then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',other_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  begin
    perform public.ieb_publish_post_draft(target,draft.updated_at);
    raise exception 'Another member published draft';
  exception when no_data_found then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  post_id := public.ieb_publish_post_draft(target,draft.updated_at);
  if post_id<>target::text or exists(select 1 from public.ieb_post_drafts where id=target)
    or not exists(select 1 from public.ieb_posts where id=post_id and user_id=member_id and body='Valid body')
  then raise exception 'Publication was not atomic'; end if;
  if public.ieb_publish_post_draft(target,draft.updated_at)<>post_id
    or (select count(*) from public.ieb_posts where id=post_id)<>1
  then raise exception 'Publication retry was not idempotent'; end if;
  begin
    perform public.ieb_save_post_draft(target,'Recreate published draft','body','review',null,null,'{}',null);
    raise exception 'Published draft recreated';
  exception when serialization_failure then null; end;
  insert into public.ieb_post_drafts(id,title,body,photos) values(missing_image_target,'Missing image','body',
    array[member_id::text||'/'||missing_image_target::text||'/'||gen_random_uuid()::text||'.jpg']);
  select * into draft from public.ieb_post_drafts where id=missing_image_target;
  begin
    perform public.ieb_publish_post_draft(missing_image_target,draft.updated_at);
    raise exception 'Missing image accepted';
  exception when check_violation then null; end;
  if not exists(select 1 from public.ieb_post_drafts where id=missing_image_target)
  then raise exception 'Missing-image failure lost draft'; end if;
  execute 'reset role';
end;
$test$;
rollback;
select 'PASS: real DB partial save, stale save/publication rejection, owner isolation, atomic publication, retry idempotency, published-draft recreation denial and failed-publication preservation; all test writes rolled back' as verification;
