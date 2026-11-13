# District perimeter regression — 2026-11-13

Cause: each SVG district painted its fill and stroke in source order. Later adjacent fills covered part of an earlier district's highlighted stroke. This made Sasang appear complete while Buk and Geumjeong had partially obscured borders.

Fix: all 16 highlight paths are painted in a dedicated pointer-transparent layer after every region fill and before labels. Each uses the exact complete district path, no fill, a 2.5px non-scaling coral stroke and rounded joins. Normal district strokes are consistently 1.5px. Shape hover, label hover, keyboard focus and persistent selection all activate the same overlay. The region caption moves up 8px on desktop and 6px on mobile by reducing its preceding paragraph margin.

`tools/audit-map-outlines.cjs` checks 16 districts × 4 states × 2 viewport widths (390/1440), **128 passing cases**. It checks visibility, width, pointer transparency, exact path equality and drawing order above every district fill. Selected-state screenshots for all 16 at both sizes are included; the 16-up desktop image was visually reviewed, with Buk/Geumjeong/Sasang also inspected at full size. Browser errors: 0.

Reproduce against `tools/preview-chatbot-fixture.cjs` on port 8783. Set `PLAYWRIGHT_MODULE` if Playwright is installed outside the normal module path. `UI_AUDIT_URL` can point to the public app for the same read-only tests. Map-related regression checks and static deployment build pass. No route or geographic boundary data changed.

Figma's two map screens reflect the thicker borders and raised caption, with three additional perimeter examples (Buk, Geumjeong, Sasang). This supersedes the map styling in the earlier spacing-audit screenshots.
