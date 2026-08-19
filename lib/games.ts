import {
  mobileLegendsMarkets,
  type MobileLegendsMarket,
  type MobileLegendsMarketCode,
} from "@/lib/mobile-legends-market";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";

export type GameLogoTreatment = "native" | "invert" | "light-panel";
export type GameKind = "game" | "mobile-legends-region";
export type GameStatus = "checkout" | "catalogue" | "coming-soon";
export type GameRegion = MobileLegendsMarket;

export type Game = {
  slug: string;
  title: string;
  publisher: string;
  category: string;
  family: "moba" | "battle-royale" | "shooter" | "rpg";
  kind: GameKind;
  status: GameStatus;
  icon?: string;
  logoSources: string[];
  artworkSources: string[];
  artworkKey?: StorefrontArtworkKey;
  logoAlt: string;
  artworkAlt: string;
  logoTreatment: GameLogoTreatment;
  artworkPosition?: string;
  accent: string;
  badge?: string;
  available?: boolean;
  href?: string;
  packages: string[];
  pricingMode?: "live" | "fallback" | "staged";
  pricingKey?: string;
  startingPriceInPaise?: number | null;
  region?: GameRegion;
};

export const mobileLegendsRegions = mobileLegendsMarkets;

const mobileLegendsRegionArtwork: Record<
  MobileLegendsMarketCode,
  StorefrontArtworkKey
> = {
  india: "mobile-legends-india",
  indonesia: "mobile-legends-indonesia",
  philippines: "mobile-legends-philippines",
  brazil: "mobile-legends-brazil",
  malaysia: "mobile-legends-malaysia",
  singapore: "mobile-legends-singapore",
  turkey: "mobile-legends-turkey",
  "united-states": "mobile-legends-united-states",
};

const mobileLegendsBase = {
  icon: "/assets/games/mobile-legends/icon.png",
  publisher: "MOONTON",
  category: "MOBA",
  family: "moba" as const,
  logoSources: [
    "/assets/founder/mobile-legends.svg",
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Mobile_Legends_Bang_Bang_logo.png/512px-Mobile_Legends_Bang_Bang_logo.png",
  ],
  artworkSources: [
    "/assets/user-supplied-v2/1000166202-card.jpg",
    "/assets/founder/mobile-legends.svg",
    "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w960-h960",
    "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
  ],
  logoAlt: "Mobile Legends: Bang Bang logo",
  artworkAlt: "Mobile Legends: Bang Bang game artwork",
  logoTreatment: "native" as const,
  artworkPosition: "center",
  accent: "#5b7cff",
  packages: ["Diamonds", "Weekly Pass", "Twilight Pass"],
  pricingKey: "mobile-legends",
  startingPriceInPaise: 3_000,
};

export const games: Game[] = [
  {
    ...mobileLegendsBase,
    slug: "mobile-legends",
    title: "Mobile Legends",
    kind: "game",
    status: "checkout",
    available: true,
    href: "/games/mobile-legends",
    pricingMode: "fallback",
    artworkKey: "mobile-legends-india",
  },
  ...mobileLegendsRegions.map(
    (region): Game => ({
      ...mobileLegendsBase,
      slug: `mobile-legends-${region.code}`,
      title: `${region.label} · Mobile Legends`,
      kind: "mobile-legends-region",
      status: "checkout",
      available: true,
      href: `/games/mobile-legends/${region.code}`,
      pricingMode: "fallback",
      region,
      artworkKey: mobileLegendsRegionArtwork[region.code],
      artworkSources: [
        `/assets/user-supplied-v2/${
          ({
            india: "1000166202-card.jpg",
            indonesia: "1000166215-card.jpg",
            philippines: "1000166207-card.jpg",
            brazil: "1000166205-card.jpg",
            malaysia: "1000166199-card.jpg",
            singapore: "1000166201-card.jpg",
            turkey: "1000166207-card.jpg",
            "united-states": "1000166215-card.jpg",
          } as Record<MobileLegendsMarketCode, string>)[region.code]
        }`,
        ...mobileLegendsBase.artworkSources,
      ],
      artworkAlt: `${region.label} Mobile Legends market artwork`,
    }),
  ),
  {
    slug: "free-fire",
    icon: "/assets/games/free-fire/icon.png",
    title: "Free Fire MAX",
    publisher: "Garena",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "checkout",
    logoSources: [
      "/assets/founder/free-fire.svg",
      "/assets/games/free-fire/logo.webp",
    ],
    artworkSources: [
      "/assets/user-supplied-v2/1000166214-card.jpg",
      "/assets/founder/free-fire.svg",
      "https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/e14db15cad1206214fe56520563e2aa7.jpg",
    ],
    artworkKey: "free-fire",
    logoAlt: "Free Fire MAX logo",
    artworkAlt: "Free Fire MAX game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#f5b72b",
    available: true,
    href: "/games/free-fire",
    packages: ["Diamonds", "Weekly Membership", "Monthly Membership"],
    pricingMode: "live",
    pricingKey: "free-fire",
  },
  {
    slug: "pubg-mobile",
    icon: "/assets/games/pubg-mobile/icon.png",
    title: "PUBG Mobile",
    publisher: "KRAFTON · Level Infinite",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "checkout",
    logoSources: [
      "/assets/founder/pubg-mobile.svg",
      "https://www.pubgmobile.com/images/event/brandassets/img-logo1.png",
    ],
    artworkSources: [
      "/assets/user-supplied-v2/1000166210-card.jpg",
      "/assets/founder/pubg-mobile.svg",
      "https://upload.wikimedia.org/wikipedia/en/9/9f/Pubgbattlegrounds.png",
    ],
    artworkKey: "pubg-mobile",
    logoAlt: "PUBG Mobile logo",
    artworkAlt: "PUBG Mobile game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#f3b81b",
    available: true,
    href: "/games/pubg-mobile",
    packages: ["Unknown Cash", "Elite Pass", "Prime Plus"],
    pricingMode: "live",
    pricingKey: "pubg-mobile",
  },
  {
    slug: "bgmi",
    icon: "/assets/games/battlegrounds-mobile-india/icon.png",
    title: "Battlegrounds Mobile India",
    publisher: "KRAFTON",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: ["https://upload.wikimedia.org/wikipedia/commons/9/99/Battlegrounds_Mobile_India%2C_BGMI_LOGO_white_-_1082x360.png"],
    artworkSources: [
      "/assets/user-supplied/1000166209.jpg",
      "https://upload.wikimedia.org/wikipedia/en/6/6f/Battlegrounds_Mobile_India.jpg",
      "/assets/games/bgmi/cover.webp",
    ],
    artworkKey: "bgmi",
    logoAlt: "Battlegrounds Mobile India logo",
    artworkAlt: "Battlegrounds Mobile India game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#ff8a2b",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    pricingMode: "staged",
  },
  {
    slug: "call-of-duty-mobile",
    icon: "/assets/games/call-of-duty-mobile/icon.png",
    title: "Call of Duty: Mobile",
    publisher: "Activision",
    category: "Shooter",
    family: "shooter",
    kind: "game",
    status: "coming-soon",
    logoSources: ["https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Call_of_Duty_Mobile_2023_logo.svg/1280px-Call_of_Duty_Mobile_2023_logo.svg.png"],
    artworkSources: [
      "/assets/user-supplied/1000166211.jpg",
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Call_of_Duty_Mobile_Logo.png/512px-Call_of_Duty_Mobile_Logo.png",
      "/assets/games/call-of-duty-mobile/cover.webp",
    ],
    artworkKey: "call-of-duty-mobile",
    logoAlt: "Call of Duty Mobile logo",
    artworkAlt: "Call of Duty Mobile game artwork",
    logoTreatment: "invert",
    artworkPosition: "center",
    accent: "#f4c430",
    packages: ["COD Points", "Battle Pass", "Vault Packs"],
    pricingMode: "staged",
  },
  {
    slug: "valorant",
    icon: "/assets/games/valorant/icon.png",
    title: "VALORANT",
    publisher: "Riot Games",
    category: "Tactical FPS",
    family: "shooter",
    kind: "game",
    status: "checkout",
    logoSources: [
      "/assets/founder/valorant.svg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Valorant_logo.svg/960px-Valorant_logo.svg.png",
    ],
    artworkSources: [
      "/assets/user-supplied-v2/1000166213-card.jpg",
      "/assets/founder/valorant.svg",
      "https://upload.wikimedia.org/wikipedia/en/b/ba/Valorant_cover.jpg",
    ],
    artworkKey: "valorant",
    logoAlt: "VALORANT logo",
    artworkAlt: "VALORANT game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#ff4655",
    available: true,
    href: "/games/valorant",
    packages: ["VALORANT Points"],
    pricingMode: "live",
    pricingKey: "valorant",
  },
  {
    slug: "genshin-impact",
    icon: "/assets/games/genshin-impact/icon.png",
    title: "Genshin Impact",
    publisher: "HoYoverse",
    category: "Action RPG",
    family: "rpg",
    kind: "game",
    status: "checkout",
    logoSources: [
      "/assets/founder/genshin-impact.svg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Genshin_Impact_wordmark.svg/960px-Genshin_Impact_wordmark.svg.png",
    ],
    artworkSources: [
      "/assets/user-supplied-v2/1000166212-card.jpg",
      "/assets/founder/genshin-impact.svg",
      "https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg",
    ],
    artworkKey: "genshin-impact",
    logoAlt: "Genshin Impact logo",
    artworkAlt: "Genshin Impact game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#7ec8ff",
    available: true,
    href: "/games/genshin-impact",
    packages: ["Genesis Crystals", "Chronal Nexus", "Welkin Moon"],
    pricingMode: "live",
    pricingKey: "genshin-impact",
  },
  {
    slug: "fortnite",
    icon: "/assets/games/fortnite/icon.png",
    title: "Fortnite",
    publisher: "Epic Games",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/FortniteLogo.svg/1280px-FortniteLogo.svg.png"],
    artworkSources: [
      "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-discover-playlist-tiles-keyart-480x270-480x270-d8d88e6f0b9d.jpg",
      "/assets/games/fortnite/cover.webp",
    ],
    artworkKey: "fortnite",
    logoAlt: "Fortnite logo",
    artworkAlt: "Fortnite game artwork",
    logoTreatment: "invert",
    artworkPosition: "center",
    accent: "#8d5cff",
    packages: ["V-Bucks", "Starter Packs", "Gift Cards"],
    pricingMode: "staged",
  },
];

export const mainGames = games.filter((game) => game.kind === "game");
export const regionalMobileLegendsGames = games.filter(
  (game) => game.kind === "mobile-legends-region",
);
