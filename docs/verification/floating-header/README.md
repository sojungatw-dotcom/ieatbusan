# Floating header — 2026-11-17

Removed the common app-header white wrapper/shadow. The fixed opaque page-background guard stays in place so scrolled content cannot show through. Individual search, language, login, mobile search and signed-in notification controls use white surfaces with ink text/icons and a coral login label; hover and focus use existing coral tokens.

Desktop header now shares the main content gutter: 32px or the centered 1256px content limit. Search flexes across all available space with 12px before actions. Mobile keeps the existing compact logo/actions arrangement with individual white controls. Page-specific back/title headers are unchanged.

Validation: 40 combinations (guest/member × KO/EN/JA/ZH × 320/390/960/1440/1920), no horizontal overflow, transparent outer header, white visible controls, desktop search/title exact left alignment and 12px action gap. Member state uses a synthetic read-only bootstrap response; no real member data changed. Build, deployment and public-entry tests pass.

Figma reauthenticated and updated: shared desktop/mobile app-header components 40:324, 40:743, 45:1134, 45:1499. Wrapper fills/shadows removed, desktop search expanded, controls white, login text coral. Existing native components/instances retained; screenshot visually checked.

Integrated origin/main f84b11e before deployment, preserving the newer mobile intro, language picker, chatbot and restaurant interactions.
