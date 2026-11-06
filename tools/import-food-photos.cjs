/* Import the supplied 25-image collection without editing its pixels or metadata. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const supplied = process.argv[2];
if (!supplied) throw new Error('Usage: node tools/import-food-photos.cjs <collection-directory>');
const input = path.resolve(supplied);
const guide = fs.readFileSync(path.join(input, '먼저_읽어주세요_25개_출처_및_권리.txt'), 'utf8');
const ids = ['busan-wandang','pohang-mulhoe','gwamegi','mungtigi','andong-jjimdak','andong-godeungeo','yeongdeok-uljin-daege','daegu-kongguk','cheongdo-minari-samgyeopsal','yonggung-sundae','daegu-makchang','daegu-napjak-mandu','andong-heotjesatbap','eonyang-bulgogi','gorae-gogi','jinju-naengmyeon','masan-bokguk','hadong-jaecheopguk','namhae-myeolchi-ssambap','masan-agujjim','chungmu-gimbap','meongge-bibimbap','dodari-ssukguk','jinju-bibimbap','uiryeong-manggaetteok'];
const archived = new Set(['yonggung-sundae', 'andong-heotjesatbap']);
const blocks = [...guide.matchAll(/^(\d{2})\. (.+)\r?\n([\s\S]*?)(?=^\d{2}\. |$(?![\s\S]))/gm)];
if (blocks.length !== 25) throw new Error('Expected all 25 source and rights records');
const assets = path.join(root, 'assets/food');
const manifest = blocks.map(([, number, name, body], index) => {
  if (Number(number) !== index + 1) throw new Error('Unexpected photo ordering');
  const field = label => body.match(new RegExp('^' + label + ': (.*)$', 'm'))?.[1].trim();
  const sourceFile = field('파일');
  const absolute = path.resolve(input, sourceFile);
  if (!absolute.startsWith(input + path.sep)) throw new Error('Source image outside the supplied collection');
  const bytes = fs.readFileSync(absolute);
  const extension = path.extname(sourceFile).toLowerCase();
  if (!['.jpg', '.jpeg', '.gif', '.webp'].includes(extension) || !bytes.length) throw new Error('Invalid supplied photo: ' + sourceFile);
  const id = ids[index], asset = id + extension;
  const license = index === 18 ? '공공누리 제1유형 (제공 안내 기준)' : [4, 5].includes(index)
    ? '공공누리 표기·원문 조건 추가 확인 필요' : '재사용 허가 미확인 (제공 안내 기준)';
  const credit = { file: path.basename(sourceFile), author: field('표시된 저작자·제공처'), license,
    url: field('출처'), rightsNote: field('권리 상태'), usageNote: field('이용 조건'),
    source: '사용자 제공 사진·출처 안내', modified: false };
  if (!credit.author || !credit.rightsNote || !credit.usageNote || !/^https:\/\//.test(credit.url)) throw new Error('Incomplete attribution: ' + sourceFile);
  return { id, name, sourceFile, asset, photo: 'assets/food/' + asset, archived: archived.has(id),
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), credit };
});
// Validate the current catalog before writing any files; excluded foods must stay excluded.
const catalogFile = path.join(root, 'js/data/foods.js');
const marker = '/* User-supplied food photos (2026-11-06). Original files and rights notes preserved. */';
const current = fs.readFileSync(catalogFile, 'utf8');
const baseline = current.includes(marker) ? current.slice(0, current.indexOf(marker)).trimEnd() + '\n' : current;
const context = { window: {} }; vm.runInNewContext(baseline, context);
for (const item of manifest) {
  const exists = context.window.FOODS.some(food => food.id === item.id);
  if (exists === item.archived) throw new Error('Unexpected current food visibility: ' + item.id);
}
for (const item of manifest) fs.copyFileSync(path.resolve(input, item.sourceFile), path.join(assets, item.asset));
fs.writeFileSync(path.join(root, 'docs/research/food-photo-manifest-20261106.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'docs/research/food-photo-sources-20261106.txt'), guide);
const script = '\n' + marker + `
(function () {
  const photos = ${JSON.stringify(manifest.map(({id, photo, credit}) => ({id, photo, credit})), null, 2)};
  const foods = new Map(window.FOODS.map(food => [food.id, food]));
  for (const item of photos) {
    const food = foods.get(item.id);
    if (food) Object.assign(food, { photo: item.photo, credit: item.credit });
  }
})();
`;
fs.writeFileSync(catalogFile, baseline + script);
const sql = `-- Supplied food photos only. Archived foods remain archived; original image bytes are in assets/food/.
-- Attribution and rights notes describe the supplied guide, not a newly granted reuse license.
begin;
set local lock_timeout='5s';
-- The supplied wonton photo is GIF. Preserve the existing basename rule and extensions.
do $image_format$
declare rule text;
begin
 select pg_get_constraintdef(oid) into rule from pg_constraint
 where conrelid='public.ieb_foods'::regclass and conname='ieb_foods_image_asset_check';
 if rule = 'CHECK ((image_asset ~ ''^[a-z0-9][a-z0-9._-]*\\.(jpg|jpeg|png|webp|avif|svg)$''::text))' then
  alter table public.ieb_foods drop constraint ieb_foods_image_asset_check;
  alter table public.ieb_foods add constraint ieb_foods_image_asset_check
   check (image_asset ~ '^[a-z0-9][a-z0-9._-]*\\.(jpg|jpeg|png|webp|avif|svg|gif)$');
 elsif rule is distinct from 'CHECK ((image_asset ~ ''^[a-z0-9][a-z0-9._-]*\\.(jpg|jpeg|png|webp|avif|svg|gif)$''::text))' then
  raise exception 'Unexpected image filename constraint; review before changing it';
 end if;
end $image_format$;
-- Use transaction-local variables for validation; do not create any tables or change RLS.
do $photo_import$
declare
 payload jsonb := $photos$${JSON.stringify(manifest.map(({id, asset, photo, credit})=>({id, asset, photo, credit})))}$photos$::jsonb;
 before_rows jsonb; prior jsonb; item jsonb; current_row record; touched integer; changed integer:=0;
begin
 if jsonb_array_length(payload)<>25 or
 (select count(*) from public.ieb_foods f join jsonb_array_elements(payload) p on f.id=p.value->>'id')<>25 then
  raise exception 'Expected exactly 25 existing food records; no rows may be added';
 end if;
 if (select count(*) from public.ieb_foods where id in('yonggung-sundae','andong-heotjesatbap') and content->>'catalogStatus'='archived')<>2 then
  raise exception 'Expected the two reviewed exclusions to remain archived';
 end if;
 select jsonb_object_agg(f.id,to_jsonb(f)) into before_rows from public.ieb_foods f;
 for item in select value from jsonb_array_elements(payload) loop
  update public.ieb_foods f set image_asset=item->>'asset',
   content=jsonb_set(jsonb_set(f.content,'{photo}',item->'photo'),'{credit}',item->'credit')
  where f.id=item->>'id' and (f.image_asset is distinct from item->>'asset'
   or f.content->'photo' is distinct from item->'photo' or f.content->'credit' is distinct from item->'credit');
  get diagnostics touched=row_count; changed:=changed+touched;
 end loop;
 for current_row in select * from public.ieb_foods loop
  prior:=before_rows->current_row.id;
  if to_jsonb(current_row)-array['image_asset','content','updated_at'] is distinct from prior-array['image_asset','content','updated_at']
   or current_row.content-array['photo','credit'] is distinct from (prior->'content')-array['photo','credit'] then
   raise exception 'Photo import changed unrelated food data: %',current_row.id;
  end if;
  select value into item from jsonb_array_elements(payload) where value->>'id'=current_row.id;
  if item is null then
   if current_row.image_asset is distinct from prior->>'image_asset' or current_row.content is distinct from prior->'content' then
    raise exception 'Untargeted photo changed: %',current_row.id;
   end if;
  elsif current_row.image_asset is distinct from item->>'asset' or current_row.content->'photo' is distinct from item->'photo'
   or current_row.content->'credit' is distinct from item->'credit' then
   raise exception 'Photo import did not match its source: %',current_row.id;
  end if;
 end loop;
 perform set_config('ieatbusan.photo_rows_changed',changed::text,true);
end $photo_import$;
select jsonb_build_object('matched_photos',25,'visible_photos',23,'archived_photos',2,
 'changed_rows',current_setting('ieatbusan.photo_rows_changed')::integer,
 'food_rows',(select count(*) from public.ieb_foods),'visible_foods',(select count(*) from public.ieb_foods where content->>'catalogStatus' is distinct from 'archived'),
 'out_of_scope_changes',0) as photo_import_result;
commit;
`;
fs.writeFileSync(path.join(root, 'supabase/migrations/20261106070000_add_supplied_food_photos.sql'), sql);
console.log('Imported 25 unchanged photos: 23 visible, 2 archived; existing foods and operating information preserved.');
