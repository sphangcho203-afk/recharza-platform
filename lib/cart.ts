import { createHash, randomBytes } from "node:crypto";

import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const CART_COOKIE = "recharza_cart";
const CART_TTL_SECONDS = 60 * 60 * 24 * 30;

function hashCartToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createCartToken() {
  return randomBytes(32).toString("base64url");
}

function parseCookies(request: Request) {
  const cookies = new Map<string, string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name && rest.length) cookies.set(name, decodeURIComponent(rest.join("=")));
  }
  return cookies;
}

export function createCartCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CART_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CART_TTL_SECONDS}${secure}`;
}

export function clearCartCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CART_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

const cartInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function getCartForRequest(
  request: Request,
  options: { create?: boolean } = {},
) {
  const create = options.create ?? true;
  const prisma = getPrisma();
  const session = await getRequestSession(request).catch(() => null);
  const guestToken = parseCookies(request).get(CART_COOKIE) ?? "";
  const validGuestToken =
    guestToken.length >= 32 && guestToken.length <= 256 ? guestToken : "";
  const guestKeyHash = validGuestToken
    ? hashCartToken(validGuestToken)
    : null;

  if (session) {
    let customerCart = await prisma.cart.findFirst({
      where: { customerId: session.customer.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: cartInclude,
    });

    if (!customerCart && create) {
      customerCart = await prisma.cart.create({
        data: { customerId: session.customer.id },
        include: cartInclude,
      });
    }

    let clearGuestCookie = false;
    if (customerCart && guestKeyHash) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestKeyHash },
        include: cartInclude,
      });

      if (
        guestCart &&
        guestCart.status === "ACTIVE" &&
        guestCart.id !== customerCart.id
      ) {
        await prisma.$transaction(async (transaction) => {
          const claimed = await transaction.cart.updateMany({
            where: {
              id: guestCart.id,
              guestKeyHash,
              status: "ACTIVE",
            },
            data: { status: "MERGING" },
          });

          if (claimed.count !== 1) return;

          if (guestCart.items.length) {
            await transaction.cartItem.createMany({
              data: guestCart.items.map((item) => ({
                cartId: customerCart!.id,
                gameSlug: item.gameSlug,
                marketCode: item.marketCode,
                packageId: item.packageId,
                packageName: item.packageName,
                amountInPaise: item.amountInPaise,
                currency: item.currency,
                quantity: item.quantity,
                playerId: item.playerId,
                zoneId: item.zoneId,
                verifiedNickname: item.verifiedNickname,
                verificationMode: item.verificationMode,
              })),
            });
          }

          await transaction.cart.deleteMany({
            where: { id: guestCart.id, status: "MERGING" },
          });
        });

        customerCart = await prisma.cart.findUnique({
          where: { id: customerCart.id },
          include: cartInclude,
        });
        clearGuestCookie = true;
      }
    }

    return {
      cart: customerCart,
      owner: "customer" as const,
      setCookie: clearGuestCookie ? clearCartCookie() : null,
    };
  }

  if (guestKeyHash) {
    const cart = await prisma.cart.findUnique({
      where: { guestKeyHash },
      include: cartInclude,
    });
    if (cart?.status === "ACTIVE") {
      return { cart, owner: "guest" as const, setCookie: null };
    }
  }

  if (!create) {
    return { cart: null, owner: "guest" as const, setCookie: null };
  }

  const token = createCartToken();
  const cart = await prisma.cart.create({
    data: { guestKeyHash: hashCartToken(token) },
    include: cartInclude,
  });

  return {
    cart,
    owner: "guest" as const,
    setCookie: createCartCookie(token),
  };
}

export function serializeCart(
  cart: Awaited<ReturnType<typeof getCartForRequest>>["cart"],
) {
  if (!cart) {
    return {
      id: null,
      itemCount: 0,
      totalInPaise: 0,
      currency: "INR",
      items: [],
    };
  }

  return {
    id: cart.id,
    itemCount: cart.items.reduce(
      (total, item) => total + Math.max(1, item.quantity),
      0,
    ),
    totalInPaise: cart.items.reduce(
      (total, item) => total + item.amountInPaise * Math.max(1, item.quantity),
      0,
    ),
    currency: "INR",
    items: cart.items.map((item) => ({
      id: item.id,
      gameSlug: item.gameSlug,
      marketCode: item.marketCode,
      package: {
        id: item.packageId,
        name: item.packageName,
        amountInPaise: item.amountInPaise,
        currency: item.currency,
      },
      quantity: item.quantity,
      player: {
        playerId: item.playerId,
        zoneId: item.zoneId,
        nickname: item.verifiedNickname,
        verificationMode: item.verificationMode,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}
