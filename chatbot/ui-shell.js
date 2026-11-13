/* Keep host controls out of the way of native dialogs inside the iframe. */
(function () {
  'use strict';
  if (parent === window) return;
  const sync = () => parent.postMessage({type:'ieb-chatbot:dialog', open:!!document.querySelector('dialog[open]')}, location.origin);
  const observer = new MutationObserver(sync);
  document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, {attributes:true,attributeFilter:['open']}));
  sync();
})();
