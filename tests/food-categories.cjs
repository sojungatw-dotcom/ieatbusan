'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['js/data/foods.js','js/data/restaurant-updates.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const before=JSON.stringify(ctx.window.FOODS);
vm.runInNewContext(fs.readFileSync(path.join(root,'js/food-categories.js'),'utf8'),ctx);
const api=ctx.window.IEBFoodCategories,foods=ctx.window.FOODS,ids=new Set(foods.map(f=>f.id));
assert.equal(api.groups.length,8);
assert.equal(new Set(api.groups.map(g=>g.id)).size,8);
const covered=new Set();
for(const group of api.groups){
 assert.equal(new Set(group.foods).size,group.foods.length);
 assert.ok(group.foods.length>0);
 for(const id of group.foods){assert.ok(ids.has(id),'Unknown or archived dish: '+id);covered.add(id);}
 for(const lang of ['ko','en','zh','ja'])assert.ok(api.name(group,lang).trim());
 const svg=fs.readFileSync(path.join(root,group.image.split('?')[0]),'utf8');
 assert.ok(svg.includes('viewBox="0 0 72 72"'));
 assert.ok(!/<script|<foreignObject|https?:|<text/.test(svg.replace('http://www.w3.org/2000/svg','')),'Icons contain only original vector artwork');
 const expected=foods.filter(f=>group.foods.includes(f.id));
 assert.equal(api.foods(group.id,foods).map(f=>f.id).join(),expected.map(f=>f.id).join());
}
assert.equal(covered.size,ids.size,'Every active dish has a discovery group');
assert.deepEqual(Array.from(api.groups,g=>api.name(g,'ko')),['육류','해산물','찜·탕','면 요리','밥·죽','분식','간식','매운맛']);
assert.equal(api.byId('vegan'),undefined);
assert.equal(api.byId('steamed'),undefined);
assert.ok(api.byId('snacks').foods.includes('daegu-kongguk')&&api.byId('snacks').foods.includes('uiryeong-manggaetteok'),'Snacks retain their actual food links');
assert.equal(api.byId('soups').foods.length,15,'Steamed dishes, soups and stews are one group');
for(const [id,expected] of Object.entries({
 'dwaeji-gukbap':['meat','soups','rice'],
 'masan-agujjim':['seafood','soups','spicy'],
 'andong-jjimdak':['meat','soups','spicy'],
 'gijang-daege':['seafood','soups'],
 'bibim-dangmyeon':['noodles','street'],
 'uiryeong-manggaetteok':['snacks'],
}))assert.deepEqual(Array.from(api.groups.filter(g=>g.foods.includes(id)),g=>g.id).sort(),expected.sort(),id+' must be connected to the correct overlapping groups');
assert.ok(api.byId('seafood').foods.includes('bokguk')&&api.byId('soups').foods.includes('bokguk'),'Overlapping categories are intentional');
assert.equal(api.foods('all',foods).length,foods.length);
assert.equal(api.foods('missing',foods).length,0);
assert.equal(api.foods('soups',foods.filter(f=>f.id!=='bokguk')).some(f=>f.id==='bokguk'),false,'A server-removed dish cannot reappear through categories');
assert.equal(JSON.stringify(foods),before,'Grouping never changes original facts or ordering');
console.log('PASS 8 category illustrations, four labels each, merged steamed/soup links and separate street-food/snack links, complete active-food coverage and catalog immutability');
