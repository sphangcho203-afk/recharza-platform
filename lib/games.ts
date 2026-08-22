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
  /**
   * Researched delivery-region coverage copy for the game header headline.
   * `mode` describes how delivery maps to regions:
   *  - "global": the top-up reaches the account from any supplier region
   *    (account lives on a single global server).
   *  - "global-id": the player ID is globally unique, but delivery follows
   *    the supplier's regional packs.
   *  - "region-scoped": the account is scoped to a server/region and the
   *    top-up must match it.
   */
  deliveryCoverage?: {
    mode: "global" | "global-id" | "region-scoped";
    headline: string;
    note: string;
  };
  /**
   * Professional education copy shown below the checkout on the game page:
   * what the game is, what its currency is used for, how to find the
   * player ID, and the step-by-step purchase guide.
   */
  education?: {
    about: string;
    currencyUses: string;
    findId: string;
    steps: readonly string[];
    regionNote?: string;
  };
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
    deliveryCoverage: {
      mode: "region-scoped" as const,
      headline: "Global account verification with region-specific delivery",
      note: "Our account verification service works globally, allowing you to confirm your nickname regardless of your location. However, game currency is delivered through regional catalogues. To ensure successful delivery, please select the market that matches your game account's registered region. For example, an account registered in India should be topped up using the India market.",
    },
  pricingKey: "mobile-legends",
  startingPriceInPaise: 3_000,
  education: {
    about: "Mobile Legends: Bang Bang is a premier 5v5 mobile MOBA developed by Moonton. With over 100 million active players globally, it offers high-speed tactical combat where two teams compete to destroy the enemy's base. The game is known for its diverse roster of heroes, frequent balance updates, and competitive ranked seasons that provide a fresh experience for every match.\n\nPlayers can choose from various roles including Tank, Fighter, Assassin, Mage, Marksman, and Support to build the perfect team composition. Mastering hero abilities and map strategy is key to climbing the ranks from Warrior to Mythical Glory.",
    currencyUses:
      "Diamonds are the essential premium currency in Mobile Legends, used to enhance your gaming experience. You can use them to:\n\n• Unlock New Heroes: Gain immediate access to the latest heroes to diversify your playstyle.\n• Exclusive Skins: Purchase skins to change your hero's appearance and add unique skill effects.\n• Weekly Diamond Pass: The best value top-up, providing 220 diamonds and additional rewards over 7 days.\n• Twilight Pass: Unlock a progressive reward track that includes exclusive skins and items as you level up your account.\n• Emotes & Effects: Personalize your presence on the battlefield with custom recall effects and battle emotes.\n• Starlight Membership: Access a monthly subscription for exclusive skins, hero fragments, and other premium perks.",
    findId: "Locating your account details is simple:\n\n1. Open Mobile Legends on your device.\n2. Tap your Avatar in the top-left corner of the home screen to open your Profile.\n3. Your User ID and Zone ID are displayed under your nickname.\n   • The User ID is the longer number (e.g., 12345678).\n   • The Zone ID is the shorter number in brackets (e.g., 1234).\n\nMake sure to note both numbers accurately, as they are both required to identify your account for a successful top-up.",
    steps: [
      "Select your preferred account market (e.g., India, Global, Indonesia).",
      "Choose the diamond pack or membership you wish to purchase.",
      "Enter your User ID and Zone ID in the player information section.",
      "Confirm your account using our live checker to ensure the username matches your profile.",
      "Complete the payment securely using our integrated payment methods.",
      "Your diamonds will be credited to your account instantly. You can track your order status in the 'Orders' section.",
    ],
    regionNote:
      "Account confirmation is vital: Always ensure the username displayed by our checker matches your in-game profile before proceeding to payment. Please note that top-ups are processed instantly and are non-refundable. Additionally, diamonds are server-specific; ensure the market you select matches your account's registered region to avoid delivery issues.",
  },
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
      deliveryCoverage: {
        mode: "global-id",
        headline: "Global account verification with region-specific delivery",
        note: "You can verify your Garena ID from any country using our integrated lookup service. For successful top-up delivery, please ensure you select the market that corresponds to your game account's region. Regional restrictions apply to the delivery of game currency, and matching your account region is essential for a successful transaction.",
      },
    pricingMode: "live",
    pricingKey: "free-fire",
    education: {
      about: "Garena Free Fire MAX is a fast 10-minute battle royale from Garena, built for mobile. Up to 50 players drop onto an island, scavenge weapons, and fight to be the last one standing — with characters, pets and ranked seasons.",
      currencyUses:
        "Diamonds are the premium currency used to buy character and weapon skins, the Elite Pass, bundles and emotes. The Weekly and Monthly Memberships stack extra diamonds on top of what you buy, making them the best value for regular players.",
      findId: "Open Free Fire and tap your avatar in the top-left corner of the main screen. Your numeric Player ID appears right under your name. Enter it exactly as shown — top-ups are instant and go only to the ID you enter.",
      steps: [
        "Pick the pack you want and add it to your cart.",
        "Enter your Player ID — our live checker shows your in-game name before you pay.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "Diamonds are delivered straight to your in-game account — track the order anytime from Orders.",
      ],
      regionNote:
        "Diamonds are credited through region-scoped supplier packs, so your account region must match the pack you buy. Always confirm the username shown by our checker matches your account before paying — top-ups are instant and cannot be reversed.",
    },
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
      deliveryCoverage: {
        mode: "region-scoped",
        headline: "Region-specific currency delivery",
        note: "Game currency is bound to your specific account region. To ensure your top-up is credited correctly, please choose the market that matches your game server. Transactions made for a different region cannot be credited to your account due to publisher restrictions.",
      },
    pricingMode: "live",
    pricingKey: "pubg-mobile",
    education: {
      about: "PUBG Mobile is one of the world's most-played battle royales from KRAFTON and Level Infinite. 100 players parachute onto a shrinking map, looting and fighting for the last-man-standing title across maps like Erangel, Livik and Miramar.",
      currencyUses:
        "Unknown Cash (UC) is the premium currency used to buy the Royale Pass and Prime, premium crates, weapon and character skins, and event bundles. UC is the only way to unlock every cosmetic and seasonal content in the game.",
      findId: "Open PUBG Mobile, go to Settings → Basic. Your numeric character ID (8–10 digits) is displayed there. Enter it exactly — UC is credited to that ID instantly and cannot be transferred to another account.",
      steps: [
        "Pick the UC pack you want and add it to your cart.",
        "Enter your character ID — our live checker confirms your username before you pay.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "UC is delivered to your account — track the order anytime from Orders.",
      ],
      regionNote:
        "UC is region-locked and delivered as regional vouchers, so buy from the market that matches the server you play on — a different-region purchase will not credit your account. This is a Level Infinite server rule, not a store limitation.",
    },
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
    deliveryCoverage: {
      mode: "region-scoped",
      headline: "India-only server",
      note: "Battlegrounds Mobile India runs exclusively on the Indian server. Top-ups only work for Indian accounts; international PUBG Mobile accounts cannot be credited.",
    },
    education: {
      about: "Battlegrounds Mobile India (BGMI) is KRAFTON's Indian edition of PUBG Mobile, tailored for India with local content and compliant mechanics. The gameplay is the same battle royale formula — drop, loot, survive.",
      currencyUses:
        "Unknown Cash (UC) is the premium currency used to buy the Royale Pass and Prime, premium crates, weapon and character skins, and event bundles. UC is the only way to unlock every cosmetic and seasonal content in the game.",
      findId: "Open BGMI, go to Settings → Basic. Your numeric character ID (8–10 digits) is displayed there. Enter it exactly — UC is credited to that ID instantly and cannot be transferred to another account.",
      steps: [
        "Pick the UC pack you want and add it to your cart.",
        "Enter your character ID — our live checker confirms your username before you pay.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "UC is delivered to your account — track the order anytime from Orders.",
      ],
      regionNote:
        "BGMI runs exclusively on the Indian server — international PUBG Mobile accounts cannot be credited. Only Indian accounts are supported.",
    },
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
    deliveryCoverage: {
      mode: "global",
      headline: "Global CP top-up — worldwide delivery",
      note: "COD Points are delivered straight to your Activision account, which is the same everywhere. A CP top-up from any market reaches your account regardless of the country you buy from.",
    },
    pricingMode: "staged",
    education: {
      about: "Call of Duty: Mobile is Activision's free-to-play shooter built by TiMi Studios, bringing classic CoD maps, weapons and game modes — Multiplayer and Battle Royale — to mobile.",
      currencyUses:
        "COD Points (CP) are the premium currency used to buy the Battle Pass, weapon blueprints, operator skins, and lucky draws. CP unlocks every seasonal cosmetic without grinding.",
      findId: "Your CoD account is your Activision account, linked through the game's settings. Sign in with the same Activision account you play with — top-ups credit that account.",
      steps: [
        "Pick the CP pack you want and add it to your cart.",
        "Sign in or link the Activision account you play with.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "CP is delivered to your Activision account — track the order anytime from Orders.",
      ],
      regionNote:
        "CP is delivered to your global Activision account from any market.",
    },
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
    deliveryCoverage: {
      mode: "global-id",
      headline: "One Riot ID — but VP only credits its own region",
      note: "Your Riot ID is the same everywhere and can be checked from any country, but VALORANT Points are strictly regional: points bought in one region can never be spent in another. Each market sells only the VP region it is licensed for (ID, PH, MY, SG catalogues), so choose the market whose region matches your account.",
    },
    pricingMode: "live",
    pricingKey: "valorant",
    education: {
      about: "VALORANT is Riot Games' tactical 5v5 FPS, blending precise gunplay with agent abilities. Bomb defusal, one-life rounds and ranked seasons make it one of the most competitive shooters on PC.",
      currencyUses:
        "VALORANT Points (VP) are the premium currency used to buy weapon skins, the Battle Pass, Radianite Points, and event bundles. Skin collections in VALORANT are permanent and account-bound, so VP spent today stays with you forever.",
      findId: "Your Riot ID is your in-game name followed by a #tagline, shown in the top-right of the VALORANT client and on your Riot account page (account.riotgames.com). Enter both parts exactly.",
      steps: [
        "Pick the VP pack you want and add it to your cart.",
        "Enter your Riot ID (name#tagline) — our live checker confirms your account before you pay.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "VP is delivered to your Riot account — track the order anytime from Orders.",
      ],
      regionNote:
        "VP is strictly regional — points bought in one region can never be spent in another. Choose the market whose region matches your account.",
    },
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
    deliveryCoverage: {
      mode: "region-scoped",
      headline: "Server-scoped UID — pick the right server",
      note: "Your UID belongs to exactly one server: Asia, America, Europe, or TW/HK/MO (hint: UID prefix 8 = Asia, 7 = America, 9 = Europe, 6 = TW/HK/MO). Our Global catalogue credits accounts on the supported server only — top-ups never cross servers. Check your UID before buying; this is a HoYoverse server rule, not a store limitation.",
    },
    pricingMode: "live",
    pricingKey: "genshin-impact",
    education: {
      about: "Genshin Impact is HoYoverse's open-world action RPG set in Teyvat, where you explore seven nations, collect characters, and fight through story quests and weekly bosses. New regions and characters arrive every few weeks.",
      currencyUses:
        "Genesis Crystals are the premium currency, converted 1:1 into Primogems — the currency that fuels Wishes for new characters and weapons. The Welkin Moon is the best-value item in the game: 300 crystals instantly plus 90 Primogems every day for 30 days (3,000 total, about 19 Wishes).",
      findId: "Your UID is shown in the top-right corner of the game screen and on the Paimon profile page. It is server-scoped: the first digit hints at the server — 8 for Asia, 7 for America, 9 for Europe, 6 for TW/HK/MO.",
      steps: [
        "Pick the pack you want and add it to your cart.",
        "Enter your UID and choose the server that matches it — our checker confirms your username before you pay.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "Crystals are delivered to your account — track the order anytime from Orders.",
      ],
      regionNote:
        "Top-ups never cross servers — pick the market matching your UID's server. This is a HoYoverse server rule, not a store limitation.",
    },
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
    deliveryCoverage: {
      mode: "global",
      headline: "Global Epic account — V-Bucks delivered worldwide",
      note: "Fortnite accounts live on one Epic ecosystem, so a V-Bucks top-up from any market credits the same account. Any Epic account can be checked from any country. Regional storefront differences apply only to the Epic Games Store, not to console or PC Fortnite.",
    },
    pricingMode: "staged",
    education: {
      about: "Fortnite is Epic Games' global battle royale phenomenon with building, zero-build and creative modes, plus constant collaborations with music, film and sport franchises.",
      currencyUses:
        "V-Bucks are the premium currency used to buy the Battle Pass, outfit skins, pickaxes, emotes and Crew Packs. Your cosmetic collection follows your Epic account across every platform you play on.",
      findId: "Your Fortnite account is your Epic Games account. Sign in with the same Epic account you play with — top-ups credit that account.",
      steps: [
        "Pick the V-Bucks pack you want and add it to your cart.",
        "Sign in or link the Epic Games account you play with.",
        "Complete payment securely via Razorpay (UPI, cards, wallets).",
        "V-Bucks are delivered to your Epic account — track the order anytime from Orders.",
      ],
      regionNote:
        "V-Bucks are delivered to your global Epic account from any market. Note: V-Bucks purchased on one platform may only be visible there, so buy on the platform you mostly play.",
    },
  },
];

export const mainGames = games.filter((game) => game.kind === "game");
export const regionalMobileLegendsGames = games.filter(
  (game) => game.kind === "mobile-legends-region",
);
