export const mobileLegendsMarketCodes = ["india", "indonesia", "philippines"] as const;

export type MobileLegendsMarketCode = (typeof mobileLegendsMarketCodes)[number];

export type MobileLegendsMarket = {
  code: MobileLegendsMarketCode;
  label: string;
  flag: string;
  note: string;
};

export const mobileLegendsMarkets: MobileLegendsMarket[] = [
  {
    code: "india",
    label: "India",
    flag: "🇮🇳",
    note: "For Mobile Legends accounts routed through the India catalogue.",
  },
  {
    code: "indonesia",
    label: "Indonesia",
    flag: "🇮🇩",
    note: "For Mobile Legends accounts routed through the Indonesia catalogue.",
  },
  {
    code: "philippines",
    label: "Philippines",
    flag: "🇵🇭",
    note: "For Mobile Legends accounts routed through the Philippines catalogue.",
  },
];

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
  return packageRegion.trim().toLowerCase() === marketCode;
}
