// Notion Link Guard
//
// Intercepts left-clicks on links (including page/person mentions, which
// Notion renders as anchors) inside Notion page content, and shows a small
// popover with the URL plus copy / open-in-new-tab actions instead of
// navigating immediately — the Google Docs link behavior.
//
// Deliberately NOT intercepted:
//   - modifier clicks (cmd/ctrl/shift/alt) and middle clicks — explicit intent
//   - clicks in the sidebar, topbar/breadcrumbs, and other chrome
//   - non-http(s) hrefs (Notion uses fragment/js hrefs for some controls)

(() => {
  'use strict';

  // Set just before we re-dispatch the original click from the popover, so
  // our capture listener lets that one through to Notion untouched.
  let bypassNextClick = false;
  let currentLink = null;
  let currentUrl = null;

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
    if (!popover.isConnected) document.body.appendChild(popover);
  }

  // Keep clicks inside the popover from moving Notion's caret or triggering
  // Notion's global mousedown handlers.
  popover.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  function showPopover(link) {
    mountPopover();
    currentLink = link;
    currentUrl = resolveUrl(link);

    const display = currentUrl.href.replace(/^https?:\/\//, '');
    urlEl.textContent = display;
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
    let left = Math.min(Math.max(rect.left, margin), window.innerWidth - pw - margin);
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
    const link = currentLink;
    hidePopover();
    if (!link || !link.isConnected) {
      if (currentUrl) window.open(currentUrl.href, '_blank', 'noopener');
      return;
    }
    // Re-dispatch the original click so Notion's own handling runs: SPA
    // navigation for internal pages, new tab for external links.
    bypassNextClick = true;
    link.click();
    bypassNextClick = false;
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

  function isInterceptable(link) {
    const url = resolveUrl(link);
    if (!url || !/^https?:$/.test(url.protocol)) return false;
    if (link.closest('#nlg-popover')) return false;
    // Leave app chrome alone — sidebar, topbar/breadcrumbs.
    if (link.closest('.notion-sidebar-container, .notion-topbar')) return false;
    // Only guard links inside actual page content (main frame, peek modals,
    // and overlays such as link previews).
    return !!link.closest(
      '.notion-page-content, .notion-frame, .notion-peek-renderer, .notion-overlay-container'
    );
  }

  document.addEventListener(
    'click',
    (e) => {
      if (bypassNextClick) return;
      if (popover.contains(e.target)) return; // popover handles its own clicks

      const link = e.target.closest && e.target.closest('a[href]');
      if (!link || !isInterceptable(link)) {
        hidePopover();
        return;
      }

      // Explicit-intent clicks pass through (cmd/ctrl-click new tab, etc.).
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // Always stop Notion from navigating on a plain click…
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();

      // …but if this click is the tail end of a text-selection drag, don't
      // pop anything up either — the user is selecting, not linking.
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && String(sel).length > 0) {
        hidePopover();
        return;
      }

      showPopover(link);
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
})();
