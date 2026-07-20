export type GameLogoTreatment = "native" | "invert" | "light-panel";
export type GameKind = "game" | "mobile-legends-region";
export type GameStatus = "checkout" | "catalogue" | "coming-soon";

export type GameRegion = {
  code: "global" | "india" | "indonesia" | "philippines" | "arabia";
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
  logoSrc: string;
  logoAlt: string;
  logoTreatment: GameLogoTreatment;
  gradient: string;
  glow: string;
  badge?: string;
  available?: boolean;
  href?: string;
  packages: string[];
  pricingMode?: "live" | "fallback" | "staged";
  pricingKey?: string;
  startingPriceInPaise?: number | null;
  region?: GameRegion;
};

export const mobileLegendsLogo =
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsDEXLMCs22Ic2oY5ujt7mnL1U2XT8pK7E6JzK4DD5z6GgjZMANhLwq6pSDfzF-sEQZ24jV6FTLPDfrxui43Cw-3ZlLDqJQ4gMpyqETN1AU_20t_Rbhu_h7r1uYbugXEcEXlE-pPaRgNQ/s320-rw/MLBB%2B%2528Mobile%2BLegends%2BBang%2BBang%2529%2BNew%2B2020%2BLogo%2B-%2BDownload%2BFree%2BVector%2BPNG.png";

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
  {
    code: "arabia",
    label: "Arabia",
    flag: "🌍",
    note: "Arabic-market supplier category routing",
  },
];

const mobileLegendsBase = {
  publisher: "MOONTON",
  category: "MOBA",
  family: "moba" as const,
  logoSrc: mobileLegendsLogo,
  logoAlt: "Mobile Legends: Bang Bang logo",
  logoTreatment: "native" as const,
  gradient: "linear-gradient(135deg, #0f4cbb 0%, #4f2cb9 50%, #8618a7 100%)",
  glow: "rgba(99,102,241,0.38)",
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
    badge: "Checkout ready",
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
      badge: "Regional MLBB",
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
    logoSrc: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Freefirelogo.png",
    logoAlt: "Free Fire logo",
    logoTreatment: "light-panel",
    gradient: "linear-gradient(135deg, #dc2626 0%, #f97316 55%, #facc15 100%)",
    glow: "rgba(249,115,22,0.34)",
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
    logoSrc: "https://www.pubgmobile.com/images/event/brandassets/down-logo5.png",
    logoAlt: "PUBG Mobile logo",
    logoTreatment: "invert",
    gradient: "linear-gradient(135deg, #d97706 0%, #334155 58%, #020617 100%)",
    glow: "rgba(245,158,11,0.32)",
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
    logoSrc:
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Battlegrounds_Mobile_India%2C_BGMI_LOGO_white_-_1082x360.png",
    logoAlt: "Battlegrounds Mobile India logo",
    logoTreatment: "native",
    gradient: "linear-gradient(135deg, #f97316 0%, #facc15 48%, #16a34a 100%)",
    glow: "rgba(34,197,94,0.25)",
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
    logoSrc:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Call_of_Duty_Mobile_2023_logo.svg/1280px-Call_of_Duty_Mobile_2023_logo.svg.png",
    logoAlt: "Call of Duty Mobile logo",
    logoTreatment: "invert",
    gradient: "linear-gradient(135deg, #111827 0%, #334155 60%, #eab308 100%)",
    glow: "rgba(234,179,8,0.26)",
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
    logoSrc:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Valorant_logo.svg/960px-Valorant_logo.svg.png",
    logoAlt: "VALORANT logo",
    logoTreatment: "invert",
    gradient: "linear-gradient(135deg, #fb7185 0%, #be123c 48%, #3f0d21 100%)",
    glow: "rgba(251,113,133,0.34)",
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
    logoSrc:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Genshin_Impact_wordmark.svg/960px-Genshin_Impact_wordmark.svg.png",
    logoAlt: "Genshin Impact logo",
    logoTreatment: "invert",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #6366f1 54%, #312e81 100%)",
    glow: "rgba(56,189,248,0.33)",
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
    logoSrc:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/FortniteLogo.svg/1280px-FortniteLogo.svg.png",
    logoAlt: "Fortnite logo",
    logoTreatment: "invert",
    gradient: "linear-gradient(135deg, #2563eb 0%, #7c3aed 52%, #ec4899 100%)",
    glow: "rgba(124,58,237,0.36)",
    packages: ["V-Bucks", "Starter Packs", "Gift Cards"],
    pricingMode: "staged",
  },
];

export const mainGames = games.filter((game) => game.kind === "game");
export const regionalMobileLegendsGames = games.filter(
  (game) => game.kind === "mobile-legends-region",
);
