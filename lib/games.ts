export type GameLogoTreatment = "native" | "invert" | "light-panel";
export type GameKind = "game" | "mobile-legends-region";
export type GameStatus = "checkout" | "catalogue" | "coming-soon";

export type GameRegion = {
  code: "global" | "india" | "indonesia" | "philippines";
  label: string;
  flag: string;
  note: string;
};

export type Game = {
  slug: string;
  title: string;
  publisher: string;
  category: string;
  family: "moba" | "battle-royale" | "shooter" | "rpg";
  kind: GameKind;
  status: GameStatus;
  logoSources: string[];
  artworkSources: string[];
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

export const mobileLegendsRegions: GameRegion[] = [
  {
    code: "india",
    label: "India",
    flag: "🇮🇳",
    note: "Indian account and supplier category routing",
  },
  {
    code: "indonesia",
    label: "Indonesia",
    flag: "🇮🇩",
    note: "Indonesia-specific catalogue routing",
  },
  {
    code: "philippines",
    label: "Philippines",
    flag: "🇵🇭",
    note: "Philippines-specific catalogue routing",
  },
];

const mobileLegendsBase = {
  publisher: "MOONTON",
  category: "MOBA",
  family: "moba" as const,
  logoSources: [
    "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Mobile_Legends_Bang_Bang_logo.png/512px-Mobile_Legends_Bang_Bang_logo.png",
  ],
  artworkSources: [
    "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
    "https://static-jupiter-cms-axis.xlaxiata.my.id/1332/pasted-image-2026-01-29T00-07-50-831Z_cropped_processed_by_imagy.webp",
  ],
  logoAlt: "Mobile Legends: Bang Bang game icon",
  artworkAlt: "Mobile Legends: Bang Bang promotional artwork",
  logoTreatment: "native" as const,
  artworkPosition: "center 30%",
  accent: "#5b7cff",
  packages: ["Diamonds", "Weekly Pass", "Twilight Pass"],
  pricingKey: "mobile-legends",
  startingPriceInPaise: 13_000,
};

export const games: Game[] = [
  {
    ...mobileLegendsBase,
    slug: "mobile-legends",
    title: "Mobile Legends",
    kind: "game",
    status: "checkout",
    badge: "Available",
    available: true,
    href: "/games/mobile-legends",
    pricingMode: "fallback",
    region: {
      code: "global",
      label: "Global",
      flag: "🌐",
      note: "Global Mobile Legends catalogue",
    },
  },
  ...mobileLegendsRegions.map(
    (region): Game => ({
      ...mobileLegendsBase,
      slug: `mobile-legends-${region.code}`,
      title: `MLBB ${region.label}`,
      kind: "mobile-legends-region",
      status: "catalogue",
      badge: `${region.flag} ${region.label}`,
      available: true,
      href: `/games/mobile-legends?region=${region.code}`,
      pricingMode: "fallback",
      region,
    }),
  ),
  {
    slug: "free-fire",
    title: "Free Fire MAX",
    publisher: "Garena",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://dl.dir.freefiremobile.com/common/web_event/official2/dist/client/img/max_logo.b96cbd2.png",
      "https://dl.dir.freefiremobile.com/common/web_event/official2/dist/client/img/full_logo.969f536.png",
    ],
    artworkSources: [
      "https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/e14db15cad1206214fe56520563e2aa7.jpg",
      "https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/f10082aee7db7a5bf0e28c5a6383e4b7.jpg",
    ],
    logoAlt: "Free Fire MAX game logo",
    artworkAlt: "Free Fire MAX game artwork",
    logoTreatment: "native",
    artworkPosition: "center",
    accent: "#f5b72b",
    packages: ["Diamonds", "Membership", "Level Up Pass"],
    pricingMode: "staged",
  },
  {
    slug: "pubg-mobile",
    title: "PUBG Mobile",
    publisher: "KRAFTON · Level Infinite",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://www.pubgmobile.com/images/event/brandassets/img-logo1.png",
      "https://www.pubgmobile.com/images/event/brandassets/img-logo3.png",
    ],
    artworkSources: [
      "https://upload.wikimedia.org/wikipedia/en/9/9f/Pubgbattlegrounds.png",
      "https://www.pubgmobile.com/images/event/brandassets/img-logo1.png",
    ],
    logoAlt: "PUBG Mobile game logo",
    artworkAlt: "PUBG Mobile game artwork",
    logoTreatment: "native",
    artworkPosition: "center 25%",
    accent: "#f3b81b",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    pricingMode: "staged",
  },
  {
    slug: "bgmi",
    title: "BGMI",
    publisher: "KRAFTON",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Battlegrounds_Mobile_India.jpg/512px-Battlegrounds_Mobile_India.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Battlegrounds_Mobile_India%2C_BGMI_LOGO_white_-_1082x360.png",
    ],
    artworkSources: [
      "https://upload.wikimedia.org/wikipedia/en/6/6f/Battlegrounds_Mobile_India.jpg",
      "https://www.battlegroundsmobileindia.com/api/fileDownload/901/2",
    ],
    logoAlt: "Battlegrounds Mobile India game icon",
    artworkAlt: "BGMI game artwork",
    logoTreatment: "native",
    artworkPosition: "center 30%",
    accent: "#ff8a2b",
    badge: "India",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    pricingMode: "staged",
  },
  {
    slug: "call-of-duty-mobile",
    title: "Call of Duty: Mobile",
    publisher: "Activision",
    category: "Shooter",
    family: "shooter",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Call_of_Duty_Mobile_Logo.png/512px-Call_of_Duty_Mobile_Logo.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Call_of_Duty_Mobile_2023_logo.svg/640px-Call_of_Duty_Mobile_2023_logo.svg.png",
    ],
    artworkSources: [
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Call_of_Duty_Mobile_Logo.png/512px-Call_of_Duty_Mobile_Logo.png",
      "https://lblog.fp.guinfra.com/file/694780e0d500923b76140cddVE93BDRB03",
    ],
    logoAlt: "Call of Duty Mobile game icon",
    artworkAlt: "Call of Duty Mobile game artwork",
    logoTreatment: "native",
    artworkPosition: "center 20%",
    accent: "#f4c430",
    packages: ["COD Points", "Battle Pass", "Vault Packs"],
    pricingMode: "staged",
  },
  {
    slug: "valorant",
    title: "VALORANT",
    publisher: "Riot Games",
    category: "Tactical FPS",
    family: "shooter",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/en/b/ba/Valorant_cover.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png",
    ],
    artworkSources: [
      "https://upload.wikimedia.org/wikipedia/en/b/ba/Valorant_cover.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png",
    ],
    logoAlt: "VALORANT game icon",
    artworkAlt: "VALORANT game artwork",
    logoTreatment: "native",
    artworkPosition: "center 18%",
    accent: "#ff4655",
    packages: ["VALORANT Points", "Regional Gift Cards"],
    pricingMode: "staged",
  },
  {
    slug: "genshin-impact",
    title: "Genshin Impact",
    publisher: "HoYoverse",
    category: "Action RPG",
    family: "rpg",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Genshin_Impact_wordmark.svg/640px-Genshin_Impact_wordmark.svg.png",
    ],
    artworkSources: [
      "https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Genshin_Impact_wordmark.svg/960px-Genshin_Impact_wordmark.svg.png",
    ],
    logoAlt: "Genshin Impact game icon",
    artworkAlt: "Genshin Impact game artwork",
    logoTreatment: "native",
    artworkPosition: "center 18%",
    accent: "#7ec8ff",
    packages: ["Genesis Crystals", "Welkin Moon"],
    pricingMode: "staged",
  },
  {
    slug: "fortnite",
    title: "Fortnite",
    publisher: "Epic Games",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    status: "coming-soon",
    logoSources: [
      "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-discover-playlist-tiles-keyart-480x270-480x270-d8d88e6f0b9d.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/FortniteLogo.svg/640px-FortniteLogo.svg.png",
    ],
    artworkSources: [
      "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-discover-playlist-tiles-keyart-480x270-480x270-d8d88e6f0b9d.jpg",
      "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-web-carousel-logo-1458x416-0adca73e5786.png",
    ],
    logoAlt: "Fortnite game icon",
    artworkAlt: "Fortnite game artwork",
    logoTreatment: "native",
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