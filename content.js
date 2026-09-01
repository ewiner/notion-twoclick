// Notion Link Guard
//
// Intercepts left-clicks on links (including page/person mentions, which
// Notion renders as anchors) inside Notion page content, and shows a small
// popover with the URL plus copy / open-in-new-tab actions instead of
// navigating immediately — the Google Docs link behavior.
//
// Runs at document_start so our capture listeners register before Notion's
// own document-level handlers; Notion's editor may navigate from mouseup /
// pointerup rather than click, so those are guarded too.
//
// Deliberately NOT intercepted:
//   - modifier clicks (cmd/ctrl/shift/alt) and middle clicks — explicit intent
//   - clicks in the sidebar and topbar/breadcrumbs
//   - non-http(s) hrefs (Notion uses fragment/js hrefs for some controls)
//   - clicks that end a text-selection drag, or a drag that started elsewhere
//     (block drag-and-drop released over a link)

(() => {
  'use strict';

  let currentUrl = null;
  let lastMouseDownTarget = null;

  // ---------------------------------------------------------------- popover

  const popover = document.createElement('div');
  popover.id = 'nlg-popover';
  popover.hidden = true;

  const ICON_COPY =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const ICON_NEWTAB =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
  const ICON_GLOBE =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  popover.innerHTML = `
    <span class="nlg-glyph">${ICON_GLOBE}</span>
    <a class="nlg-url" href="#" title=""></a>
    <span class="nlg-sep"></span>
    <button type="button" class="nlg-btn" data-action="copy" title="Copy link">${ICON_COPY}</button>
    <button type="button" class="nlg-btn" data-action="newtab" title="Open in new tab">${ICON_NEWTAB}</button>
  `;

  const urlEl = popover.querySelector('.nlg-url');
  const copyBtn = popover.querySelector('[data-action="copy"]');
  const newtabBtn = popover.querySelector('[data-action="newtab"]');

  function mountPopover() {
    if (!popover.isConnected && document.body) document.body.appendChild(popover);
  }

  // Keep clicks inside the popover from moving Notion's caret or triggering
  // Notion's global mousedown handlers.
  popover.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  function showPopover(link) {
    mountPopover();
    currentUrl = resolveUrl(link);

    urlEl.textContent = currentUrl.href.replace(/^https?:\/\//, '');
    urlEl.href = currentUrl.href;
    urlEl.title = currentUrl.href;

    popover.classList.toggle('nlg-dark', !!document.querySelector('.notion-dark-theme'));
    resetCopyButton();

    // Position below the clicked link, clamped to the viewport; flip above
    // if there's no room underneath.
    popover.hidden = false;
    popover.style.visibility = 'hidden';
    const rect = link.getBoundingClientRect();
    const pw = popover.offsetWidth;
    const ph = popover.offsetHeight;
    const margin = 8;
    const left = Math.min(Math.max(rect.left, margin), window.innerWidth - pw - margin);
    let top = rect.bottom + 6;
    if (top + ph > window.innerHeight - margin) top = rect.top - ph - 6;
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
    popover.style.visibility = '';
  }

  function hidePopover() {
    popover.hidden = true;
  }

  let copyResetTimer = null;
  function resetCopyButton() {
    clearTimeout(copyResetTimer);
    copyBtn.innerHTML = ICON_COPY;
    copyBtn.title = 'Copy link';
  }

  // ---------------------------------------------------------------- actions

  urlEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = currentUrl;
    hidePopover();
    if (!url) return;
    // Same-origin Notion pages navigate in this tab; external links open a
    // new tab, which is what Notion does by default.
    if (url.origin === location.origin) {
      location.assign(url.href);
    } else {
      window.open(url.href, '_blank', 'noopener');
    }
  });

  newtabBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUrl) window.open(currentUrl.href, '_blank', 'noopener');
    hidePopover();
  });

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl.href);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = currentUrl.href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copyBtn.innerHTML = ICON_CHECK;
    copyBtn.title = 'Copied';
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(resetCopyButton, 1200);
  });

  // ----------------------------------------------------------- interception

  function resolveUrl(link) {
    try {
      return new URL(link.getAttribute('href'), location.href);
    } catch {
      return null;
    }
  }

  function isGuardedLink(link) {
    const url = resolveUrl(link);
    if (!url || !/^https?:$/.test(url.protocol)) return false;
    if (link.closest('#nlg-popover')) return false;
    // Leave app chrome alone — sidebar, topbar/breadcrumbs. Everything else
    // (page content, peek modals, database cells, overlays) is guarded.
    if (link.closest('.notion-sidebar-container, .notion-topbar')) return false;
    return true;
  }

  // Is this a plain left-click-style event on a guarded link that did not
  // start as a drag from somewhere else and is not the end of a selection?
  function guardTarget(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
    if (typeof e.button === 'number' && e.button !== 0) return null;
    if (popover.contains(e.target)) return null;
    const link = e.target instanceof Element && e.target.closest('a[href]');
    if (!link || !isGuardedLink(link)) return null;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && String(sel).length > 0) return 'suppress';
    return link;
  }

  document.addEventListener(
    'mousedown',
    (e) => {
      lastMouseDownTarget = e.target;
    },
    true
  );

  // Notion's editor can navigate from mouseup/pointerup handlers rather than
  // waiting for click, so starve those events for guarded links. Only when
  // the press started on the same link — releasing a drag (text selection,
  // block drag-and-drop) over a link must still reach Notion.
  function onPointerRelease(e) {
    const result = guardTarget(e);
    if (!result || result === 'suppress') return;
    if (
      !(lastMouseDownTarget instanceof Node) ||
      !result.contains(lastMouseDownTarget)
    ) {
      return;
    }
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
  document.addEventListener('pointerup', onPointerRelease, true);
  document.addEventListener('mouseup', onPointerRelease, true);

  document.addEventListener(
    'click',
    (e) => {
      if (popover.contains(e.target)) return; // popover handles its own clicks

      const result = guardTarget(e);
      if (!result) {
        hidePopover();
        return;
      }

      // Always stop Notion from navigating on a plain click…
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();

      // …but if this click is the tail end of a text-selection drag, don't
      // pop anything up either — the user is selecting, not linking.
      if (result === 'suppress') {
        hidePopover();
        return;
      }

      showPopover(result);
    },
    true
  );

  // Dismissal: escape, scroll anywhere, resize, tab switch.
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && !popover.hidden) {
        e.stopPropagation();
        hidePopover();
      }
    },
    true
  );
  window.addEventListener('scroll', hidePopover, true);
  window.addEventListener('resize', hidePopover);
  document.addEventListener('visibilitychange', hidePopover);

  console.info('[Notion Link Guard] active');
})();
