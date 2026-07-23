# Multi-game checkout architecture

This document defines the contract for adding game top-up flows without copying Mobile Legends-specific logic into every route.

## Registry ownership

`lib/commerce/game-checkout.ts` is the source of truth for:

- game checkout lifecycle (`live`, `beta`, or `planned`);
- checkout mode (`market-routed`, `single-route`, or `voucher`);
- public route and supplier game key;
- required identity fields and format constraints;
- package families displayed before supplier products are approved;
- whether the production order API is allowed to accept the game.

A game card or form must not claim that checkout is live unless `orderApiEnabled` is true and the full server path enforces the same definition.

## Current lifecycle

- Mobile Legends: live architecture with regional routes, server pricing, verified orders, test payment, tracking and gated fulfilment.
- Free Fire MAX: beta architecture. Identity requirements and package families are registered, but supplier mapping and order creation remain locked.
- Other games: planned contracts only.

## Safety invariants

1. Browser-submitted prices are never authoritative.
2. A registered game is not automatically order-enabled.
3. Supplier category and field mappings must be reviewed before order submission.
4. Voucher products and direct top-ups remain separate checkout modes.
5. Market selection must be server-owned when a game requires a region.
6. Generic identity validation is format-only until a confirmed supplier or publisher API validates the destination.
7. Existing Mobile Legends routes and order behavior remain backward compatible during migration.

## Next integration slice

Refactor `POST /api/orders` to resolve the game definition first, delegate package resolution by game, and persist a normalized player-data snapshot. Mobile Legends remains the compatibility adapter while Free Fire becomes the second end-to-end dry-run implementation.
