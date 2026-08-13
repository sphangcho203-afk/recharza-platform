import { getCartForRequest, serializeCart } from "@/lib/cart";
import {
  isPackageAvailableForMarket,
  parseMobileLegendsMarket,
  type MobileLegendsMarketCode,
} from "@/lib/mobile-legends-market";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import {
  getPublishedGamePackageForCheckout,
  isSupplierCheckoutGameSlug,
} from "@/lib/storefront-game-catalog";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";

export const runtime = "nodejs";

const CART_WRITE_LIMIT = 20;
const CART_WRITE_WINDOW_MS = 10 * 60 * 1000;
const CART_MAX_QUANTITY = 10;

function normalizeOptionalNumericId(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\D/g, "").slice(0, maxLength);
  return normalized || null;
}

type ResolvedCartProduct = {
  gameSlug: string;
  marketCode: MobileLegendsMarketCode | string;
  packageId: string;
  packageName: string;
  amountInPaise: number;
  currency: "INR";
};

type ResolveResult =
  | { ok: true; product: ResolvedCartProduct }
  | { ok: false; message: string };

async function resolveCartProduct(
  data: Record<string, unknown>,
): Promise<ResolveResult> {
  const gameSlug = typeof data.gameSlug === "string" ? data.gameSlug.trim() : "";
  const packageId =
    typeof data.packageId === "string" ? data.packageId.trim() : "";

  if (gameSlug === "mobile-legends") {
    const market = parseMobileLegendsMarket(data.marketCode);
    if (!market) {
      return { ok: false, message: "Choose a supported account region." };
    }

    const selectedPackage = packageId
      ? await getMobileLegendsPackageForCheckout(packageId)
      : null;
    if (!selectedPackage) {
      return {
        ok: false,
        message: "That package changed or is unavailable. Refresh and retry.",
      };
    }

    if (!isPackageAvailableForMarket(selectedPackage.region, market.code)) {
      return {
        ok: false,
        message: `That package is not approved for ${market.label}.`,
      };
    }

    return {
      ok: true,
      product: {
        gameSlug: "mobile-legends",
        marketCode: market.code,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amountInPaise: selectedPackage.amountInPaise,
        currency: "INR",
      },
    };
  }

  if (isSupplierCheckoutGameSlug(gameSlug)) {
    const selectedPackage = packageId
      ? await getPublishedGamePackageForCheckout(gameSlug, packageId)
      : null;
    if (!selectedPackage) {
      return {
        ok: false,
        message: "That product changed or is unavailable. Refresh and retry.",
      };
    }

    const requestedMarket =
      typeof data.marketCode === "string" ? data.marketCode.trim() : "";
    if (requestedMarket && requestedMarket !== selectedPackage.marketCode) {
      return {
        ok: false,
        message: `That product is not approved for the selected market.`,
      };
    }

    return {
      ok: true,
      product: {
        gameSlug,
        marketCode: selectedPackage.marketCode,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amountInPaise: selectedPackage.amountInPaise,
        currency: "INR",
      },
    };
  }

  return { ok: false, message: "That game is not available for cart." };
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/cart/items",
      limit: CART_WRITE_LIMIT,
      windowMs: CART_WRITE_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many cart changes. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Cart item details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const resolved = await resolveCartProduct(data);
    if (!resolved.ok) {
      return Response.json(
        { ok: false, message: resolved.message },
        { status: 409, headers: rateHeaders },
      );
    }

    const cartResult = await getCartForRequest(request);
    if (!cartResult.cart) {
      throw new Error("Cart could not be created.");
    }

    const { product } = resolved;
    const playerId = normalizeOptionalNumericId(data.playerId, 24);
    const zoneId = normalizeOptionalNumericId(data.zoneId, 12);

    const existingItem = cartResult.cart.items.find(
      (item) =>
        item.gameSlug === product.gameSlug &&
        item.marketCode === product.marketCode &&
        item.packageId === product.packageId &&
        (item.playerId ?? null) === playerId &&
        (item.zoneId ?? null) === zoneId,
    );

    if (existingItem) {
      const nextQuantity = Math.min(
        CART_MAX_QUANTITY,
        existingItem.quantity + 1,
      );

      await getPrisma().cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity },
      });

      const updated = await getPrisma().cart.findUnique({
        where: { id: cartResult.cart.id },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });

      return Response.json(
        {
          ok: true,
          message:
            nextQuantity > existingItem.quantity
              ? `${product.packageName} is already in your cart. Quantity increased to ${nextQuantity}.`
              : `${product.packageName} is already in your cart at the maximum quantity.`,
          cart: serializeCart(updated),
        },
        {
          status: 201,
          headers: {
            ...rateHeaders,
            "Cache-Control": "no-store",
            ...(cartResult.setCookie
              ? { "Set-Cookie": cartResult.setCookie }
              : {}),
          },
        },
      );
    }

    await getPrisma().cartItem.create({
      data: {
        cartId: cartResult.cart.id,
        gameSlug: product.gameSlug,
        marketCode: product.marketCode,
        packageId: product.packageId,
        packageName: product.packageName,
        amountInPaise: product.amountInPaise,
        currency: product.currency,
        quantity: 1,
        playerId,
        zoneId,
        verifiedNickname: null,
        verificationMode: null,
      },
    });

    const updated = await getPrisma().cart.findUnique({
      where: { id: cartResult.cart.id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    return Response.json(
      {
        ok: true,
        message: `${product.packageName} added to cart.`,
        cart: serializeCart(updated),
      },
      {
        status: 201,
        headers: {
          ...rateHeaders,
          "Cache-Control": "no-store",
          ...(cartResult.setCookie
            ? { "Set-Cookie": cartResult.setCookie }
            : {}),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Add-to-cart failed", error);
    }
    return Response.json(
      { ok: false, message: "The item could not be added to the cart." },
      { status: 503, headers: rateHeaders },
    );
  }
}