export type MobileLegendsPackage = {
  id: string;
  name: string;
  description: string;
  amountInPaise: number;
  deliveryLabel: string;
  featured?: boolean;
  source: "fazercards-live" | "fazercards-indicative";
  supplierCategoryId?: string;
  supplierOfferId?: string;
  region?: string | null;
  expectedMarginInPaise?: number;
};

export const fallbackMobileLegendsPackages: MobileLegendsPackage[] = [
  {
    id: "mlbb-86-indicative",
    name: "86 Diamonds",
    description: "78 Diamonds + 8 bonus. Entry pack with a protected minimum profit.",
    amountInPaise: 13_000,
    deliveryLabel: "Supplier price fallback",
    source: "fazercards-indicative",
    supplierOfferId: "indicative-78-plus-8",
  },
  {
    id: "mlbb-weekly-pass-indicative",
    name: "Weekly Diamond Pass",
    description: "Seven-day value pack for frequent players.",
    amountInPaise: 16_000,
    deliveryLabel: "Supplier price fallback",
    featured: true,
    source: "fazercards-indicative",
    supplierOfferId: "indicative-weekly-pass",
  },
  {
    id: "mlbb-172-indicative",
    name: "172 Diamonds",
    description: "156 Diamonds + 16 bonus for regular top-ups.",
    amountInPaise: 25_000,
    deliveryLabel: "Supplier price fallback",
    source: "fazercards-indicative",
    supplierOfferId: "indicative-156-plus-16",
  },
  {
    id: "mlbb-257-indicative",
    name: "257 Diamonds",
    description: "234 Diamonds + 23 bonus for events and premium items.",
    amountInPaise: 36_000,
    deliveryLabel: "Supplier price fallback",
    source: "fazercards-indicative",
    supplierOfferId: "indicative-234-plus-23",
  },
  {
    id: "mlbb-565-indicative",
    name: "565 Diamonds",
    description: "500 Diamonds + 65 bonus with a lower percentage margin at higher value.",
    amountInPaise: 83_000,
    deliveryLabel: "Supplier price fallback",
    source: "fazercards-indicative",
    supplierOfferId: "indicative-500-plus-65",
  },
  {
    id: "mlbb-twilight-pass-indicative",
    name: "Twilight Pass",
    description: "Premium progression pass priced from the public supplier reference rate.",
    amountInPaise: 90_000,
    deliveryLabel: "Supplier price fallback",
    source: "fazercards-indicative",
    supplierOfferId: "indicative-twilight-pass",
  },
];

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
