# Game education section research + copy plan (2026-08-20)

## User request
1. Header note shrinks to headline ONLY (remove long paragraph from the header box).
2. Add a professional "About this game + how to purchase" education section BELOW the checkout on EVERY game page:
   what the game is, what its currency does/uses, how items work, how to find your ID,
   step-by-step purchase guide, honest region rules.

## Implementation plan
- lib/games.ts Game type: keep `deliveryCoverage: { mode, headline, note }` (short headline used in header).
  Add NEW optional field `education: { about: string; currency: string[]; findId: string; howToTopUp: string[]; regionNote?: string }`.
- New component: components/game-education-section.tsx (used by 3 page templates:
  app/games/[gameSlug]/page.tsx, app/games/mobile-legends/page.tsx, app/games/mobile-legends/[market]/page.tsx).
  Renders below the checkout shell: "About {title}" intro paragraph + 3-4 column grid
  (What is {currency}, How to find your ID, How to purchase in 4 steps) + region warning strip.
  Fable 5 tokens: rounded-lg border border-white/[0.08] bg-[#0d0f16], 12px labels text-white/50, headings text-white.
- Header change: keep the {deliveryCoverage && ...} block but REMOVE the Learn more span
  and the note span — only shield icon + headline (one line, truncate on mobile OK).

## Research facts (with sources)
### MLBB (mobile-legends.fandom.com Weekly_Diamond_Pass; redxgame id-checker)
- MLBB = 5v5 MOBA by Moonton (100+M players); Diamonds buy heroes, skins, emotes;
  Weekly Pass = 7-day sub: 80 diamonds instantly + 20/day + choice box = ~220 diamonds + 70 worth of boxes;
  can stack max 10 passes; Twilight Pass = Miya skin+rewards monthly pass.
- ID: tap avatar top-left; User ID under name + Zone (Server) ID in brackets, e.g. 12345678 (1234).
  Both together uniquely identify the account; top-ups instant + non-refundable, wrong ID = diamonds to stranger.
- Accounts tied to regional server; diamonds for one region cannot move to another.

### Genshin Impact (genshin-impact.fandom.com Welkin_Moon)
- Action RPG by HoYoverse set in Teyvat; Genesis Crystals are premium currency,
  converted 1:1 to Primogems which fund Wishes (character/weapon banner gacha).
- Welkin Moon: 300 Genesis Crystals instantly + 90 Primogems/day x30 days = 3000 primogems total (~19 wishes);
  best value item; extendable to 180 days max.
- UID server-scoped: Asia 8xxxxxxx, America 7xxxxxxx, Europe 9xxxxxxx, TW/HK/MO 6xxxxxxx.
  Find UID on screen top-right in-game or profile page.

### Free Fire (redxgame/refillarena guides)
- Garena 50-player battle royale (max 100); Diamonds buy skins, characters, weapons, Elite Pass.
- Player ID: tap avatar top-left, ID under name. Verify before buying; top-up is instant to that ID.
- Regional catalogues (ID/PH/MY-SG/BD) — only matching region credits.

### PUBG Mobile (midasbuy/lootbar/carry1st)
- Battle royale by Tencent/Level Infinite; UC (Unknown Cash) buys Royale Pass, skins, crates.
- UC is region-bound and delivered via region-specific vouchers; buy only the market matching your server.
- UID: in-game profile/settings Basic tab; 8-10 digit number. Midasbuy is official recharge partner.

### Valorant
- Riot tactical 5v5 FPS; VALORANT Points buy skins, battle passes, agents;
  VP is strictly REGIONAL (cannot spend VP of region A in region B);
  Riot ID = username#tagline; ID found in client top-right.

### CODM
- Free-to-play FPS by Activision/TiMi; CP (COD Points) buy Battle Pass, weapon skins, lucky draws;
  delivered to Activision account — global.

### Fortnite
- Epic Games battle royale/building hybrid; V-Bucks buy Battle Pass, skins, emotes;
  one Epic account globally; V-Bucks tied to the platform purchased on for some uses.

## Steps copy template (for all games, adapted)
1. Pick the pack you want and add it to cart.
2. Enter your game ID — our checker shows your username before you pay.
3. Complete payment (UPI, card, wallets via Razorpay).
4. Diamonds are delivered directly to your in-game account — track the order anytime.

## Sources
- https://mobile-legends.fandom.com/wiki/Weekly_Diamond_Pass
- https://genshin-impact.fandom.com/wiki/Blessing_of_the_Welkin_Moon
- https://redxgame.com/tools/mobile-legends-id-checker
- https://refillarena.com/en/know/how-to-guides/how-to-recharge-garena-free-fire-diamonds
- https://www.midasbuy.com/midasbuy/us/buy/pubgm

## IMPLEMENTATION STATE (2026-08-20, session verify3)
DONE:
- lib/games.ts: Game type now has optional `education?: { about, currencyUses, findId, steps, regionNote? }`.
  ALL 8 game entries have education copy filled (mobileLegendsBase incl. MLBB region spreads,
  free-fire, pubg-mobile, bgmi, call-of-duty-mobile, valorant, genshin-impact, fortnite).
- components/game-education-section.tsx: new Fable 5 section component (About + 3-col grid
  currencyUses/findId/steps + regionNote strip). Mounted in 3 pages:
  - app/games/[gameSlug]/page.tsx: after SupplierGameCheckoutShell, inside <section max-w-1240>
  - app/games/mobile-legends/page.tsx: after the market choice disclaimer
  - app/games/mobile-legends/[market]/page.tsx: after MobileLegendsCheckoutShell
- Header pill shrunk to headline-only (inline-flex, truncate) on all 3 pages; Learn more + mobile note removed.

REMAINING:
1. `npm run typecheck && npm run lint && VERCEL=1 npm run build` (session: deploy)
2. git add -A && commit -m "feat: per-game education sections and compact delivery headlines" && push
3. source /home/ubuntu/.vercel_api.sh && python3 /home/ubuntu/scripts/monitor_deploy.py
4. Verify live: curl MLBB landing page for "What the currency is used for" and headline-only pill;
   visual check in browser; report.
Deployment monitor prints DEPLOY_READY:<url> when done.

## LIVE VERIFICATION (2026-08-20)
Deployment recharza-platform-igi0vm7je-stand-still.vercel.app (commit 1383389):
- MLBB landing page curl: "What the currency is used for" x2, "How to find your ID" x2,
  "How to purchase" x2, headline present, "Learn more" = 0 occurrences (headline-only pill confirmed).
- Browser screenshot: header pill is compact single line; "About Mobile Legends" section
  renders below the market grid with 3-column grid (currency/findId/steps) and region note strip.
- E2E suite: 45/45 passed on new deployment.
- Market pages (india, ff, etc.) remain auth-gated (307 -> /account) — PRE-EXISTING design
  (identical on prior deployments per scripts/e2e-suite.py comments), not introduced by this change.
