# Compact home and complete chatbot locale audit — 2026-11-13

- Home: introduction removed; one full-width slide; labels under eight icons; eight columns at desktop, four columns on mobile; secondary sidebar search removed.
- Home measured in KO/EN/JA/ZH at 320×568, 390×844, 768×1024, 960×768, 1280×720, 1440×900, 1920×1080: 28 cases. Category grid visible above bottom navigation/viewport; no horizontal overflow. Tiny-screen chatbot launcher moved away from category labels.
- Community: top primary Write link replaces Refresh; redundant floating Write removed. Editor uses separate submit/header columns and wrapping, individually bordered category controls; outer form box removed.
- Writing/community: 24 cases (four languages × three widths × two routes), synthetic signed-in user, no production writes.
- Chatbot: EN/JA/ZH × all 44 scenarios and 11 reached conversation stages; 43 food records per language, descriptions/ingredients/safety/spice/prices; visible help/scenarios/preferences/catalog and all 129 food dialogs. Fixed standalone help sentence and photo reuse/license notes.
- Original Korean menu names, restaurant-facing Korean order cards and source author names deliberately remain original. Source-author spans carry lang=ko; license descriptions are translated without changing their meaning.
- Headless Chrome used for rendered validation. Fixture catalog is synthetic and some fixture home images intentionally use the existing placeholder. Public deployment is verified separately.
- Figma: existing editable desktop/mobile home and community updated; editable writing frame 56:969 added in file 2jTLllte3E3vg4fjrbvwj2. Existing map border fixes retained.
- Latest request referred to second/fourth images but supplied none; review covered actual rendered forms and duplicate search/nested cards, not an unseen image.

Reproduce with PLAYWRIGHT_MODULE pointing to the installed Playwright package:

    node tools/audit-home-layout.cjs
    node tools/audit-writing-layout.cjs
    node tools/audit-chatbot-language.cjs
    node tools/audit-chatbot-content.cjs

Home/chatbot scripts accept UI_AUDIT_URL for read-only production verification. Tests reject unmet assertions.
