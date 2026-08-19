# Cross-region verification + delivery headlines task state (2026-08-20)

## DONE (provider backend, typecheck+lint clean)
- lib/player-identity-provider.ts: PlayerIdentityResult now has `region: string | null`; all branches set it (region lookup error branch, internal, rapidapi, volsever fallback result).
- lib/volsever.ts: VOLSEVER_ENDPOINT_REGION_LABELS map (mlbb=Global, ff-asia=Asia, ff-india=India, ff-indonesia=Indonesia, pubg=Global, valorant=Indonesia, genshin=Global); lookup result reports region of the matching endpoint slug.
- lib/suppliers/shop2topup.ts: config now `validateSubCategoryIds: number[]` + regionLabels. mlbb=[28] Global; ff=[28,33] MENA "Middle East & Africa"/CIS. Loop tries all packs; REGION_MISMATCH → continue next pack; validation-not-configured → continue. region = result.player.region || label.
- app/api/games/mobile-legends/verify/route.ts + app/api/games/[gameSlug]/verify/route.ts: JSON responses include `region`.
- components/supplier-game-checkout-shell.tsx: IdentityVerification type has region; verification message shows "(Region account)"; status line shows "— Region account"; order review shows cyan pill badge for region.

## REMAINING
1. lib/games.ts deliveryCoverage: added to mobileLegendsBase (done, lines ~92-96). STILL NEED: add deliveryCoverage to each other game entry (free-fire, pubg-mobile, battlegrounds-mobile-india, call-of-duty-mobile, valorant, genshin-impact, fortnite). Entries found by grep for `packages:` lines: free-fire, pubg-mobile (cat 2), genshin (cat 6), valorant, codm, fortnite. Headline copy per research:
   - Free Fire: global accounts (Garena ID), delivery follows supplier regional packs — mode "global-id", headline "Global Garena account — worldwide delivery", note about regional supplier packs both MENA/CIS validating.
   - PUBG Mobile UC: accounts region-bound (UC items are voucher-redeem); headline "Region-locked — match your account region".
   - BGMI: India-exclusive server; headline "India-only server".
   - CODM: mostly global CP packs; use "global" safe note "CP top-ups deliver to accounts worldwide via global packs".
   - Valorant: Riot ID unique, regions via Volsever Indonesia endpoint; use "global-id".
   - Genshin Impact: UID server-scoped (America/Europe/Asia/TW); headline "Server-scoped UID — pick the right server"; note that UID starts 800000001 = Asia, 700 = America, 900 = Europe, 600 = TW/HK/MO (approx).
   - Fortnite: global Epic account; headline "Global Epic account".
2. Render headline: 3 pages — app/games/[gameSlug]/page.tsx (header ~line 112 h1 "Top Up", pills lines 114-118, subtitle area), app/games/mobile-legends/page.tsx (header ~56), app/games/mobile-legends/[market]/page.tsx (header ~92-148). Plan: after the title h1 (or under pills), render a deliveryCoverage pill row: a small cyan-emerald note block (Fable 5 tokens: rounded-md border border-white/10 bg-white/[0.04], 11-12px text-white/70). Also update the "market" pill text to mention cross-region? Keep minimal.
3. Typecheck+lint+build (VERCEL=1), commit, push, deploy monitor (python3 /home/ubuntu/scripts/monitor_deploy.py after sourcing /home/ubuntu/.vercel_api.sh), live verify.

## Research facts for headlines (from search)
- MLBB: one global Moonton server; matchmaking "regions" (Asia/EU/NA/Brazil) are cosmetic; ID globally unique.
- FF: Garena account global; suppliers deliver regional packs.
- PUBG: region-bound skins/UC per region; voucher redeem.
- Genshin: UID prefix = server region (Asia 8, America 7, Europe 9, TW 6).
- Fortnite: Epic account global, V-Bucks regional to store locale.
- CODM: CP packs mostly global via direct topup.

## Deployment target
- Production deployment to watch: recharza-platform-7cru6uy53-stand-still.vercel.app
- Mail health probe bearer: rcz-probe-7k3m9q2x
