# Recharza Platform

Recharza is a mobile-first multi-game top-up and digital recharge platform built around server-owned pricing, supplier-aware margins, durable order records, protected tracking, signed payment events, recoverable test checkout, and auditable operations.

## Current foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Media-first responsive game catalogue and Mobile Legends checkout
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
- Recoverable Razorpay Standard Checkout restricted to Test Mode
- Server-side Razorpay Checkout signature verification
- Razorpay raw-body HMAC webhook verification
- Idempotent payment webhook receipts and monotonic reconciliation
- Protected operational-health, supplier-pricing, and order consoles
- Protected maintenance cleanup for expired rate-limit and webhook data
- GitHub Actions checks for Prisma schema, TypeScript, ESLint, and production builds

## Requirements

- Node.js 20.19 or newer
- npm
- PostgreSQL
- A FazerCards B2B API key for authenticated catalogue prices
- Razorpay Test Mode keys for simulated Standard Checkout

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
```

Configure the supplier integration:

```text
FAZERCARDS_API_KEY=<server-side B2B key>
FAZERCARDS_API_BASE_URL=https://api.fzr.cards/api/v2
FAZERCARDS_PUBLISHED_CATEGORY_IDS=<comma-separated reviewed category IDs>
```

Configure Razorpay Test Mode:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<test key secret>
RAZORPAY_WEBHOOK_SECRET=<test-mode webhook secret>
RAZORPAY_API_BASE_URL=https://api.razorpay.com/v1
```

This build rejects non-test Razorpay key IDs. Live charging remains intentionally blocked.

Do not place supplier or payment secrets in a `NEXT_PUBLIC_` variable. They must never reach browser JavaScript.

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
/orders/:orderId          Private tracking and recoverable test payment
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

The sync route loads paginated categories and offers, marks stale offers unavailable, calculates landed cost and retail price, publishes only reviewed category IDs, and writes a supplier sync run plus an operator audit record.

An empty publication allowlist is safe: products synchronize for review but none become visible to customers.

## Pricing policy

```text
GET  /api/operator/pricing
POST /api/operator/pricing
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

The stored policy contains the USD/INR rate, FX reserve, gateway reserve, target margin, minimum profit, operating overhead, and upward-only rounding increment. Existing orders retain their recorded totals when the policy changes.

## Customer and order APIs

```text
POST /api/games/mobile-legends/verify
POST /api/orders
GET  /api/orders/:orderId
POST /api/orders/:orderId/payment-session
POST /api/payments/razorpay/verify
```

### Order creation

`POST /api/orders` requires an `Idempotency-Key` header. The server resolves the package from the approved catalogue, recalculates the authoritative total, validates player details and customer email, applies rate limits, and writes the order.

Retrying the same request with the same idempotency key returns the original order rather than creating another one.

### Order tracking

A successful order response contains a public order ID, a separate private access token, and a tracking path. The tracking endpoint requires the token as a bearer credential. Customer email addresses are masked in tracking responses.

## Razorpay Test Mode checkout

Test checkout begins from the secure order page, not from untrusted browser pricing.

```text
POST /api/orders/:orderId/payment-session
Authorization: Bearer <ORDER_ACCESS_TOKEN>
```

The payment-session route:

1. verifies the private order token
2. permits only payable order states
3. rejects missing, partial, or non-test Razorpay keys
4. claims the order in PostgreSQL before contacting Razorpay
5. creates or restores one Razorpay Test Mode order
6. returns only the public test key ID and checkout configuration
7. restores the previous Recharza payment state if provider creation fails

After Standard Checkout returns a payment ID, order ID, and signature, the browser sends them to:

```text
POST /api/payments/razorpay/verify
Authorization: Bearer <ORDER_ACCESS_TOKEN>
```

The server verifies the signature using the server-stored provider order ID. A valid browser callback may move the order to `PAYMENT_PENDING`, but it cannot establish `PAID`.

## Payment reconciliation

```text
POST /api/webhooks/razorpay
```

The webhook route reads the unmodified raw request body, verifies `X-Razorpay-Signature`, deduplicates deliveries, matches the provider order ID, verifies amount and currency, records the immutable receipt, and advances the order through monotonic payment states.

Supported events are `payment.authorized`, `payment.captured`, `payment.failed`, and `order.paid`.

Operators cannot manually set `PAID`. Only a verified and reconciled payment webhook may establish that state.

## Operator APIs

```text
GET  /api/operator/health
GET  /api/operator/orders
POST /api/operator/orders/:orderId/status
```

All routes require `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.

The health endpoint reports only readiness and counters. It never returns secrets. It covers database reachability, Razorpay mode, webhook configuration, pending orders, failed webhook receipts, supplier-key state, approved categories, offer counts, and the latest supplier sync.

Manual order transitions are intentionally narrow:

- `CREATED`, `AWAITING_PAYMENT`, or `PAYMENT_PENDING` → `FAILED` or `CANCELLED`
- `PAID` → `FULFILLING`
- `FULFILLING` → `COMPLETED` or `FAILED`

Every operator transition requires a written reason and creates an audit record plus an order timeline event.

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

The application never trusts browser-supplied prices, supplier availability, provider order IDs, or payment states. Product totals, offer publication, payment sessions, and reconciliation are resolved on the server.

Raw client IP addresses are not stored in rate-limit records. They are converted into salted fingerprints.

Order tracking tokens are returned to the customer once, stored only as hashes in PostgreSQL, and required to read the order timeline or create a payment session.

Payment webhooks are verified against the raw request body before JSON parsing. Amount, currency, and provider order references must all match before the order can be marked paid.

## Deliberately disabled

- Razorpay Live Mode and real customer charging
- automated FazerCards order placement
- FazerCards completion, failure, and refund webhook handling
- live Mobile Legends nickname retrieval through FazerCards
- automated fulfilment-provider calls
- refunds
- customer and staff login
- verified email delivery

These features must not be represented as active until their credentials, signatures, reconciliation rules, failure handling, and test runs are complete.

## Next milestone

Add customer and staff authentication, verified email ownership, supplier player-ID validation, test fulfilment orders, supplier completion/refund webhooks, and automated post-payment fulfilment reconciliation.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
