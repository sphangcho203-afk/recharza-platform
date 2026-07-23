import { resolveProductMedia, type ProductMedia } from "@/lib/catalog/product-media";
import type { Game } from "@/lib/games";

export type StoreProductSource = "fazercards-live" | "fazercards-indicative";

export type StoreProduct = {
  id: string;
  gameSlug: string;
  name: string;
  description: string;
  amountInPaise: number;
  deliveryLabel: string;
  source: StoreProductSource;
  featured?: boolean;
  region?: string | null;
  supplierProductId?: string;
  supplierCategoryId?: string;
  supplierOfferId?: string;
  expectedMarginInPaise?: number;
  media: ProductMedia;
};

const commonMultipliers = [1, 2, 3, 5, 8, 12, 20, 30] as const;
const giftCardMultipliers = [1, 2, 5, 10] as const;

function roundToNearestHundred(value: number) {
  return Math.max(100, Math.round(value / 100) * 100);
}

function productName(game: Game, index: number) {
  const packageName = game.packages[index % game.packages.length] ?? "Credit";
  const tier = Math.floor(index / Math.max(1, game.packages.length)) + 1;

  if (game.fulfilmentType === "gift-card" || game.fulfilmentType === "redeem-code") {
    const valueLabels = ["Starter", "Standard", "Plus", "Premium", "Max"];
    return `${packageName} · ${valueLabels[Math.min(tier - 1, valueLabels.length - 1)]}`;
  }

  if (tier === 1) return packageName;
  return `${packageName} · Tier ${tier}`;
}

export function createIndicativeProducts(game: Game): StoreProduct[] {
  const base = game.startingPriceInPaise ?? 10_000;
  const multipliers =
    game.fulfilmentType === "gift-card" || game.fulfilmentType === "redeem-code"
      ? giftCardMultipliers
      : commonMultipliers;
  const total = Math.min(
    game.fulfilmentType === "gift-card" || game.fulfilmentType === "redeem-code" ? 12 : 16,
    Math.max(game.packages.length * 3, multipliers.length),
  );

  return Array.from({ length: total }, (_, index) => {
    const multiplier = multipliers[index % multipliers.length];
    const cycle = Math.floor(index / multipliers.length) + 1;
    const name = productName(game, index);
    const amountInPaise = roundToNearestHundred(base * multiplier * cycle);

    return {
      id: `indicative:${game.slug}:${index + 1}`,
      gameSlug: game.slug,
      name,
      description:
        "Indicative supplier preview. Final availability, account compatibility, and supplier rate are rechecked on the server before an order is accepted.",
      amountInPaise,
      deliveryLabel:
        game.fulfilmentType === "gift-card" || game.fulfilmentType === "redeem-code"
          ? "Digital code after payment verification"
          : "Direct fulfilment after account validation",
      source: "fazercards-indicative",
      featured: index === 2,
      region: game.region?.label ?? null,
      supplierOfferId: `indicative-${game.slug}-${index + 1}`,
      media: resolveProductMedia({
        gameSlug: game.slug.startsWith("mobile-legends-") ? "mobile-legends" : game.slug,
        productName: name,
      }),
    } satisfies StoreProduct;
  });
}

export function getIndicativeProduct(game: Game, productId: string) {
  return createIndicativeProducts(game).find((product) => product.id === productId) ?? null;
}
