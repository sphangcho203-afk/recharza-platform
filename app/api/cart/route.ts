import { getCartForRequest, serializeCart } from "@/lib/cart";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const result = await getCartForRequest(request);
    return Response.json(
      {
        ok: true,
        owner: result.owner,
        cart: serializeCart(result.cart),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...(result.setCookie ? { "Set-Cookie": result.setCookie } : {}),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Cart lookup failed", error);
    }
    return Response.json(
      { ok: false, message: "The cart could not be loaded." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await getCartForRequest(request, { create: false });
    if (result.cart) {
      await getPrisma().cartItem.deleteMany({
        where: { cartId: result.cart.id },
      });
    }

    return Response.json(
      {
        ok: true,
        message: "Cart cleared.",
        cart: {
          id: result.cart?.id ?? null,
          itemCount: 0,
          totalInPaise: 0,
          currency: "INR",
          items: [],
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...(result.setCookie ? { "Set-Cookie": result.setCookie } : {}),
        },
      },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Cart clear failed", error);
    }
    return Response.json(
      { ok: false, message: "The cart could not be cleared." },
      { status: 503 },
    );
  }
}
