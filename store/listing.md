# Chrome Web Store listing

Copy/paste source for the developer dashboard. Not part of the uploaded zip.

## Store listing tab

**Category:** Productivity (Workflow & Planning)
**Language:** English

**Summary** (from manifest `description`, ≤132 chars):

> Clicking a link in a Notion page shows a copy/open popover instead of navigating, like Google Docs.

**Description:**

```
Stop opening links by accident while editing Notion.

With TwoClick for Notion, clicking a link or page mention inside a Notion page no longer navigates away. Instead, a small popover shows the URL with two actions — copy link and open in new tab — the same way Google Docs handles links. Click the URL in the popover to follow it as Notion normally would.

• Place your cursor, select text, and click around links without leaving the page
• Copy a link's URL in one click
• Cmd/Ctrl-click, Shift-click, and middle-click still open links immediately
• Sidebar, breadcrumbs, and search results are unaffected
• User @-mentions no longer pop open profiles on a stray click
• Follows Notion's light and dark themes

Privacy: no data collection, no network requests, no extension permissions beyond running on Notion pages. Open source: https://github.com/ewiner/notion-twoclick

Not affiliated with or endorsed by Notion Labs, Inc.
```

**Store icon:** `icons/icon128.png`
**Screenshots:** 1280×800 (or 640×400) PNG/JPEG, at least one. TODO.
**Homepage URL:** https://github.com/ewiner/notion-twoclick
**Support URL:** https://github.com/ewiner/notion-twoclick/issues

## Privacy practices tab

**Single purpose:**

> Changes link clicks inside Notion pages to show a popover with the URL and copy/open actions instead of navigating immediately.

**Host permission justification** (content script matches on notion.so / notion.com / notion.site):

> The extension's only function is changing how link clicks behave on Notion pages, so its content script must run on Notion's domains. It runs nowhere else.

**Remote code:** No, I am not using remote code.

**Data usage:** check none of the data types. Certify all three disclosures
(not sold to third parties, not used for unrelated purposes, not used for
creditworthiness/lending).

**Privacy policy URL:** https://github.com/ewiner/notion-twoclick/blob/main/PRIVACY.md

## Distribution tab

Visibility: Public (or Unlisted for a soft launch). Regions: all.
