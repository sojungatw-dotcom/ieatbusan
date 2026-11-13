# Open map layout — 2026-11-13

Removed the overview map's enclosing card and individual restaurant card shadows/backgrounds. Restaurant entries now form a continuous list, with separators only between entries. Desktop columns share one quiet divider; mobile keeps a single vertical flow. Existing coral controls, rounded photos, typography tokens and fixed navigation remain.

The stage is explicitly constrained to its container width; small Japanese headings flex without pushing the reset control outside the viewport. No district geometry, selection logic, restaurant routes or provider behavior changed.

Validation: tools/audit-open-map.cjs checks KO/EN/JA/ZH × 320/390/768/960/1440px (20 layouts), horizontal overflow, heading/reset separation, transparent canvas, no card shadows or final bottom border, desktop independent list scroll, district selection/reset. tools/audit-map-outlines.cjs checks 16 districts × 4 highlight states × 2 widths (128 cases). Map district/restaurant-overview/contracts/lifecycle tests and production build/deployment checks pass.

Figma existing editable frames: desktop 45:868, mobile 45:1256 in 2jTLllte3E3vg4fjrbvwj2. Mobile viewport clips below-fold content while retaining editable layers. Shared navigation, district paths, text and image assets preserved; redundant sidebar search hidden.

Local screenshots and reports are included. Public verification follows deployment, using UI_AUDIT_URL=https://ieatbusan-eight.vercel.app with the same audit.
