# Game brand assets

Recharza uses real game logos to identify the digital products presented in the catalogue. The logos remain property and trademarks of their respective publishers. Their presence does not claim sponsorship, partnership, endorsement, or official publisher status.

## Current logo sources

| Game | Publisher | Asset source |
| --- | --- | --- |
| Mobile Legends: Bang Bang | MOONTON | Mobile Legends 2020 transparent wordmark sourced from `m.mobilelegends.com` through the Vector69 archive page |
| PUBG Mobile | KRAFTON / Level Infinite / LightSpeed Studios | Official PUBG Mobile brand-assets endpoint: `pubgmobile.com/images/event/brandassets/down-logo5.png` |
| Battlegrounds Mobile India | KRAFTON | Official BGMI logo mirrored by Wikimedia Commons from `battlegroundsmobileindia.com` |
| Call of Duty: Mobile | Activision | Current game wordmark mirrored by Wikimedia Commons from the official Call of Duty website |
| VALORANT | Riot Games | Official wordmark mirrored by Wikimedia Commons from `playvalorant.com` |
| Genshin Impact | HoYoverse | Game wordmark mirrored by Wikimedia Commons |
| Fortnite | Epic Games | Game wordmark mirrored by Wikimedia Commons from Epic Games |
| Free Fire | Garena | Free Fire wordmark mirrored by Wikimedia Commons |

## MLBB regional catalogue rules

India, Indonesia, Philippines, and Arabia are not represented as separate games or invented regional logos. They reuse the Mobile Legends: Bang Bang logo and add a region badge and supplier-routing label.

Regional supplier products remain unpublished until their exact FazerCards category IDs are reviewed and added to `FAZERCARDS_PUBLISHED_CATEGORY_IDS`.

## Implementation rules

- Do not redraw, distort, recolor, or combine publisher logos into a fake official mark.
- Preserve readable aspect ratios with `object-contain`.
- Dark wordmarks may receive a CSS inversion for contrast on the storefront's dark background.
- Do not place Recharza branding inside a publisher logo.
- Do not imply official publisher partnership.
- Prefer locally hosted reviewed assets before production launch. The current remote assets are an integration-stage implementation and should be migrated into the deployment asset pipeline after legal and brand review.
