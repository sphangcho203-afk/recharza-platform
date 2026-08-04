import { getCartForRequest, serializeCart } from "@/lib/cart";
import {
  isPackageAvailableForMarket,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";

export const runtime = "nodejs";

const CART_WRITE_LIMIT = 20;
const CART_WRITE_WINDOW_MS = 10 * 60 * 1000;

function normalizeOptionalNumericId(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\D/g, "").slice(0, maxLength);
  return normalized || null;
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
    if (data.gameSlug !== "mobile-legends") {
      return Response.json(
        { ok: false, message: "This cart currently supports Mobile Legends." },
        { status: 400, headers: rateHeaders },
      );
    }

    const market = parseMobileLegendsMarket(data.marketCode);
    const packageId =
      typeof data.packageId === "string" ? data.packageId.trim() : "";
    const selectedPackage = packageId
      ? await getMobileLegendsPackageForCheckout(packageId)
      : null;

    if (!market) {
      return Response.json(
        { ok: false, message: "Choose a supported account region." },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!selectedPackage) {
      return Response.json(
        {
          ok: false,
          message: "That package changed or is unavailable. Refresh and retry.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (!isPackageAvailableForMarket(selectedPackage.region, market.code)) {
      return Response.json(
        {
          ok: false,
          message: `That package is not approved for ${market.label}.`,
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const cartResult = await getCartForRequest(request);
    if (!cartResult.cart) {
      throw new Error("Cart could not be created.");
    }

    const playerId = normalizeOptionalNumericId(data.playerId, 24);
    const zoneId = normalizeOptionalNumericId(data.zoneId, 12);

    await getPrisma().cartItem.create({
      data: {
        cartId: cartResult.cart.id,
        gameSlug: "mobile-legends",
        marketCode: market.code,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amountInPaise: selectedPackage.amountInPaise,
        currency: "INR",
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
        message: `${selectedPackage.name} added to cart.`,
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
