(function(root){
 'use strict';
 const fields=['name','summary','category','ingredients','allergenNote','price','spice','romanization'];
 const pick=object=>Object.fromEntries(fields.filter(k=>typeof object?.[k]==='string').map(k=>[k,object[k]]));
 function project(rows,localFoods=[]){
  if(!Array.isArray(rows))return {available:false,foods:[]};
  const local=new Map(localFoods.map(food=>[food.id,food])),foods=[];
  for(const row of rows){if(!row||typeof row.id!=='string'||row.content?.catalogStatus==='archived')continue;const fallback=local.get(row.id)||{},content=row.content&&typeof row.content==='object'?row.content:{},ko={...pick(fallback.ko),...pick(content.ko)};
   for(const [column,key] of [['name','name'],['summary','summary'],['category','category']])if(typeof row[column]==='string')ko[key]=row[column];
   if(!ko.name)continue;
   if(Array.isArray(content.ko?.allergens))ko.allergens=content.ko.allergens.filter(v=>typeof v==='string');else if(Array.isArray(fallback.ko?.allergens))ko.allergens=fallback.ko.allergens.filter(v=>typeof v==='string');
   const rawRows=content.manuscript?.infoRows||fallback.manuscript?.infoRows,infoRows=Array.isArray(rawRows)?rawRows.filter(r=>Array.isArray(r)&&r.length>=2&&typeof r[0]==='string'&&typeof r[1]==='string').map(r=>[r[0],r[1]]):[];
   const classification={};for(const key of ['categories','ingredients','possibleIngredients'])if(Array.isArray(content.classification?.[key]))classification[key]=content.classification[key].filter(v=>typeof v==='string');for(const key of ['spicy','plantCandidate'])if(typeof content.classification?.[key]==='boolean')classification[key]=content.classification[key];
   const rawCredit=content.credit||fallback.credit||{},credit=Object.fromEntries(['author','license','url'].filter(k=>typeof rawCredit[k]==='string').map(k=>[k,rawCredit[k]]));
   const image=typeof row.imageAsset==='string'&&/^[-\w.]+\.(?:jpg|jpeg|png|webp|gif|avif|svg)$/i.test(row.imageAsset)?(row.imageAsset==='food-placeholder.svg'?'../assets/food-placeholder.svg':'../assets/food/'+row.imageAsset):'../assets/food-placeholder.svg';
   foods.push({id:row.id,ko,en:{...pick(fallback.en),...pick(content.en)},zh:{...pick(fallback.zh),...pick(content.zh)},ja:{...pick(fallback.ja),...pick(content.ja)},manuscript:{infoRows},classification,dietary:{veganVerified:content.dietary?.veganVerified===true},credit,photo:image,places:(Array.isArray(content.places)?content.places:Array.isArray(fallback.places)?fallback.places:[]).map((p,index)=>({p:{...(fallback.places||[]).find(known=>known.name===p?.name),...p,address:p?.address||p?.research?.area||((content.manuscript||fallback.manuscript)?.placeRecordsMerged?'':(content.manuscript||fallback.manuscript)?.restaurants?.[index]?.area)||(content.ko||fallback.ko)?.restaurants?.[index]?.address||(fallback.places||[]).find(known=>known.name===p?.name)?.address||''},index})).filter(({p})=>typeof p?.name==='string').map(({p,index})=>({...Object.fromEntries(['name','address','addressEn','addressZh','addressJa','area','phone','naverUrl','googleUrl','romanization'].filter(k=>typeof p[k]==='string').map(k=>[k,p[k]])),index,...(Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lng)&&Math.abs(p.lng)<=180?{lat:p.lat,lng:p.lng}:{})}))});
  }
  return {available:true,foods};
 }
 const api={project};root.IEBChatbotCatalog=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
