# Recharza Platform

Recharza is a mobile-first game top-up platform built around verified account ownership, server-owned pricing, supplier-aware margins, durable orders, signed payment events, private tracking, and auditable fulfilment.

## Current foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Media-first responsive game catalogue
- Mobile Legends regional checkout
- PostgreSQL persistence through Prisma
- Verified email magic-link accounts
- `CUSTOMER`, `STAFF`, and `ADMIN` roles
- HTTP-only database sessions and revocation
- Account-owned order history
- Server-resolved supplier products and retail prices
- Database idempotency and rate limiting
- Private tracking tokens and order timelines
- Razorpay Standard Checkout restricted to Test Mode
- Signed Razorpay webhook reconciliation
- FazerCards catalogue synchronization and pricing controls
- Optional supplier player/nickname validation
- Dry-run-by-default supplier fulfilment
- Explicitly gated supplier writes
- Scheduled supplier-status reconciliation
- Audited staff operations and fulfilment retries
- GitHub Actions validation for Prisma, TypeScript, ESLint, and production builds

## Requirements

- Node.js 20.19 or newer
- npm
- PostgreSQL
- Resend credentials for production email delivery
- Razorpay Test Mode keys for simulated checkout
- FazerCards credentials for authenticated catalogue data

## Local setup

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Required security configuration

```text
DATABASE_URL=postgresql://username:password@localhost:5432/recharza?schema=public
ORDER_ACCESS_SECRET=<random value with at least 32 characters>
RATE_LIMIT_SALT=<different random value with at least 32 characters>
CRON_SECRET=<separate maintenance token with at least 32 characters>
```

`ADMIN_ACCESS_TOKEN` is an emergency operator fallback. Normal operator access uses verified staff sessions.

## Verified email accounts

Configure reviewed staff and admin addresses:

```text
AUTH_STAFF_EMAILS=staff1@example.com,staff2@example.com
AUTH_ADMIN_EMAILS=owner@example.com
```

Configure production email delivery:

```text
RESEND_API_KEY=<server-side key>
RESEND_FROM_EMAIL=Recharza <accounts@your-verified-domain.example>
```

In non-production, `AUTH_EMAIL_DELIVERY_MODE=development` may return the one-time link to the account UI when Resend is unavailable. Production never returns raw login links and requires configured email delivery.

### Authentication flow

```text
POST /api/auth/request-link
GET  /api/auth/consume?token=...
GET  /api/auth/session
POST /api/auth/logout
GET  /api/account/orders
```

Magic-link and session tokens are stored only as SHA-256 hashes. Links expire after 15 minutes and are single-use. Sessions are HTTP-only, same-site, database-backed, revocable, and expire after 30 days.

The public link-request response does not reveal whether an account already exists.

## Application routes

```text
/                         Storefront
/account                  Verified account and order history
/games/mobile-legends     Account-owned checkout
/orders/:orderId          Private tracking and Razorpay Test Mode
/operator                 Verified staff operations
/api/health               Public deployment health response
```

## Catalogue and pricing

FazerCards is used as a server-side supplier source. The browser never receives the supplier API key.

```text
FazerCards catalogue
    ↓ server-only sync
SupplierProduct records
    ↓ reviewed category allowlist
Pricing policy
    ↓ FX + gateway reserve + overhead + margin + upward rounding
Storefront package
    ↓ server resolves again at checkout
Account-owned order
```

Configure catalogue access:

```text
FAZERCARDS_API_KEY=<server-side key>
FAZERCARDS_API_BASE_URL=https://api.fzr.cards/api/v2
FAZERCARDS_PUBLISHED_CATEGORY_IDS=<comma-separated reviewed category IDs>
```

An empty publication allowlist is safe. Products may synchronize for review, but none become customer-visible.

Protected staff routes:

```text
POST /api/operator/suppliers/fazercards/sync
GET  /api/operator/pricing
POST /api/operator/pricing
```

Staff sessions are preferred. `Authorization: Bearer <ADMIN_ACCESS_TOKEN>` remains a break-glass fallback.

## Checkout and order ownership

```text
POST /api/games/mobile-legends/verify
POST /api/orders
GET  /api/orders/:orderId
```

`POST /api/orders` requires:

- a verified account session
- an `Idempotency-Key` header
- a currently approved package
- valid player and zone data

The server resolves the package, price, supplier product, account owner, and player validation again. A browser-supplied receipt address or amount is never trusted.

Retrying with the same idempotency key returns the original account-owned order instead of creating a duplicate.

## Player validation

Local player/zone format validation always works. Remote supplier validation runs only when an exact path is configured:

```text
FAZERCARDS_PLAYER_VALIDATION_PATH=
```

No endpoint path is guessed. If the supplier response does not contain an explicit boolean validation result, Recharza refuses to represent the destination as confirmed.

Live supplier offers are revalidated during server-side order creation. Confirmed nicknames and validation mode are persisted with the order.

## Razorpay Test Mode

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<test secret>
RAZORPAY_WEBHOOK_SECRET=<test webhook secret>
RAZORPAY_API_BASE_URL=https://api.razorpay.com/v1
```

Non-test key IDs are rejected.

Test checkout begins from private order tracking:

```text
POST /api/orders/:orderId/payment-session
POST /api/payments/razorpay/verify
POST /api/webhooks/razorpay
```

The private token authorizes payment-session creation. The browser callback is verified on the server and may move an order only to `PAYMENT_PENDING`. Only a signed webhook with matching provider order ID, amount, and currency may establish `PAID`.

## Supplier fulfilment

Configure exact account-specific operation paths only after confirming them from FazerCards:

```text
FAZERCARDS_ORDER_CREATE_PATH=
FAZERCARDS_ORDER_STATUS_PATH=/orders/{order_id}
FAZERCARDS_ORDER_WRITES_ENABLED=false
```

`FAZERCARDS_ORDER_STATUS_PATH` must contain `{order_id}` or `:orderId`.

### Safety model

- supplier writes default to dry-run
- indicative packages can never be submitted
- live writes require an approved supplier product
- live writes require the exact create path
- live writes require `FAZERCARDS_ORDER_WRITES_ENABLED=true`
- each attempt has a database idempotency key
- raw request and response evidence is stored privately
- active or completed attempts cannot be duplicated
- retries create new numbered attempts instead of rewriting old evidence

After a verified paid webhook, Recharza creates exactly one fulfilment attempt. With writes disabled, a complete dry-run plan is recorded. With writes explicitly enabled, the order is submitted once and moves to `FULFILLING`.

Protected staff recovery:

```text
POST /api/operator/orders/:orderId/fulfilment
```

A written reason is required. Every request creates an audit record linked to the staff account or emergency access fingerprint.

## Supplier status reconciliation

```text
POST /api/internal/maintenance/reconcile-fulfilment
Authorization: Bearer <CRON_SECRET>
```

The scheduled route checks submitted or processing attempts only when the exact status path is configured. It recognizes explicit processing, completed, failed, and cancelled states. Unknown responses never become success.

Completed supplier status moves the order to `COMPLETED`. Failed or cancelled supplier status moves the order to `FAILED` and records that staff/refund review is required. Refunds are not automated.

## Staff operations

```text
GET  /api/operator/health
GET  /api/operator/orders
POST /api/operator/orders/:orderId/status
POST /api/operator/orders/:orderId/fulfilment
```

Approved staff/admin account sessions are the normal access path. The operator health panel reports account counts, payment readiness, supplier readiness, validation paths, write-gate state, and fulfilment failures without returning secrets.

Operators cannot manually establish `PAID`. Manual state transitions remain narrow and require a written reason.

## Maintenance

```text
POST /api/internal/maintenance/cleanup
Authorization: Bearer <CRON_SECRET>
```

Cleanup removes:

- expired rate-limit buckets
- old processed/ignored webhook receipts
- expired sessions
- old revoked sessions
- expired or consumed magic links

Failed webhook evidence, audit logs, orders, and fulfilment attempts are retained.

## Database commands

```bash
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:deploy
```

Use `db:migrate` locally. Use `db:deploy` in a reviewed deployment after inspecting migrations.

## Validation

```bash
npm run db:validate
npm run typecheck
npm run lint
npm run build
```

## Security rules

- Never commit credentials or paste production secrets into chat.
- Never place supplier, payment, email, or database secrets in `NEXT_PUBLIC_` variables.
- Browser prices, account ownership, supplier state, and payment state are untrusted.
- Raw IP addresses are not stored for rate limiting.
- Magic-link, session, and order-access tokens are stored only as hashes.
- Payment webhooks are verified before business processing.
- Supplier success requires an explicit recognized status.

## Deliberately disabled

- Razorpay Live Mode and real charging
- supplier writes unless the separate write gate is enabled
- guessed FazerCards endpoints
- automated refunds
- live completion claims from unknown supplier responses

## Next milestone

Add email receipts and operational alerts, customer profile editing, supplier webhook support if available, explicit refund workflows, self-hosted reviewed game media, and deployment observability.
