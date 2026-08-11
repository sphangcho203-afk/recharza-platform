# Recharza Platform — OpenCode Operating Instructions

## Role

You are the primary implementation agent for Recharza Platform.

Work directly in this repository. Inspect the existing code before changing it.
Prefer small, verifiable changes over broad rewrites.

## Product

Recharza is a professional digital game-top-up platform.

Primary customer flow:

Home → Game → Product → Account/Game ID validation → Cart → Checkout → Payment → Order

The platform currently supports game/account validation and payment flows.
Do not break existing working functionality while improving UX.

## Current State

Working / established:
- MLBB/game top-up flow
- Volsever IGN/Game ID lookup
- Authentication
- Google authentication
- Customer accounts
- Cart
- Checkout/payment flow
- Billing information
- Admin functionality
- Vercel deployment
- Neon/Postgres
- Account → Saved Addresses

Current development focus:
1. Saved billing addresses in checkout
2. Cart UX
3. Customer navigation
4. Account/dashboard UX
5. Orders
6. Google signup display-name flow
7. Checkout UX
8. Responsive/mobile polish
9. Final QA

## Critical Rules

### Do not break working systems

Before modifying:
- IGN/Game ID validation
- payment processing
- authentication
- checkout
- admin functionality
- database schema

inspect the existing implementation and understand its dependencies.

Never replace working functionality with a mock or simplified implementation.

### UX direction

The goal is professional UX/UI, not a visual redesign for its own sake.

Prioritize:
- correct information hierarchy
- intuitive placement
- spacing
- consistency
- mobile usability
- clear loading states
- clear empty states
- clear error states
- minimal unnecessary interaction

Do not redesign components merely to make them look different.

### Cart

Cart must represent the customer's actual cart.

If empty, show a concise, slightly playful empty state.

Never make the Cart route render a game/product interface.

### Accounts

Google signup:
- avoid meaningless/random usernames
- use the user's Google-provided identity appropriately
- if the product asks the user for a preferred display name, preserve that choice

User-created accounts may explicitly choose their username.

### Saved Addresses

Saved addresses belong to the authenticated customer.

Support:
- add
- edit
- delete
- set default
- select during checkout
- save a newly entered address for future purchases

Never expose another customer's addresses.

Guest checkout must continue working.

### Database

Database: Neon/Postgres.

Production branch:
- project: Recherza TopUp
- project ID: solitary-lake-08821205
- branch: production

Do not expose DATABASE_URL or other secrets in source control.

Before schema changes:
1. inspect the current Prisma schema
2. inspect existing migrations
3. make the smallest safe migration
4. verify generated Prisma client
5. run the relevant build/tests

Never casually modify production data.

### Environment Variables

Never commit:
- .env
- .env.local
- .neon
- API keys
- database credentials
- payment secrets
- authentication secrets

Never print secret values in logs, commits, or responses.

### Git

Work on the appropriate feature branch.

Do not force-push or rewrite shared history unless explicitly instructed.

Before committing:
- inspect git diff
- inspect git status
- run relevant checks

Commit messages should describe the actual change.

### Vercel

Recharza is deployed on Vercel.

Existing project:
- stand-still/recharza-platform

Before declaring a change complete:
1. run the local build/checks
2. inspect the diff
3. push the intended branch
4. verify the Vercel deployment
5. inspect build logs if deployment fails

Never claim a deployment succeeded without verification.

### Verification

For meaningful changes, run the smallest relevant checks first.

For frontend changes:
- TypeScript/build checks
- lint if configured
- inspect affected routes/components

For database changes:
- migration validation
- Prisma generation
- build

For checkout/payment changes:
- inspect both authenticated and guest flows
- do not modify payment behavior unnecessarily

## Working Style

When asked to implement something:
1. inspect
2. plan internally
3. implement
4. test
5. inspect diff
6. commit/push when appropriate
7. verify deployment
8. report only what was actually completed

Do not stop at describing what should be done when you have the ability to implement it.

Do not repeatedly ask for confirmation for ordinary implementation decisions.

If something fails, investigate the actual error before guessing.

## Current Priority

The immediate next engineering task is:

### Connect saved addresses to checkout

Requirements:
- authenticated users see their saved addresses
- default address can be preselected
- selecting an address populates the existing billing structure
- users can choose a new address
- users can save a newly entered address
- guest checkout remains unchanged
- existing payment payload structure remains compatible
- do not modify the working Volsever IGN lookup

After this passes build/deployment verification, move to Cart UX.

