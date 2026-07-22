import { randomUUID } from "node:crypto";

import { getRequestSession } from "@/lib/auth";
import { validateBillingSelection } from "@/lib/commerce/billing";
import { convertInrPaiseToCurrencyMinor } from "@/lib/commerce/currencies";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import {
  isPackageAvailableForMarket,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
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
  marketCode: string | null;
  packageId: string;
  packageName: string;
  amountInPaise: number;
  currency: string;
  presentmentCurrency: string;
  presentmentAmountMinor: number | null;
  fxRateFromInrMicros: number | null;
  fxQuotedAt: Date | null;
  billingName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountryCode: string | null;
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
  const market = parseMobileLegendsMarket(order.marketCode);

  return {
    ok: true,
    duplicate,
    order: {
      id: order.publicId,
      status: order.status.toLowerCase(),
      gameSlug: order.gameSlug,
      market: market ? { code: market.code, label: market.label } : null,
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
        order.presentmentCurrency === "INR"
          ? "The verified order is saved. Open secure tracking to continue with Razorpay Test Mode when configured."
          : `The order is saved with a ${order.presentmentCurrency} display snapshot. Payment remains protected in INR until an approved multi-currency gateway is configured.`,
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

    const selectedMarket = parseMobileLegendsMarket(data.marketCode);
    if (!selectedMarket) {
      return Response.json(
        {
          ok: false,
          code: "MARKET_REQUIRED",
          message: "Choose a supported Mobile Legends fulfilment market before creating the order.",
        },
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

    if (!isPackageAvailableForMarket(selectedPackage.region, selectedMarket.code)) {
      return Response.json(
        {
          ok: false,
          code: "MARKET_PACKAGE_MISMATCH",
          message: `That package is not approved for the ${selectedMarket.label} market.`,
        },
        { status: 409, headers: rateHeaders },
      );
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
          message: "The selected currency quote is temporarily unavailable. Choose INR or retry later.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    const presentmentAmountMinor = convertInrPaiseToCurrencyMinor(
      selectedPackage.amountInPaise,
      presentmentCurrency,
      fxRateFromInrMicros,
    );
    const parsedFxQuotedAt = new Date(fxSnapshot.quotedAt);
    const fxQuotedAt = Number.isNaN(parsedFxQuotedAt.getTime()) ? new Date() : parsedFxQuotedAt;

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
    const billing = billingResult.selection.address;

    let order: StoredOrder;
    try {
      order = await prisma.order.create({
        data: {
          publicId,
          idempotencyKey,
          accessTokenHash,
          status: "CREATED",
          gameSlug: "mobile-legends",
          marketCode: selectedMarket.code,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          amountInPaise: selectedPackage.amountInPaise,
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
              message: `Verified-account order persisted for the ${selectedMarket.label} market with server-resolved pricing, currency and billing snapshots.`,
              metadata: {
                catalogueSource: selectedPackage.source,
                supplierProductId: selectedPackage.supplierProductId ?? null,
                supplierCategoryId: selectedPackage.supplierCategoryId ?? null,
                supplierOfferId: selectedPackage.supplierOfferId ?? null,
                marketCode: selectedMarket.code,
                supplierPackageRegion: selectedPackage.region ?? null,
                settlementCurrency: "INR",
                settlementAmountInPaise: selectedPackage.amountInPaise,
                presentmentCurrency,
                presentmentAmountMinor,
                fxRateFromInrMicros,
                fxQuotedAt: fxQuotedAt.toISOString(),
                fxMode: fxSnapshot.mode,
                billingCountryCode: billing.countryCode,
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
