# Game Page Header Improvement (Aug 18, ~21:45)

## User request
Improve the game page header "in each game": add the game icon well there, keep wording clean, make it function well, look professional. Screenshot shows MLBB India page: header card has small circular game icon (looks like a cropped character art, not the official game icon), title "Mobile Legends: Bang Bang Top Up", badges row (India flag, 26 offers, INR, "Fixed market pricing" green, headset+Support cyan), plus region note card below.

## Files involved
1. `app/games/mobile-legends/[market]/page.tsx` lines ~92-148:
   - Header card: icon via ResilientImage (gameLogo or regionalGame.logoSources), fallbackLabel "ML", className object-contain p-2 in 64-80px rounded-lg box
   - h1 "Mobile Legends: Bang Bang Top Up"
   - badges row (line 119-125): flag+label, offers, currency, "Fixed market pricing" (emerald), Support link (cyan)
   - region note card (line 145-148): market.note + "Prices shown in X"
   - right side: hidden md:block artwork panel
2. `app/games/[gameSlug]/page.tsx` lines ~83-133: same structure, fallbackLabel = first 2 chars of title uppercase; badges include ★ 4.9 rating, offers, markets, Secure, Support.
3. `app/games/mobile-legends/page.tsx` line 56: same h1, likely similar header.
4. Game data: game logoSources/artworkSources come from supplier config (games data source, likely lib/supplier-config or games.json).

## Issues observed in screenshot
- Icon shows a cropped character scene (artwork-like) rather than the official game icon; icon box has heavy padding (p-2) and border.
- Badges are dense and unstyled (plain spans, mixed colors), "Fixed market pricing" + Support look like raw text.
- Title "Mobile Legends: Bang Bang Top Up" is fine but could drop "Top Up" redundancy on some.
- Region note card: "Use only for accounts confirmed against an approved India supplier catalogue." — wordy; could be cleaner.

## Plan
- Create a reusable `GameHeader` component in components/ with: official game icon (larger, subtle glow, object-contain no padding or minimal), title (game name only + subtitle "Instant top-up"), refined badge row with pill styling (flag+region, offers count, currency, trusted badge, support link with icons).
- Wire it into the three game page files.
- Keep same design tokens: bg-[#0d0f16] card, border-white/[0.08], emerald/cyan accents, Fable 5 style.
- Typecheck, commit, push, monitor deploy, verify.

## Production info
- Current prod URL: recharza-platform-6ojx3kpob-stand-still.vercel.app (commit cb4ad2f)
- Monitor script: python3 /home/ubuntu/scripts/monitor_deploy.py
- Vercel helpers: source /home/ubuntu/.vercel_api.sh
- Mail probe: INTERNAL_HEALTH_SECRET = rcz-probe-7k3m9q2x

## Asset inventory (verified)
- `public/assets/founder/`: mobile-legends.svg, free-fire.svg, pubg-mobile.svg, genshin-impact.svg, valorant.svg — ALL are 480x300 landscape WEBP art inside SVG (NOT square icons). These are the logoSources for ML/FF/PUBG/Genshin/Valorant and are the source of the "cropped character scene" problem.
- `public/assets/games/free-fire/logo.webp` — 800x117 wide wordmark only, not square.
- BGMI logo source: wikimedia horizontal white logo png. CODM: wikimedia horizontal logo png. Fortnite: horizontal wordmark svg.
- Games data lives in `lib/games.ts` (~10 games).
- NO square official game icons exist in repo. Plan: generate proper square game icons (AI) per game into public/assets/games/{slug}/icon.png, or create stylized icon tiles with game accent colors + official logo mark rendered square.
- Header component duplication: three pages with inline header markup:
  1. app/games/mobile-legends/[market]/page.tsx (lines 92-148, ResilientImage gameLogo + badges line 119-125)
  2. app/games/[gameSlug]/page.tsx (lines 83-133)
  3. app/games/mobile-legends/page.tsx (line ~56)

## Chosen design direction for game header
- Official square icon: generate via image generation one square icon per game (square format, app-icon style, official art) saved at public/assets/games/{game}/icon.png.
- In ResilientImage sources, prepend local icon first so it takes precedence; keep artwork fallbacks as is for artwork panel.
- Badges row: restyle as small pills (flag+region pill, offers pill, currency pill, trust badge pill, support link pill) with consistent 10-11px text, subtle borders.
- Title: keep game title, subtitle "Instant digital top-up".
- Reusable component GameHeaderProps shape should match both pages.

## Icon generation DONE (all saved)
All 10 square icons generated in public/assets/games/{slug}/icon.png (1920x1920):
mobile-legends, free-fire, pubg-mobile, battlegrounds-mobile-india, call-of-duty-mobile, valorant, genshin-impact, fortnite, league-of-legends-wild-rift, clash-of-clans.

## logoSources mapping in lib/games.ts (what each game currently uses)
- mobileLegendsBase (line 55, for slug mobile-legends + regions): ["/assets/founder/mobile-legends.svg", wikimedia ML logo]
- free-fire (line ~129): ["/assets/founder/free-fire.svg", "/assets/games/free-fire/logo.webp"]
- pubg-mobile (line ~158): ["/assets/founder/pubg-mobile.svg", "pubgmobile.com img-logo1.png"]
- bgmi (line ~187, coming-soon): [wikimedia white horizontal logo png]
- call-of-duty-mobile (line ~210, coming-soon): [wikimedia CODM logo svg png]
- valorant (line ~233): ["/assets/founder/valorant.svg", wikimedia valorant logo png]
- genshin-impact (line ~262): ["/assets/founder/genshin-impact.svg", wikimedia wordmark]
- fortnite (line ~291, coming-soon): [wikimedia FortniteLogo.svg png]
- clash-of-clans / wild-rift: not in this games list (may not be in storefront).

## Plan (remaining)
1. Add iconSource field (or prepend /assets/games/{slug}/icon.png into logoSources) per game in lib/games.ts. Simplest: add optional `icon: string` field to Game type and set it per game with local square icon path.
2. Update game page headers in:
   - app/games/mobile-legends/[market]/page.tsx (header lines ~92-148): replace gameLogo ResilientImage to use icon with accent-gradient backdrop tile; restyle badges row as pills.
   - app/games/[gameSlug]/page.tsx (header lines ~83-133): same treatment; ensure fallback when no icon.
   - app/games/mobile-legends/page.tsx (~line 56): same.
3. Badge row restyle (Fable 5): small pills with border-white/10 bg-white/[0.04], flag emoji + region, "{n} offers", currency code, "Fixed market pricing" trust pill, Support link pill.
4. Wording: title "Mobile Legends: Bang Bang" keep; subtitle "Instant digital top-up"; badges single line, no wrapping.
5. typecheck + lint + build, commit push, monitor deploy Ready, verify visually via deployment URL, report.

## Vercel/deploy helpers (already set up)
- source /home/ubuntu/.vercel_api.sh for VERCEL_TOKEN/TEAM_ID/PROJECT_ID (vars named in that file).
- python3 /home/ubuntu/scripts/monitor_deploy.py waits for Ready.
- Deployment URL: recharza-platform-{uid}-stand-still.vercel.app
- Protected probe: curl -H "Authorization: Bearer rcz-probe-7k3m9q2x" .../api/internal/mail-health
- Mail send test (premium template): curl -X POST to /api/internal/mail-send-test (no body needed) on deployment.
