# UI Polish Pass — State Notes (Phase 18–21)

## User request
Polish the frontend designs of the store's interfaces: accounts, cart, orders, navigation menu, features. Make it professional, not cartoonish.

## Audit findings (cartoonish styling hotspots)

### 1. `components/customer-dashboard.tsx` (account/orders dashboard)
- Extensive `font-black`, `rounded-3xl`, `rounded-2xl`, `rounded-full` badges, `text-[0.7rem]` font-black uppercase labels.
- Oversized shadows `shadow-2xl shadow-black/25`.
- Pulsing skeleton `rounded-3xl` blocks.
- Empty-state `font-black` headings.

### 2. `components/customer-account-shell.tsx`
- Mostly professional (rounded-lg, proper focus states) — light-touch only if at all. Signup success card good.

### 3. `components/cart-workspace.tsx`
- `rounded-3xl` sections, `font-black` headings/labels/buttons, `shadow-2xl`, pulsing rounded-2xl skeletons, empty-state font-black.

### 4. `components/cart-page.tsx`
- Gradient pulsing skeletons, `font-black` empty states.

### 5. `components/storefront-category-nav.tsx`
- Pill category chips (`rounded-full`, font-black, 11px) — replace with refined rectangular/rounded-lg tabs.

### 6. `components/site-header.tsx` + `app/storefront-redesign.css`
- Desktop nav visible only >=1100px (line 236 hides at <=1099px). Nav links `font-size: .72rem font-weight 850` — small + heavy.
- Brand copy b .74rem tracking .13em.
- Mobile nav menu (mobile-nav-menu.tsx) has good structure (drawer, support sub-page) but typography uses font-black.

## Polish approach (Fable 5-aligned, dark theme adaptation)
- Typography: replace `font-black` with `font-semibold`/`font-medium`; heading ramp: page H1 text-2xl/3xl font-semibold tracking-tight; labels: text-xs uppercase tracking-wide font-semibold (not black).
- Radii: standardize to `rounded-lg` (10px) for cards, inputs, buttons; `rounded-xl` max for large panels; remove `rounded-3xl`/`rounded-full` pills in nav.
- Elevation: dark theme uses subtle borders `border-white/[0.08]` + one shadow tier; remove `shadow-2xl`.
- Colors: keep violet accents but soften; status badges use `rounded-full` kept only for status chips (acceptable per Linear-like design) but soften font weight to font-semibold uppercase text-[11px].
- Motion: keep 150-200ms ease-out transitions, remove heavy transforms; subtle translateY hover fine.
- Skeletons: use border border-white/[0.08] bg-white/[0.03] rounded-lg.
- Lower desktop nav breakpoint 1099px -> keep (it's about fitting); improve link styling instead.

## Files to edit — PROGRESS
- DONE: customer-dashboard.tsx, cart-workspace.tsx, storefront-category-nav.tsx, mobile-nav-menu.tsx (partially), cart-badge.tsx, order-tracker.tsx, app/storefront-redesign.css (nav links, brand copy, account link, mobile direct links)
- DONE: cart-page.tsx (all 14 edits), cart-item-row.tsx (8 edits), cart-order-summary.tsx (7 edits)
- Remaining: cart-checkout-page.tsx (check weights), customer-account-shell.tsx (done mostly; check leftover font-black), mobile-nav-menu.tsx leftover font-black in channel/cart rows, then typec+lint+build, commit, push, verify

## Original todo
1. components/customer-dashboard.tsx — biggest pass
2. components/cart-workspace.tsx — big pass
3. components/cart-page.tsx — light pass
4. components/storefront-category-nav.tsx — chips -> refined tabs
5. app/storefront-redesign.css — nav link weights/sizes, brand copy
6. components/mobile-nav-menu.tsx — typography weights
7. components/cart-item-row.tsx, cart-order-summary.tsx, cart-checkout-page.tsx — check weights

## Verification
- npm run typec + lint; SKIP_DB_MIGRATIONS=true npm run build (no local DB)
- Commit locally, push, wait for Vercel Ready, browse live
- Production URL format: https://recharza-platform-<id>-stand-still.vercel.app

## Deployment history
- Latest Ready: 1f88e47 (support explainer), k5u8r9htv
- Telegram Quick Reply live: 17b2c3b, kivzbopi1
- Neon project: "Recherza TopUp" solitary-lake-08821205
- Vercel project: stand-still / recharza-platform
