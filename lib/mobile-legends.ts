export type MobileLegendsPackage = {
  id: string;
  name: string;
  description: string;
  amountInPaise: number;
  deliveryLabel: string;
  featured?: boolean;
};

export const mobileLegendsPackages: MobileLegendsPackage[] = [
  {
    id: "diamonds-86",
    name: "86 Diamonds",
    description: "A starter diamond package for skins and in-game items.",
    amountInPaise: 9900,
    deliveryLabel: "Demo fulfilment",
  },
  {
    id: "diamonds-172",
    name: "172 Diamonds",
    description: "A balanced package for regular top-ups.",
    amountInPaise: 19500,
    deliveryLabel: "Demo fulfilment",
  },
  {
    id: "diamonds-257",
    name: "257 Diamonds",
    description: "A larger package for events and premium items.",
    amountInPaise: 28900,
    deliveryLabel: "Demo fulfilment",
  },
  {
    id: "weekly-diamond-pass",
    name: "Weekly Diamond Pass",
    description: "A seven-day value package for frequent players.",
    amountInPaise: 14900,
    deliveryLabel: "Demo fulfilment",
    featured: true,
  },
  {
    id: "twilight-pass",
    name: "Twilight Pass",
    description: "A premium progression package for active players.",
    amountInPaise: 74900,
    deliveryLabel: "Demo fulfilment",
  },
];

export function getMobileLegendsPackage(packageId: string) {
  return mobileLegendsPackages.find((item) => item.id === packageId) ?? null;
}

export function formatInr(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100);
}
