# Recharza Product System

This document is the source of truth for how Recharza is structured as a product. It separates customer features, staff operations, administrator controls, module readiness, permissions, and design behavior.

## 1. Product surfaces

Recharza has exactly three product surfaces.

### Customer surface

Routes:

```text
/
/games/mobile-legends
/account
/orders/lookup
/orders/:orderId
```

Purpose:

- browse supported games
- choose a supported Mobile Legends market
- verify account ownership
- create an account-owned order
- continue Razorpay Test Mode checkout
- track private order and fulfilment state
- view account-owned order history

The customer surface must never expose supplier, pricing, staff, audit, or operator navigation.

### Staff surface

Route:

```text
/staff
```

Allowed roles:

```text
STAFF
ADMIN
```

Purpose:

- review protected orders
- inspect player validation state
- ensure or retry allowed fulfilment attempts
- handle operational work as persistent workflows are implemented

Staff cannot configure pricing, supplier publication, staff roles, or store-wide settings.

### Administrator surface

Route:

```text
/admin
```

Allowed role:

```text
ADMIN
```

Purpose:

- review system health
- manage supplier catalogue synchronization
- manage pricing policy
- inspect and recover orders
- govern future customer, staff, promotion, support, audit, and settings modules

The former `/operator` route is not a fourth product surface. It redirects verified users to the appropriate staff or administrator workspace.

## 2. Module lifecycle

Every product module has one state in `lib/product-system.ts`.

### `live`

The workflow has a real route or control, persistent state where required, permission checks, loading/error handling, and a supported user path.

### `beta`

The workflow is usable but incomplete, preview-based, read-only, or missing some operational depth. Beta modules must be labelled visibly.

### `planned`

The workflow is part of the roadmap but does not have the necessary persistence, API contract, authorization, or recovery behavior. Planned modules must not render active controls.

### `hidden`

The workflow must not appear in navigation or product surfaces.

A module does not become live because a button exists. It becomes live only when its complete workflow exists.

## 3. Role and route enforcement

Protected routes use `requireWorkspaceSession` from `lib/server-session.ts` before rendering.

Rules:

```text
CUSTOMER → customer surface only
STAFF    → customer + staff surfaces
ADMIN    → customer + staff + administrator surfaces
```

Unauthenticated users are redirected to:

```text
/account?returnTo=<protected-route>&reason=sign-in
```

Verified users with insufficient roles are redirected to:

```text
/account?reason=forbidden
```

Magic-link requests recover the guarded return path only from a same-origin account-page referrer. Every return path is sanitized to prevent open redirects.

API authorization remains mandatory even when a page is server-guarded. Page guards protect presentation; API guards protect data and writes.

## 4. Customer journey

The supported Mobile Legends customer journey is:

```text
Storefront
→ choose Mobile Legends market
→ verify email account
→ choose package
→ enter player and zone IDs
→ validate destination
→ create idempotent account-owned order
→ open private tracking
→ continue Razorpay Test Mode
→ signed webhook establishes payment state
→ fulfilment is planned or submitted
→ customer tracks explicit updates
```

The customer browser never controls:

- retail price
- account ownership
- payment state
- supplier state
- fulfilment success

## 5. Navigation ownership

Navigation must come from `lib/product-system.ts`.

Do not create independent route arrays inside headers, footers, dashboards, or sidebars.

The registry controls:

- label
- route
- description
- audience
- module state
- workspace visibility

This prevents hidden or planned routes from appearing accidentally.

## 6. Design system

Shared visual tokens are defined in `app/globals.css`.

Core token groups:

- surfaces
- borders
- primary and muted text
- brand colors
- success, warning, and danger states
- focus ring
- radii
- panel shadow

Reusable utility classes:

```text
.system-panel
.system-card
.system-empty-state
```

Shared state components:

```text
ModuleStateBadge
SystemState
WorkspaceNavigation
```

New pages must include:

- loading state
- empty state
- error or recovery state
- permission state when protected
- reduced-motion compatibility
- narrow-phone layout

## 7. Honest controls

Controls must follow these rules:

- live controls perform a real action
- beta controls disclose limitations
- planned controls are disabled or replaced by a roadmap state
- destructive or financial actions require server verification
- internal controls never appear on the customer surface

Do not add buttons solely to make a dashboard look populated.

## 8. Current module map

### Customer

| Module | State |
|---|---|
| Game catalogue | Live |
| Mobile Legends market chooser | Live |
| Verified account sign-in | Live |
| Account-owned order history | Live |
| Saved players derived from orders | Beta |
| Private tracking | Live |
| Razorpay Test Mode continuation | Beta |
| Profile editing | Planned |
| Rewards | Planned |
| Support tickets | Planned |
| Device/session management | Planned |

### Staff

| Module | State |
|---|---|
| Protected order operations | Live |
| Assigned work queue | Beta |
| Shift activity | Beta |
| Support inbox | Planned |
| Escalation workflow | Planned |

### Administrator

| Module | State |
|---|---|
| Overview | Live |
| Order operations | Live |
| Pricing rules | Live |
| Supplier health and synchronization | Live |
| Product catalogue management | Beta |
| Payment overview | Beta |
| Audit visibility | Beta |
| Customer management | Planned |
| Staff and role management | Planned |
| Promotions | Planned |
| Support administration | Planned |
| Store settings | Planned |

## 9. Adding a feature

Before adding a new feature:

1. Assign its audience and module state.
2. Add it to `lib/product-system.ts`.
3. Define persistence and ownership.
4. Define API authorization.
5. Define loading, empty, error, and recovery states.
6. Define mobile behavior.
7. Add or update protected route guards.
8. Add CI-safe validation.
9. Move it to live only after the complete path works.

## 10. Next product-system milestones

Recommended order:

1. self-host reviewed game media
2. real support-ticket persistence and assignment
3. account profile editing
4. device/session list and revocation
5. persisted staff queue and assignment
6. admin customer and role management
7. notification and email event system
8. deployment observability and alerting
9. explicit refund workflow
10. additional game checkout adapters

Supplier and IGN APIs can be integrated after the user, role, navigation, and module system remains stable through staging tests.
