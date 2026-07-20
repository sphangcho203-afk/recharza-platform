# Recharza Platform

Recharza is a mobile-first multi-game top-up and digital recharge platform built around server-owned pricing, supplier-aware margins, durable order records, protected tracking, signed payment events, and auditable operations.

## Current foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Responsive six-game catalogue and a complete Mobile Legends development checkout
- Server-loaded package catalogue with safe supplier-price fallbacks
- FazerCards B2B category and offer synchronization through a server-only API client
- Category allowlisting so region-incompatible supplier lines cannot publish automatically
- Profit-aware retail pricing with FX, gateway, overhead, minimum-profit, percentage-margin, and upward-rounding rules
- Protected operator pricing controls and full-catalogue repricing
- Player and zone ID format validation without fake nickname claims
- Server-side package and price verification at order creation
- PostgreSQL order persistence through Prisma ORM
- Database-enforced idempotency to prevent duplicate orders
- Database-backed rate limiting with salted client fingerprints
- Private order tracking tokens and event timelines
- Razorpay raw-body HMAC webhook verification
- Idempotent payment webhook receipts and monotonic reconciliation
- Protected operator order console with audited status transitions
- Protected maintenance cleanup for expired rate-limit and webhook data
- Development payment adapter that cannot charge real money
- GitHub Actions checks for Prisma schema, TypeScript, ESLint, and production builds

## Requirements

- Node.js 20.19 or newer
- npm
- PostgreSQL
- A FazerCards B2B API key for authenticated catalogue prices

## Local setup

```bash
npm install
cp .env.example .env
```

Configure the required database and security values:

```text
DATABASE_URL=postgresql://username:password@localhost:5432/recharza?schema=public
ORDER_ACCESS_SECRET=<random value with at least 32 characters>
RATE_LIMIT_SALT=<different random value with at least 32 characters>
ADMIN_ACCESS_TOKEN=<temporary operator token with at least 32 characters>
CRON_SECRET=<separate maintenance token with at least 32 characters>
RAZORPAY_WEBHOOK_SECRET=<webhook secret configured in Razorpay>
```

Configure the supplier integration:

```text
FAZERCARDS_API_KEY=<server-side B2B key>
FAZERCARDS_API_BASE_URL=https://api.fzr.cards/api/v2
FAZERCARDS_PUBLISHED_CATEGORY_IDS=<comma-separated reviewed category IDs>
```

Do not place the FazerCards key in a `NEXT_PUBLIC_` variable. It must never reach browser JavaScript.

Create the database tables and start the app:

```bash
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Application routes

```text
/                         Supplier-aware storefront
/games/mobile-legends     Server-loaded protected checkout
/orders/:orderId          Private customer order tracking
/operator                 Temporary protected operations console
/api/health               Deployment health response
```

The operator page is excluded from search indexing. Its bearer-token gate is temporary and must be replaced with staff authentication before production use.

## Supplier catalogue flow

Recharza uses the FazerCards top-up catalogue as a supplier source, not as a public client-side dependency.

```text
FazerCards API
    ↓ server-only category and offer sync
SupplierProduct records
    ↓ approved-category publication gate
Pricing policy
    ↓ FX + fees + overhead + margin + upward rounding
Storefront package
    ↓ server resolves the same offer again
Persistent order
```

### Synchronize FazerCards

```text
POST /api/operator/suppliers/fazercards/sync
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

The sync route:

1. loads FazerCards top-up categories with pagination
2. keeps supported Recharza game lines
3. loads each category's offers and required fields
4. marks missing old offers unavailable
5. converts supplier USD prices into integer micro-dollars
6. calculates landed cost and protected retail price
7. stores expected margin and catalogue metadata
8. publishes only category IDs in `FAZERCARDS_PUBLISHED_CATEGORY_IDS`
9. writes a supplier sync run and operator audit record

An empty publication allowlist is safe: products synchronize for review but none become visible to customers.

## Pricing policy

```text
GET  /api/operator/pricing
POST /api/operator/pricing
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

The stored policy contains:

- `usdInrRatePaise`: paise per USD, for example `9650` means ₹96.50
- `fxBufferBps`: reserve for exchange-rate movement and conversion spread
- `gatewayFeeBps`: estimated payment-processing reserve
- `targetMarginBps`: base expected percentage margin
- `minimumMarginInPaise`: absolute expected profit floor
- `overheadInPaise`: supplier-plan and operating contribution per order
- `roundingInPaise`: upward-only customer-price increment

Small products receive a higher percentage target automatically. Larger products receive a lower percentage target so headline prices can remain competitive. No price is rounded downward.

Updating the policy reprices stored supplier products in controlled database batches. Existing orders retain their recorded totals.

## Customer and order APIs

```text
POST /api/games/mobile-legends/verify
POST /api/orders
GET  /api/orders/:orderId
```

### Order creation

`POST /api/orders` requires an `Idempotency-Key` header. The server resolves the package from the approved catalogue, recalculates the authoritative total, validates player details and customer email, applies rate limits, and writes the order.

A stale, unavailable, or unpublished supplier offer is rejected with a refresh message. Retrying the same request with the same idempotency key returns the original order rather than creating another one.

### Order tracking

A successful order response contains a public order ID, a separate private access token, and a tracking path. The tracking endpoint requires the token as a bearer credential. Customer email addresses are masked in tracking responses.

## Payment reconciliation

```text
POST /api/webhooks/razorpay
```

The webhook route:

1. reads the unmodified raw request body
2. verifies `X-Razorpay-Signature` with HMAC-SHA256
3. rejects invalid signatures before parsing business data
4. deduplicates by `X-Razorpay-Event-Id` and payload hash
5. matches the provider order ID to a stored Recharza order
6. verifies the amount and currency
7. records the immutable webhook receipt
8. advances the order through monotonic payment states

Supported events are `payment.authorized`, `payment.captured`, `payment.failed`, and `order.paid`.

Operators cannot manually set `PAID`. Only a verified and reconciled payment webhook may establish that state.

## Operator order APIs

```text
GET  /api/operator/orders
POST /api/operator/orders/:orderId/status
```

Both routes require `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.

Manual transitions are intentionally narrow:

- `CREATED`, `AWAITING_PAYMENT`, or `PAYMENT_PENDING` → `FAILED` or `CANCELLED`
- `PAID` → `FULFILLING`
- `FULFILLING` → `COMPLETED` or `FAILED`

Every operator transition requires a written reason and creates an `AdminAuditLog` record plus an order timeline event.

## Maintenance API

```text
POST /api/internal/maintenance/cleanup
```

This route requires `Authorization: Bearer <CRON_SECRET>`. It removes expired rate-limit buckets and processed or ignored webhook receipts older than 90 days. Failed webhook receipts and operator audit logs are retained.

## Database commands

```bash
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:deploy
```

Use `db:migrate` during local development. Use `db:deploy` in a controlled production deployment after reviewing migrations.

## Validation

```bash
npm run db:validate
npm run typecheck
npm run lint
npm run build
```

## Security rules

Never commit API keys, database passwords, payment secrets, webhook secrets, service-account files, authentication secrets, or production credentials.

Use `.env.example` only as a variable-name template. Store real values in the deployment provider's encrypted environment settings.

The application never trusts browser-supplied prices, supplier availability, or payment states. Product totals and offer publication are resolved on the server.

Raw client IP addresses are not stored in rate-limit records. They are converted into salted fingerprints.

Order tracking tokens are returned to the customer once, stored only as hashes in PostgreSQL, and required to read the order timeline.

Payment webhooks are verified against the raw request body before JSON parsing. Amount, currency, and provider order references must all match before the order can be marked paid.

## Deliberately disabled

- real payment-session creation and customer charging
- automated FazerCards order placement
- FazerCards completion, failure, and refund webhook handling
- live Mobile Legends nickname retrieval through FazerCards
- automated fulfilment-provider calls
- refunds
- customer and staff login
- verified email delivery

These features must not be represented as active until their credentials, signatures, reconciliation rules, failure handling, and test-mode runs are complete.

## Next milestone

Connect FazerCards player-ID validation and test fulfilment orders, process supplier completion and refund webhooks, add customer and staff authentication, enable verified email ownership, and create live Razorpay test-mode payment sessions.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
