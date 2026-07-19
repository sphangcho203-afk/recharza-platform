export type Game = {
  slug: string;
  title: string;
  publisher: string;
  category: string;
  icon: string;
  gradient: string;
  badge?: string;
  available?: boolean;
  packages: string[];
  pricingMode?: "live" | "fallback" | "staged";
  startingPriceInPaise?: number | null;
};

export const games: Game[] = [
  {
    slug: "mobile-legends",
    title: "Mobile Legends",
    publisher: "MOONTON",
    category: "MOBA",
    icon: "ML",
    gradient: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    badge: "Supplier-priced",
    available: true,
    packages: ["Diamonds", "Weekly Pass", "Twilight Pass"],
    pricingMode: "fallback",
    startingPriceInPaise: 13_000,
  },
  {
    slug: "free-fire",
    title: "Free Fire MAX",
    publisher: "Garena",
    category: "Battle Royale",
    icon: "FF",
    gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
    packages: ["Diamonds", "Membership", "Level Up Pass"],
    pricingMode: "staged",
  },
  {
    slug: "pubg-mobile",
    title: "PUBG Mobile",
    publisher: "KRAFTON",
    category: "Battle Royale",
    icon: "PM",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #475569 100%)",
    packages: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    pricingMode: "staged",
  },
  {
    slug: "valorant",
    title: "VALORANT",
    publisher: "Riot Games",
    category: "Tactical FPS",
    icon: "V",
    gradient: "linear-gradient(135deg, #fb7185 0%, #7f1d1d 100%)",
    packages: ["VALORANT Points", "Regional Top-Ups"],
    pricingMode: "staged",
  },
  {
    slug: "genshin-impact",
    title: "Genshin Impact",
    publisher: "HoYoverse",
    category: "Action RPG",
    icon: "GI",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #4338ca 100%)",
    packages: ["Genesis Crystals", "Blessing of the Welkin Moon"],
    pricingMode: "staged",
  },
  {
    slug: "roblox",
    title: "Roblox",
    publisher: "Roblox Corporation",
    category: "Platform",
    icon: "R",
    gradient: "linear-gradient(135deg, #334155 0%, #020617 100%)",
    packages: ["Robux", "Digital Gift Cards"],
    pricingMode: "staged",
  },
];
