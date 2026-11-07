'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const foods=[{id:'test',places:[{name:'shifted record'}]}],ctx={window:{FOODS:foods}};
vm.runInNewContext(read('js/data/restaurant-images.js'),ctx);const api=ctx.window.IEBRestaurantImages;
assert.equal(api.records.length,86);assert.equal(new Set(api.records.map(r=>r.id)).size,86);
assert.equal(foods[0].places[0].imageAsset,undefined);
for(const r of api.records){assert.ok(fs.existsSync(path.join(root,'assets/restaurant',r.imageAsset)));assert.equal(api.image({restaurantId:r.id},'fallback'),'assets/restaurant/'+r.imageAsset);}
assert.equal(api.image({restaurantId:api.records[0].id,imageAsset:null},'fallback'),'fallback');
assert.equal(api.image({imageAsset:'../../private.jpg'},'fallback'),'fallback');
assert.equal(api.image({},'fallback'),'fallback');
const source=read('server/backend.cjs'),project={};vm.runInNewContext(source.slice(source.indexOf('function applyRestaurantData('),source.indexOf('async function snapshot(')),project);
const r=api.records[0],food=[{id:'test',content:{places:[{name:r.name}],ko:{restaurants:[]}}}];
project.applyRestaurantData(food,[{id:r.id,name:r.name,image_asset:r.imageAsset,food_links:[{food_id:'test',place_index:0}]}]);
assert.equal(food[0].content.places[0].imageAsset,r.imageAsset);
project.applyRestaurantData(food,[{id:r.id,name:r.name,image_asset:null,food_links:[{food_id:'test',place_index:0}]}]);
assert.equal(food[0].content.places[0].imageAsset,null);
assert.ok(source.includes('like_count,image_asset&limit=1000'));
console.log('PASS 86 verified storefront assets, master-data image projection, safe filenames, and null/unknown fallback');
