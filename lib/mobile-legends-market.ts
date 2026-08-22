import type { SupportedCurrencyCode } from "@/lib/commerce/currencies";

export const mobileLegendsMarketCodes = [
  "india",
  "indonesia",
  "philippines",
  "brazil",
  "malaysia",
  "singapore",
  "turkey",
  "united-states",
] as const;

export type MobileLegendsMarketCode = (typeof mobileLegendsMarketCodes)[number];

export type MobileLegendsMarket = {
  code: MobileLegendsMarketCode;
  label: string;
  flag: string;
  note: string;
  defaultCurrency: SupportedCurrencyCode;
  providerAliases: readonly string[];
};

export const mobileLegendsMarkets: MobileLegendsMarket[] = [
  {
    code: "india",
    label: "India",
    flag: "🇮🇳",
    note: "Optimized for accounts registered in India. Prices shown in INR.",
    defaultCurrency: "INR",
    providerAliases: ["india", "in"],
  },
  {
    code: "indonesia",
    label: "Indonesia",
    flag: "🇮🇩",
    note: "Optimized for accounts registered in Indonesia. Prices shown in IDR.",
    defaultCurrency: "IDR",
    providerAliases: ["indonesia", "id"],
  },
  {
    code: "philippines",
    label: "Philippines",
    flag: "🇵🇭",
    note: "Optimized for accounts registered in the Philippines. Prices shown in PHP.",
    defaultCurrency: "PHP",
    providerAliases: ["philippines", "philippine", "ph"],
  },
  {
    code: "brazil",
    label: "Brazil",
    flag: "🇧🇷",
    note: "Optimized for accounts registered in Brazil. Prices shown in BRL.",
    defaultCurrency: "BRL",
    providerAliases: ["brazil", "br"],
  },
  {
    code: "malaysia",
    label: "Malaysia",
    flag: "🇲🇾",
    note: "Optimized for accounts registered in Malaysia. Prices shown in MYR.",
    defaultCurrency: "MYR",
    providerAliases: ["malaysia", "my"],
  },
  {
    code: "singapore",
    label: "Singapore",
    flag: "🇸🇬",
    note: "Optimized for accounts registered in Singapore. Prices shown in SGD.",
    defaultCurrency: "SGD",
    providerAliases: ["singapore", "sg"],
  },
  {
    code: "turkey",
    label: "Turkey",
    flag: "🇹🇷",
    note: "Optimized for accounts registered in Turkey. Prices shown in TRY.",
    defaultCurrency: "TRY",
    providerAliases: ["turkey", "türkiye", "tr"],
  },
  {
    code: "united-states",
    label: "United States",
    flag: "🇺🇸",
    note: "Optimized for accounts registered in the United States. Prices shown in USD.",
    defaultCurrency: "USD",
    providerAliases: ["united states", "usa", "us"],
  },
];

function normalizeRegion(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[_·-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function parseMobileLegendsMarket(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return mobileLegendsMarkets.find((market) => market.code === normalized) ?? null;
}

export function isPackageAvailableForMarket(
  packageRegion: string | null | undefined,
  marketCode: MobileLegendsMarketCode,
) {
  if (!packageRegion) return true;
  const market = mobileLegendsMarkets.find((item) => item.code === marketCode);
  if (!market) return false;
  const normalizedRegion = normalizeRegion(packageRegion);
  const regionTokens = new Set(normalizedRegion.split(" ").filter(Boolean));

  return market.providerAliases.some((alias) => {
    const normalizedAlias = normalizeRegion(alias);
    if (normalizedRegion === normalizedAlias) return true;
    if (normalizedAlias.length <= 3) return regionTokens.has(normalizedAlias);
    return normalizedRegion.includes(normalizedAlias);
  });
}
