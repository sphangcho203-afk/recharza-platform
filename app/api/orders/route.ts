import { randomUUID } from "node:crypto";

import { getRequestSession } from "@/lib/auth";
import {
  deriveOrderAccessToken,
  hashOrderAccessToken,
  normalizeIdempotencyKey,
} from "@/lib/order-security";
import { validateMobileLegendsPlayer } from "@/lib/order-validation";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";
import { validateFazerCardsPlayer } from "@/lib/suppliers/fazercards-operations";

export const runtime = "nodejs";

const ORDER_LIMIT = 5;
const ORDER_WINDOW_MS = 10 * 60 * 1000;

type StoredOrder = {
  id: string;
  publicId: string;
  idempotencyKey: string;
  status: string;
  gameSlug: string;
  packageId: string;
  packageName: string;
  amountInPaise: number;
  currency: string;
  playerId: string;
  zoneId: string;
  verificationMode: string;
  verifiedNickname: string | null;
  paymentProvider: string | null;
  paymentSessionId: string | null;
  customerId: string;
  createdAt: Date;
  customer: { id: string; email: string };
};

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

function createPublicOrderId() {
  return `RZ-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

function createOrderResponse(
  order: StoredOrder,
  accessToken: string,
  duplicate: boolean,
) {
  return {
    ok: true,
    duplicate,
    order: {
      id: order.publicId,
      status: order.status.toLowerCase(),
      gameSlug: order.gameSlug,
      package: {
        id: order.packageId,
        name: order.packageName,
        amountInPaise: order.amountInPaise,
        currency: order.currency,
      },
      player: {
        playerId: order.playerId,
        zoneId: order.zoneId,
        nickname: order.verifiedNickname,
        verificationMode: order.verificationMode,
      },
      customerEmail: order.customer.email,
      createdAt: order.createdAt.toISOString(),
      persistence: "database",
      tracking: {
        path: `/orders/${order.publicId}`,
        accessToken,
      },
    },
    paymentSession: {
      provider: order.paymentProvider,
      sessionId: order.paymentSessionId,
      status: "not_started",
      checkoutUrl: null,
      message:
        "The verified order is saved. Open secure tracking to continue with Razorpay Test Mode when configured.",
    },
  };
}

async function findExistingOrder(idempotencyKey: string) {
  return getPrisma().order.findUnique({
    where: { idempotencyKey },
    include: { customer: true },
  });
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/orders",
      limit: ORDER_LIMIT,
      windowMs: ORDER_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many order attempts. Wait before trying again." },
        {
          status: 429,
          headers: {
            ...rateHeaders,
            "Retry-After": String(
              Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            ),
          },
        },
      );
    }

    const session = await getRequestSession(request);
    if (!session) {
      return Response.json(
        {
          ok: false,
          code: "AUTH_REQUIRED",
          message: "Verify your email and sign in before creating an order.",
        },
        { status: 401, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Order details are required in valid JSON." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const idempotencyKey = normalizeIdempotencyKey(
      request.headers.get("idempotency-key") ?? data.idempotencyKey,
    );

    if (!idempotencyKey) {
      return Response.json(
        {
          ok: false,
          message: "A valid idempotency key is required to prevent duplicate orders.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const existingOrder = await findExistingOrder(idempotencyKey);
    if (existingOrder) {
      if (existingOrder.customerId !== session.customer.id) {
        return Response.json(
          { ok: false, message: "That retry key is already associated with another account." },
          { status: 409, headers: rateHeaders },
        );
      }

      const accessToken = deriveOrderAccessToken(existingOrder.publicId, idempotencyKey);
      return Response.json(createOrderResponse(existingOrder, accessToken, true), {
        status: 200,
        headers: rateHeaders,
      });
    }

    if (data.gameSlug !== "mobile-legends") {
      return Response.json(
        { ok: false, message: "This game is not available for checkout yet." },
        { status: 400, headers: rateHeaders },
      );
    }

    const selectedPackage =
      typeof data.packageId === "string"
        ? await getMobileLegendsPackageForCheckout(data.packageId)
        : null;

    if (!selectedPackage) {
      return Response.json(
        {
          ok: false,
          message:
            "That package is unavailable or no longer approved. Refresh the catalogue and choose another offer.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const player = validateMobileLegendsPlayer(data.playerId, data.zoneId);
    if (!player.valid) {
      return Response.json(
        { ok: false, message: player.message },
        { status: 400, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    let verificationMode: string = player.verificationMode;
    let verifiedNickname: string | null = null;
    let supplierValidationConfirmed = false;

    if (selectedPackage.source === "fazercards-live" && selectedPackage.supplierProductId) {
      const product = await prisma.supplierProduct.findFirst({
        where: {
          id: selectedPackage.supplierProductId,
          provider: "fazercards",
          available: true,
          published: true,
        },
        select: {
          categoryId: true,
          offerId: true,
          fields: true,
        },
      });

      if (!product) {
        return Response.json(
          { ok: false, message: "The approved supplier product changed. Refresh and retry." },
          { status: 409, headers: rateHeaders },
        );
      }

      const supplierValidation = await validateFazerCardsPlayer({
        categoryId: product.categoryId,
        offerId: product.offerId,
        playerId: player.playerId,
        zoneId: player.zoneId,
        fieldSchema: product.fields,
      });

      if (!supplierValidation.valid) {
        return Response.json(
          { ok: false, message: supplierValidation.message },
          { status: 400, headers: rateHeaders },
        );
      }

      verificationMode = supplierValidation.mode;
      verifiedNickname = supplierValidation.nickname;
      supplierValidationConfirmed = supplierValidation.confirmed;
    }

    const publicId = createPublicOrderId();
    const accessToken = deriveOrderAccessToken(publicId, idempotencyKey);
    const accessTokenHash = hashOrderAccessToken(accessToken);

    let order: StoredOrder;
    try {
      order = await prisma.order.create({
        data: {
          publicId,
          idempotencyKey,
          accessTokenHash,
          status: "CREATED",
          gameSlug: "mobile-legends",
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          amountInPaise: selectedPackage.amountInPaise,
          currency: "INR",
          playerId: player.playerId,
          zoneId: player.zoneId,
          verifiedNickname,
          verificationMode,
          customerId: session.customer.id,
          supplierProductId: selectedPackage.supplierProductId ?? null,
          supplierCategoryId: selectedPackage.supplierCategoryId ?? null,
          supplierOfferId: selectedPackage.supplierOfferId ?? null,
          events: {
            create: {
              type: "ORDER_CREATED",
              message: "Verified-account order persisted with a server-resolved catalogue price.",
              metadata: {
                catalogueSource: selectedPackage.source,
                supplierProductId: selectedPackage.supplierProductId ?? null,
                supplierCategoryId: selectedPackage.supplierCategoryId ?? null,
                supplierOfferId: selectedPackage.supplierOfferId ?? null,
                region: selectedPackage.region ?? null,
                verificationMode,
                supplierValidationConfirmed,
                accountRole: session.customer.role,
              },
            },
          },
        },
        include: { customer: true },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicateOrder = await findExistingOrder(idempotencyKey);
        if (duplicateOrder?.customerId === session.customer.id) {
          const duplicateToken = deriveOrderAccessToken(
            duplicateOrder.publicId,
            idempotencyKey,
          );
          return Response.json(createOrderResponse(duplicateOrder, duplicateToken, true), {
            status: 200,
            headers: rateHeaders,
          });
        }
      }
      throw error;
    }

    return Response.json(createOrderResponse(order, accessToken, false), {
      status: 201,
      headers: rateHeaders,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        {
          ok: false,
          message:
            "Order storage or verified-account access is not configured yet. Add the required database and security secrets.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Order creation failed", error);
    return Response.json(
      { ok: false, message: "The order could not be safely created. Please retry later." },
      { status: 500, headers: rateHeaders },
    );
  }
}
