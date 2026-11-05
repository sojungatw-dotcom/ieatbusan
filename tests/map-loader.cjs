'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const filename = path.join(__dirname,'../js/map/map-loader.js');
assert.ok(fs.existsSync(filename), 'Missing lazy map SDK loader');
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(filename,'utf8'),ctx);
function harness(existing = false) {
  let sdk = existing ? {} : null, next = 0;
  const nodes = [], timers = new Map();
  const loader = ctx.window.IEBMapSDK.create({ getSDK:()=>sdk,
    document:{createElement(tag){return {tag,remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}};},head:{appendChild(node){nodes.push(node);}}},
    setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),
  });
  return {loader,nodes,timers,success(){sdk={};for(const node of [...nodes])node.onload?.();}};
}
(async()=>{
  const h=harness();
  assert.equal(h.nodes.length,0,'Overview must not trigger SDK requests');
  const first=h.loader.load(),second=h.loader.load();
  assert.equal(first,second,'Concurrent main/mini requests share one load');
  assert.equal(h.nodes.length,2);
  h.success();await first;
  assert.equal(h.loader.ready(),true);
  await h.loader.load();assert.equal(h.nodes.length,2);
  assert.equal(h.timers.size,0);
  const failed=harness();
  const attempt=failed.loader.load();
  failed.nodes[0].onerror();await assert.rejects(attempt);
  assert.equal(failed.nodes.length,0);
  const retry=failed.loader.load();
  assert.equal(failed.nodes.length,2,'A failed load can be retried');
  failed.success();await retry;
  const slow=harness();const timeout=slow.loader.load();
  const [id,fire]=[...slow.timers][0];slow.timers.delete(id);fire();
  await assert.rejects(timeout);assert.equal(slow.nodes.length,0);
  const existing=harness(true);const styleOnly=existing.loader.load();
  assert.equal(existing.nodes.length,1);assert.equal(existing.nodes[0].tag,'link');
  existing.nodes[0].onload();await styleOnly;
  console.log('PASS lazy SDK loading, shared request, stylesheet readiness, failure/retry and bounded timeout');
})().catch(error=>{console.error(error);process.exitCode=1;});
