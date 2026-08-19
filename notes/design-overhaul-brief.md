# Recharza Full Visual & UX Overhaul (from user attachment /home/ubuntu/upload/recharza-design-overhaul-prompt.md)

## User's 6 problems to fix
1. Background = "stacked bricks": flat dark rectangles, hard edges, no depth/gradient/texture/lighting.
2. Icons inconsistent/low-quality: mixed weights/corners, outline vs filled, nav icons look like icon-pack leftovers.
3. Hierarchy flat: headings/body/labels/buttons similar weight; eye has no landing.
4. Cards/modals boxy & undifferentiated: same rounded-rect-on-dark for game cards, steps, account panel, order history.
5. Labeling/structure inconsistent: breadcrumbs, step indicators, status badges all different treatments.
6. Empty/transitional states (loading, awaiting payment, step transitions) look like default states.

## What they want
1. **Atmosphere background**: soft radial/directional gradients, subtle noise/grain texture, layered depth (glow bg, mid layer, foreground), faint restrained particle/light-trail motif; different pages can use different gradient moods under same palette logic.
2. **One custom icon set**: single stroke weight, single corner radius, single grid; ONE style (all line or all filled/duotone), everywhere, no exceptions.
3. **Real type scale**: hero/display, section headers, card titles, body, micro-labels/badges; distinct weight/size/tracking; status badges = consistent pill component color-coded (pending=amber, success=green, error=red).
4. **Vary language per section** (CRITICAL — user emphasized):
   - Home/hero: bold editorial, big type, dynamic gradient bg, one standout CTA.
   - Game/product grid: image-forward cards, strong hover/press, consistent aspect ratio, price/CTA separated from metadata.
   - Checkout flow (Package→Player→Billing→Review→Payment): form-like reassuring UI; proper progress component (not numbered circles), generous spacing, trust signals as integrated inline notes.
   - Account/Orders: data-dense utilitarian table/list clarity, scannable, not decorative.
   - Modals/sheets (sign-in, nav drawer): distinct elevated layer with real shadow/blur backdrop.
5. **Depth/motion/polish**: real elevation (shadows, blur/backdrop-filter), restrained micro-interactions (press states, hover lift, smooth step transitions), skeleton/shimmer loading, button hierarchy primary/secondary/tertiary (currently everything same purple pill).
6. **Structure/labeling consistency**: spacing scale 4/8/12/16/24/32/48 uniform; eyebrow/label small-caps treatment shared for breadcrumbs, steps, section eyebrows.

## Constraints
- Keep purple/blue brand accent; dark-mode-first but rich layered dark; responsive + accessible; NO copy-paste of one reskinned component everywhere.

## Fable 5 skill rules to obey (from /home/ubuntu/skills/fable-5-design-engine/SKILL.md)
- Spacing on 4px scale (4/8/12/16/24/32/48/64/96); section rhythm min py-16 desktop/py-8 mobile; card internal padding min p-6 (p-4 data-dense).
- Elevation tiers: 0 Flat (border only, list rows), 1 Raised (cards), 2 Floating (modals with scrim).
- Layout: CSS grid default; max-w-3xl prose / max-w-7xl app.
- One corner-radius token peer-level (rounded-lg default); all interactive elements need hover/focus-visible/disabled.
- Type: Cal Sans headings (fallback font-semibold Inter), Inter body, JetBrains Mono mono; fixed ramp; body floor 14px.
- Semantic color tokens via CSS vars (--color-primary etc.); single gray ramp.

## Current state (before overhaul)
- Deployment: recharza-platform-muohw4wt9-stand-still.vercel.app (commit 2a1c207, "quiet living design").
- E2E: scripts/e2e-suite.py 45/45; mail-health probe Bearer rcz-probe-7k3m9q2x.
- Key surfaces: app/page.tsx (hero/how-it-works/catalogue), components/game-card.tsx, game-education-section.tsx, customer-dashboard.tsx (account/orders), mobile-nav-menu.tsx, checkout flow = components/supplier-game-checkout-shell.tsx + supplier-game-checkout-step* / storefront checkout; storefront-redesign.css holds custom classes.
- Icon set: components/storefront-icon.tsx (line icons, single set) — check weights/corners consistency there.
- Badge/status system: customer-dashboard statusClassName (amber payment, green completed, red failed) exists but ad hoc.
- User repo: sphangcho203-afk/recharza-platform, deploy = push main + monitor.

## Overhaul plan
Phase 1 spec (foundation CSS in storefront-redesign.css):
- .rcz-atmosphere layered bg: radial cones + grain SVG noise overlay + faint drift; per-page variants (home purple-blue, game pages game-accent tint).
- Type tokens: --rcz-display/heading/card/body/micro; eyebrow small-caps class .rcz-eyebrow (used for breadcrumbs, steps, section labels, badges labels).
- Buttons: .rcz-btn-primary (violet), .rcz-btn-secondary (glass), .rcz-btn-tertiary (ghost text+arrow), with press state (translateY(1px)).
- Badges: .rcz-badge + state variants (pending amber / success green / error red / info blue) pill form.
- Shimmer skeleton: .rcz-shimmer class + reusable <Shimmer /> component.
- Icon policy: keep storefront-icon line style, ensure uniform 1.5px stroke, round joins, 24 grid; update any filled outliers.

Phase 2 per-surface:
- Hero app/page.tsx: editorial — huge display type, animated gradient wash, single primary CTA.
- Game grid: image-forward fixed 4:3/3:4 art, hover lift + press, price bottom row, CTA distinct.
- Checkout: replace numbered circles with connected progress bar (filled segment), inline trust notes (no boxed bolted warning), generous 24/32 spacing, button hierarchy.
- Account/Orders: table/list utilitarian with hairline rules, denser p-4 rows, badges via rcz-badge.
- Modals/drawer: blur backdrop-filter overlay, elevation-2 shadow.
- Loading/skeleton states in package grids and order history.

Then: typecheck, lint, VERCEL=1 build, security scan (npm audit + secret scan summary to user), commit, push, monitor_deploy.py, E2E + mail-health, screenshots, result.
