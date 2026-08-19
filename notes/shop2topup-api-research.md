# Shop2TopUp reseller API — research notes (user's new B2B platform for IGN verification)

## User's plan
Use Shop2TopUp (shop2topup.com) reseller API for **IGN/username verification only** (they accept verification, prices are high so NOT used for delivery). **Fazercards stays the delivery supplier** (already integrated via lib/suppliers/fazercards-operations.ts, fulfilment.ts, storefront-catalog.ts curated-fazercards).

## API contract (from https://shop2topup.com/en/reseller-api/docs and /docs/player)
- Base URL: https://shop2topup.com/api/endpoints/v1
- Auth header on every request: `Authorization: Bearer <keyId>.<secret>` (keyId + secret from reseller panel API Access page; supports IP allowlist; wrong IP → IP_NOT_ALLOWED)
- All responses have boolean `success`. Failures: `{ success: false, error: { code, message, details? } }` — branch on code.
- Player validation endpoint: **POST /player/validate**
  - Body: `{ sub_category_id: number (product subcategory id), player_id: string, ...requirements (extra fields from GET /catalog/category/:categoryId/requirements, e.g. "server": "Asia") }`
  - First call GET /catalog/category/:categoryId/requirements to learn required fields per game (single_select/multi_select must use values from select_options).
  - Success response: `{ success: true, player: { player_id: string, player_name: string, region: string } }`
  - Region mismatch at order time → REGION_MISMATCH.
  - Has dedicated rate limiter (X-RateLimit-* headers; 429 + Retry-After).
- Catalog is 3-level tree: big categories → categories → subcategories (subcategory = the item bought).
- Account check: GET /account (proves key works, wallet balance).
- Order creation POST /orders/create is idempotent on order_id UUID; webhook HMAC-SHA256 signed payloads. (Not needed — Fazercards keeps delivery.)
- Interactive playground at /en/reseller-api/docs/player accepts pasted key for live tests.

## Current verification architecture (our codebase)
- player-identity-provider.ts: validateMobileLegendsIdentity({playerId, zoneId}) — numeric normalization, dispatches by env IGN_LOOKUP_PROVIDER (internal | volsever | rapidapi).
- lib/volsever.ts: lookupVolseverGameIdentity({gameSlug, playerId, zoneId, marketCode?}) — POST to VOLSEVER_API_BASE with X-API-Key, reads data.user_id echoed + data.username/nickname + data.zone; valid only when echoedId === playerId and nickname present.
- app/api/games/mobile-legends/verify/route.ts (POST): rate-limited (20/10min), payload {marketCode, packageId, playerId, zoneId}; MLBB strictly numeric IDs; MLBB alias in volsever = "mobile-legends-wr".
- app/api/games/[gameSlug]/verify/route.ts: generic supplier checkout flow; payload {packageId, marketCode, identity}; validateSupplierCheckoutIdentity in lib/commerce/game-identity.ts (format-only validation, valorant riotId etc.) + volsever lookup for others.
- Fazercards: fulfilment via lib/fulfilment.ts (ensureOrderFulfilment after payment webhook), supplierProduct on order, provider "fazercards".

## Integration design (proposed)
1. New lib/suppliers/shop2topup.ts (or shop2topup-client.ts): POST /player/validate with Bearer keyId.secret env; map our gameSlug+package → sub_category_id config (env or small mapping file).
2. Extend IGN_LOOKUP_PROVIDER to accept "shop2topup"; add validateViaShop2TopUp(path) returning PlayerIdentityResult-like struct with nickname/region.
3. Wire into both verify routes as an additional provider; keep volsever as default for delivery-relevant games, shop2topup as verify-only fallback (provider chain: try shop2topup when volsever fails, controlled by env).
4. Vercel envs to add: SHOP2TOPUP_API_KEY_ID, SHOP2TOPUP_API_SECRET (secret), optionally SHOP2TOPUP_CATALOG (per-game sub_category_id mapping JSON).
5. Fazercards untouched for delivery; only identity verification path changes.

## Pending from user
- API keyId + secret (they have the reseller key), and which games/sub_category_ids they want verified.
