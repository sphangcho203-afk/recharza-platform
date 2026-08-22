# Recharza — Institutional Knowledge & Context (August 2026)

Recharza is a premium gaming top-up commerce platform designed for high-trust, instant delivery of digital gaming credits (Diamonds, UC, VP, etc.). It is built on a modern full-stack architecture optimized for global markets, regional pricing, and secure player verification.

## 1. Core Architecture & Stack

The platform is built using a "fail-closed" architectural philosophy, ensuring that no fulfillment occurs without verified payment and no payment is accepted without a valid player identity confirmation.

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16.3 (App Router), React 19, Tailwind CSS 4.3 |
| **Backend** | Next.js Server Actions & API Routes (Node.js 22.x) |
| **Database** | PostgreSQL (Neon) via Prisma ORM 7.x |
| **Auth** | Custom Session-based Auth with Google OAuth integration |
| **Payments** | Razorpay (Webhooks for async reconciliation) |
| **Fulfillment** | Multi-provider orchestration (Shop2TopUp, Volsever, FazerCards) |
| **Messaging** | Gmail SMTP (Nodemailer) + Telegram Bot API |

## 2. Design System (Fable 5)

Recharza uses a semantic design token system that enforces visual consistency across all surfaces.

*   **Typography:** Inter (Body) for high readability, with semantic weights (400, 600, 700, 850).
*   **Color System:** Uses CSS variables for semantic mapping (`--brand-primary`, `--surface-elevated`, `--status-success`).
*   **Elevation:** Surfaces are strictly categorized as **Flat** (backgrounds), **Raised** (standard cards), or **Floating** (modals/popups).
*   **Responsiveness:** Mobile-first design with optimized touch targets (min 44px) and 2-column grid layouts for dashboard stats.

## 3. Critical Routes & Components

| Route | Purpose | Key Component |
|---|---|---|
| `/` | Storefront & Catalog | `GameCatalogue`, `StorefrontHero` |
| `/games/[slug]` | Game Landing Page | `GameEducationSection`, `SupplierGameCheckoutShell` |
| `/cart` | Cart Management | `CartPage`, `CartItemRow` |
| `/account` | Customer Dashboard | `CustomerDashboard`, `SavedAddressPicker` |
| `/admin` | Operations & Metrics | `AdminControlCenter` |
| `/api/checkout` | Order Creation | `lib/commerce/game-checkout.ts` |
| `/api/webhook` | Payment Processing | `lib/razorpay-webhook.ts` |

## 4. Business Invariants

These rules must NEVER be broken during future development:
1.  **Player Verification First:** A player's nickname must be confirmed via a provider before payment is allowed.
2.  **Fail-Closed Fulfillment:** Orders only move to `FULFILLING` after a `PAID` status is confirmed via webhook.
3.  **Idempotency:** Every checkout attempt uses a unique `Idempotency-Key` to prevent duplicate charges.
4.  **Guest Privacy:** Guest orders are accessible only via a unique tracking token stored in the order record.

## 5. Known Issues & Technical Debt

*   **Visibility Fix (Aug 2026):** Resolved a critical regression where dark game checkout pages were unreadable due to global white gradients. Fixed via `.recharza-dark-atmosphere` in `app/storefront-redesign.css` and dark-theme overrides for `SavedAddressPicker` and `CountryPicker`.
*   **Prisma Security Pin:** A `deepmerge-ts` vulnerability in Prisma 7 is currently resolved via a `package.json` override. Do not upgrade to Prisma 8 without a full migration audit.
*   **MLBB India Auth-Gate:** The Mobile Legends India market page is intentionally auth-gated to ensure regional compliance; this is a design choice, not a bug.
*   **Volsever Mapping:** Some generic games rely on Volsever fallback; always verify the endpoint slug in `lib/volsever.ts` when adding new games.

## 6. Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build (includes Prisma generation)
pnpm typecheck    # Run TypeScript static analysis
pnpm db:migrate   # Apply database migrations
python3 scripts/e2e-suite.py  # Run 45-test health suite
```

## 7. Rules for Future AI Agents

1.  **Inspect First:** Always read `PROJECT_CONTEXT.md` and `lib/runtime-config.ts` before editing.
2.  **Verification:** Every UI change must be verified with a screenshot at 360x800 (mobile) and 1440x900 (desktop).
3.  **Safety:** Never allow unconfirmed player IDs to proceed to payment.
4.  **Copy:** Maintain a professional, premium retail tone. Avoid technical jargon in customer-facing strings.
