# Recharza staging deployment

This runbook creates a non-production environment for testing verified accounts, Razorpay Test Mode, supplier catalogue synchronization, dry-run fulfilment, and operator workflows.

Staging must not use Razorpay Live Mode. FazerCards order writes should remain disabled until the exact account-specific request and response formats are verified.

## 1. Create the staging services

Create:

1. a hosted PostgreSQL database dedicated to staging;
2. a deployment project connected to `sphangcho203-afk/recharza-platform`;
3. a verified Resend sending domain or approved sender;
4. Razorpay Test Mode credentials and a Test Mode webhook;
5. optional FazerCards B2B staging credentials.

Do not reuse the production database or production secrets.

## 2. Configure encrypted environment variables

Set these in the hosting provider's encrypted environment settings:

```text
DEPLOYMENT_ENV=staging
NEXT_PUBLIC_APP_URL=https://your-staging-domain.example
DATABASE_URL=postgresql://...
ORDER_ACCESS_SECRET=<unique random value, at least 32 characters>
RATE_LIMIT_SALT=<different random value, at least 32 characters>
CRON_SECRET=<different random value, at least 32 characters>
ADMIN_ACCESS_TOKEN=<optional emergency fallback, at least 32 characters>
AUTH_ADMIN_EMAILS=<reviewed administrator email>
AUTH_STAFF_EMAILS=<optional reviewed staff emails>
AUTH_EMAIL_DELIVERY_MODE=resend
RESEND_API_KEY=<server-side key>
RESEND_FROM_EMAIL=Recharza <accounts@your-verified-domain.example>
```

For simulated Razorpay checkout:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<test secret>
RAZORPAY_WEBHOOK_SECRET=<test webhook secret>
RAZORPAY_API_BASE_URL=https://api.razorpay.com/v1
```

For FazerCards catalogue review:

```text
FAZERCARDS_API_KEY=<server-side key>
FAZERCARDS_API_BASE_URL=https://api.fzr.cards/api/v2
FAZERCARDS_PUBLISHED_CATEGORY_IDS=<reviewed comma-separated IDs>
FAZERCARDS_PLAYER_VALIDATION_PATH=<confirmed path, optional>
FAZERCARDS_ORDER_CREATE_PATH=<confirmed path, keep unused initially>
FAZERCARDS_ORDER_STATUS_PATH=<confirmed path containing {order_id} or :orderId>
FAZERCARDS_ORDER_WRITES_ENABLED=false
```

Never place private values in `NEXT_PUBLIC_` variables.

## 3. Validate before migration

Run in a secure deployment shell with the staging environment loaded:

```bash
npm install
npm run deploy:check
```

The validator:

- prints no secret values;
- rejects missing core security settings;
- rejects localhost as a hosted application URL;
- rejects non-test Razorpay keys;
- rejects partial Razorpay configuration;
- rejects malformed supplier status templates;
- rejects enabled supplier writes without required supplier configuration.

Warnings do not stop deployment. Errors exit with status 1.

## 4. Apply reviewed migrations

After confirming that `DATABASE_URL` points to the staging database:

```bash
npm run deploy:prepare
```

This runs configuration validation and then:

```bash
prisma migrate deploy
```

Do not hide migration execution inside the normal build command. Preview builds and code-only rebuilds must not mutate a database automatically.

## 5. Build and deploy

```bash
npm run build
npm run start
```

A managed host normally runs the equivalent build and start commands itself.

## 6. Readiness and liveness

### Liveness

```text
GET /api/health
```

A 200 response confirms that the web process is responding. It does not prove that the database or integrations are ready.

### Readiness

```text
GET /api/readiness
```

A 200 response requires:

- valid core configuration;
- a reachable PostgreSQL database;
- hosted account requirements when `DEPLOYMENT_ENV=staging` or `production`.

A 503 response contains only redacted check names and messages. It never returns secret values.

The response always states that live charging is blocked and whether supplier writes are enabled.

## 7. Run route smoke tests

After deployment:

```bash
SMOKE_TEST_BASE_URL=https://your-staging-domain.example npm run smoke
```

The smoke test checks:

```text
/api/health
/api/readiness
/
/account
/games/mobile-legends
/orders/lookup
/operator
```

For a deliberately incomplete environment, readiness 503 can be temporarily accepted:

```bash
SMOKE_TEST_BASE_URL=https://your-staging-domain.example \
SMOKE_ALLOW_UNREADY=true \
npm run smoke
```

Do not use `SMOKE_ALLOW_UNREADY=true` for release approval.

## 8. Configure external callbacks

### Razorpay Test Mode webhook

Configure the staging webhook URL:

```text
https://your-staging-domain.example/api/webhooks/razorpay
```

Use the same Test Mode webhook secret stored in `RAZORPAY_WEBHOOK_SECRET`.

The browser callback may move an order only to `PAYMENT_PENDING`. A signed webhook with matching provider order ID, amount, and currency is required for `PAID`.

### Maintenance scheduler

Call these routes with:

```text
Authorization: Bearer <CRON_SECRET>
```

Routes:

```text
POST /api/internal/maintenance/cleanup
POST /api/internal/maintenance/reconcile-fulfilment
```

Use an external scheduler capable of authenticated POST requests. Do not place `CRON_SECRET` in a public URL.

## 9. Staging acceptance test

Run this sequence:

1. Request a magic sign-in link.
2. Open it and confirm `/account` shows a verified session.
3. Confirm an approved administrator email can open `/operator` without pasting the emergency token.
4. Synchronize the FazerCards catalogue with an empty or reviewed publication allowlist.
5. Select an MLBB market and package.
6. Validate player and zone data.
7. Create an account-owned order.
8. Open private tracking with its access token.
9. Start Razorpay Test Mode checkout.
10. Confirm the signed webhook establishes `PAID`.
11. Confirm a dry-run fulfilment attempt appears while supplier writes are disabled.
12. Confirm customer tracking and operator views show the same status.
13. Run both maintenance routes.
14. Run `npm run smoke` and confirm every route passes.

## 10. Supplier-write release gate

Keep:

```text
FAZERCARDS_ORDER_WRITES_ENABLED=false
```

until all of these are true:

- the exact create endpoint is confirmed from the B2B account documentation;
- request field names are confirmed using a non-production supplier test;
- the provider returns a stable order identifier;
- the exact status endpoint and status values are confirmed;
- duplicate submission behavior is documented;
- staff has tested failed-order and refund-review handling;
- database backups and operational alerts exist.

Only then should supplier writes be enabled in staging. Production remains a separate approval.

## 11. Rollback

Code deployments may be rolled back to a previous commit. Database migrations should be treated as forward-only:

- take a database backup before applying staging migrations;
- do not manually delete migration records;
- repair schema problems with a reviewed follow-up migration;
- keep paid orders, webhook evidence, audit logs, and fulfilment attempts intact.

## Preview versus staging

The Lovable preview is a visual and interaction showcase with mock state. Staging runs the real Next.js application, PostgreSQL schema, verified email flow, Razorpay Test Mode, and dry-run supplier fulfilment.
