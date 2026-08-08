import "server-only";

import { resolveProductMedia, type ProductMedia } from "@/lib/catalog/product-media";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const supplierCheckoutGameSlugs = [
  "free-fire",
  "pubg-mobile",
  "valorant",
  "genshin-impact",
] as const;

export type SupplierCheckoutGameSlug = (typeof supplierCheckoutGameSlugs)[number];

export type StorefrontGamePackage = {
  id: string;
  gameSlug: SupplierCheckoutGameSlug;
  name: string;
  description: string;
  amountInPaise: number;
  marketCode: string;
  marketLabel: string;
  region: string | null;
  fields: unknown;
  source: "fazercards-live";
  supplierProductId: string;
  supplierCategoryId: string;
  supplierOfferId: string;
  expectedMarginInPaise: number;
  media: ProductMedia;
};

type SupplierProductView = {
  id: string;
  gameSlug: string;
  offerId: string;
  categoryId: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  expectedMarginInPaise: number;
  fields: unknown;
  raw: unknown;
};

const supplierProductSelect = {
  id: true,
  gameSlug: true,
  offerId: true,
  categoryId: true,
  name: true,
  region: true,
  retailPriceInPaise: true,
  expectedMarginInPaise: true,
  fields: true,
  raw: true,
} as const;

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getCategoryLabel(raw: unknown, categoryId: string) {
  const rawObject = asObject(raw);
  return (
    readString(rawObject?.categoryName) ||
    categoryId
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getDescription(raw: unknown, marketLabel: string) {
  const rawObject = asObject(raw);
  return (
    readString(rawObject?.categoryNote) ||
    `Live FazerCards offer for ${marketLabel}. Confirm the account market before payment.`
  );
}

function mapSupplierProduct(product: SupplierProductView): StorefrontGamePackage | null {
  if (!supplierCheckoutGameSlugs.includes(product.gameSlug as SupplierCheckoutGameSlug)) {
    return null;
  }

  const marketLabel = getCategoryLabel(product.raw, product.categoryId);
  const gameSlug = product.gameSlug as SupplierCheckoutGameSlug;

  return {
    id: product.id,
    gameSlug,
    name: product.name,
    description: getDescription(product.raw, marketLabel),
    amountInPaise: product.retailPriceInPaise,
    marketCode: product.categoryId,
    marketLabel,
    region: product.region,
    fields: product.fields,
    source: "fazercards-live",
    supplierProductId: product.id,
    supplierCategoryId: product.categoryId,
    supplierOfferId: product.offerId,
    expectedMarginInPaise: product.expectedMarginInPaise,
    media: resolveProductMedia({
      gameSlug,
      productName: product.name,
      supplierRaw: product.raw,
    }),
  };
}

export function isSupplierCheckoutGameSlug(value: unknown): value is SupplierCheckoutGameSlug {
  return typeof value === "string" && supplierCheckoutGameSlugs.includes(value as SupplierCheckoutGameSlug);
}

export async function getPublishedGamePackages(gameSlug: SupplierCheckoutGameSlug): Promise<StorefrontGamePackage[]> {
  try {
    const products = await getPrisma().supplierProduct.findMany({
      where: {
        provider: "fazercards",
        gameSlug,
        available: true,
        published: true,
      },
      orderBy: [
        { categoryId: "asc" },
        { retailPriceInPaise: "asc" },
        { name: "asc" },
      ],
      take: 100,
      select: supplierProductSelect,
    });

    return products
      .map((product) => mapSupplierProduct(product))
      .filter((product): product is StorefrontGamePackage => Boolean(product));
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) return [];
    console.error(`Live ${gameSlug} catalogue unavailable`, error);
    throw error;
  }
}

export async function getPublishedGamePackageForCheckout(gameSlug: SupplierCheckoutGameSlug, packageId: string) {
  const normalizedPackageId = packageId.trim();
  if (!normalizedPackageId) return null;

  try {
    const product = await getPrisma().supplierProduct.findFirst({
      where: {
        id: normalizedPackageId,
        provider: "fazercards",
        gameSlug,
        available: true,
        published: true,
      },
      select: supplierProductSelect,
    });

    return product ? mapSupplierProduct(product) : null;
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) return null;
    console.error(`${gameSlug} checkout catalogue unavailable`, error);
    throw error;
  }
}
