import "server-only";

import { resolveProductMedia } from "@/lib/catalog/product-media";
import {
  fallbackMobileLegendsPackages,
  getFallbackMobileLegendsPackage,
  type MobileLegendsPackage,
} from "@/lib/mobile-legends";
import {
  prioritizeMobileLegendsPackages,
  targetMobileLegendsPackageCount,
} from "@/lib/mobile-legends-package-catalog";
import {
  isPackageAvailableForMarket,
  type MobileLegendsMarketCode,
} from "@/lib/mobile-legends-market";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export type StorefrontPricingSnapshot = {
  mode: "live" | "fallback";
  publishedCount: number;
  latestSyncAt: string | null;
  offersSynced: number;
  minimumPrices: Record<string, number | null>;
};

type SupplierProductView = {
  id: string;
  offerId: string;
  categoryId: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  expectedMarginInPaise: number;
  raw: unknown;
};

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getStorefrontName(name: string, raw: unknown) {
  const override = asObject(raw)?.adminStorefrontName;
  return typeof override === "string" && override.trim()
    ? override.trim().slice(0, 120)
    : name;
}

function mapSupplierProduct(product: SupplierProductView): MobileLegendsPackage {
  const displayName = getStorefrontName(product.name, product.raw);

  return {
    id: product.offerId,
    name: displayName,
    description: product.region
      ? `FazerCards live offer for ${product.region}. Confirm the player's account region before checkout.`
      : "FazerCards live supplier offer. Confirm all player details before checkout.",
    amountInPaise: product.retailPriceInPaise,
    deliveryLabel: "Live supplier catalogue",
    source: "fazercards-live",
    supplierProductId: product.id,
    supplierCategoryId: product.categoryId,
    supplierOfferId: product.offerId,
    region: product.region,
    expectedMarginInPaise: product.expectedMarginInPaise,
    media: resolveProductMedia({
      gameSlug: "mobile-legends",
      productName: displayName,
      supplierRaw: product.raw,
    }),
  };
}

const supplierProductSelect = {
  id: true,
  offerId: true,
  categoryId: true,
  name: true,
  region: true,
  retailPriceInPaise: true,
  expectedMarginInPaise: true,
  raw: true,
} as const;

export async function getMobileLegendsPackages(
  marketCode?: MobileLegendsMarketCode,
): Promise<MobileLegendsPackage[]> {
  try {
    const products = await getPrisma().supplierProduct.findMany({
      where: {
        provider: "fazercards",
        gameSlug: "mobile-legends",
        available: true,
        published: true,
      },
      orderBy: [{ retailPriceInPaise: "asc" }, { name: "asc" }],
      take: 500,
      select: supplierProductSelect,
    });

    const mapped = products.map((product) => mapSupplierProduct(product));
    const marketPackages = marketCode
      ? mapped.filter((item) => isPackageAvailableForMarket(item.region, marketCode))
      : mapped;

    if (marketPackages.length > 0) {
      return prioritizeMobileLegendsPackages(
        marketPackages,
        targetMobileLegendsPackageCount,
      );
    }
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Live Mobile Legends catalogue unavailable", error);
    }
  }

  return prioritizeMobileLegendsPackages(
    fallbackMobileLegendsPackages,
    targetMobileLegendsPackageCount,
  );
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
      select: supplierProductSelect,
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
