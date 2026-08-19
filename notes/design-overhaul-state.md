# Design Overhaul 2026 — Implementation State

## User brief saved at notes/design-overhaul-brief.md (full requirements there).

## DONE (foundation phase 2)
1. public/assets/design/grain.svg — hand-crafted grain texture (400 dots, seed 7).
2. app/storefront-redesign.css — appended overhaul layer (after line 555):
   - .recharza-atmosphere (+ ::before grain, ::after breath) — home page bg
   - .recharza-atmosphere-game — game pages bg
   - Type ramp: .recharza-display / .recharza-section-head / .recharza-card-title / .recharza-body / .recharza-body-muted
   - .recharza-eyebrow (small caps, purple-cyan gradient tick) / .recharza-breadcrumb
   - StatusBadge pill: .recharza-badge + -pending/-success/-error/-info/-neutral
   - .recharza-btn + -primary/-secondary/-tertiary (press :active state)
   - Surfaces: .recharza-surface-flat / -raised / -floating (blur, shadows)
   - .recharza-shimmer skeleton + keyframe
   - CheckoutProgressRail: .recharza-progress-rail/--rcz-steps/--rcz-fill, nodes done/active, labels
   - .recharza-trust-note (inline integrated note)
   - .recharza-scrim (modal backdrop blur)
   - All respect prefers-reduced-motion
3. components/shimmer.tsx — reusable <Shimmer className> component.
4. components/checkout-progress-rail.tsx — <CheckoutProgressRail current> (1-based, labels Package/Player/Billing/Review/Payment).
5. components/status-badge.tsx — <StatusBadge state label>.

## DONE in phase 3 so far
- app/page.tsx fully reworked: .recharza-atmosphere on hero + how-it-works; .recharza-eyebrow on hero/kicker + catalogue + how-it-works + trust (h2 -> .recharza-section-head, h1 -> .recharza-display); CTAs -> .recharza-btn-primary/secondary; trust cells -> .recharza-surface-flat cards; electric divider before full catalogue; Suspense fallback -> <Shimmer className="h-40 rounded-xl" /> x5; how-it-works cards -> .recharza-surface-raised + hover translate-y; trust note paragraph added at end of how-it-works section (recharza-trust-note).
- components/supplier-game-checkout-shell.tsx: imported CheckoutProgressRail/Shimmer/StatusBadge; step circle nodes now get done(violet? no—active violet glow; complete green glow; neutral bg-white/[0.06] border-white/15) classes; added <CheckoutProgressRail current={step}> inside CheckoutProgress nav (rendered below ol); StepActions Back/Next -> recharza-btn-secondary/primary.
- NOTE: Shimmer/StatusBadge imports added to checkout shell but not yet used there (fine, may use later or remove before commit).

## PROGRESS UPDATE (customer-dashboard)
- statusClassName -> statusStateFor + <StatusBadge> on order rows (imported). Active-orders pill also StatusBadge.
- Order history heading -> recharza-eyebrow + recharza-section-head + recharza-body. Account overview same. Sign out -> recharza-btn-secondary. Refresh -> recharza-btn-tertiary. Open tracking -> recharza-btn-tertiary.
- Loading skeletons still animate-pulse divs (acceptable); could add Shimmer later.

## TODO (phase 3 — remaining)
### A. app/page.tsx (home)
- Wrap <main> content in .recharza-atmosphere (or add class to main) — hero already has its own art; keep hero but upgrade: use .recharza-display for h1 (line 80), .recharza-eyebrow replace kicker (line 79), .recharza-btn-primary/secondary for CTAs (lines 83-84), .recharza-body for p (line 81).
- Trust section (line 105): use .recharza-surface-raised strip instead of gap-px grid.
- Catalogue section (line 113): replace storefront-section-label with .recharza-eyebrow + .recharza-section-head h2.
- How-it-works (line 124): bg-[#090b12] -> section with subtle gradient; cards already decent, replace with .recharza-surface-raised + .recharza-card-title; section label -> eyebrow + .recharza-section-head.
- Popular rail fallback: use Shimmer divs (line 121).
### B. components/game-card.tsx — image-forward card: keep as is (already distinct) but ensure hover lift + price row separation; add aspect-ratio consistency.
### C. Checkout flow — supplier-game-checkout-shell.tsx:
   - Mount <CheckoutProgressRail current={stepIndex}> replacing numbered circles nav.
   - Replace boxed warnings with .recharza-trust-note.
   - Buttons: primary/secondary/tertiary classes where applicable.
   - Skeleton loading -> Shimmer.
### D. Account/Orders — components/customer-dashboard.tsx: [MOSTLY DONE]
   - Status pills -> <StatusBadge> DONE. Eyebrow/section-head DONE. Buttons DONE.
   - REMAINING: (1) unused Shimmer/StatusBadge imports in supplier-game-checkout-shell.tsx — either use them or remove imports before commit; (2) mobile-nav-menu.tsx -> .recharza-surface-floating sheet + .recharza-scrim backdrop [NOT DONE]; (3) game pages headers (app/games/[gameSlug]/page.tsx + mobile-legends pages) -> .recharza-breadcrumb, .recharza-eyebrow [NOT DONE]; (4) optional: game-card.tsx check aspect-ratio consistency [OPTIONAL]
### E. Nav drawer — DONE: recharza-scrim + recharza-surface-floating applied.
### F. Game page headers — app/games/[gameSlug]/page.tsx DONE (atmosphere-game + recharza-breadcrumb nav + eyebrow + section-head) and app/games/mobile-legends/page.tsx DONE (same; also 'Choose your account market' -> eyebrow Step 1 + section-head + recharza-body).
### REMAINING: app/games/mobile-legends/[market]/page.tsx header (breadcrumb/eyebrow/section-head NOT done yet) + GameEducationSection headings (check if needed, skip optional) + game-card.tsx optional. Then typecheck/lint/build.
### G. Site modal/sheets: done where used (nav drawer).

## Current page.tsx structure (key lines)
- 58-147 main render; hero section 73-103 (kicker line 79, h1 80, p 81, CTAs 82-85, console 93-101)
- trust section 105-111; catalogue 113-122; how-it-works 124-140; processItems 18-22 (step/icon/title/accent/text).

## Verify & deploy (phase 4-5)
- npm run typecheck && npm run lint && VERCEL=1 npm run build
- Pre-deploy: npm audit; secret scan of git-tracked files -> report to user first (policy: report findings, don't auto commit fixes).
- git add -A && commit (feat: full visual & UX overhaul — atmosphere, type ramp, badge system, button hierarchy, progress rail, distinct section languages) && push origin main
- source /home/ubuntu/.vercel_api.sh && python3 /home/ubuntu/scripts/monitor_deploy.py
- python3 /home/ubuntu/scripts/e2e-suite.py <new-url> ; mail-health probe Bearer rcz-probe-7k3m9q2x /api/internal/mail-health
- Screenshots of home + game page; message user.

## Icons
- storefront-icon.tsx is already one line-style set: fill none, stroke 1.8, round caps/joins, 24 grid. NO CHANGES NEEDED — already unified (verify usage consistency only: no imported external icon libs like lucide/heroicons in storefront surfaces; check site-header/mobile-bottom-nav for lucide).

## Existing deployment state
- Latest committed: 2a1c207 (quiet living design), deployed recharza-platform-muohw4wt9-stand-still.vercel.app
- E2E harness: python3 /home/ubuntu/recharza-platform/scripts/e2e-suite.py <base-url>
