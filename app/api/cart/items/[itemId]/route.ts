import { getCartForRequest, serializeCart } from "@/lib/cart";
import { validateMobileLegendsIdentity } from "@/lib/player-identity-provider";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const CART_ITEM_LIMIT = 24;
const CART_ITEM_WINDOW_MS = 10 * 60 * 1000;

async function findOwnedItem(request: Request, itemId: string) {
  const cartResult = await getCartForRequest(request, { create: false });
  const item = cartResult.cart?.items.find((entry) => entry.id === itemId) ?? null;
  return { cartResult, item };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "PATCH:/api/cart/items/:itemId",
      limit: CART_ITEM_LIMIT,
      windowMs: CART_ITEM_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many cart changes. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { itemId } = await context.params;
    const { cartResult, item } = await findOwnedItem(request, itemId);
    if (!cartResult.cart || !item) {
      return Response.json(
        { ok: false, message: "Cart item not found." },
        { status: 404, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Player details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const identity = await validateMobileLegendsIdentity({
      playerId: data.playerId,
      zoneId: data.zoneId,
    });

    if (!identity.valid) {
      return Response.json(
        { ok: false, message: identity.message },
        { status: 400, headers: rateHeaders },
      );
    }

    await getPrisma().cartItem.update({
      where: { id: item.id },
      data: {
        playerId: identity.playerId,
        zoneId: identity.zoneId,
        verifiedNickname: identity.nickname,
        verificationMode: identity.verificationMode,
      },
    });

    const updated = await getPrisma().cart.findUnique({
      where: { id: cartResult.cart.id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    return Response.json(
      {
        ok: true,
        message: identity.message,
        cart: serializeCart(updated),
      },
      {
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
      console.error("Cart item update failed", error);
    }
    return Response.json(
      { ok: false, message: "The cart item could not be updated." },
      { status: 503, headers: rateHeaders },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;
    const { cartResult, item } = await findOwnedItem(request, itemId);
    if (!cartResult.cart || !item) {
      return Response.json(
        { ok: false, message: "Cart item not found." },
        { status: 404 },
      );
    }

    await getPrisma().cartItem.delete({ where: { id: item.id } });
    const updated = await getPrisma().cart.findUnique({
      where: { id: cartResult.cart.id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    return Response.json(
      {
        ok: true,
        message: "Item removed from cart.",
        cart: serializeCart(updated),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...(cartResult.setCookie
            ? { "Set-Cookie": cartResult.setCookie }
            : {}),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Cart item removal failed", error);
    }
    return Response.json(
      { ok: false, message: "The cart item could not be removed." },
      { status: 503 },
    );
  }
}
