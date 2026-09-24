# Notion TwoClick

A tiny Chrome extension that makes links (and mentions, which Notion renders
as links) inside Notion pages a **two-click experience**, like editing a
Google Doc:

- A plain left-click on a link **does not navigate**. Instead, a small popover
  appears showing the URL with two actions: **copy link** and **open in new
  tab**.
- Clicking the URL in the popover performs the original navigation (SPA
  navigation for internal Notion pages, new tab for external links — whatever
  Notion would have done).
- You can click around, select text, and place your cursor freely without
  accidentally opening tabs or leaving the page.
- User **@-mentions** (which aren't real links — Notion opens the profile
  from its own click handler) are disabled outright: a plain click on one
  does nothing. Date mentions remain clickable for editing.

> **Provenance:** this extension is vibe-coded — written entirely by Claude
> (Anthropic's AI), reviewed only by using it. It works, but read it with
> that in mind.

## What still works normally

- **Cmd/Ctrl-click, Shift-click, Alt-click, middle-click** — treated as
  explicit intent and passed straight through to Notion/the browser.
- **Sidebar and topbar/breadcrumb links** — not intercepted; only links inside
  page content (including peek modals) are guarded.
- **Text selection across a link** — a click that ends a selection drag
  neither navigates nor shows the popover.

The popover dismisses on Escape, scroll, clicking elsewhere, or switching
tabs. It follows Notion's light/dark theme.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right).
3. Click **Load unpacked** and select this directory.
4. Reload any open Notion tabs.

No build step — plain Manifest V3 with a single content script. It runs on
the Notion app (`notion.com`/`notion.so`) and public `notion.site` pages,
needs no extension permissions beyond that, and makes no network requests.

## Not implemented (yet)

Google Docs' popover also has **Edit** and **Remove** buttons. Those require
driving Notion's own editor UI (or its private API) to rewrite the block, which
is fragile; for now, edit/remove links through Notion's native hover toolbar,
which still works — hovering a link is unaffected by this extension.

## Notes / caveats

- Notion's DOM class names (`notion-page-content`,
  `notion-text-mention-token`, etc.) are not a public API. If Notion renames
  them, interception may become broader or narrower until the selectors in
  `content.js` are updated.
- Only links inside `.notion-page-content` (the page body, including peek
  modals and inline databases) are guarded. Search results, the sidebar,
  topbar, full-page database views, and other overlays are left alone.
