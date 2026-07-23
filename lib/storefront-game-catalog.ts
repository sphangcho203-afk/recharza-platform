import "server-only";

import { resolveProductMedia } from "@/lib/catalog/product-media";
import {
  createIndicativeProducts,
  getIndicativeProduct,
  type StoreProduct,
} from "@/lib/generic-catalog";
import type { Game } from "@/lib/games";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function storefrontName(name: string, raw: unknown) {
  const override = asObject(raw).adminStorefrontName;
  return typeof override === "string" && override.trim() ? override.trim() : name;
}

function mapSupplierProduct(product: {
  id: string;
  offerId: string;
  categoryId: string;
  gameSlug: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  expectedMarginInPaise: number;
  raw: unknown;
}): StoreProduct {
  const name = storefrontName(product.name, product.raw);

  return {
    id: product.offerId,
    gameSlug: product.gameSlug,
    name,
    description:
      "Live FazerCards catalogue offer. Availability, required account fields, region, and supplier rate are verified again during checkout.",
    amountInPaise: product.retailPriceInPaise,
    deliveryLabel: "Live supplier catalogue",
    source: "fazercards-live",
    supplierProductId: product.id,
    supplierCategoryId: product.categoryId,
    supplierOfferId: product.offerId,
    region: product.region,
    expectedMarginInPaise: product.expectedMarginInPaise,
    media: resolveProductMedia({
      gameSlug: product.gameSlug,
      productName: name,
      supplierRaw: product.raw,
    }),
  };
}

export async function getStoreProductsForGame(game: Game): Promise<StoreProduct[]> {
  try {
    const products = await getPrisma().supplierProduct.findMany({
      where: {
        provider: "fazercards",
        gameSlug: game.slug,
        available: true,
        published: true,
      },
      orderBy: [{ retailPriceInPaise: "asc" }, { name: "asc" }],
      take: 40,
      select: {
        id: true,
        offerId: true,
        categoryId: true,
        gameSlug: true,
        name: true,
        region: true,
        retailPriceInPaise: true,
        expectedMarginInPaise: true,
        raw: true,
      },
    });

    if (products.length > 0) return products.map(mapSupplierProduct);
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error(`Live ${game.slug} catalogue unavailable`, error);
    }
  }

  return createIndicativeProducts(game);
}

export async function getStoreProductForCheckout(game: Game, productId: string) {
  const indicative = getIndicativeProduct(game, productId);
  if (indicative) return indicative;

  try {
    const product = await getPrisma().supplierProduct.findFirst({
      where: {
        provider: "fazercards",
        gameSlug: game.slug,
        offerId: productId,
        available: true,
        published: true,
      },
      select: {
        id: true,
        offerId: true,
        categoryId: true,
        gameSlug: true,
        name: true,
        region: true,
        retailPriceInPaise: true,
        expectedMarginInPaise: true,
        raw: true,
      },
    });

    return product ? mapSupplierProduct(product) : null;
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error(`${game.slug} checkout catalogue unavailable`, error);
    }
    return null;
  }
}
