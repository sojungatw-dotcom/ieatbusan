'use strict';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function validateRestaurant({cfg,session,body,rest,fail}){
 if(!body.restaurantId)return null;
 if(typeof body.restaurantId!=='string'||!uuid.test(body.restaurantId)||body.cat!=='review'||!body.food)fail('db.validation');
 const rows=await rest(cfg,'ieb_restaurant','?id=eq.'+body.restaurantId+'&select=id,food_ids',{token:session.token});
 if(!rows.length||!rows[0].food_ids?.includes(body.food))fail('db.validation');
 return rows[0].id;
}
async function list({cfg,session,body,rest,upstream,fail,countries,districts}){
 const offset=Number(body.offset??0);
 if(!Number.isSafeInteger(offset)||offset<0||offset>100000)fail('db.validation');
 const restaurant=body.restaurantId;
 if(restaurant?!uuid.test(restaurant):!(/^[a-z0-9][a-z0-9-]{0,79}$/.test(body.food||'')))fail('db.validation');
 const opts={token:session.token};
 const filter=restaurant?'restaurant_id=eq.'+restaurant+'&category=eq.review':'food=eq.'+encodeURIComponent(body.food);
 const rows=await rest(cfg,'ieb_posts','?select=*,ieb_profiles!ieb_posts_user_id_fkey(nickname,area)&'+filter+'&order=created_at.desc,id.desc&limit=6&offset='+offset,opts);
 const posts=rows.slice(0,5),uid=session.user?.id,paths=[...new Set(posts.flatMap(p=>p.photos||[]))];
 const signed=paths.length?await upstream(cfg,'/storage/v1/object/sign/ieb-community',{...opts,method:'POST',body:{paths,expiresIn:3600}}):[];
 const images=Object.fromEntries((signed||[]).filter(p=>p.signedURL).map(p=>[p.path,p.signedURL.startsWith('https://')?p.signedURL:cfg.url+'/storage/v1'+p.signedURL]));
 const postLikes=Object.fromEntries(posts.filter(p=>uid&&p.liked_user_ids?.includes(uid)).map(p=>[p.id,true]));
 return {hasMore:rows.length>5,postLikes,posts:posts.map(p=>({id:p.id,title:p.title,body:p.body,cat:p.category,food:p.food,restaurantId:p.restaurant_id||null,
 author:p.ieb_profiles?.nickname||p.seed_author||'',area:districts[p.ieb_profiles?.area]||p.seed_area||'',countryCode:countries.isValid(p.country_code)?p.country_code:'',
 createdAt:Date.parse(p.created_at),mine:!!uid&&p.user_id===uid,photos:(p.photos||[]).map(p=>images[p]).filter(Boolean),likes:Math.max(0,(p.like_count||0)-(postLikes[p.id]?1:0))}))};
}
module.exports={list,validateRestaurant};
