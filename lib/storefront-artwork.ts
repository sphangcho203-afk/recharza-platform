export const storefrontArtworkPositions = {
  "mobile-legends-india": { column: 0, row: 0 },
  "free-fire": { column: 1, row: 0 },
  "pubg-mobile": { column: 2, row: 0 },
  "mobile-legends-indonesia": { column: 3, row: 0 },
  bgmi: { column: 0, row: 1 },
  "call-of-duty-mobile": { column: 1, row: 1 },
  "genshin-impact": { column: 2, row: 1 },
  fortnite: { column: 3, row: 1 },
  "mobile-legends-philippines": { column: 0, row: 2 },
  valorant: { column: 1, row: 2 },
  "mobile-legends-brazil": { column: 2, row: 2 },
  "mobile-legends-malaysia": { column: 3, row: 2 },
  "mobile-legends-singapore": { column: 0, row: 3 },
  "mobile-legends-turkey": { column: 1, row: 3 },
  "mobile-legends-united-states": { column: 2, row: 3 },
  "mobile-legends-global": { column: 3, row: 3 },
} as const;

export type StorefrontArtworkKey = keyof typeof storefrontArtworkPositions;

export const storefrontArtworkSprite = "/assets/storefront/games-sprite.svg";

export function getStorefrontArtworkStyle(key: StorefrontArtworkKey) {
  const position = storefrontArtworkPositions[key];
  const x = (position.column / 3) * 100;
  const y = (position.row / 3) * 100;

  return {
    backgroundImage: `url(${storefrontArtworkSprite})`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "400% 400%",
  } as const;
}
