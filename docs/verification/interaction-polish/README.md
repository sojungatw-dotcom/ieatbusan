# Restaurant highlight and compact chatbot toolbar

2026-11-13: Overview restaurant rows had zero horizontal padding, leaving the thumbnail flush against the highlight edge. All 158 rows now share 12px horizontal insets and a 16px highlight radius. Hover, pressed and keyboard focus use the whole row background. Separators are independent straight rules between rows, hidden next to an emphasized row; the last item has no bottom rule. Nearby image-list rules were checked: ordinary list items and map detail sheet already use 12px insets.

Chatbot title and desktop four controls now share a 64px header. Controls are 32px with 20px artwork and 4px gaps. Narrow headers omit the duplicate logo to preserve the full translated title; mobile retains the existing three controls (expand has no meaning in the full-screen phone view). Dialog and composer controls are unchanged. Help and close interactions are tested.

Local headless Chrome: 4 languages × 4 widths (320,390,960,1440), all 158 rows = 2528 row bounds checks; title clipping and toolbar center alignment; hover and keyboard focus; help opening/closing and host close. tools/audit-interaction-polish.cjs reproduces and accepts UI_AUDIT_URL for production. Related chatbot/map regression tests and deployment build pass. Screenshots included.

Figma: restaurant rows in existing map frames updated; four existing chatbot headers reduced; editable desktop toolbar 62:969 created in existing final UI page.
