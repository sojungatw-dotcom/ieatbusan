# Floating header — 2026-11-17

Removed the common app-header white wrapper/shadow. The fixed opaque page-background guard stays in place so scrolled content cannot show through. Individual search, language, login, mobile search and signed-in notification controls use white surfaces with ink text/icons; hover and focus use existing coral tokens.

Desktop header now shares the main content gutter: 32px or the centered 1256px content limit. Search flexes across all available space with 12px before actions. Mobile keeps the existing compact logo/actions arrangement with individual white controls. Page-specific back/title headers are unchanged.

Validation: 40 combinations (guest/member × KO/EN/JA/ZH × 320/390/960/1440/1920), no horizontal overflow, transparent outer header, white visible controls, desktop search/title exact left alignment and 12px action gap. Member state uses a synthetic read-only bootstrap response; no real member data changed. Build, deployment and public-entry tests pass.

Figma sync pending: create_session returned UNAUTHORIZED / oauth_token_invalid_grant. Reauthentication requested in chat. Prepared script figma-header-sync.js updates existing reusable header components after authentication. This is not a claim that the Figma file has been updated.
