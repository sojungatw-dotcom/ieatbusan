-- Additive and safe to replay after the hosted migration already applied by MCP.
begin;
alter table public.ieb_profiles add column if not exists avatar_path text;
do $$begin
 if not exists(select 1 from pg_constraint where conrelid='public.ieb_profiles'::regclass and conname='ieb_profiles_avatar_path_check') then
  alter table public.ieb_profiles add constraint ieb_profiles_avatar_path_check check(avatar_path is null or avatar_path ~ ('^'||id::text||'/[a-f0-9-]{36}[.]jpg$'));
 end if;
end $$;
comment on column public.ieb_profiles.avatar_path is 'Own private ieb-avatars object path; bootstrap supplies a temporary signed image URL.';
grant update(avatar_path) on public.ieb_profiles to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ieb-avatars','ieb-avatars',false,262144,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=262144,allowed_mime_types=array['image/jpeg'];
drop policy if exists ieb_avatar_read_own on storage.objects;
create policy ieb_avatar_read_own on storage.objects for select to authenticated
using(bucket_id='ieb-avatars' and (select auth.uid())::text=(storage.foldername(name))[1]);
drop policy if exists ieb_avatar_insert_own on storage.objects;
create policy ieb_avatar_insert_own on storage.objects for insert to authenticated
with check(bucket_id='ieb-avatars' and (select auth.uid())::text=(storage.foldername(name))[1]
and name ~ ('^'||(select auth.uid())::text||'/[a-f0-9-]{36}[.]jpg$')
and exists(select 1 from public.ieb_profiles where id=(select auth.uid())));
drop policy if exists ieb_avatar_delete_own on storage.objects;
create policy ieb_avatar_delete_own on storage.objects for delete to authenticated
using(bucket_id='ieb-avatars' and (select auth.uid())::text=(storage.foldername(name))[1]);
notify pgrst,'reload schema';
commit;
