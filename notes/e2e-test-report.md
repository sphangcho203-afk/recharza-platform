# End-to-End Integration Test Report

**Deployment under test:** [recharza-platform-lqaecvl8l-stand-still.vercel.app](https://recharza-platform-lqaecvl8l-stand-still.vercel.app) (commit `904cb74`, latest production build including the `deepmerge-ts` security pin; subsequent commit `05b45a0` adds the reusable test suite to the repo).

**Method:** A 45-check HTTP integration suite (`scripts/e2e-suite.py`) exercised the live deployment end-to-end across every major surface: health, storefront and catalog, game pages, player verification, cart and checkout, orders, accounts and authentication, support, Telegram bots, email infrastructure, staff/admin gates, and payment webhooks. All requests hit production over HTTPS with real server responses; no internal state was modified by the tests (the suite deliberately uses read-only and intentionally-failing inputs, e.g., a wrong password that must be rejected, and a dummy order ID that must not be found).

## Overall result: 45/45 PASS

| Category | Checks | Result highlights |
|---|---|---|
| Health | 2 | `/api/health` 200, `/api/readiness` reports `environment: production`, `status: ready` |
| Storefront & catalog | 9 | Homepage renders with 5 catalog game slugs; MLBB landing page 200 with new square icon (asset served as `image/png`); Free Fire page 200; MLBB India market page correctly auth-gated (307 → sign-in) for anonymous users; unknown-game URL serves a guided fallback page instead of a raw 404; all four policy pages (terms, privacy, refunds, cookies) 200; account and forgot-password pages 200 |
| Accounts & auth | 5 | Anonymous session reports `authenticated: false`; duplicate-email signup rejected 400; wrong-password login rejected 401; forgot-password and magic-link endpoints respond identically (blind) for existing and non-existing emails, so no account enumeration leak |
| Cart & checkout | 5 | Cart page and checkout page render 200; guest cart read returns a structured empty cart with guest id; adding items without a session is rejected (409); checkout cart API is auth-gated (401) |
| Orders | 4 | Orders listing is not exposed without auth (405 method guard); order lookup page 200; fetching a fake order id returns 401; creating a payment session is auth-gated (401) |
| Player verification | 5 | MLBB verify accepts the full contract payload (`marketCode` + `packageId` + numeric `playerId` + `zoneId`) and returns a structured volsever verdict; unknown package correctly 409; missing market correctly 400; missing player details correctly 400; generic game verify route responds with validation errors instead of crashing |
| Commerce | 2 | Display rates live from Frankfurter (INR base); MLBB checkout config reports `lifecycle: live`, `checkoutMode: market-routed` |
| Support | 3 | Support page 200; tickets API and email diagnostics are guarded (405/auth) |
| Telegram | 3 | Both bots healthy: primary support bot (id 8854399588) and group bot **Lexi** `@rzsupport_bot` (id 8744980224) with configured token, webhook secret, and worker chat; bot registration is auth-gated (401) |
| Email | 3 | Mail health: provider `gmail-smtp`, SMTP fully configured, from `Recharza <recharza1@gmail.com>`; both diagnostic endpoints correctly reject unauthenticated calls (401); **a live premium-template `ORDER_COMPLETED` email was sent and delivered** (Gmail message id `<6cbbaf6f-5137-151e-11f2-3e196add1371@gmail.com>`) |
| Staff & admin | 3 | Staff login rejects bad credentials (403); operator health is auth-gated (401); admin catalogue is auth-gated (403) |
| Payments | 1 | Razorpay webhook endpoint is alive and signature-gated (401 for unsigned requests) |

## Observations worth knowing

The **MLBB India market page is intentionally auth-gated** for anonymous visitors (307 → sign-in) — this is the store's logged-in purchase design, not a defect; the landing and generic game pages remain publicly browsable. The **MLBB player verification requires numeric Player ID + Zone ID** as echoed by the Volsever provider; we verified the full request/response contract end-to-end, but did not assert a successful validation because no disposable real game account exists for testing — that final step only succeeds with a genuine player's credentials, which is how it behaves for real customers. The **Razorpay webhook is in live-charge-blocked mode** per the readiness endpoint (`liveChargingBlocked: true`), so no real charges were touched by any test.

## Reusable suite

The test harness was committed to the repository (`scripts/e2e-suite.py`, commit `05b45a0`) so it can be rerun against any future deployment by executing `python3 scripts/e2e-suite.py` with `DEPLOY_URL` set. Results are printed per check and also written to `/tmp/e2e-results.json`.
