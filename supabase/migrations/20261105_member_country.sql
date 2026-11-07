-- Column/FK/RLS/grant names reviewed against the supplied 2026-11-05 schema workbook.
-- Preserve the existing create_profile() and auth trigger; workbook omits their full definitions.
-- Not executed against Supabase. For a new DB, apply after supabase/schema.sql.
-- Additive migration: preserves account, post and comment records.
begin;

alter table public.ieb_profiles add column if not exists country_code text not null default 'KR';
update public.ieb_profiles set country_code='KR' where country_code is null;
alter table public.ieb_profiles alter column country_code set default 'KR';
alter table public.ieb_profiles alter column country_code set not null;
alter table public.ieb_posts add column if not exists country_code text not null default 'KR';
update public.ieb_posts set country_code='KR' where country_code is null;
alter table public.ieb_posts alter column country_code set default 'KR';
alter table public.ieb_posts alter column country_code set not null;

do $$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.ieb_profiles'::regclass and conname='ieb_profiles_country_code_check') then
    alter table public.ieb_profiles add constraint ieb_profiles_country_code_check check(country_code in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.ieb_posts'::regclass and conname='ieb_posts_country_code_check') then
    alter table public.ieb_posts add constraint ieb_posts_country_code_check check(country_code in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'));
  end if;
end;
$$;

grant update(country_code) on public.ieb_profiles to authenticated;
grant insert(country_code) on public.ieb_posts to authenticated;
create index if not exists ieb_posts_country_created_idx on public.ieb_posts(country_code,created_at desc);

-- Read signup metadata when the existing auth trigger inserts the profile.
-- This separate trigger preserves the original signup function unchanged.
-- Definer is required to read Auth metadata; no callable Data API is exposed.
create or replace function ieb_private.assign_profile_country() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  select coalesce(u.raw_user_meta_data->>'country_code','KR') into new.country_code
  from auth.users u where u.id=new.id;
  return new;
end;
$$;
revoke all on function ieb_private.assign_profile_country() from public,anon,authenticated;
drop trigger if exists ieb_profile_signup_country on public.ieb_profiles;
create trigger ieb_profile_signup_country before insert on public.ieb_profiles
for each row execute function ieb_private.assign_profile_country();

-- Always overwrite client-supplied post country using the posting account.
-- The existing own-user RLS policy still validates user_id.
create or replace function ieb_private.assign_post_country() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.user_id is not null then
    select p.country_code into new.country_code from public.ieb_profiles p where p.id=new.user_id;
  else
    new.country_code := coalesce(new.country_code,'KR');
  end if;
  return new;
end;
$$;
revoke all on function ieb_private.assign_post_country() from public,anon,authenticated;
drop trigger if exists ieb_post_country on public.ieb_posts;
create trigger ieb_post_country before insert on public.ieb_posts
for each row execute function ieb_private.assign_post_country();

notify pgrst, 'reload schema';
commit;
