'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/map/map-sheet.js'),'utf8'),ctx);
class Element {
 constructor(){this.events={};this.attrs={};this.styles={};this.classes=new Set();this.style={setProperty:(k,v)=>this.styles[k]=v,removeProperty:k=>delete this.styles[k]};this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};}
 addEventListener(k,fn){this.events[k]=fn;}removeEventListener(k){delete this.events[k];}setAttribute(k,v){this.attrs[k]=v;}
 setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
}
const panel=new Element(),handle=new Element(),canvas=new Element(),locate=new Element();let size=640,resizes=0;
panel.parentElement={getBoundingClientRect:()=>({height:size})};const windowEvents={},modeEvents={};const wide={matches:false,addEventListener:(k,f)=>modeEvents[k]=f,removeEventListener:k=>delete modeEvents[k]};
const viewport={matchMedia:()=>wide,addEventListener:(k,f)=>windowEvents[k]=f,removeEventListener:k=>delete windowEvents[k]};
const control=ctx.window.IEBMapSheet.create({panel,handle,canvas,locate,viewport,onResize:()=>resizes++});
const height=()=>parseFloat(panel.styles['--sheet-height']);
const drag=(start,end)=>{handle.events.pointerdown({pointerId:1,clientY:start,button:0,isPrimary:true});handle.events.pointermove({pointerId:1,clientY:end,cancelable:true,preventDefault(){}});handle.events.pointerup({pointerId:1});};
assert.equal(height(),132);
drag(600,427);assert.equal(height(),305,'Release retains arbitrary height rather than snapping');assert.equal(locate.hidden,false);assert.equal(canvas.style.bottom,'305px');
let prevented=false,stopped=false;handle.events.click({detail:1,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});assert.ok(prevented&&stopped,'A drag must not also trigger the delegated tap toggle');assert.equal(height(),305);
drag(500,-1000);assert.equal(height(),640,'Maximum covers the full map viewport');assert.equal(locate.hidden,true,'Hide location control when there is no visible map');assert.equal(panel.attrs['aria-expanded'],undefined);assert.equal(handle.attrs['aria-expanded'],'true');
drag(100,2000);assert.equal(height(),132,'Cannot drag below the collapsed header');assert.equal(handle.attrs['aria-expanded'],'false');
control.toggle();assert.equal(height(),640,'Tap opens the entire map, not 62 percent');control.toggle();assert.equal(height(),132);
drag(600,295);assert.equal(height(),437);handle.events.keydown({key:'ArrowUp',preventDefault(){}});assert.equal(height(),469);
handle.events.keydown({key:'End',preventDefault(){}});assert.equal(height(),640);handle.events.keydown({key:'Home',preventDefault(){}});assert.equal(height(),132);
drag(600,295);wide.matches=true;modeEvents.change();assert.equal(handle.disabled,true);assert.equal(canvas.style.bottom,'');assert.equal(height(),NaN);control.toggle();
wide.matches=false;modeEvents.change();assert.equal(handle.disabled,false);assert.equal(height(),437,'Returning to mobile preserves the chosen height');
size=350;windowEvents.resize();assert.equal(height(),350,'Viewport shrink clamps to the new map height');size=800;windowEvents.resize();assert.equal(height(),350);
handle.events.pointerdown({pointerId:2,clientY:400});handle.events.pointermove({pointerId:3,clientY:200});assert.equal(height(),350,'Ignore unrelated pointers');handle.events.pointermove({pointerId:2,clientY:300});handle.events.pointercancel({pointerId:2});assert.equal(height(),450,'Cancellation retains the current position');
control.dispose();control.dispose();assert.equal(Object.keys(handle.events).length,0);assert.equal(Object.keys(windowEvents).length,0);assert.equal(Object.keys(modeEvents).length,0);assert.ok(resizes>0);
assert.equal(ctx.window.IEBMapSheet.create({panel:null,handle}),null);
const maps=require('./map-context.cjs')();const data=maps.IEBMapData.create(maps.FOODS,()=> 'ko');const renderer=maps.IEBMapRenderer.create({data,routes:maps.IEBMapRoutes.create(data),shapes:maps.IEBDistrictShapes,messages:maps.IEBMapText,getLanguage:()=> 'ko',districtName:i=>maps.DISTRICTS.ko[i],t:k=>maps.I18N.ko[k]||k,esc:String,fname:f=>f.ko.name,img:f=>f,icon:()=>'',appHeader:()=>'',tabbar:()=>'',mapAvailable:()=>false});
const html=renderer.render({valid:true,mode:'detail',districtId:'saha',foodId:null});assert.ok(html.includes('class="icon-btn map-back"'));assert.ok(html.includes('data-map-region'));assert.ok(!html.includes('class="map-detail-links"')&&!html.includes('class="chip-row"'));
console.log('PASS arbitrary drag height, full-map expansion, touch/click suppression, keyboard sizing, resize, desktop mode, cleanup and compact map toolbar');
