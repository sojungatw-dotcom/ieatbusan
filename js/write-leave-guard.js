/* Restore the current history entry before asking to discard an unfinished post. */
(function () {
  'use strict';
  window.IEBWriteLeaveGuard = {
    create({ isDirty, t, esc, host = window, document = host.document }) {
      const stateKey = 'iebWriteNavigationIndex';
      let currentHash = host.location.hash || '#/home';
      let index = Number.isInteger(host.history.state?.[stateKey]) ? host.history.state[stateKey] : 0;
      let pending = null, restoring = false, confirmed = false, allowed = null;
      let dialog = null, actionResolve = null;
      function proceed() {
        const target = pending;
        pending = null; confirmed = false; allowed = target;
        if (target) host.location.hash = target;
      }
      function getDialog() {
        if (dialog) return dialog;
        dialog = document.createElement('dialog');
        dialog.className = 'write-leave-dialog';
        dialog.setAttribute('aria-labelledby', 'write-leave-title');
        dialog.setAttribute('aria-describedby', 'write-leave-message');
        document.body.appendChild(dialog);
        dialog.addEventListener('close', () => {
          if (actionResolve) {
            const resolve = actionResolve; actionResolve = null;
            resolve(dialog.returnValue); return;
          }
          if (dialog.returnValue === 'confirm') {
            confirmed = true;
            if (!restoring) proceed();
          } else { pending = null; confirmed = false; }
        });
        return dialog;
      }
      function showConfirmation(messageKey, cancelKey = 'common.cancel', confirmKey = 'common.confirm', titleKey = 'write.leaveTitle') {
        const popup = getDialog();
        popup.innerHTML = `<h2 id="write-leave-title">${esc(t(titleKey))}</h2>
          <p id="write-leave-message">${esc(t(messageKey))}</p>
          <form method="dialog"><button class="btn btn-outline" value="cancel"${cancelKey === 'common.cancel' ? ' autofocus' : ''}>${esc(t(cancelKey))}</button>
          <button class="btn btn-primary" value="confirm"${cancelKey === 'common.cancel' ? '' : ' autofocus'}>${esc(t(confirmKey))}</button></form>`;
        popup.returnValue = '';
        if (!popup.open) popup.showModal();
      }
      host.addEventListener('beforeunload', event => {
        if (!isDirty()) return;
        event.preventDefault(); event.returnValue = true;
      });
      return {
        confirmAction(...labels) {
          if (dialog?.open || actionResolve) return Promise.resolve('');
          return new Promise(resolve => { actionResolve = resolve; showConfirmation(...labels); });
        },
        intercept(target) {
          if (restoring) {
            if (target === currentHash) {
              restoring = false;
              if (confirmed) proceed();
            }
            return true; // Keep the exact editor DOM, selections and photos intact.
          }
          if (allowed === target) { allowed = null; return false; }
          if (target === currentHash || !isDirty()) return false;
          if (actionResolve) { actionResolve(''); actionResolve = null; }
          pending = target; confirmed = false;
          const targetIndex = host.history.state?.[stateKey];
          const delta = Number.isInteger(targetIndex) ? index - targetIndex : -1;
          restoring = delta !== 0;
          if (restoring) host.history.go(delta);
          else host.history.replaceState(host.history.state, '', currentHash);
          showConfirmation('write.leaveMessage');
          return true;
        },
        commit(hash) {
          const existing = host.history.state?.[stateKey];
          index = Number.isInteger(existing) ? existing : index + 1;
          currentHash = hash;
          host.history.replaceState({ ...host.history.state, [stateKey]: index }, '', hash);
        },
      };
    },
  };
})();
