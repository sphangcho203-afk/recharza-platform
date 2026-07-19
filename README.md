# Recharza Platform

Recharza is a mobile-first multi-game top-up and digital recharge platform being built around server-owned pricing, durable order records, protected tracking, and payment safety.

## Current foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Six-game catalogue with a playable Mobile Legends development flow
- Player and zone ID format validation without fake nickname claims
- Server-side package and price verification
- PostgreSQL order persistence through Prisma ORM
- Customer records prepared for a future authentication provider
- Database-enforced idempotency to prevent duplicate orders
- Database-backed rate limiting with salted client fingerprints
- Private order tracking tokens and event timelines
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
/orders/:orderId          Private order tracking console
/api/health               Deployment health response
```

## API routes

```text
POST /api/games/mobile-legends/verify
POST /api/orders
GET  /api/orders/:orderId
```

### Order creation

`POST /api/orders` requires an `Idempotency-Key` header. The server validates the package, amount, player details, customer email, rate limit, and database configuration before writing an order.

Retrying the same request with the same idempotency key returns the original order rather than creating another one.

### Order tracking

A successful order response contains:

- a public order ID
- a separate private access token
- a tracking path

The tracking endpoint requires the token as a bearer credential. Customer email addresses are masked in tracking responses.

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

## Deliberately disabled

- real payment collection
- live Mobile Legends nickname retrieval
- automated fulfilment
- payment webhook processing
- refunds
- customer login and email verification

These features must not be represented as active until their providers, signatures, reconciliation rules, and failure handling are implemented and tested.

## Next milestone

Add customer authentication, verified email ownership, signed payment webhooks, fulfilment reconciliation, administrative order controls, and automated expiry cleanup for old rate-limit buckets.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
