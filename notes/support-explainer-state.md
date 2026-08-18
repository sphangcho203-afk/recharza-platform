# Support Explainer Feature State (Aug 18, 2026)

## Task
Add a customer-friendly "How support works" explainer to /support page, matching premium storefront design, then commit, push, deploy, verify live.

## Key facts gathered
- /support page: app/support/page.tsx; sections: header, live-chat (LiveSupportChat embedded + TelegramGroupLauncher + t.me/supprtrz web link), SupportCenter (ticket form), amber safety banner, SiteFooter.
- Channels configured via lib/support-config.ts: telegram bot (@recherzaSupportbot), whatsapp (env NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER - currently EMPTY), instagram (NEXT_PUBLIC_INSTAGRAM_USERNAME - EMPTY), email (NEXT_PUBLIC_SUPPORT_EMAIL=recherzatopup@gmail.com).
- WhatsApp/Instagram buttons render as "Currently unavailable" when env empty.
- StorefrontIcon valid names: account, arrow, cart, games, globe, menu, receipt, search, shield, support, track.
- Website chat = LiveSupportChat component (AI assistant on this page).
- Ticket flow: 4 steps (issue → title/order/description → review card → team answers privately; /status for ticket check).

## Files
- Created: components/support-explainer.tsx (SupportExplainer component; 6 channel cards + 4-step ticket flow + tracking explanation). Icons fixed to valid names.
- Next: import SupportExplainer in app/support/page.tsx as a new section between live-chat section and SupportCenter.

## Deploy info
- Production URL: https://recharza-platform-fuvjqou63-stand-still.vercel.app
- Vercel project: stand-still/recharza-platform
- Latest live commit: 17b2c3b (Ready). Local commits before that: 02a4a23.
- Neon production project id: solitary-lake-08821205 (migration 20260818100000_staff_telegram_quick_reply applied).

## Steps remaining
1. Wire SupportExplainer into app/support/page.tsx.
2. typecheck + lint + build (SKIP_DB_MIGRATIONS=1).
3. git add components/support-explainer.tsx app/support/page.tsx, commit (feat: add support explainer), push, watch Vercel, verify /support live.
