# Volsever endpoint coverage findings

Research date: 2026-08-15.

## Verified public documentation

- Mobile Legends with region: https://rw1fk3q1mm.apidog.io/mobile-legends-with-region-38963557e0
  - Endpoint: `/proxy/api/game/mobile-legends-wr`
  - Required query parameters: `id`, `zone`
  - Response identity fields: `data.user_id`, `data.username`, `data.zone`
  - Authentication header: `X-API-KEY`

- Free Fire India: https://rw1fk3q1mm.apidog.io/free-fire-india-region-39923326e0
  - Endpoint: `/proxy/api/game/free-fire-india`
  - Required query parameter: `id`
  - Documentation says India region uses `IND`
  - Response identity fields: `data.user_id`, `data.username`, optional `data.zone`

- Free Fire Asia: https://rw1fk3q1mm.apidog.io/free-fire-asia-region-39923322e0
  - Endpoint: `/proxy/api/game/free-fire-asia`
  - Covers `SG, ID, VN, TH, TW, MY, PK, BD`
  - Required query parameter: `id`

- Free Fire US: https://rw1fk3q1mm.apidog.io/free-fire-us-region-39923332e0
  - Endpoint: `/proxy/api/game/free-fire-us`
  - Covers `BR, US, NA, LATAM`
  - Required query parameter: `id`

- Valorant Indonesia: https://rw1fk3q1mm.apidog.io/valorant-indonesia-38963578e0
  - Endpoint: `/proxy/api/game/valorant-indonesia`
  - Required query parameter: `id`
  - Documentation example uses a text ID such as `ucup`, not a numeric player ID.

- Genshin Impact Global: https://rw1fk3q1mm.apidog.io/genshin-impact-global-38963524e0
  - Endpoint: `/proxy/api/game/genshin-impact`
  - Required query parameters: `id`, `zone`
  - Supported zones: `os_asia`, `os_usa`, `os_euro`, `os_cht`

- Genshin Impact locked-region: https://rw1fk3q1mm.apidog.io/genshin-impact-lock-region-38963525e0
  - Endpoint: `/proxy/api/game/genshin-impact-cd`
  - Required query parameters: `id`, `zone`
  - Supported zones: `os_asia`, `os_usa`, `os_euro`, `os_cht`

- Volsever list-game documentation: https://rw1fk3q1mm.apidog.io/list-game-38977792e0
  - Public list endpoint: `/proxy/list-game`
  - The published list includes many endpoint slugs, including Call of Duty Mobile Indonesia and other games.

## Current Recharza gaps discovered

- `lib/volsever.ts` aliases only Free Fire, PUBG Mobile, Valorant, and Genshin Impact. Mobile Legends is not mapped to the documented `mobile-legends-wr` route.
- `lib/storefront-game-catalog.ts` only allows supplier checkout slugs `free-fire`, `pubg-mobile`, `valorant`, and `genshin-impact`, so Mobile Legends regional offers cannot reach the generic verification endpoint.
- `lib/commerce/game-identity.ts` recognizes only Valorant Riot ID and Genshin UID/server specially; all other games are treated as numeric player IDs, which is incompatible with Valorant’s documented text ID endpoint unless the Riot ID is transformed or a different API contract is used.
- The generic Volsever client currently sends `zone` whenever present and expects `data.user_id` to exactly echo the submitted ID. This is appropriate for documented numeric-ID routes but may be too strict for provider routes that return normalized or alternate identity fields.
- Games marked `coming-soon` or `planned` in the catalogue do not have published supplier products and should not be presented as fully live validation flows until their supplier mappings are actually available.

## Implementation direction

Use a declarative per-game verification mapping with endpoint candidates, input mode, required zone behavior, and response normalization. Include Mobile Legends regional routing through `mobile-legends-wr`; keep Free Fire India/Asia/US/EU/MENA fallbacks according to package market; use text identity for Valorant; use documented Genshin global or locked-region endpoint according to server; and return an explicit provider-supported/unavailable state for games without a verified supplier endpoint instead of claiming universal validation.

## Source note

These findings are based on the public Volsever Apidog OpenAPI pages above. They establish endpoint contracts, but a live key-backed smoke test is still required for each game and region before declaring production validation fully working.
