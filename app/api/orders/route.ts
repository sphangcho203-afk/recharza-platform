import { randomUUID } from "node:crypto";

import {
  deriveOrderAccessToken,
  hashOrderAccessToken,
  normalizeIdempotencyKey,
} from "@/lib/order-security";
import {
  validateCustomerEmail,
  validateMobileLegendsPlayer,
} from "@/lib/order-validation";
import { paymentProvider } from "@/lib/payments/provider";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";

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
  paymentProvider: string | null;
  paymentSessionId: string | null;
  createdAt: Date;
  customer: { email: string };
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
      provider: order.paymentProvider ?? "development-mock",
      sessionId: order.paymentSessionId ?? `dev_${order.publicId}`,
      status: "development_only",
      checkoutUrl: null,
      message:
        "No payment was charged. Connect a verified payment provider and signed webhooks before enabling checkout.",
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
        {
          ok: false,
          message: "Too many order attempts. Wait before trying again.",
        },
        {
          status: 429,
          headers: {
            ...rateHeaders,
            "Retry-After": String(
              Math.max(
                1,
                Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
              ),
            ),
          },
        },
      );
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { ok: false, message: "The request body must be valid JSON." },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "Order details are required." },
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
          message:
            "A valid idempotency key is required to prevent duplicate orders.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const existingOrder = await findExistingOrder(idempotencyKey);

    if (existingOrder) {
      const accessToken = deriveOrderAccessToken(
        existingOrder.publicId,
        idempotencyKey,
      );

      return Response.json(
        createOrderResponse(existingOrder, accessToken, true),
        { status: 200, headers: rateHeaders },
      );
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

    const customerEmail = validateCustomerEmail(data.customerEmail);

    if (!customerEmail) {
      return Response.json(
        {
          ok: false,
          message: "Enter a valid email address for the order receipt.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const prisma = getPrisma();
    const publicId = createPublicOrderId();
    const accessToken = deriveOrderAccessToken(publicId, idempotencyKey);
    const accessTokenHash = hashOrderAccessToken(accessToken);

    let order: StoredOrder;

    try {
      order = await prisma.$transaction(async (transaction) => {
        const customer = await transaction.customer.upsert({
          where: { email: customerEmail },
          update: {},
          create: { email: customerEmail },
        });

        return transaction.order.create({
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
            verificationMode: player.verificationMode,
            customerId: customer.id,
            events: {
              create: {
                type: "ORDER_CREATED",
                message: "Order persisted with a server-resolved catalogue price.",
                metadata: {
                  catalogueSource: selectedPackage.source,
                  supplierCategoryId: selectedPackage.supplierCategoryId ?? null,
                  supplierOfferId: selectedPackage.supplierOfferId ?? null,
                  region: selectedPackage.region ?? null,
                },
              },
            },
          },
          include: { customer: true },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicateOrder = await findExistingOrder(idempotencyKey);

        if (duplicateOrder) {
          const duplicateToken = deriveOrderAccessToken(
            duplicateOrder.publicId,
            idempotencyKey,
          );

          return Response.json(
            createOrderResponse(duplicateOrder, duplicateToken, true),
            { status: 200, headers: rateHeaders },
          );
        }
      }

      throw error;
    }

    const paymentSession = await paymentProvider.createSession({
      orderId: order.publicId,
      amountInPaise: order.amountInPaise,
      currency: "INR",
      customerEmail,
    });

    order = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "AWAITING_PAYMENT",
        paymentProvider: paymentSession.provider,
        paymentSessionId: paymentSession.sessionId,
        events: {
          create: {
            type: "PAYMENT_SESSION_CREATED",
            message: "Development payment session created without charging money.",
            metadata: {
              provider: paymentSession.provider,
              sessionId: paymentSession.sessionId,
            },
          },
        },
      },
      include: { customer: true },
    });

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
            "Order storage is not configured yet. Add the required database and security secrets.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Order creation failed", error);
    return Response.json(
      {
        ok: false,
        message: "The order could not be safely created. Please retry later.",
      },
      { status: 500, headers: rateHeaders },
    );
  }
}
