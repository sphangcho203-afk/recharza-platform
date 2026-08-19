# Living-Design UI Upgrade (2026-08-20)

## User request (from 9 screenshots)
"Interfaces made of bricks" — flat, dry, classic cards. Wants:
- living animated particles/gradients (different per section), electric glow brand energy
- richer/deeper copy in explanations
- varied treatments per section (no same design repeated)
- game interfaces not cheap
- Surfaces flagged by user:
  1. How-It-Works steps (home page, 01/02/03 cards: "Pick the right market", "Verify before payment", "Pay, then track")
  2. Game education section ("About MLBB" etc. — currently flat dark panel, stacked on mobile)
  3. MLBB market page header/panels + package picker
  4. Homepage game cards ("Popular right now" — flat cards with Top up buttons)
  5. Order history cards (RZ- refs, status chips, Open tracking button)
  6. Account dashboard (Cart/Orders tiles, admin workspace buttons)
  7. Store navigation menu drawer (list of pill rows)

## Inventory (files to touch)
- app/page.tsx — home: How It Works steps, Popular right now game cards (find components)
- components/game-education-section.tsx — NEW (this session), about/currency/findId/steps
- app/games/[gameSlug]/page.tsx, app/games/mobile-legends/page.tsx, app/games/mobile-legends/[market]/page.tsx — mount
- components/ (find game-card, order-history, account tiles, nav drawer components):
  - candidate: components/storefront-game-grid.tsx or similar for game cards
  - components/customer-account-shell.tsx for account + order history (151/245/304 sign-in lines)
  - components/site-header.tsx or store-nav for the drawer
- NOTE: existing design uses Fable 5 tokens (no rounded-3xl, no font-black). Keep premium rules:
  avoid cartoonish, but NOW ALLOW animated backgrounds (user explicitly asked "add animations... must be live... background animation" earlier).
  Use framer-motion is already installed.

## Upgrade spec per surface
1. **Animated primitives** (components/living-backdrop.tsx):
   - AuroraGradient: 3 slow-moving blurred orbs (game.accent colors) via CSS keyframes, mix-blend screen
   - ParticleField: canvas or div particles with float/parallax, subtle, seeded per section (avoid heavy canvas; use ~12 divs w/ CSS animations + random delays)
   - ElectricLine: thin animated gradient line sweep (electric R brand motif)
   - GlassCard: base glass layer with border gradient + inner glow on hover
   All CSS-driven (performance on mobile), framer-motion for entrance.
2. **Home How-It-Works**: each step card gets distinct treatment — step01 aurora-blue orbs + numbered glow badge, step02 green + particle drift, step03 violet + electric line sweep; connecting dashed electric line between steps on desktop; richer 2-3 line descriptions.
3. **Education section**: split into 3 glass tiles with per-tile accent tints, icon medallions with animated ring, steps as timeline with pulse dots; region note as amber glow alert.
4. **Game cards**: hover lift + accent glow aura behind card image, animated accent shimmer sweep across image, price with subtle pulse on bonus; "Top up" button gets electric sheen.
5. **Order history**: status chip w/ animated ring (awaiting payment = amber pulse), card border top accent gradient, ref number with mono glow.
6. **Account dashboard**: tiles become icon medallion + living gradient corner; admin workspace button electric.
7. **Nav drawer**: add aurora wash behind list, hover rows get accent glow + arrow slide.

## Workflow
- Read components first (grep for card styles) before editing.
- After each batch: npm run typecheck && npm run lint && VERCEL=1 npm run build (exit 0 required).
- Commit, push, monitor_deploy.py, then curl + browser verify.
- Latest deployment: recharza-platform-igi0vm7je-stand-still.vercel.app (commit 1383389).

## PROGRESS (2026-08-20)
DONE:
- Created components/living-backdrop.tsx (AuroraGradient, ParticleField, ElectricSweep, LiveGlowCard).
- Appended keyframes to app/storefront-redesign.css (recharza-aurora-drift-a/b/c, recharza-particle-float, recharza-line-sweep, recharza-sheen, recharza-chip-live, recharza-status-ring, recharza-status-pulse, recharza-electric-btn, recharza-nav-row/.recharza-nav-arrow, recharza-divider-electric, recharza-stat-tile, recharza-stat-value) + reduced-motion block.
- app/page.tsx How-It-Works DONE: richer copy w/ region honesty, per-step accent aurora + particles + electric line sweep, glowing icon medallion, animated step number.
- game.accent values: mlbb #5b7cff, free-fire #f5b72b, pubg #f3b81b, bgmi #ff8a2b (not used in game cards?), codm #f4c430, valorant #ff4655, genshin #7ec8ff, fortnite #8d5cff.

REMAINING:
1. game-card.tsx: add game.accent aura + sheen + electric Top-up button (LiveGlowCard usage) — article element is the card; make wrapper span `group`.
2. game-education-section.tsx: rebuild as 3 living tiles (AuroraGradient per tile w/ game.accent), findId medallion, steps timeline w/ pulse dots, regionNote amber glow alert.
3. customer-dashboard.tsx: account header living bg, nav tiles living glow, stat tiles recharza-stat-tile, order cards: top accent line (game accent), status ring (awaiting_payment amber pulse), Open tracking electric button, ref mono glow; saved players tiles.
4. mobile-nav-menu.tsx: aurora wash background in drawer, recharza-nav-row class on links/buttons, arrow recharza-nav-arrow, live dot on logo header.
5. Typecheck+lint+build VERCEL=1, commit, push, monitor_deploy.py, verify via curl + browser (mail health + e2e 45/45).
6. Latest deployment before this: recharza-platform-igi0vm7je-stand-still.vercel.app (commit 1383389).
Workflow refs: source /home/ubuntu/.vercel_api.sh && python3 /home/ubuntu/scripts/monitor_deploy.py; python3 scripts/e2e-suite.py URL.

## PROGRESS UPDATE 2
DONE so far:
- home How-It-Works living cards (aurora per accent, particles, sweep, glowing icons, richer copy) ✓
- game-card.tsx living aura + sweep on hover + electric button ✓
- game-education-section.tsx fully rebuilt living (section aurora, 3 Tile components, animated timeline, amber glow regionNote) ✓
- storefront-icon.tsx: added coin, id, info icons ✓
- customer-dashboard.tsx: nav tiles living (4 accents), stat tiles recharza-stat-tile, order cards accent top-line + status ring + electric Open tracking, saved players accent line ✓

REMAINING:
1. mobile-nav-menu.tsx: nav drawer aurora wash + recharza-nav-row on link buttons + arrow recharza-nav-arrow; also the "close X" top bar.
2. Then: npm run typecheck && npm run lint && VERCEL=1 npm run build (watch exit code).
3. git add -A; git commit -m "feat: living design — aurora surfaces, particle energy, electric sweeps across store, education and account"; git push origin main.
4. source /home/ubuntu/.vercel_api.sh && python3 /home/ubuntu/scripts/monitor_deploy.py
5. Verify: curl mail-health + e2e suite: python3 scripts/e2e-suite.py {new deployment URL}. Also browser-view homepage + game page + account page on new deployment.
6. Report to user.
