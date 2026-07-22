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
  "global",
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
    note: "Use only for accounts confirmed against an approved India supplier catalogue.",
    defaultCurrency: "INR",
    providerAliases: ["india", "in"],
  },
  {
    code: "indonesia",
    label: "Indonesia",
    flag: "🇮🇩",
    note: "For Mobile Legends accounts routed through the Indonesia supplier catalogue.",
    defaultCurrency: "IDR",
    providerAliases: ["indonesia", "id"],
  },
  {
    code: "philippines",
    label: "Philippines",
    flag: "🇵🇭",
    note: "For Mobile Legends accounts routed through the Philippines supplier catalogue.",
    defaultCurrency: "PHP",
    providerAliases: ["philippines", "philippine", "ph"],
  },
  {
    code: "brazil",
    label: "Brazil",
    flag: "🇧🇷",
    note: "For accounts confirmed against the FazerCards Brazil product line.",
    defaultCurrency: "BRL",
    providerAliases: ["brazil", "br"],
  },
  {
    code: "malaysia",
    label: "Malaysia",
    flag: "🇲🇾",
    note: "For accounts confirmed against the FazerCards Malaysia product line.",
    defaultCurrency: "MYR",
    providerAliases: ["malaysia", "my"],
  },
  {
    code: "singapore",
    label: "Singapore",
    flag: "🇸🇬",
    note: "For accounts confirmed against the FazerCards Singapore product line.",
    defaultCurrency: "SGD",
    providerAliases: ["singapore", "sg"],
  },
  {
    code: "turkey",
    label: "Turkey",
    flag: "🇹🇷",
    note: "For accounts confirmed against the FazerCards Turkey product line.",
    defaultCurrency: "TRY",
    providerAliases: ["turkey", "türkiye", "tr"],
  },
  {
    code: "united-states",
    label: "United States",
    flag: "🇺🇸",
    note: "For accounts confirmed against the FazerCards United States product line.",
    defaultCurrency: "USD",
    providerAliases: ["united states", "usa", "us"],
  },
  {
    code: "global",
    label: "Global",
    flag: "🌐",
    note: "Use only when player validation confirms the account belongs to an approved Global catalogue.",
    defaultCurrency: "USD",
    providerAliases: ["global", "worldwide", "international"],
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
  return market.providerAliases.some((alias) => {
    const normalizedAlias = normalizeRegion(alias);
    return normalizedRegion === normalizedAlias || normalizedRegion.includes(normalizedAlias);
  });
}
