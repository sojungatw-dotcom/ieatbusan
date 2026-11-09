'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['js/data/foods.js','js/data/restaurant-updates.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const before=JSON.stringify(ctx.window.FOODS);
vm.runInNewContext(fs.readFileSync(path.join(root,'js/food-categories.js'),'utf8'),ctx);
const api=ctx.window.IEBFoodCategories,foods=ctx.window.FOODS,ids=new Set(foods.map(f=>f.id));
assert.equal(api.groups.length,10);
assert.equal(new Set(api.groups.map(g=>g.id)).size,10);
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
assert.ok(api.byId('seafood').foods.includes('bokguk')&&api.byId('soups').foods.includes('bokguk'),'Overlapping categories are intentional');
assert.equal(api.foods('all',foods).length,foods.length);
assert.equal(api.foods('missing',foods).length,0);
assert.equal(api.foods('soups',foods.filter(f=>f.id!=='bokguk')).some(f=>f.id==='bokguk'),false,'A server-removed dish cannot reappear through categories');
assert.equal(JSON.stringify(foods),before,'Grouping never changes original facts or ordering');
console.log('PASS 10 original category illustrations, four labels each, complete active-food coverage, overlap and catalog immutability');
