# Recharza Content & Storefront Command Center

The protected storefront command center controls customer-facing presentation without changing payment, checkout, supplier, deployment, or fulfilment authority.

## Version model

Storefront content is stored as an append-only administrator audit ledger.

- **Save draft** creates a private sanitized draft version.
- **Publish saved draft** creates a customer-visible published version.
- **Restore published** copies the current published version into a new draft.
- Existing history is never overwritten or deleted.
- Every change requires an administrator session and an audit reason.

When no published version exists, the application uses reviewed code-owned defaults.

## Controlled surfaces

The command center can manage:

- hero visibility and copy;
- primary and secondary hero actions;
- announcement visibility, tone, copy, and internal link;
- header navigation visibility and action;
- catalogue heading and description;
- regional Mobile Legends selector visibility;
- homepage game-card visibility;
- three ordered featured-game positions;
- how-it-works cards;
- customer-benefit cards;
- footer visibility and copyright copy;
- terms, privacy, refund, and cookie policy drafts;
- safe presentation flags;
- complete draft and publication history.

## Policy publication

A policy page is publicly available only when all three conditions are true:

1. status is `APPROVED`;
2. public visibility is enabled;
3. the reviewed body is not empty.

Policy routes:

- `/policies/terms`
- `/policies/privacy`
- `/policies/refunds`
- `/policies/cookies`

Footer policy links also require the safe `showPolicyLinks` presentation flag.

## Input safety

Before content is stored:

- unknown navigation IDs are removed;
- unknown game slugs are removed;
- featured games are limited to three;
- action links must be internal paths or page anchors;
- text lengths are bounded;
- step and benefit counts are bounded;
- policy states are restricted to `DRAFT`, `REVIEW`, and `APPROVED`;
- policy bodies are size-limited;
- invalid values fall back to reviewed defaults.

## Presentation flags

The current private flags are presentation-only:

- development badges;
- starting-price snapshots;
- approved policy links.

They cannot enable checkout, live payments, supplier writes, manual paid overrides, refunds, deployment, or maintenance locks.

## Explicitly locked operations

The content system cannot:

- enable Razorpay Live Mode;
- execute provider refunds;
- mark orders paid;
- enable supplier writes;
- publish the application;
- alter product pricing;
- change order state;
- bypass game checkout gates;
- expose unpublished policy drafts.

Those operations require separate protected systems with their own authorization, audit, idempotency, and recovery behavior.

## Storefront behavior

The customer storefront reads only the latest published version. The same published configuration controls:

- homepage content;
- customer header navigation;
- announcement bar;
- game visibility;
- featured artwork;
- presentation flags;
- footer links;
- published policy pages.

Draft content remains visible only inside the administrator console preview.
