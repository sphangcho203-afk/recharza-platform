# Recharza Platform

Recharza is a multi-game top-up, gift card, and digital recharge platform being built around secure checkout, clear order tracking, and a focused mobile-first storefront.

## Current foundation

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Responsive Recharza landing page
- Initial six-game catalogue
- Playable Mobile Legends development storefront
- Package selection with clearly labelled placeholder prices
- Player and zone ID format validation
- Server-side package and price verification
- Development-only order creation
- Payment-provider abstraction that cannot charge real money
- Deployment health endpoint
- GitHub Actions verification workflow
- Environment-variable template with no real credentials

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The Mobile Legends development flow is available at:

```text
/games/mobile-legends
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

The health endpoint is available at:

```text
/api/health
```

## Development API routes

```text
POST /api/games/mobile-legends/verify
POST /api/orders
```

The verification endpoint currently checks player and zone ID format only. It does not claim to retrieve a live nickname.

The order endpoint recalculates the selected package and price on the server. It returns a temporary development order and a non-charging payment session. Orders are not persisted yet.

## Security rules

Never commit real API keys, database passwords, payment secrets, webhook secrets, service-account files, or production credentials.

Use `.env.example` only as a variable-name template. Store real values in the deployment provider's encrypted environment settings.

Never trust a price, product description, payment status, or verification result sent directly by the browser. Recalculate and verify sensitive order data on the server.

## Purchase flow

1. Choose a game
2. Select a package
3. Enter and validate player details
4. Create an order
5. Start a payment session
6. Track fulfilment status

## Next milestone

Add persistent order storage, duplicate-order protection, rate limiting, customer authentication, and a verified provider integration. Real payments must remain disabled until webhook verification and fulfilment reconciliation are complete.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
