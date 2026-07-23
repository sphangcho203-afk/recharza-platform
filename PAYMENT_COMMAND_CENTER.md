# Recharza Payment Command Center

The Payment Command Center is the protected administration surface for payment evidence, signed webhook receipts, reconciliation queues, refund preparation, disputes, and payment-failure investigations.

It is intentionally not a money-moving interface.

## Data sources

The command center reads from existing durable records:

- Recharza orders and their server-owned amounts
- Razorpay Test Mode provider order IDs
- verified Checkout callback events
- signed webhook receipts
- order payment-event history
- fulfilment-attempt counts
- administrator audit records

Raw secrets, order access tokens, session hashes, webhook secrets, API secrets, card details, passwords, OTPs, and customer authentication data are never returned.

## Views

### Attention queue

Collects payment-pending orders, failed payment orders, failed webhook receipts, and ignored receipts with reconciliation errors.

### Payment sessions

Shows the stored Recharza order, settlement amount, provider order ID, provider payment ID when recorded, payment state, webhook count, fulfilment count, and linked case count.

### Webhook receipts

Shows signed webhook evidence after ingestion: provider event ID, event type, receipt status, linked order, provider order ID, provider payment ID, amount, currency, provider state, and reconciliation error.

The raw webhook payload is not sent to the browser.

### Payment cases

Cases are append-only workflows stored through `AdminAuditLog` events.

Supported types:

- `RECONCILIATION`
- `REFUND_REVIEW`
- `DISPUTE`
- `PAYMENT_FAILURE`

Supported states:

- `OPEN`
- `INVESTIGATING`
- `AWAITING_EVIDENCE`
- `READY_FOR_APPROVAL`
- `RESOLVED`
- `DISMISSED`

Creating or advancing a case requires a verified administrator session and a written audit reason. Existing history is never overwritten.

## Refund-review boundary

A refund-review case may record a proposed amount only when:

- it is attached to a stored order;
- the amount is a positive integer in minor currency units;
- the amount does not exceed the order's stored settlement amount.

This does not call Razorpay, change payment state, mark a refund complete, or move money.

## Locked actions

The following actions remain intentionally disabled:

- replaying stored webhooks;
- manually marking an order paid;
- executing a provider refund;
- submitting a provider dispute;
- enabling Razorpay Live Mode.

These require provider-backed idempotency, approval policy, recovery behavior, permission enforcement, and dedicated immutable records before activation.

## Provider state

The admin UI reports only redacted configuration state:

- test-ready;
- partial;
- unconfigured;
- live key blocked.

It never returns key IDs, secrets, webhook secrets, or credential fragments.

## Next payment milestones

1. Dedicated provider transaction ledger with multiple attempts per order
2. Safe webhook reprocessing with original signature-verification evidence
3. Dual approval for refunds and payment-state overrides
4. Provider refund API integration with idempotency and reconciliation
5. Dispute evidence attachments and response deadlines
6. Staff payment permissions separated into read, investigate, and approve scopes
7. Payment-case assignment, SLA tracking, and notifications
