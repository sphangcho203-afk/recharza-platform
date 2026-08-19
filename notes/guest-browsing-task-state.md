# Guest Browsing Task — State Notes (Aug 20, 2026)

## Task
Open game pages for guest browsing; sign-in required only at checkout.

## Root cause found
- `proxy.ts` (Next.js proxy/middleware) gated EVERY `/games/:path*` route for guests, redirecting to `/account?returnTo=...&reason=sign-in`. This is why guests could not view packs at all.
- `app/games/*` pages themselves never redirected (getServerSession returns null without redirect).

## Changes made (not yet committed)
1. `proxy.ts` — `isProtectedStorefrontPath` now gates only `/api/checkout/*`. Game pages publicly browsable. Matcher unchanged.
2. `components/mobile-legends-checkout-shell.tsx` — `submitCheckout`: if `!isAuthenticated`, show friendly inline error instead of a vague server error (state preserved on page).
3. `components/supplier-game-checkout-shell.tsx` — same guest pre-check in `submitCheckout`.
4. `components/cart-checkout-page.tsx` — added `isAuthenticated` client state via `GET /api/auth/session` (existing route); `createUnifiedOrder` pre-checks auth with friendly message.

## Server-side defense (unchanged, still active)
- `/api/checkout/*` (mobile-legends, game, cart) → proxy returns HTTP 401 `{AUTH_REQUIRED}` for guests.
- Identity verify routes (`/api/games/[gameSlug]/verify`) remain public (public IGN lookup).

## Quality gates
- `npm run typecheck`: PASS (0 errors)
- `npm run lint`: PASS (0 errors, 26 pre-existing warnings only)
- `VERCEL=1 npm run build`: PASS (✓ Compiled successfully, 71/71 static pages)
- `npm audit`: 0 vulnerabilities (0 critical/high/moderate/low)
- Secret scan (`vulnerabilities-fetcher/scripts/scan_secrets.py`, 1335 files):
  - 544 findings in package-lock.json (npm sha hashes — noise)
  - `.next/` build artifacts and `generated/prisma` (build noise)
  - 12 s2s-* probe scripts + 1 note contain the user-provided Shop2TopUp API key (OBqp...u70V) — these are local probe scripts provided by the user for integration; the real key lives in Vercel env var SHOP2TOPUP_API_KEY (IP-allowlisted to 103.190.132.18 per user). Pre-existing, not introduced by this change.
  - None of the 4 changed files contain secrets.

## Remaining steps
1. Commit + push main.
2. Monitor Vercel deployment (team_6W1aKKvykfYhQKrJlvewD9bl, project prj_97Lj5h6yobyPZMJWQrpi6yfCFNzo).
3. Verify live:
   - curl guest → https://{deployment}/games/mobile-legends/india returns HTTP 200 with packages
   - curl guest POST /api/checkout/mobile-legends → HTTP 401 AUTH_REQUIRED
   - Browser: view packs as guest; advance to pay → friendly sign-in prompt
   - E2E suite: python3 scripts/e2e-suite.py against deployment
   - mail-health probe: curl -H "Authorization: Bearer rcz-probe-7k3m9q2x" https://{deployment}/api/internal/mail-health
