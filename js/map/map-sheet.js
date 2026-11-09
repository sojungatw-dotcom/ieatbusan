/* Free-position mobile restaurant sheet; desktop keeps its fixed sidebar. */
(function () {
  'use strict';
  window.IEBMapSheet = {
    create({ panel, handle, canvas, locate, onResize = () => {}, viewport = window }) {
      const wrap = panel?.parentElement;
      if (!wrap || !handle || !panel.style?.setProperty) return null;
      const wide = viewport.matchMedia?.('(min-width: 960px)');
      let height = 132, drag = null, suppressClick = false, disposed = false;
      const maximum = () => Math.max(0, wrap.getBoundingClientRect().height);
      const minimum = () => Math.min(132, maximum());
      const isWide = () => !!wide?.matches;
      function setHeight(value, resize = false) {
        if (disposed || isWide()) return;
        height = Math.max(minimum(), Math.min(maximum(), value));
        panel.style.setProperty('--sheet-height', height + 'px');
        panel.classList.toggle('collapsed', height <= minimum() + 1);
        handle.setAttribute('aria-expanded', String(height > minimum() + 1));
        if (canvas?.style) canvas.style.bottom = height + 'px';
        if (locate?.style) { locate.style.bottom = (height + 16) + 'px'; locate.hidden = maximum() - height < 60; }
        if (resize) onResize();
      }
      function sync() {
        if (disposed) return;
        drag = null;
        panel.classList.remove('is-dragging');
        handle.disabled = isWide();
        if (isWide()) {
          panel.style.removeProperty('--sheet-height');
          handle.setAttribute('aria-expanded', 'true');
          if (canvas?.style) canvas.style.bottom = '';
          if (locate?.style) { locate.style.bottom = ''; locate.hidden = false; }
          onResize();
        } else setHeight(height, true);
      }
      const down = event => {
        if (disposed || isWide() || drag || event.isPrimary === false || (event.button != null && event.button !== 0)) return;
        suppressClick = false;
        drag = { id: event.pointerId, y: event.clientY, height, moved: false };
        try { handle.setPointerCapture?.(event.pointerId); } catch { /* Capture can end during native navigation. */ }
      };
      const move = event => {
        if (!drag || drag.id !== event.pointerId || disposed) return;
        const distance = drag.y - event.clientY;
        if (!drag.moved && Math.abs(distance) < 4) return;
        drag.moved = true;
        panel.classList.add('is-dragging');
        if (event.cancelable) event.preventDefault();
        setHeight(drag.height + distance);
      };
      const end = event => {
        if (!drag || drag.id !== event.pointerId) return;
        suppressClick = drag.moved;
        drag = null;
        panel.classList.remove('is-dragging');
        try { if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId); } catch {}
        // No snapping: retain the exact clamped height where the user released.
        onResize();
      };
      const click = event => {
        if (!suppressClick || event.detail === 0) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      };
      const key = event => {
        if (isWide()) return;
        const value = event.key === 'Home' ? minimum() : event.key === 'End' ? maximum()
          : event.key === 'ArrowUp' ? height + 32 : event.key === 'ArrowDown' ? height - 32 : null;
        if (value === null) return;
        event.preventDefault();
        setHeight(value, true);
      };
      const events = { pointerdown: down, pointermove: move, pointerup: end, pointercancel: end, lostpointercapture: end, click, keydown: key };
      for (const [name, listener] of Object.entries(events)) handle.addEventListener(name, listener);
      viewport.addEventListener?.('resize', sync);
      wide?.addEventListener?.('change', sync);
      const observer = viewport.ResizeObserver ? new viewport.ResizeObserver(sync) : null;
      observer?.observe(wrap);
      sync();
      return {
        toggle() { if (!isWide()) setHeight(height <= minimum() + 1 ? maximum() : minimum(), true); },
        collapse() { setHeight(minimum(), true); },
        dispose() {
          if (disposed) return;
          disposed = true;
          if (drag) { try { handle.releasePointerCapture?.(drag.id); } catch {} }
          drag = null;
          for (const [name, listener] of Object.entries(events)) handle.removeEventListener(name, listener);
          viewport.removeEventListener?.('resize', sync);
          wide?.removeEventListener?.('change', sync);
          observer?.disconnect();
          panel.classList.remove('is-dragging');
        },
      };
    },
  };
})();
