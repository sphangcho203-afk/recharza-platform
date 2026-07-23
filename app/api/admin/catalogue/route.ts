import type { Prisma } from "@/generated/prisma/client";

import { getRequestSession } from "@/lib/auth";
import {
  isTrustedProductMediaUrl,
  resolveProductMedia,
} from "@/lib/catalog/product-media";
import { mainGames } from "@/lib/games";
import { mobileLegendsMarkets } from "@/lib/mobile-legends-market";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

const catalogueProductSelect = {
  id: true,
  provider: true,
  offerId: true,
  categoryId: true,
  gameSlug: true,
  name: true,
  region: true,
  retailPriceInPaise: true,
  available: true,
  published: true,
  syncedAt: true,
  raw: true,
} as const;

async function requireAdmin(request: Request) {
  const session = await getRequestSession(request);
  return session?.customer.role === "ADMIN" ? session : null;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function getStorefrontName(name: string, raw: unknown) {
  const override = asObject(raw).adminStorefrontName;
  return typeof override === "string" && override.trim()
    ? override.trim().slice(0, 120)
    : name;
}

function serializeProduct(product: {
  id: string;
  provider: string;
  offerId: string;
  categoryId: string;
  gameSlug: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  available: boolean;
  published: boolean;
  syncedAt: Date;
  raw: unknown;
}) {
  const displayName = getStorefrontName(product.name, product.raw);

  return {
    ...product,
    name: displayName,
    syncedAt: product.syncedAt.toISOString(),
    media: resolveProductMedia({
      gameSlug: product.gameSlug,
      productName: displayName,
      supplierRaw: product.raw,
    }),
  };
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const products = await getPrisma().supplierProduct.findMany({
    orderBy: [
      { gameSlug: "asc" },
      { region: "asc" },
      { retailPriceInPaise: "asc" },
    ],
    take: 500,
    select: catalogueProductSelect,
  });

  return Response.json({
    ok: true,
    interfaces: {
      storefront: "/",
      account: "/account",
      tracking: "/orders/lookup",
      staff: "/staff",
      admin: "/admin",
    },
    games: mainGames.map((game) => ({
      slug: game.slug,
      title: game.title,
      status: game.status,
      available: Boolean(game.available),
      href: game.href ?? null,
      mediaSources: [...game.artworkSources, ...game.logoSources],
    })),
    markets: mobileLegendsMarkets.map((market) => ({
      code: market.code,
      label: market.label,
      flag: market.flag,
      href: `/games/mobile-legends/${market.code}`,
      defaultCurrency: market.defaultCurrency,
    })),
    products: products.map(serializeProduct),
  });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json(
      { ok: false, message: "A valid catalogue update is required." },
      { status: 400 },
    );
  }

  const data = body as Record<string, unknown>;
  const productId = typeof data.productId === "string" ? data.productId.trim() : "";
  if (!productId) {
    return Response.json(
      { ok: false, message: "productId is required." },
      { status: 400 },
    );
  }

  const product = await getPrisma().supplierProduct.findUnique({
    where: { id: productId },
    select: { id: true, name: true, raw: true },
  });
  if (!product) {
    return Response.json(
      { ok: false, message: "Catalogue product was not found." },
      { status: 404 },
    );
  }

  const raw = asObject(product.raw);
  const imageUrl =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : undefined;
  const imageAlt =
    typeof data.imageAlt === "string"
      ? data.imageAlt.trim().slice(0, 180)
      : undefined;
  const storefrontName =
    typeof data.storefrontName === "string"
      ? data.storefrontName.trim().slice(0, 120)
      : undefined;

  if (imageUrl !== undefined) {
    if (imageUrl && !isTrustedProductMediaUrl(imageUrl)) {
      return Response.json(
        {
          ok: false,
          message:
            "The media URL must use HTTPS and a reviewed publisher, supplier, or configured CDN host.",
        },
        { status: 400 },
      );
    }

    if (imageUrl) {
      raw.adminMediaOverride = {
        imageUrl,
        imageAlt: imageAlt || `${product.name} artwork`,
      };
    } else {
      delete raw.adminMediaOverride;
    }
  }

  if (storefrontName !== undefined) {
    if (storefrontName) raw.adminStorefrontName = storefrontName;
    else delete raw.adminStorefrontName;
  }

  const updateData: Prisma.SupplierProductUpdateInput = {
    raw: raw as Prisma.InputJsonValue,
  };
  if (typeof data.published === "boolean") updateData.published = data.published;
  if (typeof data.available === "boolean") updateData.available = data.available;

  const updated = await getPrisma().supplierProduct.update({
    where: { id: productId },
    data: updateData,
    select: catalogueProductSelect,
  });

  await getPrisma().adminAuditLog.create({
    data: {
      action: "CATALOG_PRODUCT_UPDATED",
      actorFingerprint: session.sessionId,
      actorCustomerId: session.customer.id,
      metadata: {
        productId,
        published: updated.published,
        available: updated.available,
        mediaOverrideChanged: imageUrl !== undefined,
        storefrontNameChanged: storefrontName !== undefined,
      },
    },
  });

  return Response.json({ ok: true, product: serializeProduct(updated) });
}
