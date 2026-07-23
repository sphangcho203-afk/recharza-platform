import {
  mobileLegendsMarkets,
  type MobileLegendsMarket,
} from "@/lib/mobile-legends-market";

export type GameLogoTreatment = "native" | "invert" | "light-panel";
export type GameKind = "game" | "mobile-legends-region" | "gift-card";
export type GameStatus = "checkout" | "catalogue";
export type GameRegion = MobileLegendsMarket;
export type GameFamily =
  | "moba"
  | "battle-royale"
  | "shooter"
  | "rpg"
  | "strategy"
  | "sports"
  | "sandbox"
  | "platform"
  | "gift-card";
export type FulfilmentType =
  | "player-id"
  | "uid"
  | "redeem-code"
  | "gift-card"
  | "wallet"
  | "subscription";

export type GameInputField = {
  id: string;
  label: string;
  placeholder: string;
  inputMode?: "text" | "numeric" | "email";
  required?: boolean;
};

export type Game = {
  slug: string;
  title: string;
  publisher: string;
  category: string;
  family: GameFamily;
  kind: GameKind;
  status: GameStatus;
  fulfilmentType: FulfilmentType;
  description: string;
  logoSources: string[];
  artworkSources: string[];
  logoAlt: string;
  artworkAlt: string;
  logoTreatment: GameLogoTreatment;
  artworkPosition?: string;
  accent: string;
  badge?: string;
  available: boolean;
  href: string;
  packages: string[];
  inputFields: GameInputField[];
  pricingMode: "live" | "fallback" | "staged";
  pricingKey: string;
  startingPriceInPaise: number | null;
  region?: GameRegion;
  catalogueVisible?: boolean;
  supplierAliases?: string[];
};

const playerIdFields: GameInputField[] = [
  { id: "playerId", label: "Player ID", placeholder: "Enter player ID", inputMode: "numeric", required: true },
];

const uidFields: GameInputField[] = [
  { id: "uid", label: "UID", placeholder: "Enter account UID", inputMode: "numeric", required: true },
  { id: "server", label: "Server / region", placeholder: "Select or enter server", required: true },
];

const playerAndZoneFields: GameInputField[] = [
  { id: "playerId", label: "Player ID", placeholder: "Enter player ID", inputMode: "numeric", required: true },
  { id: "zoneId", label: "Zone ID", placeholder: "Enter zone ID", inputMode: "numeric", required: true },
];

const deliveryEmailField: GameInputField[] = [
  { id: "deliveryEmail", label: "Delivery email", placeholder: "name@example.com", inputMode: "email", required: true },
];

function storeItem(input: Omit<Game, "status" | "available" | "pricingMode"> & { pricingMode?: Game["pricingMode"] }): Game {
  return {
    ...input,
    status: input.kind === "gift-card" ? "catalogue" : "checkout",
    available: true,
    pricingMode: input.pricingMode ?? "staged",
  };
}

export const mobileLegendsRegions = mobileLegendsMarkets;

const mobileLegendsIcon =
  "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w512-h512";

const mobileLegendsBase = {
  publisher: "MOONTON",
  category: "MOBA",
  family: "moba" as const,
  fulfilmentType: "player-id" as const,
  description: "Regional Mobile Legends diamonds, passes, and approved event packs.",
  logoSources: [
    mobileLegendsIcon,
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Mobile_Legends_Bang_Bang_logo.png/512px-Mobile_Legends_Bang_Bang_logo.png",
  ],
  artworkSources: [
    mobileLegendsIcon,
    "https://upload.wikimedia.org/wikipedia/en/8/86/Mobile_Legends_Bang_Bang.jpg",
  ],
  logoAlt: "Mobile Legends: Bang Bang app icon",
  artworkAlt: "Mobile Legends: Bang Bang official artwork",
  logoTreatment: "native" as const,
  artworkPosition: "center",
  accent: "#667cff",
  packages: ["Diamonds", "Weekly Diamond Pass", "Twilight Pass", "Event packs"],
  inputFields: playerAndZoneFields,
  pricingKey: "mobile-legends",
  startingPriceInPaise: 3_000,
  supplierAliases: ["mobile legends", "mlbb"],
};

const hiddenMobileLegendsBase: Game = storeItem({
  ...mobileLegendsBase,
  slug: "mobile-legends",
  title: "Mobile Legends: Bang Bang",
  kind: "game",
  href: "/#games",
  pricingMode: "fallback",
  catalogueVisible: false,
});

export const regionalMobileLegendsGames: Game[] = mobileLegendsMarkets.map((region) =>
  storeItem({
    ...mobileLegendsBase,
    slug: `mobile-legends-${region.code}`,
    title: `Mobile Legends ${region.label}`,
    kind: "mobile-legends-region",
    badge: `${region.flag} ${region.label}`,
    href: `/games/mobile-legends/${region.code}`,
    pricingMode: "fallback",
    pricingKey: `mobile-legends:${region.code}`,
    region,
  }),
);

const gameProducts: Game[] = [
  storeItem({
    slug: "pubg-mobile",
    title: "PUBG Mobile",
    publisher: "KRAFTON · Level Infinite",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Unknown Cash, Royale Pass, and Prime membership top-ups.",
    logoSources: [
      "https://play-lh.googleusercontent.com/O8jPCZ2EXAt7wGlbZhkhA-3vPIWVBpz8tZrRnsr7uVeqp0UD1AQwIEl_N9So80kdp8gDvIksC64GypylkQV_=w512-h512",
      "https://www.pubgmobile.com/images/event/brandassets/img-logo1.png",
    ],
    artworkSources: ["https://upload.wikimedia.org/wikipedia/en/9/9f/Pubgbattlegrounds.png"],
    logoAlt: "PUBG Mobile app icon",
    artworkAlt: "PUBG Mobile official artwork",
    logoTreatment: "native",
    accent: "#f2b90b",
    href: "/games/pubg-mobile",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    inputFields: playerIdFields,
    pricingKey: "pubg-mobile",
    startingPriceInPaise: 8_900,
    supplierAliases: ["pubg mobile", "pubg"],
  }),
  storeItem({
    slug: "bgmi",
    title: "BGMI",
    publisher: "KRAFTON",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    fulfilmentType: "player-id",
    description: "India-region UC and Royale Pass catalogue.",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Battlegrounds_Mobile_India%2C_BGMI_LOGO_white_-_1082x360.png",
      "https://upload.wikimedia.org/wikipedia/en/6/6f/Battlegrounds_Mobile_India.jpg",
    ],
    artworkSources: ["https://www.battlegroundsmobileindia.com/api/fileDownload/901/2"],
    logoAlt: "Battlegrounds Mobile India logo",
    artworkAlt: "Battlegrounds Mobile India official artwork",
    logoTreatment: "native",
    accent: "#ff8a24",
    badge: "India",
    href: "/games/bgmi",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    inputFields: playerIdFields,
    pricingKey: "bgmi",
    startingPriceInPaise: 7_500,
    supplierAliases: ["bgmi", "battlegrounds mobile india"],
  }),
  storeItem({
    slug: "free-fire",
    title: "Free Fire MAX",
    publisher: "Garena",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Diamonds, memberships, and level-up passes for supported markets.",
    logoSources: [
      "https://play-lh.googleusercontent.com/SDYv1Th3VdjfM0MwObMIvH3L2I2owroB3leEtbMrFJZYRklHroxw_AspZZmno_8DBdiar3d03kHsyjBsnvcdlg=w512-h512",
      "https://dl.dir.freefiremobile.com/common/web_event/official2/dist/client/img/max_logo.b96cbd2.png",
    ],
    artworkSources: ["https://freefiremobile-a.akamaihd.net/common/web_event/official2.ff.garena.all/img/20228/e14db15cad1206214fe56520563e2aa7.jpg"],
    logoAlt: "Free Fire MAX app icon",
    artworkAlt: "Free Fire MAX official artwork",
    logoTreatment: "native",
    accent: "#ffb10a",
    href: "/games/free-fire",
    packages: ["Diamonds", "Weekly Membership", "Monthly Membership", "Level Up Pass"],
    inputFields: playerIdFields,
    pricingKey: "free-fire",
    startingPriceInPaise: 4_000,
    supplierAliases: ["free fire", "free fire max", "garena free fire"],
  }),
  storeItem({
    slug: "call-of-duty-mobile",
    title: "Call of Duty: Mobile",
    publisher: "Activision",
    category: "Shooter",
    family: "shooter",
    kind: "game",
    fulfilmentType: "player-id",
    description: "COD Points, Battle Pass, and approved vault bundles.",
    logoSources: [
      "https://play-lh.googleusercontent.com/cfGSXkDwxa1jW3TlhhkDJBN16-1_KEtEDhnILPcs9rXcC25g14XY6MRGCtlXHFHs0g=w512-h512",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Call_of_Duty_Mobile_2023_logo.svg/1280px-Call_of_Duty_Mobile_2023_logo.svg.png",
    ],
    artworkSources: ["https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Call_of_Duty_Mobile_Logo.png/512px-Call_of_Duty_Mobile_Logo.png"],
    logoAlt: "Call of Duty Mobile app icon",
    artworkAlt: "Call of Duty Mobile official artwork",
    logoTreatment: "native",
    accent: "#f4c430",
    href: "/games/call-of-duty-mobile",
    packages: ["COD Points", "Battle Pass", "Vault packs"],
    inputFields: playerIdFields,
    pricingKey: "call-of-duty-mobile",
    startingPriceInPaise: 8_000,
    supplierAliases: ["call of duty mobile", "cod mobile", "codm"],
  }),
  storeItem({
    slug: "valorant",
    title: "VALORANT",
    publisher: "Riot Games",
    category: "Tactical FPS",
    family: "shooter",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "Region-locked VALORANT Points and Riot gift cards delivered by code.",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Valorant_logo.svg/960px-Valorant_logo.svg.png",
    ],
    artworkSources: ["https://upload.wikimedia.org/wikipedia/en/b/ba/Valorant_cover.jpg"],
    logoAlt: "VALORANT logo",
    artworkAlt: "VALORANT official key art",
    logoTreatment: "native",
    accent: "#ff4655",
    href: "/games/valorant",
    packages: ["VALORANT Points", "Riot gift cards", "Regional codes"],
    inputFields: deliveryEmailField,
    pricingKey: "valorant",
    startingPriceInPaise: 45_000,
    supplierAliases: ["valorant", "riot points", "riot games"],
  }),
  storeItem({
    slug: "genshin-impact",
    title: "Genshin Impact",
    publisher: "HoYoverse",
    category: "Action RPG",
    family: "rpg",
    kind: "game",
    fulfilmentType: "uid",
    description: "Genesis Crystals and Blessing of the Welkin Moon.",
    logoSources: [
      "https://play-lh.googleusercontent.com/YQqyKaXX-63krqsfIzUEJWUWLINxcb5tbS6QVySdxbS7eZV7YB2dUjUvX27xA0TIGtfxQ5v-tQjwlT5tTB-O=w512-h512",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Genshin_Impact_wordmark.svg/960px-Genshin_Impact_wordmark.svg.png",
    ],
    artworkSources: ["https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg"],
    logoAlt: "Genshin Impact app icon",
    artworkAlt: "Genshin Impact official artwork",
    logoTreatment: "native",
    accent: "#7ac8ff",
    href: "/games/genshin-impact",
    packages: ["Genesis Crystals", "Welkin Moon"],
    inputFields: uidFields,
    pricingKey: "genshin-impact",
    startingPriceInPaise: 8_900,
    supplierAliases: ["genshin", "genshin impact", "genesis crystals"],
  }),
  storeItem({
    slug: "fortnite",
    title: "Fortnite",
    publisher: "Epic Games",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "V-Bucks cards, starter packs, and platform-specific codes.",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/FortniteLogo.svg/1280px-FortniteLogo.svg.png",
      "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-web-carousel-logo-1458x416-0adca73e5786.png",
    ],
    artworkSources: ["https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-discover-playlist-tiles-keyart-480x270-480x270-d8d88e6f0b9d.jpg"],
    logoAlt: "Fortnite logo",
    artworkAlt: "Fortnite official key art",
    logoTreatment: "native",
    accent: "#8d5cff",
    href: "/games/fortnite",
    packages: ["V-Bucks", "Starter packs", "Gift cards"],
    inputFields: deliveryEmailField,
    pricingKey: "fortnite",
    startingPriceInPaise: 79_000,
    supplierAliases: ["fortnite", "v-bucks", "vbucks"],
  }),
  storeItem({
    slug: "honor-of-kings",
    title: "Honor of Kings",
    publisher: "Level Infinite",
    category: "MOBA",
    family: "moba",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Tokens and regional direct top-up packages.",
    logoSources: ["https://play-lh.googleusercontent.com/hEm5NVeEv7UfFJaK8GZdfWe7p3DB_VvYx57qIEHbR0tMV_NToziH0Vbgd6CxLiWF-iURpAe-jsC_UGUDt0diPQ=w512-h512"],
    artworkSources: [],
    logoAlt: "Honor of Kings app icon",
    artworkAlt: "Honor of Kings official artwork",
    logoTreatment: "native",
    accent: "#d9a441",
    href: "/games/honor-of-kings",
    packages: ["Tokens", "Weekly card", "Monthly card"],
    inputFields: playerIdFields,
    pricingKey: "honor-of-kings",
    startingPriceInPaise: 6_000,
    supplierAliases: ["honor of kings", "hok"],
  }),
  storeItem({
    slug: "wild-rift",
    title: "League of Legends: Wild Rift",
    publisher: "Riot Games",
    category: "MOBA",
    family: "moba",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "Wild Cores and Riot regional gift cards.",
    logoSources: ["https://play-lh.googleusercontent.com/7-kbcpgrCOE1mleJ9g0d61sJeoqKcQRIj4iFvJ8DjPlRIfocOWfOQsXzKWw2I5oHySVdbjR2fvzfCCz1FYQ-RQ=w512-h512"],
    artworkSources: [],
    logoAlt: "League of Legends Wild Rift app icon",
    artworkAlt: "Wild Rift official artwork",
    logoTreatment: "native",
    accent: "#42c8e8",
    href: "/games/wild-rift",
    packages: ["Wild Cores", "Riot gift cards"],
    inputFields: deliveryEmailField,
    pricingKey: "wild-rift",
    startingPriceInPaise: 45_000,
    supplierAliases: ["wild rift", "league of legends", "wild cores"],
  }),
  storeItem({
    slug: "clash-of-clans",
    title: "Clash of Clans",
    publisher: "Supercell",
    category: "Strategy",
    family: "strategy",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Gold Pass, Event Pass, and approved direct offers.",
    logoSources: ["https://play-lh.googleusercontent.com/gX_sXesdzLc9C4tancLSiJKZom_gLi7Uc5cMfaC-zaY0gvFbXV_DTRZFNqlVx6USMWkqglYgr-k0NeaUq5zE=w512-h512"],
    artworkSources: [],
    logoAlt: "Clash of Clans app icon",
    artworkAlt: "Clash of Clans official artwork",
    logoTreatment: "native",
    accent: "#f2b33d",
    href: "/games/clash-of-clans",
    packages: ["Gold Pass", "Event Pass", "Special offers"],
    inputFields: playerIdFields,
    pricingKey: "clash-of-clans",
    startingPriceInPaise: 29_000,
    supplierAliases: ["clash of clans", "coc"],
  }),
  storeItem({
    slug: "clash-royale",
    title: "Clash Royale",
    publisher: "Supercell",
    category: "Strategy",
    family: "strategy",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Diamond Pass, Gold Pass, and approved shop offers.",
    logoSources: ["https://play-lh.googleusercontent.com/z0rspJKftanEI7MA4WOdypbaaHfeKy4UjoawRGKf4Ys3v6LrrcleZWOfms7XK-J33Oqyfm3DlFd4Z_eKWafVFg=w512-h512"],
    artworkSources: [],
    logoAlt: "Clash Royale app icon",
    artworkAlt: "Clash Royale official artwork",
    logoTreatment: "native",
    accent: "#4ca4ff",
    href: "/games/clash-royale",
    packages: ["Diamond Pass", "Gold Pass", "Shop offers"],
    inputFields: playerIdFields,
    pricingKey: "clash-royale",
    startingPriceInPaise: 29_000,
    supplierAliases: ["clash royale"],
  }),
  storeItem({
    slug: "brawl-stars",
    title: "Brawl Stars",
    publisher: "Supercell",
    category: "Action",
    family: "shooter",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Gems, Brawl Pass, and approved Supercell offers.",
    logoSources: ["https://play-lh.googleusercontent.com/c0hXyphuxh-gpnhSJGZV1I0IpWbq9IdEc1pautS7SmHlXNBrCff7bMqK-u63pJdfP3KJoxamG7W1dRMKr7ZzWKs=w512-h512"],
    artworkSources: [],
    logoAlt: "Brawl Stars app icon",
    artworkAlt: "Brawl Stars official artwork",
    logoTreatment: "native",
    accent: "#ffd23f",
    href: "/games/brawl-stars",
    packages: ["Gems", "Brawl Pass", "Special offers"],
    inputFields: playerIdFields,
    pricingKey: "brawl-stars",
    startingPriceInPaise: 19_000,
    supplierAliases: ["brawl stars"],
  }),
  storeItem({
    slug: "roblox",
    title: "Roblox",
    publisher: "Roblox Corporation",
    category: "Platform",
    family: "platform",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "Robux and Roblox gift-card codes.",
    logoSources: [
      "https://play-lh.googleusercontent.com/QqZj22aXblAyYDxLQw-Gg0ycW0QkKhrDnwqgERZU9BMRXZnMlgXfq-94sikG5mEpt_I0lzZxcUzfLblmQgwYzUE=s512",
      "https://cdn.simpleicons.org/roblox/ffffff",
    ],
    artworkSources: [],
    logoAlt: "Roblox app icon",
    artworkAlt: "Roblox official artwork",
    logoTreatment: "native",
    accent: "#e8e8e8",
    href: "/games/roblox",
    packages: ["Robux", "Gift cards", "Premium"],
    inputFields: deliveryEmailField,
    pricingKey: "roblox",
    startingPriceInPaise: 40_000,
    supplierAliases: ["roblox", "robux"],
  }),
  storeItem({
    slug: "minecraft",
    title: "Minecraft",
    publisher: "Mojang · Microsoft",
    category: "Sandbox",
    family: "sandbox",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "Minecraft, Minecoins, and Realms codes for supported platforms.",
    logoSources: [
      "https://play-lh.googleusercontent.com/30koN0eGl-LHqvUZrCj9HT4qVPQdvN508p2wuhaWUnqKeCp6nrs9QW8v6IVGvGNauA=s512",
      "https://cdn.simpleicons.org/minecraft/62B47A",
    ],
    artworkSources: [],
    logoAlt: "Minecraft app icon",
    artworkAlt: "Minecraft official artwork",
    logoTreatment: "native",
    accent: "#62b47a",
    href: "/games/minecraft",
    packages: ["Minecraft", "Minecoins", "Realms"],
    inputFields: deliveryEmailField,
    pricingKey: "minecraft",
    startingPriceInPaise: 59_000,
    supplierAliases: ["minecraft", "minecoins", "realms"],
  }),
  storeItem({
    slug: "honkai-star-rail",
    title: "Honkai: Star Rail",
    publisher: "HoYoverse",
    category: "Turn-based RPG",
    family: "rpg",
    kind: "game",
    fulfilmentType: "uid",
    description: "Oneiric Shards and Express Supply Pass.",
    logoSources: ["https://play-lh.googleusercontent.com/aWrGocSA7hEuk1qAPe7L4T57LvLKrwwH26cK2_LOqxRQMQX7j3uHYojC-EKWgYEV2PdrmE0ahqvvhLhXrAGk6Q=w512-h512"],
    artworkSources: [],
    logoAlt: "Honkai Star Rail app icon",
    artworkAlt: "Honkai Star Rail official artwork",
    logoTreatment: "native",
    accent: "#8f83ff",
    href: "/games/honkai-star-rail",
    packages: ["Oneiric Shards", "Express Supply Pass"],
    inputFields: uidFields,
    pricingKey: "honkai-star-rail",
    startingPriceInPaise: 8_900,
    supplierAliases: ["honkai star rail", "oneiric shards"],
  }),
  storeItem({
    slug: "zenless-zone-zero",
    title: "Zenless Zone Zero",
    publisher: "HoYoverse",
    category: "Action RPG",
    family: "rpg",
    kind: "game",
    fulfilmentType: "uid",
    description: "Monochrome and Inter-Knot Membership top-ups.",
    logoSources: ["https://play-lh.googleusercontent.com/-ZZaqZBQ7EBjH4j0hyHX-0Fu0jUtnoOc-LwydvgQmsXWBZLxyAhxPcmIakzZB7NFurlK4Mj0pbvYe0pHYSuv4p8=w512-h512"],
    artworkSources: [],
    logoAlt: "Zenless Zone Zero app icon",
    artworkAlt: "Zenless Zone Zero official artwork",
    logoTreatment: "native",
    accent: "#ff8d31",
    href: "/games/zenless-zone-zero",
    packages: ["Monochrome", "Inter-Knot Membership"],
    inputFields: uidFields,
    pricingKey: "zenless-zone-zero",
    startingPriceInPaise: 8_900,
    supplierAliases: ["zenless zone zero", "zzz", "monochrome"],
  }),
  storeItem({
    slug: "wuthering-waves",
    title: "Wuthering Waves",
    publisher: "Kuro Games",
    category: "Action RPG",
    family: "rpg",
    kind: "game",
    fulfilmentType: "uid",
    description: "Lunites and Lunite Subscription top-ups.",
    logoSources: ["https://play-lh.googleusercontent.com/f8SoRHdK3E8ofPV6ZbXG-TkcNtXiGmgXnPLl_zjHh6OsSQ1yZqbDIDWFI2P7UCnAQGY_C9VUv2Q8P87CIAqH=s512"],
    artworkSources: [],
    logoAlt: "Wuthering Waves app icon",
    artworkAlt: "Wuthering Waves official artwork",
    logoTreatment: "native",
    accent: "#6f9bb7",
    href: "/games/wuthering-waves",
    packages: ["Lunites", "Lunite Subscription"],
    inputFields: uidFields,
    pricingKey: "wuthering-waves",
    startingPriceInPaise: 8_900,
    supplierAliases: ["wuthering waves", "lunites"],
  }),
  storeItem({
    slug: "arena-breakout",
    title: "Arena Breakout",
    publisher: "Level Infinite",
    category: "Tactical FPS",
    family: "shooter",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Bonds and supported regional direct top-ups.",
    logoSources: ["https://play-lh.googleusercontent.com/WGZQlOqgq70CEtUbvx0CuFZMU3cTFZlGkfdens6vNzexOhsCdL9X0MT4jpruZjHCqg=w512-h512"],
    artworkSources: [],
    logoAlt: "Arena Breakout app icon",
    artworkAlt: "Arena Breakout official artwork",
    logoTreatment: "native",
    accent: "#c2a16d",
    href: "/games/arena-breakout",
    packages: ["Bonds", "Bulletproof Case", "Membership"],
    inputFields: playerIdFields,
    pricingKey: "arena-breakout",
    startingPriceInPaise: 9_900,
    supplierAliases: ["arena breakout"],
  }),
  storeItem({
    slug: "ea-sports-fc-mobile",
    title: "EA SPORTS FC Mobile",
    publisher: "Electronic Arts",
    category: "Sports",
    family: "sports",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "FC Points and supported platform gift-card codes.",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/EA_Sports_FC_logo.svg/512px-EA_Sports_FC_logo.svg.png",
      "https://cdn.simpleicons.org/ea/ffffff",
    ],
    artworkSources: [],
    logoAlt: "EA SPORTS FC logo",
    artworkAlt: "EA SPORTS FC Mobile official artwork",
    logoTreatment: "native",
    accent: "#35e09b",
    href: "/games/ea-sports-fc-mobile",
    packages: ["FC Points", "Google Play codes", "App Store codes"],
    inputFields: deliveryEmailField,
    pricingKey: "ea-sports-fc-mobile",
    startingPriceInPaise: 40_000,
    supplierAliases: ["ea sports fc", "fc mobile", "fifa mobile"],
  }),
  storeItem({
    slug: "efootball",
    title: "eFootball",
    publisher: "KONAMI",
    category: "Sports",
    family: "sports",
    kind: "game",
    fulfilmentType: "redeem-code",
    description: "eFootball Coins through approved platform codes.",
    logoSources: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/EFootball_logo.svg/512px-EFootball_logo.svg.png",
      "https://cdn.simpleicons.org/konami/B60014",
    ],
    artworkSources: [],
    logoAlt: "eFootball logo",
    artworkAlt: "eFootball official artwork",
    logoTreatment: "native",
    accent: "#ffe600",
    href: "/games/efootball",
    packages: ["eFootball Coins", "Google Play codes", "App Store codes"],
    inputFields: deliveryEmailField,
    pricingKey: "efootball",
    startingPriceInPaise: 40_000,
    supplierAliases: ["efootball", "pes mobile"],
  }),
  storeItem({
    slug: "blood-strike",
    title: "Blood Strike",
    publisher: "NetEase Games",
    category: "Battle Royale",
    family: "battle-royale",
    kind: "game",
    fulfilmentType: "player-id",
    description: "Gold and supported direct top-up packages.",
    logoSources: ["https://play-lh.googleusercontent.com/2rpY4edYLIs4AdPnEtezeBVlFj7qvgIleIAHAywLjaff4Q80-X8JQo7Ddca9rJPovXTBKacIAJXA0lMpjIgpKQ=w512-h512"],
    artworkSources: [],
    logoAlt: "Blood Strike app icon",
    artworkAlt: "Blood Strike official artwork",
    logoTreatment: "native",
    accent: "#ef3f37",
    href: "/games/blood-strike",
    packages: ["Gold", "Pass", "Special packs"],
    inputFields: playerIdFields,
    pricingKey: "blood-strike",
    startingPriceInPaise: 7_900,
    supplierAliases: ["blood strike"],
  }),
];

function giftCard(input: {
  slug: string;
  title: string;
  publisher: string;
  logoSources: string[];
  accent: string;
  packages: string[];
  startingPriceInPaise: number;
  supplierAliases: string[];
}): Game {
  return storeItem({
    ...input,
    category: "Gift Card",
    family: "gift-card",
    kind: "gift-card",
    fulfilmentType: "gift-card",
    description: `${input.title} digital codes delivered to the verified customer account.`,
    artworkSources: [],
    logoAlt: `${input.title} official logo`,
    artworkAlt: `${input.title} gift-card artwork`,
    logoTreatment: "native",
    href: `/games/${input.slug}`,
    inputFields: deliveryEmailField,
    pricingMode: "staged",
    pricingKey: input.slug,
  });
}

export const giftCardGames: Game[] = [
  giftCard({ slug: "steam-wallet", title: "Steam Wallet", publisher: "Valve", logoSources: ["https://cdn.simpleicons.org/steam/ffffff"], accent: "#1b9fff", packages: ["₹500", "₹1,000", "$10", "$20", "$50"], startingPriceInPaise: 50_000, supplierAliases: ["steam", "steam wallet"] }),
  giftCard({ slug: "playstation-store", title: "PlayStation Store", publisher: "Sony Interactive Entertainment", logoSources: ["https://cdn.simpleicons.org/playstation/ffffff"], accent: "#2f74d0", packages: ["$10", "$25", "$50", "₹1,000", "₹2,000"], startingPriceInPaise: 80_000, supplierAliases: ["playstation", "psn", "playstation store"] }),
  giftCard({ slug: "xbox-game-pass", title: "Xbox and Game Pass", publisher: "Microsoft", logoSources: ["https://cdn.simpleicons.org/xbox/52b043"], accent: "#52b043", packages: ["Xbox Wallet", "Game Pass Core", "Game Pass Ultimate"], startingPriceInPaise: 49_000, supplierAliases: ["xbox", "game pass", "microsoft"] }),
  giftCard({ slug: "google-play", title: "Google Play", publisher: "Google", logoSources: ["https://cdn.simpleicons.org/googleplay/ffffff"], accent: "#34a853", packages: ["₹100", "₹500", "₹1,000", "$10", "$25"], startingPriceInPaise: 10_000, supplierAliases: ["google play"] }),
  giftCard({ slug: "apple-app-store", title: "Apple and App Store", publisher: "Apple", logoSources: ["https://cdn.simpleicons.org/apple/ffffff"], accent: "#d8d8d8", packages: ["₹500", "₹1,000", "$10", "$25", "$50"], startingPriceInPaise: 50_000, supplierAliases: ["apple", "itunes", "app store"] }),
  giftCard({ slug: "nintendo-eshop", title: "Nintendo eShop", publisher: "Nintendo", logoSources: ["https://cdn.simpleicons.org/nintendo/ffffff"], accent: "#e60012", packages: ["$10", "$20", "$35", "$50"], startingPriceInPaise: 80_000, supplierAliases: ["nintendo", "eshop"] }),
  giftCard({ slug: "razer-gold", title: "Razer Gold", publisher: "Razer", logoSources: ["https://cdn.simpleicons.org/razer/44d62c"], accent: "#44d62c", packages: ["$5", "$10", "$20", "$50", "$100"], startingPriceInPaise: 40_000, supplierAliases: ["razer", "razer gold"] }),
  giftCard({ slug: "roblox-gift-card", title: "Roblox Gift Card", publisher: "Roblox Corporation", logoSources: ["https://cdn.simpleicons.org/roblox/ffffff"], accent: "#e8e8e8", packages: ["$10", "$20", "$25", "$50"], startingPriceInPaise: 80_000, supplierAliases: ["roblox gift card", "robux"] }),
  giftCard({ slug: "riot-games-gift-card", title: "Riot Games Gift Card", publisher: "Riot Games", logoSources: ["https://cdn.simpleicons.org/riotgames/ffffff"], accent: "#d13639", packages: ["$10", "$20", "$25", "$50"], startingPriceInPaise: 80_000, supplierAliases: ["riot games", "valorant gift card"] }),
  giftCard({ slug: "amazon-gift-card", title: "Amazon Gift Card", publisher: "Amazon", logoSources: ["https://cdn.simpleicons.org/amazon/ffffff"], accent: "#ff9900", packages: ["₹500", "₹1,000", "$10", "$25", "$50"], startingPriceInPaise: 50_000, supplierAliases: ["amazon", "amazon gift card"] }),
];

export const games: Game[] = [
  hiddenMobileLegendsBase,
  ...regionalMobileLegendsGames,
  ...gameProducts,
  ...giftCardGames,
];

export const catalogueGames = games.filter((game) => game.catalogueVisible !== false);
export const mainGames = catalogueGames.filter((game) => game.kind !== "gift-card");
export const redeemCodeGames = catalogueGames.filter(
  (game) => game.kind === "gift-card" || game.fulfilmentType === "redeem-code",
);

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug) ?? null;
}
