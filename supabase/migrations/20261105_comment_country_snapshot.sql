-- Apply after 20261105_member_country.sql. Actual DB execution is pending.
-- Preserve all historical rows: no backfill and no profile/post changes.
begin;

alter table public.ieb_comments add column if not exists country_code text;

do $$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.ieb_comments'::regclass and conname='ieb_comments_country_code_check') then
    alter table public.ieb_comments add constraint ieb_comments_country_code_check check(country_code in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'));
  end if;
end;
$$;

grant insert(country_code) on public.ieb_comments to authenticated;

-- Only new comments receive the posting account's country. NULL legacy values stay untouched.
create or replace function ieb_private.assign_comment_country() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.user_id is not null then
    select coalesce(nullif(btrim(p.country_code),''),'KR') into new.country_code
    from public.ieb_profiles p where p.id=new.user_id;
    if not found then
      raise exception 'Comment author profile is missing';
    end if;
  else
    new.country_code := 'KR';
  end if;
  return new;
end;
$$;
revoke all on function ieb_private.assign_comment_country() from public,anon,authenticated;
drop trigger if exists ieb_comment_country on public.ieb_comments;
create trigger ieb_comment_country before insert on public.ieb_comments
for each row execute function ieb_private.assign_comment_country();

notify pgrst, 'reload schema';
commit;
