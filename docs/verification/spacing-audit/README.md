# 2026-11-13 UI spacing and integration audit

## Changes

- Home typography uses 12px eyebrow/title/body spacing, with separate section spacing. Map heading/caption spacing is reduced without collapsing the hierarchy.
- Soup icon has separate solid lid, handles and pot; no horizontal stroked lid line.
- Chatbot help actions have a measured 12px gap. Catalog count and explanation are separate lines. Supporting copy is 12–14px with appropriate line height.
- Chatbot panel tabs use 16px inset / 16px inner radius in the desktop panel, and 12px inset / 12px radius on mobile. Modal padding, search inputs and secondary action groups share the same geometry.
- Host close/expand controls hide while an iframe dialog is open and return when it closes.
- Fixed a missing `js/chatbot-catalog.js` entry script: the host previously sent an unavailable catalog even with loaded food data. The isolated browser now receives all 43 fixture foods.

## Evidence and reproduction

Run `node tools/preview-chatbot-fixture.cjs` (8783), and `node tests/admin-browser.cjs` (8782). Set `PLAYWRIGHT_MODULE` to an installed Playwright module if not on the normal Node module path. Both audit scripts use installed Chrome in headless mode, without controlling the user's foreground browser.

- `node tools/audit-ui.cjs`: 25 public routes × 4 widths (320/390/768/1440) × 4 languages (KO/EN/ZH/JA), **400 cases**, document overflow 0 / page errors 0. Help button gap 12px; desktop tab inset/radius 16px.
- `node tools/audit-ui-states.cjs`: 12 member/post/saved/chatbot/admin route states × 4 widths, **48 cases**, document overflow 0 / page errors 0. Synthetic account/post responses; modal host control hide/restore assertions pass.
- Rendered screenshots reviewed for home, map, search, food detail, community, settings, member profile/post and chatbot conversation/help/catalog. Screenshots and JSON reports are in this directory.
- `node tools/build-static.cjs`, then the 40 standalone `tests/*.cjs` checks excluding browser/preview/context server scripts: passed.

These are route/layout and targeted visual checks, not a claim that every scroll position, sentence or physical mobile device was manually reviewed. Administrator coverage here is its route shell and login screen; real admin writes, real account mutations and external map-provider availability were not tested. Fixture food imagery can include the existing placeholder. No production database writes were made.

## Figma

[Final UI file](https://www.figma.com/design/2jTLllte3E3vg4fjrbvwj2?node-id=40-46): 26 editable screen/state frames, shared navigation/header components and the eight original food icon components. Includes desktop/mobile home and map, category/detail/search/community/saved/settings/auth/support screens and chatbot help/catalog/conditions/offline state. Member-only form variants are browser-verified but not separately reproduced in this Figma board.

Figma uses Noto Sans KR because the connected Figma environment cannot load Pretendard Variable. The website retains its self-hosted Pretendard. Figma mobile reference frames use the capture browser's actual 504px content width; browser implementation was separately tested down to 320px. Map references show the first eight restaurant rows to keep capture size bounded. These differences are intentional and documented, not a change to production data or responsive breakpoints.

Routes did not change, so the sitemap route inventory remains applicable. `tools/figma-capture-preview.cjs` is a local-only capture helper and is excluded from the static production build.
