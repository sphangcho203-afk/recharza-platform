# Recharza Platform

Recharza is a multi-game top-up, gift card, and digital recharge platform being built around secure checkout, clear order tracking, and a focused mobile-first storefront.

## Current foundation

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Responsive Recharza landing page
- Initial six-game catalogue
- Reusable catalogue components
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

## Security rules

Never commit real API keys, database passwords, payment secrets, webhook secrets, service-account files, or production credentials.

Use `.env.example` only as a variable-name template. Store real values in the deployment provider's encrypted environment settings.

## Planned purchase flow

1. Choose a game
2. Select a package
3. Enter and verify player details
4. Pay and receive an order record
5. Track fulfilment status

## Next milestone

Build the first complete Mobile Legends product flow with package selection, player-ID validation, order creation, and a payment-provider abstraction.

## Branch workflow

Development changes should be made on feature branches and reviewed through pull requests before entering `main`.
