# Delivery-region matrix research (2026-08-20)

## Key facts (grounded in our own catalogue + supplier documentation)

Our live Fazercards catalogue for MLBB exposes exactly these product regions:
`mobile_legends_global` (20 offers), `mobile_legends_india` (india market),
`mobile_legends_indonesia` (45 offers), `mobile_legends_philippines` (70),
`mobile_legends_malaysia` (92), `mobile_legends_singapore` (117).
Turkey and United States markets reference FazerCards TR/US product lines via the
market note ("FazerCards Turkey product line", "FazerCards United States product line").

## Moonton server rules (from supplier docs, moogold, kinguin, redxgame)
- MLBB has ONE global account system (UID+Zone), but TOP-UP catalogues are
  region-scoped:
- `mobile_legends_global`: works on MOST accounts but EXCLUDES Indonesia,
  Brazil, Philippines (Kinguin: "Global Except Indonesia/Brazil/Philippines/
  Singapore"; Codashop US sells Global product). i.e. Global credits
  Asia-except-ID/PH, Turkey, EU, NA, LatAm accounts.
- `mobile_legends_indonesia` (Rp pricing): Indonesia accounts ONLY
  (moogold: "This product is only available for Mobile Legends players in
  Indonesia. If you are not an Indonesia player, purchase the Global version").
- `mobile_legends_philippines`: Philippines accounts only (PHP pricing).
- `mobile_legends_india`: India accounts only (INR pricing).
- Brazil: Brazil-only product line.
- Malaysia/Singapore: SEA (MY/SG) catalogues — MY+SG accounts.
- Turkey/US markets: local FazerCards product lines — local accounts only.
- Cross-region recharge is explicitly BLOCKED by Moonton ("Cross Region
  Recharge blocked" FB group reports; Moonton enforces server matching at
  catalogue level).

## Generalisation to other games (our catalogue)
- Free Fire: FazerCards product lines id (Indonesia), ph (PH), sg, my_sg,
  bd (Bangladesh). Garena IDs are global but supplier packs are REGION-scoped —
  each catalogue only credits accounts of that region.
- PUBG Mobile: FazerCards `pubg_mobile_auto` — region-bound UC by account
  region (voucher redeem).
- Valorant: id/ph/my/sg VP catalogues — Riot Points are strictly REGIONAL
  (Riot region pricing). VP purchased in one region never credits another.
- Genshin Impact: UID prefix = server (Asia 8xxxx, America 7xxxx, Europe
  9xxxx, TW/HK/MO 6xxxx). HoYoverse server rule.
- BGMI: India-only server.
- CODM: CP via Activision global account — global.
- Fortnite: Epic account global; V-Bucks tied to platform/storefront,
  delivered to the Epic account.

## Honest user-facing copy rule (user requirement)
- Verification (IGN check) works across any country — any player can check
  their username from any market page.
- Delivery (credit) ONLY succeeds when the chosen catalogue's region matches
  the account's server region.
- Headlines must say which catalogue delivers to which accounts; never claim
  "every market delivers to every account".
