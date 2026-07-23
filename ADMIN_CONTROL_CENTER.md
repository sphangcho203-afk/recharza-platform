# Recharza Control Center

The Recharza Control Center is the protected master administration layer for the entire store. It is intentionally broader than a normal ecommerce dashboard: it combines store commands, operational alerts, database exploration, public-interface access, catalogue control, pricing, suppliers, order operations, sessions, payment evidence, fulfilment evidence, and audit history.

## Current upgrade

This milestone adds:

- 36 registered control commands across Storefront, Commerce, Operations, Data, Security, and System groups;
- explicit `live`, `beta`, `planned`, and `locked` command states;
- eight real database views:
  - orders;
  - customers;
  - supplier products;
  - payment webhook events;
  - fulfilment attempts;
  - authentication sessions;
  - administrator audit logs;
  - supplier synchronization runs;
- cross-column search;
- dataset switching;
- compact and comfortable row density;
- CSV export of the visible result set;
- record inspection and JSON copying;
- live metrics and operational alerts;
- server-rendered, protected database snapshots;
- refresh through the authenticated admin route.

## Safety model

The database explorer is read-only. Database mutation must remain inside domain-specific controls with authorization, validation, audit reasons, idempotency, and recovery behavior.

The following commands remain locked:

- public deployment;
- supplier writes;
- emergency store lock;
- secret rotation;
- refunds;
- maintenance mode.

They must not become active merely because a button exists. Each command requires a server-side capability, role checks, confirmation flow, audit persistence, rollback or recovery behavior, and focused tests.

## Data exposure

The Control Center is restricted to verified administrators through the existing workspace-session gate. It is marked `noindex` and must never be linked from the customer navigation.

The explorer must not display:

- password material;
- session token hashes;
- magic-link tokens;
- order access-token hashes;
- supplier secrets;
- payment secrets;
- raw payment payloads;
- full private metadata unless a future audited detail endpoint explicitly allows it.

## Next milestones

1. Persisted admin table preferences and saved views.
2. Server-side pagination and advanced filters.
3. Customer restriction and session-revocation controls.
4. Role and staff-access management.
5. Payment reconciliation detail pages.
6. Support ticket database and assignment workflow.
7. Content and homepage controls.
8. Feature flags and maintenance-state persistence.
9. Backup and restore evidence.
10. Dual-approval gates for destructive commands.
