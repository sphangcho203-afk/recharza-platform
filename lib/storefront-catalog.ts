import "server-only";

import {
  fallbackMobileLegendsPackages,
  getFallbackMobileLegendsPackage,
  type MobileLegendsPackage,
} from "@/lib/mobile-legends";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export type StorefrontPricingSnapshot = {
  mode: "live" | "fallback";
  publishedCount: number;
  latestSyncAt: string | null;
  offersSynced: number;
  minimumPrices: Record<string, number | null>;
};

function mapSupplierProduct(product: {
  offerId: string;
  categoryId: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  expectedMarginInPaise: number;
}): MobileLegendsPackage {
  return {
    id: product.offerId,
    name: product.name,
    description: product.region
      ? `Fazercards live offer for ${product.region}. Confirm the player's account region before checkout.`
      : "Fazercards live supplier offer. Confirm all player details before checkout.",
    amountInPaise: product.retailPriceInPaise,
    deliveryLabel: "Live supplier catalogue",
    source: "fazercards-live",
    supplierCategoryId: product.categoryId,
    supplierOfferId: product.offerId,
    region: product.region,
    expectedMarginInPaise: product.expectedMarginInPaise,
  };
}

export async function getMobileLegendsPackages(): Promise<MobileLegendsPackage[]> {
  try {
    const products = await getPrisma().supplierProduct.findMany({
      where: {
        provider: "fazercards",
        gameSlug: "mobile-legends",
        available: true,
        published: true,
      },
      orderBy: [{ retailPriceInPaise: "asc" }, { name: "asc" }],
      take: 36,
      select: {
        offerId: true,
        categoryId: true,
        name: true,
        region: true,
        retailPriceInPaise: true,
        expectedMarginInPaise: true,
      },
    });

    if (products.length > 0) {
      return products.map(mapSupplierProduct);
    }
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Live Mobile Legends catalogue unavailable", error);
    }
  }

  return fallbackMobileLegendsPackages;
}

export async function getMobileLegendsPackageForCheckout(packageId: string) {
  const fallback = getFallbackMobileLegendsPackage(packageId);

  if (fallback) {
    return fallback;
  }

  try {
    const product = await getPrisma().supplierProduct.findFirst({
      where: {
        provider: "fazercards",
        offerId: packageId,
        gameSlug: "mobile-legends",
        available: true,
        published: true,
      },
      select: {
        offerId: true,
        categoryId: true,
        name: true,
        region: true,
        retailPriceInPaise: true,
        expectedMarginInPaise: true,
      },
    });

    return product ? mapSupplierProduct(product) : null;
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Mobile Legends checkout catalogue unavailable", error);
    }

    return null;
  }
}

export async function getStorefrontPricingSnapshot(): Promise<StorefrontPricingSnapshot> {
  try {
    const [publishedCount, latestSync, gameMinimums] = await Promise.all([
      getPrisma().supplierProduct.count({
        where: { provider: "fazercards", published: true, available: true },
      }),
      getPrisma().supplierSyncRun.findFirst({
        where: { provider: "fazercards", status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true, offersSynced: true },
      }),
      getPrisma().supplierProduct.groupBy({
        by: ["gameSlug"],
        where: { provider: "fazercards", published: true, available: true },
        _min: { retailPriceInPaise: true },
      }),
    ]);

    return {
      mode: publishedCount > 0 ? "live" : "fallback",
      publishedCount,
      latestSyncAt: latestSync?.completedAt?.toISOString() ?? null,
      offersSynced: latestSync?.offersSynced ?? 0,
      minimumPrices: Object.fromEntries(
        gameMinimums.map((item) => [item.gameSlug, item._min.retailPriceInPaise ?? null]),
      ),
    };
  } catch {
    return {
      mode: "fallback",
      publishedCount: 0,
      latestSyncAt: null,
      offersSynced: 0,
      minimumPrices: {},
    };
  }
}
