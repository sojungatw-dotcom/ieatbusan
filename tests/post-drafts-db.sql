begin;
do $test$
declare
  owner_id uuid;
  other_id uuid;
  draft_id uuid := gen_random_uuid();
  other_draft_id uuid := gen_random_uuid();
  object_name text;
  invalid_photos text[];
  affected integer;
  original_created timestamptz;
  original_updated timestamptz;
begin
  select id into strict owner_id from public.ieb_profiles order by id limit 1;
  select id into strict other_id from public.ieb_profiles where id <> owner_id order by id limit 1;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated')::text, true);
  execute 'set local role authenticated';

  insert into public.ieb_post_drafts(id) values(draft_id);
  select created_at,updated_at into strict original_created,original_updated
  from public.ieb_post_drafts where id=draft_id and user_id=owner_id and title='' and body='';
  object_name := owner_id::text || '/' || draft_id::text || '/' || gen_random_uuid()::text || '.jpg';
  update public.ieb_post_drafts set title='draft verification',body='unfinished body',photos=array[object_name] where id=draft_id;
  if not exists(select 1 from public.ieb_post_drafts where id=draft_id and created_at=original_created and updated_at>=original_updated and photos=array[object_name])
  then raise exception 'Owner update, timestamp or photo path validation failed'; end if;

  foreach invalid_photos slice 1 in array array[
    array[other_id::text || '/' || draft_id::text || '/' || gen_random_uuid()::text || '.jpg'],
    array[owner_id::text || '/' || other_draft_id::text || '/' || gen_random_uuid()::text || '.jpg'],
    array['https://example.invalid/photo.jpg'],
    array['data:image/jpeg;base64,/9j/'],
    array[null::text]
  ] loop
    begin
      update public.ieb_post_drafts set photos=invalid_photos where id=draft_id;
      raise exception 'Invalid photo path accepted';
    exception when check_violation then null; end;
  end loop;
  begin
    update public.ieb_post_drafts set photos=array_fill(object_name,array[5]) where id=draft_id;
    raise exception 'More than four photos accepted';
  exception when check_violation then null; end;
  begin
    update public.ieb_post_drafts set title=repeat('x',81) where id=draft_id;
    raise exception 'Oversized title accepted';
  exception when check_violation then null; end;
  begin
    update public.ieb_post_drafts set body=repeat('x',2001) where id=draft_id;
    raise exception 'Oversized body accepted';
  exception when check_violation then null; end;
  begin
    update public.ieb_post_drafts set category='invalid' where id=draft_id;
    raise exception 'Invalid category accepted';
  exception when check_violation then null; end;
  begin
    update public.ieb_post_drafts set user_id=other_id where id=draft_id;
    raise exception 'Draft owner reassignment accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.ieb_post_drafts(user_id) values(other_id);
    raise exception 'Forged owner insert accepted';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',other_id,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.ieb_post_drafts(id) values(other_draft_id);
  if exists(select 1 from public.ieb_post_drafts where id=draft_id)
  then raise exception 'Another member can read the draft'; end if;
  update public.ieb_post_drafts set title='unauthorized' where id=draft_id;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Another member can update the draft'; end if;
  delete from public.ieb_post_drafts where id=draft_id;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Another member can delete the draft'; end if;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  delete from public.ieb_post_drafts where id=draft_id;
  get diagnostics affected = row_count;
  if affected<>1 then raise exception 'Owner cannot delete own draft'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  begin
    perform 1 from public.ieb_post_drafts;
    raise exception 'Anonymous user can read drafts';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.ieb_post_drafts(id,user_id) values(gen_random_uuid(),owner_id);
    raise exception 'Anonymous user can create drafts';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end;
$test$;
rollback;
select jsonb_build_object(
 'status','PASS: owner CRUD, private drafts, forged owner/foreign photo/URL/base64/null/oversized content rejection; test writes rolled back',
 'draft_rows',(select count(*) from public.ieb_post_drafts),
 'rls_enabled',(select relrowsecurity from pg_class where oid='public.ieb_post_drafts'::regclass),
 'policy_count',(select count(*) from pg_policies where schemaname='public' and tablename='ieb_post_drafts'),
 'storage_bucket_private',(select not public from storage.buckets where id='ieb-community')
) as verification;
