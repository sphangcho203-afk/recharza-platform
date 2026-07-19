# Recharza Platform

Recharza is a mobile-first multi-game top-up and digital recharge platform being built around server-owned pricing, durable order records, protected tracking, signed payment events, and auditable operations.

## Current foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Six-game catalogue with a playable Mobile Legends development flow
- Player and zone ID format validation without fake nickname claims
- Server-side package and price verification
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

## Local setup

```bash
npm install
cp .env.example .env
```

Configure at least these variables:

```text
DATABASE_URL=postgresql://username:password@localhost:5432/recharza?schema=public
ORDER_ACCESS_SECRET=<random value with at least 32 characters>
RATE_LIMIT_SALT=<different random value with at least 32 characters>
ADMIN_ACCESS_TOKEN=<temporary operator token with at least 32 characters>
CRON_SECRET=<separate maintenance token with at least 32 characters>
RAZORPAY_WEBHOOK_SECRET=<webhook secret configured in Razorpay>
```

Create the database tables and start the app:

```bash
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Application routes

```text
/                         Storefront
/games/mobile-legends     Persistent development checkout
/orders/:orderId          Private customer order tracking
/operator                 Temporary protected operator console
/api/health               Deployment health response
```

The operator page is deliberately excluded from search indexing. Its bearer-token gate is temporary and must be replaced with staff authentication before production use.

## Customer and order APIs

```text
POST /api/games/mobile-legends/verify
POST /api/orders
GET  /api/orders/:orderId
```

### Order creation

`POST /api/orders` requires an `Idempotency-Key` header. The server validates the package, amount, player details, customer email, rate limit, and database configuration before writing an order.

Retrying the same request with the same idempotency key returns the original order rather than creating another one.

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

## Operator APIs

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

The application never trusts browser-supplied prices or payment states. Product totals are recalculated on the server.

Raw client IP addresses are not stored in rate-limit records. They are converted into salted fingerprints.

Order tracking tokens are returned to the customer once, stored only as hashes in PostgreSQL, and required to read the order timeline.

Payment webhooks are verified against the raw request body before JSON parsing. Amount, currency, and provider order references must all match before the order can be marked paid.

## Deliberately disabled

- real payment-session creation and customer charging
- live Mobile Legends nickname retrieval
- automated fulfilment-provider calls
- refunds
- customer and staff login
- verified email delivery

These features must not be represented as active until their providers, credentials, signatures, reconciliation rules, and failure handling are implemented and tested.

## Next milestone

Add customer and staff authentication, verified email ownership, live test-mode Razorpay order creation, fulfilment-provider reconciliation, refunds, and notification delivery.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
