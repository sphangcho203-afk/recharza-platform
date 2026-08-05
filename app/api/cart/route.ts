import { getCartForRequest, serializeCart } from "@/lib/cart";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const CART_LOOKUP_TIMEOUT_MS = 10_000;

class CartLookupTimeoutError extends Error {
  constructor() {
    super("Cart lookup timed out");
    this.name = "CartLookupTimeoutError";
  }
}

async function withCartLookupTimeout<T>(operation: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new CartLookupTimeoutError()),
          CART_LOOKUP_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  try {
    // Reading a fresh guest cart should not create an empty database record.
    // The first write creates the cart when a package is actually added.
    const result = await withCartLookupTimeout(
      getCartForRequest(request, { create: false }),
    );

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
    if (error instanceof CartLookupTimeoutError) {
      return Response.json(
        {
          ok: false,
          message: "The cart took too long to load. Please retry.",
        },
        { status: 504, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Cart lookup failed", error);
    }

    return Response.json(
      { ok: false, message: "The cart could not be loaded." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
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
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
