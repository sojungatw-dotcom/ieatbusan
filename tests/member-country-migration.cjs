/* Structural safety checks only; this does not execute PostgreSQL or prove RLS behavior. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const countries=require('../js/countries.js');
const sql=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261105_member_country.sql'),'utf8');
assert.ok(!/create\s+or\s+replace\s+function\s+ieb_private\.create_profile\s*\(/i.test(sql),
  'The supplied workbook omits the existing signup function body; preserve that function');
assert.ok(!/drop\s+trigger[^;]*ieb_new_auth_user/i.test(sql),'Preserve the existing auth trigger');
assert.ok(!/disable\s+row\s+level\s+security|drop\s+policy|drop\s+table/i.test(sql));
assert.ok(/before insert on public\.ieb_profiles/i.test(sql));
assert.ok(/from auth\.users/i.test(sql)&&/raw_user_meta_data/.test(sql));
for(const table of ['ieb_profiles','ieb_posts']) {
  assert.ok(sql.includes(`alter table public.${table} add column if not exists country_code text not null default 'KR'`));
  const check=sql.match(new RegExp(table+'_country_code_check check\\(country_code in \\(([^)]+)\\)\\)'));
  assert.ok(check);
  const codes=[...check[1].matchAll(/'([A-Z]{2})'/g)].map(match=>match[1]);
  assert.deepEqual(codes,[...countries.codes],'DB and API must accept the same countries');
}
assert.ok(sql.includes('grant update(country_code) on public.ieb_profiles to authenticated'));
assert.ok(sql.includes('grant insert(country_code) on public.ieb_posts to authenticated'));
console.log('PASS migration preserves existing signup/RLS and matches country defaults, allowlists and column grants (SQL execution pending)');
