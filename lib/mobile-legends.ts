export type MobileLegendsPackage = {
  id: string;
  name: string;
  description: string;
  amountInPaise: number;
  deliveryLabel: string;
  featured?: boolean;
  source: "fazercards-live" | "fazercards-indicative";
  supplierProductId?: string;
  supplierCategoryId?: string;
  supplierOfferId?: string;
  region?: string | null;
  expectedMarginInPaise?: number;
};

type IndicativePackageRow = readonly [
  id: string,
  name: string,
  amountInPaise: number,
  supplierOfferId: string,
  featured?: boolean,
];

const indicativePackageRows: IndicativePackageRow[] = [
  ["mlbb-limited-value-indicative", "Limited-Time Value Pack", 5_000, "indicative-limited-value"],
  ["mlbb-5-indicative", "5 Diamonds", 3_000, "indicative-5"],
  ["mlbb-11-indicative", "10 + 1 Diamonds", 4_000, "indicative-10-plus-1"],
  ["mlbb-14-indicative", "14 Diamonds", 4_500, "indicative-14"],
  ["mlbb-22-indicative", "20 + 2 Diamonds", 5_500, "indicative-20-plus-2"],
  ["mlbb-42-indicative", "42 Diamonds", 9_500, "indicative-42"],
  ["mlbb-55-indicative", "50 + 5 Diamonds", 9_500, "indicative-50-plus-5"],
  ["mlbb-56-indicative", "51 + 5 Diamonds", 10_000, "indicative-51-plus-5"],
  ["mlbb-70-indicative", "70 Diamonds", 15_000, "indicative-70"],
  ["mlbb-86-indicative", "78 + 8 Diamonds", 14_000, "indicative-78-plus-8"],
  ["mlbb-weekly-elite-indicative", "Weekly Elite Pack", 10_000, "indicative-weekly-elite"],
  ["mlbb-weekly-pass-indicative", "Weekly Diamond Pass", 17_500, "indicative-weekly-pass", true],
  ["mlbb-112-indicative", "102 + 10 Diamonds", 19_000, "indicative-102-plus-10"],
  ["mlbb-140-indicative", "140 Diamonds", 28_000, "indicative-140"],
  ["mlbb-165-indicative", "150 + 15 Diamonds", 26_000, "indicative-150-plus-15"],
  ["mlbb-172-indicative", "156 + 16 Diamonds", 26_500, "indicative-156-plus-16"],
  ["mlbb-223-indicative", "203 + 20 Diamonds", 36_500, "indicative-203-plus-20"],
  ["mlbb-257-indicative", "234 + 23 Diamonds", 38_500, "indicative-234-plus-23"],
  ["mlbb-275-indicative", "250 + 25 Diamonds", 41_000, "indicative-250-plus-25"],
  ["mlbb-336-indicative", "303 + 33 Diamonds", 54_500, "indicative-303-plus-33"],
  ["mlbb-355-indicative", "355 Diamonds", 69_000, "indicative-355"],
  ["mlbb-429-indicative", "429 Diamonds", 83_000, "indicative-429"],
  ["mlbb-565-indicative", "500 + 65 Diamonds", 83_000, "indicative-500-plus-65"],
  ["mlbb-570-indicative", "504 + 66 Diamonds", 90_000, "indicative-504-plus-66"],
  ["mlbb-twilight-pass-indicative", "Twilight Pass", 90_500, "indicative-twilight-pass"],
  ["mlbb-706-indicative", "625 + 81 Diamonds", 102_500, "indicative-625-plus-81"],
  ["mlbb-716-indicative", "716 Diamonds", 134_500, "indicative-716"],
];

export const fallbackMobileLegendsPackages: MobileLegendsPackage[] = indicativePackageRows.map(
  ([id, name, amountInPaise, supplierOfferId, featured]) => ({
    id,
    name,
    description:
      "Indicative public-supplier benchmark for development preview. The exact regional Gold-plan rate replaces this after an approved live sync.",
    amountInPaise,
    deliveryLabel: "Indicative supplier benchmark",
    featured,
    source: "fazercards-indicative",
    supplierOfferId,
    region: null,
  }),
);

export function getFallbackMobileLegendsPackage(packageId: string) {
  return fallbackMobileLegendsPackages.find((item) => item.id === packageId) ?? null;
}

export function formatInr(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100);
}
