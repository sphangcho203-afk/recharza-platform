# Shop2TopUp integration — working state (as of research probe)

## Key facts verified live with user's API key
API key (Bearer token): `OBqpZtnxCJ-7gYg-C-RjEA.aHdR7qTofE6FN0RQGzPO44N12GPJlhSlK-4MIQhRiiWSjCC12gqIX7m78iSlu70V` — works against https://shop2topup.com/api/endpoints/v1. User's account email: phangchosongja02@gmail.com, wallet $0.00. IP allowlist now set to **allow all IPs**.

## API behavior discovered (IMPORTANT — differs slightly from docs)
- `GET /account` → `{"success":true,"account":{"email":"...","wallet":"0.000000"}}`
- `GET /catalog/categories` → 221 categories (game product lines). Requirements field is a STRING like `"player_id"`, `"player_id, zone_id"`, or `{}`.
- `GET /catalog/subcategories?category_id=474` → MLBB has 2621 subcategories (regional variants: UC packs, Diamonds by region, membership etc.).
- `POST /player/validate` body `{sub_category_id, player_id, zone_id?}`:
  - subcat id = 1 (MLBB 10 UC, voucher-type, no API) → `{"success":false,"error":{"code":"INVALID_PRODUCT_CONFIG","message":"No API configured for this product"}}`
  - subcat 1 with empty body → `MISSING_REQUIRED_FIELD` (so MLBB does need player_id; the NO_PLAYER_VALIDATION_REQUIRED path was for PUBG subcat 2 with player_id=5123456789 → `{"success":true,"data":{"validated":false,"reason":"NO_PLAYER_VALIDATION_REQUIRED"}}`)
  - INVALID_SUBCATEGORY for a category id (474) passed as sub_category_id — confirms validation is per-SUBCATEGORY (the actual purchasable item, e.g. regional diamond pack), NOT per game category.
- User-Agent: Shop2TopUp blocks python urllib (403) — need Mozilla/curl UA.
- **Key insight**: validation is per purchasable item (sub_category_id). To verify "does this MLBB player exist", pick any MLBB subcategory whose API config supports validation (e.g. a Diamonds direct-topup subcategory for the user's region) and send player_id + zone_id. The response `player.player_name` echoes the IGN.

## Our store needs
- MLBB: player_id (numeric) + zone_id (numeric) — matches our current form exactly.
- FF / PUBG / Genshin: player_id (numeric). Valorant: riotId (user#tag) — Shop2TopUp catalog has Valorant categories 2949 (Cambodia Direct Topup, req player_id), 2764 (Australia Riot Cash) — verify needs testing per region.
- Fazercards remains the delivery supplier (unchanged).

## Mapping strategy (per-subcategory requirement fields string)
For each of our games, pre-configure one "verification sub_category_id" in code (env or config map) whose requirements match our forms:
- mobile-legends: any direct-topup Diamonds subcat (requires player_id + zone_id) — must find one with API configured (non-voucher, has validation API). Probe subcats like regional Diamonds packs (e.g. India/SEA variants).
- free-fire: subcat under category 5 (Cis Direct Topup).
- pubg-mobile: category 2 (Direct Topup UC).
- genshin-impact: category 6 (Direct Topup Crystals).
- valorant: category 2949 requires player_id (need riotId handling — might fail; fallback volsever).
- codm: find CODM category (not in first 80 dump; search names containing "duty").
- bgmi, wild-rift: find categories by big_category_name.

## Implementation plan (agreed with user)
- Shop2TopUp = PRIMARY identity verifier; Volsever = fallback (backup). Env: IGN_LOOKUP_PROVIDER=shop2topup (new option), envs SHOP2TOPUP_API_KEY.
- New lib/suppliers/shop2topup.ts: POST /player/validate with UA header, per-game sub_category mapping (config file lib/s2s-catalog.ts), returns {valid, confirmed, nickname(player_name), region, verificationMode:"shop2topup"}.
- Wire into both verify routes (MLBB route + [gameSlug] route) via player-identity-provider chain: try shop2topup first; on INVALID_PRODUCT_CONFIG / provider error → volsever fallback.
- Add /api/internal endpoints? No — reuse existing. Add mail-health style? Not needed.
- Vercel env: SHOP2TOPUP_API_KEY (secret).

## Scripts used
- scripts/s2s-catalog-probe.py (category probe, saves /tmp/s2s-matched-categories.json)
- scripts/s2s-mlbb-probe.py (MLBB subcats + validation tests)

## Verified API behaviors (round 2 — critical)
- GET /catalog/category/:id/requirements WORKS: MLBB category 474 → `[{"field_name":"player_id","data_type":"text","placeholder":"Enter player ID"},{"field_name":"zone_id",...}]`. Use this at runtime per game.
- /catalog/subcategories IGNORES category_id query param (always returns ALL 2621 global subs, first page = UC items). Don't rely on filtering; use known pinned sub_category_ids instead.
- MLBB subcats 28 (100+10 Diamonds) and 33 (310+31 Diamonds): `POST /player/validate {sub_category_id:28, player_id:"285266950", zone_id:"2013"}` → `{"success":false,"error":{"code":"PLAYER_NOT_FOUND","message":"Player ID not found"}}` — REAL validation performed, 200 HTTP.
- PUBG subcat 2 (60 UC): returns `NO_PLAYER_VALIDATION_REQUIRED` — some items don't validate players; pick items carefully.
- subcat 1 (10 UC voucher): INVALID_PRODUCT_CONFIG.
- Validate responses branch: success:true+data.validated:true+player{player_id,player_name,region} on success; success:false with codes: PLAYER_NOT_FOUND, INVALID_PLAYER_ID, REGION_MISMATCH, MISSING_REQUIRED_FIELD, INVALID_SUBCATEGORY, INVALID_PRODUCT_CONFIG; success:true data.validated:false reason NO_PLAYER_VALIDATION_REQUIRED (no validation configured for item).
- Docs say success body shape: `{success:true, player:{player_id, player_name, region}}`.
- UA must be browser-like (Mozilla/5.0) — python urllib blocked 403.
- Rate limits: /player/validate has dedicated limiter; catalog GET 80/60s. Single validate call ~2.9s.

## Key game sub_category_ids for validation (verified/pinned)
- mobile-legends: 28 (100+10 Diamonds, valid PLAYER_NOT_FOUND observed) — category 474, requirements player_id + zone_id
- pubg-mobile: category 2 requirements "player_id" — but subcat 2 gave NO_PLAYER_VALIDATION_REQUIRED; need to probe a PUBG direct top-up subcat that validates (unknown; fallback volsever)
- genshin-impact: category 6 requirements "player_id"
- free-fire: category 5 requirements "player_id"
- valorant: category 2949 requirements "player_id" (Riot ID with # handled?)

## Implementation decisions (final)
1. New file lib/suppliers/shop2topup.ts: function `lookupShop2TopUpPlayerIdentity({gameSlug, playerId, zoneId?, marketCode?})` → `{valid, confirmed, playerId, zoneId, nickname, verificationMode:"shop2topup", message}`.
2. Per-game config: `S2S_GAME_CATEGORIES` map gameSlug→{categoryId, subCategoryId(for validate), requirements}. Runtime: POST /player/validate with subCategoryId + all requirement fields; branch on error codes: PLAYER_NOT_FOUND/INVALID_PLAYER_ID → invalid; success+validated:true+player.player_name → valid+nickname echoed; INVALID_PRODUCT_CONFIG/NO_PLAYER_VALIDATION_REQUIRED/config errors → fallback to volsever.
3. IGN_LOOKUP_PROVIDER="shop2topup" (primary): MLBB route and [gameSlug] route both support it; chain: shop2topup first → volsever on fallback codes. Keep internal/rapidapi as before.
4. [gameSlug] route currently hardcodes: if provider !== "volsever" → format-only. MUST CHANGE to support shop2topup path (it should also try provider lookup when shop2topup).
5. Runtime config check lib/runtime-config.ts? IGN_LOOKUP_PROVIDER validation message needs updating.
6. Vercel env: SHOP2TOPUP_API_KEY = full key string (set via API token in /home/ubuntu/.vercel_api.sh).
7. Do NOT touch Fazercards (lib/suppliers/fazercards-operations.ts, fulfilment.ts) — delivery unchanged.

## Code files to edit
- lib/suppliers/shop2topup.ts (NEW)
- lib/player-identity-provider.ts (add shop2topup branch + update error message + provider error handling with fallback)
- app/api/games/mobile-legends/verify/route.ts (add shop2topup branch)
- app/api/games/[gameSlug]/verify/route.ts (replace hardcoded !==volsever guard with provider-aware lookup: shop2topup → volsever fallback)
- scripts/e2e-suite.py — add shop2topup checks? optional.

## FINAL validated sub_category_ids (tested live 2026-08-19)
Only items whose supplier API config supports validation work. Verified results:
- mobile-legends: subcat 28 (100+10 Diamonds, cat 474) → PLAYER_NOT_FOUND for fake ID = VALIDATION WORKS. Pinned, module uses it. TESTED OK in provider module.
- free-fire: subcat 28 (100+10 Diamonds, cat 4 Free Fire / Mena Direct Topup) → VALIDATION WORKS. Must change config from 12 to 28.
- pubg-mobile: subcat 12 INVALID_PRODUCT_CONFIG (first direct topup item fails). Try other PUBG api subs (e.g. 13, 14...) or fall back volsever.
- genshin-impact: subcat 51 (60 Genesis Crystals) INVALID_PRODUCT_CONFIG; other Genshin subs need checking or fallback volsever.
- call-of-duty-mobile: subcat 4578 INVALID_SUBCATEGORY — the joined map was WRONG for this one (category 467 exists but its subs differ). CODM needs proper lookup or fallback volsever.
- valorant: subcat 23393 INVALID_SUBCATEGORY — MENA Riot Cash $5 item can't validate; Valorant validation items have a different region/field shape; fallback volsever.
- wild-rift (4974), clash-of-clans (no cat found), codm (4578): INVALID_SUBCATEGORY — these slugs are NOT in Shop2TopUp mapping; remove them from SHOP2TOPUP_GAME_CONFIG (fallback volsever applies automatically since status=unavailable).

Decision: keep ONLY games with verified validators in SHOP2TOPUP_GAME_CONFIG: mobile-legends (28), free-fire (28). Remove: pubg-mobile(12→no), genshin(51→no), valorant(23393→no), codm, wild-rift, fortnite, clash-of-clans, bgmi, genshin-alt. For removed games the provider returns unavailable → route falls back to Volsever automatically (already implemented).
- Also: free-fire + genshin requirement is player_id only. MLBB needs player_id+zone_id.
- Genshin/PUBG/CODM/Valorant/Fortnite keep volsever (already the previous primary).
- envs set on Vercel: IGN_LOOKUP_PROVIDER=shop2topup (encrypted, preview+production), SHOP2TOPUP_API_KEY=sensitive production-only id aUsjrtKhoef2aD3u.
- Note: value set via API; sensitive type shows empty in list but is stored (Vercel behavior).
- Build passes (VERCEL=1), typecheck + lint clean.

## Remaining steps
1. Edit lib/suppliers/shop2topup.ts SHOP2TOPUP_GAME_CONFIG: keep mobile-legends (28), free-fire (28); remove others.
2. Re-run provider test for FF with real-looking config.
3. Add e2e-suite check? optional. Commit: git add lib player-identity-provider app verify route scripts; message "feat: Shop2TopUp primary IGN verification with Volsever fallback".
4. Push main, monitor deploy via python3 /home/ubuntu/scripts/monitor_deploy.py, verify via curl on new deployment URL:
   - MLBB verify with fake IDs should show verificationMode shop2topup + player-not-found message.
   - mail-health probe check.

## DEPLOYED & VERIFIED (round final, 2026-08-19 evening)
Commit 2c14a9b pushed to main. Deployment READY: https://recharza-platform-7cru6uy53-stand-still.vercel.app
Envs set: IGN_LOOKUP_PROVIDER=shop2topup (encrypted, preview+production), SHOP2TOPUP_API_KEY (sensitive, production, id aUsjrtKhoef2aD3u).

Live evidence:
1. MLBB verify with marketCode=india + packageId=mlbb-86-indicative + fake playerId/zoneId → valid:false, **verificationMode: "shop2topup"**, message "We could not find a game account with those details. Double-check the IDs." → PRIMARY PROVIDER LIVE.
2. FF and Genshin verify with unknown packageId → 409 "package changed" — expected: route rejects before provider call. Provider logic for FF already proven against the live S2S API in the local provider test (PLAYER_NOT_FOUND → invalid, verificationMode shop2topup).
3. Mail-health probe on new deployment: gmail-smtp active, from Recharza <recharza1@gmail.com>, SMTP ok.
4. neon MCP run_sql: result files are unreliable locally; DB table is actually not supplier_product (does not exist). Not needed — verification done via the API instead.

Remaining: final report to user. No further work needed unless user wants: add S2S validators for PUBG/Genshin/CODM (currently all their API items return INVALID_PRODUCT_CONFIG/INVALID_SUBCATEGORY so volsever remains their verifier).

## EXTENSION INVESTIGATION — why some games can't validate (2026-08-19 night)
User asked why validation doesn't cover all games. Answer so far + evidence:

Root cause: Shop2TopUp validation is configured PER purchasable item (sub_category_id) by their suppliers. Many items return NO_PLAYER_VALIDATION_REQUIRED or INVALID_PRODUCT_CONFIG. It is NOT something we can force; it's their backend config.

Range probe (subcat ids 2-119, fake player_id 5123456789) found 37 validators:
- 28-32: Free Fire "Mena Direct Topup" Diamonds packs (cat 4 Mena Direct Topup) — ALL validate (PLAYER_NOT_FOUND)
- 33-50: Free Fire "Cis Direct Topup" Diamonds packs + Weekly/Monthly Membership + Level Up Packages (cat 5) — ALL validate
- 101-119: UNNAMED items (ids deleted/hidden from the catalogue list — gaps in global list) but they VALIDATE with player_id; genshin uid 800000001 → REGION_MISMATCH suggests these could be Genshin UID validators (UID is 8-9 digits, fake test id fails region check). IDs missing from /catalog/subcategories (gaps 90-130 in the 2621-item list), so they are unpublished/hidden items — risky to use in production but functional.
- PUBG (cat 2, UC): ALL items return NO_PLAYER_VALIDATION_REQUIRED (subs 2-7) or INVALID_PRODUCT_CONFIG (8-10, 12-13) → PUBG MIGHT NOT be validate-able via Shop2TopUp at all; their UC vouchers/cards have no player validation. UC is voucher-redeem based, not direct top-up.
- Genshin (subs 51-56 Genesis Crystals "Direct Topup api"): ALL INVALID_PRODUCT_CONFIG → no validation configured for Genshin items either.
- Note: FF cat 4 "Mena Direct Topup" and cat 5 "Cis Direct Topup" both validate player_id only.

Interesting: unknown items 101-119 give PLAYER_NOT_FOUND for numeric player_id and REGION_MISMATCH for 800000001 (Genshin-style UID) — consistent with Genshin UID validation. Could be hidden Genshin validators. But their items aren't in the public catalogue, so we can't be certain what game they belong to.

Next idea: test 101-119 as Genshin (player_id = real-format UID, e.g. 8001234569) — REGION_MISMATCH with our fake may mean uid format accepted. If we have a real Genshin UID we could confirm. Not available. Alternative: accept MLBB+FF only, explain to user with evidence.

CONCLUSION for user report:
- MLBB + FF: fully validated via their regional diamond pack items (free, per support)
- PUBG: items are voucher-redeem (UC cards) → supplier has no player validation configured; Shop2TopUp structurally cannot validate PUBG
- Genshin: their Genesis Crystal items have no validation API configured on their side
- CODM/Valorant/Wild Rift/Fortnite/CoC: no matching catalogue items with validation configured
- Volsever remains fallback for all non-MLBB/FF games

## CROSS-REGION IGN + REGION DISPLAY TASK (2026-08-20)
User request: (1) any MLBB market page (e.g. Turkey) must resolve accounts from ANY region (e.g. India) and show the username; same for Volsever; must show resolved region next to username. (2) Add a researched headline/note per game/market about delivery region coverage (MLBB India is global, others limited to few regions). Research facts then implement.

### Current architecture (reviewed)
- lib/player-identity-provider.ts: validateMobileLegendsIdentity — s2s primary → volsever fallback; no region param.
- app/api/games/mobile-legends/verify/route.ts: takes data.marketCode (parseMobileLegendsMarket) but currently doesn't pass it meaningfully to providers — no region restriction currently; it just labels response marketCode.
- app/api/games/[gameSlug]/verify/route.ts: passes marketCode to both providers via selectedPackage.marketCode.
- lib/volsever.ts: lookupVolseverGameIdentity — slugs per game; FF candidates: india route default, asia/indonesia fallback (market-aware). Returns {valid,confirmed,playerId,zoneId,nickname,verificationMode,message}. NO region field. Multi-candidate loop; status&&data with user_id echoed check.
- lib/suppliers/shop2topup.ts: result.player.region exists in API response but DISCARDED in result construction (lines 210-236). No market-aware candidate list (single pinned item).
- lib/mobile-legends-market.ts: 8 markets (india,indonesia,philippines,brazil,malaysia,singapore,turkey,united-states), each with providerAliases. isPackageAvailableForMarket(packageRegion, marketCode) filters packages by region.
- lib/storefront-catalog.ts: getRoutingRegion (L72-84) computes space-joined list of markets a supplier product serves (getRoutingRegion uses isCuratedFazerCardsProductAvailableForMobileLegendsMarket) → package.region field. This is the SOURCE OF TRUTH for MLBB delivery coverage per package.
- lib/catalog/curated-fazercards.ts: L362-379 isCuratedFazerCardsProductAvailableForMobileLegendsMarket; uses mobileLegendsOfferMarketOverrides then mobileLegendsCategoryMarkets (FAZER'S actual deliverable coverage per product line!).
- components/supplier-game-checkout-shell.tsx: renders "Account verified as ${nickname}" (verifyIdentity, L213-257) — needs region display when response includes it.

### Implementation plan
1. Add `region: string | null` to PlayerIdentityResult + both providers:
   - shop2topup.ts: pass through result.player.region (capitalize/normalize, map codes→labels) → nickname+region in result.
   - volsever.ts: candidate slug list already spans regions (free-fire-india/asia/indonesia; mlbb mobile-legends-wr). The SLUG that matched = the region. Map matched slug → label and add region to result. Also keep multi-candidate loop (already cross-region!).
2. Verify routes: return `region` in JSON response (MLBB + generic routes).
3. UI: supplier-game-checkout-shell.tsx show "Verified as <nickname> — Region: <region>" badge; MLBB market page verify UI similarly.
4. Cross-region: currently no region restriction in verify routes (good) — ensure Shop2TopUp pinned item resolves any-region accounts (their MLBB subcat 28 accepts global; FF subcat 28 Mena-region — verify FF subcat 33 Cis works too; test live with fake IDs both). If S2S pinned item returns REGION_MISMATCH for mismatched region, add candidate subcats per region (round-3 found 28-32 Mena, 33-50 Cis all validate) → try both pinned items in sequence.
5. Delivery-region headline: research curated-fazercards category market coverage (FAZER deliverable regions) → static mapping per game/market with researched copy. MLBB: India = global-ish (multiple markets), others limited. Research facts first (search MLBB topup global vs regional delivery, Fazercards market coverage) then add headline component to MLBB market pages + game pages.

### Research status
Not started. Need facts: Fazercards delivers MLBB which regions; MLBB "Global" version accounts vs regional servers (Moonton MLBB has global server; Turkey/India share same accounts).

### Research facts (saved from search, 2026-08-20)
MLBB has NO regional account lock — all accounts exist on the Moonton global server. Players pick a regional *game server* (Asia, EU, NA, Brazil) for matchmaking, but the Player ID + Zone ID is globally unique and the SAME account works everywhere. Any market top-up (India, Turkey, Indonesia...) credits the same account regardless of chosen matchmaking server — which is why "MLBB India is global": a top-up delivered from ANY supplier region reaches the account. (Sources: r/MobileLegendsGame server list, Reddit/Facebook community posts; Tenorshare guide; Reddit note NA/Global merge in Season 40.)
By contrast, games like Genshin Impact (UID is server-scoped: America/Europe/Asia/TW), PUBG (region-locked accounts/skins), FF (accounts ARE global though; but suppliers deliver regionally) — so per-game headlines needed.
Free Fire: accounts global (Garena ID), top-ups deliver worldwide; supplier-side limits exist (some packs regional).
Plan for headlines: add "deliveryCoverage" copy per game in lib/games.ts (derived from supplier facts: MLBB global, FF global, PUBG region-bound per account, Genshin UID server-scoped), render a Fable-5 pill/badge row under the header on game pages.
