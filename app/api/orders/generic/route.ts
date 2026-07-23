import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { getRequestSession } from "@/lib/auth";
import { validateBillingSelection } from "@/lib/commerce/billing";
import { convertInrPaiseToCurrencyMinor } from "@/lib/commerce/currencies";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { getGameBySlug } from "@/lib/games";
import {
  deriveOrderAccessToken,
  hashOrderAccessToken,
  normalizeIdempotencyKey,
} from "@/lib/order-security";
import { getPrisma } from "@/lib/prisma";
import { consumeRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getStoreProductForCheckout } from "@/lib/storefront-game-catalog";

export const runtime = "nodejs";

const ORDER_LIMIT = 5;
const ORDER_WINDOW_MS = 10 * 60 * 1000;

type StoredOrder = Prisma.OrderGetPayload<{ include: { customer: true } }>;

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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanValue(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function createOrderResponse(order: StoredOrder, accessToken: string, duplicate: boolean) {
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
      presentment:
        order.presentmentAmountMinor !== null
          ? {
              amountMinor: order.presentmentAmountMinor,
              currency: order.presentmentCurrency,
              fxQuotedAt: order.fxQuotedAt?.toISOString() ?? null,
            }
          : null,
      billing:
        order.billingName && order.billingCountryCode && order.billingCity
          ? {
              fullName: order.billingName,
              countryCode: order.billingCountryCode,
              city: order.billingCity,
            }
          : null,
      customerEmail: order.customer.email,
      createdAt: order.createdAt.toISOString(),
      persistence: "database",
      tracking: {
        path: `/orders/${order.publicId}`,
        accessToken,
      },
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
      route: "POST:/api/orders/generic",
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
          message: "Verify your customer email and sign in before creating an order.",
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
        { ok: false, message: "A valid idempotency key is required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const existingOrder = await findExistingOrder(idempotencyKey);
    if (existingOrder) {
      if (existingOrder.customerId !== session.customer.id) {
        return Response.json(
          { ok: false, message: "That retry key belongs to another account." },
          { status: 409, headers: rateHeaders },
        );
      }
      return Response.json(
        createOrderResponse(
          existingOrder,
          deriveOrderAccessToken(existingOrder.publicId, idempotencyKey),
          true,
        ),
        { status: 200, headers: rateHeaders },
      );
    }

    const gameSlug = cleanValue(data.gameSlug, 100);
    const game = getGameBySlug(gameSlug);
    if (!game || game.catalogueVisible === false || game.kind === "mobile-legends-region") {
      return Response.json(
        { ok: false, message: "That game catalogue is unavailable." },
        { status: 404, headers: rateHeaders },
      );
    }

    const productId = cleanValue(data.productId, 180);
    const product = productId
      ? await getStoreProductForCheckout(game, productId)
      : null;
    if (!product) {
      return Response.json(
        {
          ok: false,
          message: "That product is unavailable or changed. Refresh the catalogue.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const fulfilmentInput = asObject(data.fulfilmentFields);
    const fulfilmentFields: Record<string, string> = {};
    for (const field of game.inputFields) {
      const value = cleanValue(fulfilmentInput[field.id]);
      if (field.required !== false && !value) {
        return Response.json(
          { ok: false, message: `${field.label} is required.` },
          { status: 400, headers: rateHeaders },
        );
      }
      if (value) fulfilmentFields[field.id] = value;
    }

    const billingResult = validateBillingSelection(data.billing);
    if (!billingResult.ok) {
      return Response.json(
        { ok: false, code: "BILLING_INVALID", message: billingResult.message },
        { status: 400, headers: rateHeaders },
      );
    }

    const fxSnapshot = await getCurrencyRateSnapshot();
    const presentmentCurrency = billingResult.selection.presentmentCurrency;
    const fxRateFromInrMicros = fxSnapshot.ratesFromInrMicros[presentmentCurrency] ?? 0;
    if (!fxRateFromInrMicros) {
      return Response.json(
        {
          ok: false,
          code: "FX_UNAVAILABLE",
          message: "The selected currency quote is unavailable. Choose INR or retry later.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    const presentmentAmountMinor = convertInrPaiseToCurrencyMinor(
      product.amountInPaise,
      presentmentCurrency,
      fxRateFromInrMicros,
    );
    const parsedQuote = new Date(fxSnapshot.quotedAt);
    const fxQuotedAt = Number.isNaN(parsedQuote.getTime()) ? new Date() : parsedQuote;
    const billing = billingResult.selection.address;
    const primaryField =
      fulfilmentFields.playerId ??
      fulfilmentFields.uid ??
      fulfilmentFields.deliveryEmail ??
      Object.values(fulfilmentFields)[0] ??
      session.customer.email;
    const secondaryField =
      fulfilmentFields.zoneId ??
      fulfilmentFields.server ??
      game.fulfilmentType;
    const publicId = createPublicOrderId();
    const accessToken = deriveOrderAccessToken(publicId, idempotencyKey);
    const accessTokenHash = hashOrderAccessToken(accessToken);
    const prisma = getPrisma();

    let order: StoredOrder;
    try {
      order = await prisma.order.create({
        data: {
          publicId,
          idempotencyKey,
          accessTokenHash,
          status: "CREATED",
          gameSlug: game.slug,
          marketCode: game.region?.code ?? null,
          packageId: product.id,
          packageName: product.name,
          amountInPaise: product.amountInPaise,
          currency: "INR",
          presentmentCurrency,
          presentmentAmountMinor,
          fxRateFromInrMicros,
          fxQuotedAt,
          billingName: billing.fullName,
          billingEmail: billing.email,
          billingPhone: billing.phone,
          billingLine1: billing.line1,
          billingLine2: billing.line2,
          billingCity: billing.city,
          billingState: billing.state,
          billingPostalCode: billing.postalCode,
          billingCountryCode: billing.countryCode,
          playerId: primaryField,
          zoneId: secondaryField,
          verifiedNickname: null,
          verificationMode:
            product.source === "fazercards-live"
              ? "supplier-fields-captured"
              : "indicative-catalogue-contract",
          customerId: session.customer.id,
          supplierProductId: product.supplierProductId ?? null,
          supplierCategoryId: product.supplierCategoryId ?? null,
          supplierOfferId: product.supplierOfferId ?? null,
          events: {
            create: {
              type: "ORDER_CREATED",
              message: `Customer order persisted for ${game.title} with server-resolved product, currency, billing, and delivery snapshots.`,
              metadata: {
                catalogueSource: product.source,
                fulfilmentType: game.fulfilmentType,
                fulfilmentFields,
                settlementCurrency: "INR",
                settlementAmountInPaise: product.amountInPaise,
                presentmentCurrency,
                presentmentAmountMinor,
                fxRateFromInrMicros,
                fxQuotedAt: fxQuotedAt.toISOString(),
                fxMode: fxSnapshot.mode,
                billingCountryCode: billing.countryCode,
                supplierProductId: product.supplierProductId ?? null,
                supplierCategoryId: product.supplierCategoryId ?? null,
                supplierOfferId: product.supplierOfferId ?? null,
              },
            },
          },
        },
        include: { customer: true },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicate = await findExistingOrder(idempotencyKey);
        if (duplicate?.customerId === session.customer.id) {
          return Response.json(
            createOrderResponse(
              duplicate,
              deriveOrderAccessToken(duplicate.publicId, idempotencyKey),
              true,
            ),
            { status: 200, headers: rateHeaders },
          );
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
          message: "Order storage is not configured. Add the required database and security secrets.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Generic order creation failed", error);
    return Response.json(
      { ok: false, message: "The order could not be safely created. Retry later." },
      { status: 500, headers: rateHeaders },
    );
  }
}
