import { randomUUID } from "node:crypto";

import { validateBillingSelection } from "@/lib/commerce/billing";
import { convertInrPaiseToCurrencyMinor } from "@/lib/commerce/currencies";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
import { sendOrderCreatedLifecycleEmail } from "@/lib/lifecycle-email";
import {
  deriveOrderAccessToken,
  hashOrderAccessToken,
  normalizeIdempotencyKey,
} from "@/lib/order-security";
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
import {
  lookupVolseverGameIdentity,
  VolseverProviderError,
} from "@/lib/volsever";

export const runtime = "nodejs";

const CHECKOUT_LIMIT = 6;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

type StoredCheckoutOrder = {
  id: string;
  publicId: string;
  idempotencyKey: string;
  accessTokenHash: string;
  status: string;
  gameSlug: string;
  marketCode: string | null;
  packageId: string;
  packageName: string;
  amountInPaise: number;
  currency: string;
  presentmentCurrency: string;
  presentmentAmountMinor: number | null;
  fxQuotedAt: Date | null;
  billingName: string | null;
  billingEmail: string | null;
  billingCountryCode: string | null;
  billingCity: string | null;
  playerId: string;
  zoneId: string;
  verificationMode: string;
  verifiedNickname: string | null;
  paymentProvider: string | null;
  paymentSessionId: string | null;
  customerId: string;
  createdAt: Date;
  customer: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
  };
};

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createCheckoutResponse(
  order: StoredCheckoutOrder,
  accessToken: string,
  duplicate: boolean,
) {
  const customerEmail = order.billingEmail ?? order.customer.email;

  return {
    ok: true,
    duplicate,
    order: {
      id: order.publicId,
      status: order.status.toLowerCase(),
      gameSlug: order.gameSlug,
      market: order.marketCode
        ? { code: order.marketCode, label: order.marketCode }
        : null,
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
              email: customerEmail,
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
      ownership: {
        mode: "billing-email",
        email: customerEmail,
        accountLinked: Boolean(order.customer.emailVerifiedAt),
      },
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
      status: order.paymentSessionId ? "ready" : "not_started",
      message:
        "The order is saved. Payment can now open inside this checkout without leaving the flow.",
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
      route: "POST:/api/checkout/game",
      limit: CHECKOUT_LIMIT,
      windowMs: CHECKOUT_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: "Too many checkout attempts. Wait a moment before trying again.",
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

    const payload = await request.json().catch(() => null);
    const data = asObject(payload);
    if (!data) {
      return Response.json(
        {
          ok: false,
          code: "INVALID_JSON",
          message: "Checkout details are required.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!isSupplierCheckoutGameSlug(data.gameSlug)) {
      return Response.json(
        {
          ok: false,
          code: "GAME_UNAVAILABLE",
          message: "This game is not enabled for supplier checkout.",
        },
        { status: 400, headers: rateHeaders },
      );
    }
    const gameSlug = data.gameSlug;

    const idempotencyKey = normalizeIdempotencyKey(
      request.headers.get("idempotency-key") ?? data.idempotencyKey,
    );
    if (!idempotencyKey) {
      return Response.json(
        {
          ok: false,
          code: "IDEMPOTENCY_REQUIRED",
          message: "A valid retry key is required to prevent duplicate orders.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const billingResult = validateBillingSelection(data.billing);
    if (!billingResult.ok) {
      return Response.json(
        {
          ok: false,
          code: "BILLING_INVALID",
          message: billingResult.message,
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const billing = billingResult.selection.address;
    const billingEmail = normalizeEmail(billing.email);
    const prisma = getPrisma();

    const existingOrder = await findExistingOrder(idempotencyKey);
    if (existingOrder) {
      const existingEmail = normalizeEmail(
        existingOrder.billingEmail ?? existingOrder.customer.email,
      );

      if (
        existingEmail !== billingEmail ||
        existingOrder.gameSlug !== gameSlug
      ) {
        return Response.json(
          {
            ok: false,
            code: "RETRY_KEY_CONFLICT",
            message: "That retry key belongs to another checkout.",
          },
          { status: 409, headers: rateHeaders },
        );
      }

      const accessToken = deriveOrderAccessToken(
        existingOrder.publicId,
        idempotencyKey,
      );
      return Response.json(
        createCheckoutResponse(existingOrder, accessToken, true),
        { status: 200, headers: rateHeaders },
      );
    }

    const selectedPackage =
      typeof data.packageId === "string"
        ? await getPublishedGamePackageForCheckout(gameSlug, data.packageId)
        : null;
    if (!selectedPackage) {
      return Response.json(
        {
          ok: false,
          code: "PACKAGE_UNAVAILABLE",
          message:
            "That package changed or is unavailable. Refresh the catalogue and choose again.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (
      typeof data.marketCode !== "string" ||
      data.marketCode !== selectedPackage.marketCode
    ) {
      return Response.json(
        {
          ok: false,
          code: "MARKET_PACKAGE_MISMATCH",
          message: "Choose the exact account market attached to this package.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const identityValues = asObject(data.identity) ?? {};
    const identity = validateSupplierCheckoutIdentity(
      gameSlug,
      identityValues,
      selectedPackage.fields,
    );
    if (!identity.valid) {
      return Response.json(
        {
          ok: false,
          code: "PLAYER_INVALID",
          field: identity.field,
          message: identity.message,
        },
        { status: 400, headers: rateHeaders },
      );
    }

    let verificationMode: string = identity.verificationMode;
    let verifiedNickname: string | null = null;

    if (
      process.env.IGN_LOOKUP_PROVIDER?.trim().toLowerCase() === "volsever"
    ) {
      const liveVerification = await lookupVolseverGameIdentity({
        gameSlug,
        playerId: identity.playerId,
        zoneId: identity.zoneId,
      });

      if (!liveVerification.valid) {
        return Response.json(
          {
            ok: false,
            code: "PLAYER_NOT_CONFIRMED",
            message: liveVerification.message,
          },
          { status: 400, headers: rateHeaders },
        );
      }

      verificationMode = liveVerification.verificationMode;
      verifiedNickname = liveVerification.nickname;
    }

    const fxSnapshot = await getCurrencyRateSnapshot();
    const presentmentCurrency = billingResult.selection.presentmentCurrency;
    const fxRateFromInrMicros =
      fxSnapshot.ratesFromInrMicros[presentmentCurrency] ?? 0;
    if (!fxRateFromInrMicros) {
      return Response.json(
        {
          ok: false,
          code: "FX_UNAVAILABLE",
          message:
            "The selected display currency is temporarily unavailable. Choose INR or retry later.",
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
    const fxQuotedAt = Number.isNaN(parsedFxQuotedAt.getTime())
      ? new Date()
      : parsedFxQuotedAt;

    const customer = await prisma.customer.upsert({
      where: { email: billingEmail },
      create: {
        email: billingEmail,
        displayName: billing.fullName,
      },
      update: {},
      select: {
        id: true,
        email: true,
        role: true,
        accessStatus: true,
        emailVerifiedAt: true,
      },
    });

    if (
      customer.accessStatus === "ORDER_RESTRICTED" ||
      customer.accessStatus === "SUSPENDED"
    ) {
      return Response.json(
        {
          ok: false,
          code: "ORDER_RESTRICTED",
          message:
            "Orders are restricted for this billing email. Contact support before retrying.",
        },
        { status: 403, headers: rateHeaders },
      );
    }

    const publicId = createPublicOrderId();
    const accessToken = deriveOrderAccessToken(publicId, idempotencyKey);
    const accessTokenHash = hashOrderAccessToken(accessToken);

    let order: StoredCheckoutOrder;
    try {
      order = await prisma.order.create({
        data: {
          publicId,
          idempotencyKey,
          accessTokenHash,
          status: "CREATED",
          gameSlug,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          amountInPaise: selectedPackage.amountInPaise,
          currency: "INR",
          presentmentCurrency,
          presentmentAmountMinor,
          fxRateFromInrMicros,
          fxQuotedAt,
          billingName: billing.fullName,
          billingEmail,
          billingPhone: billing.phone,
          billingLine1: billing.line1,
          billingLine2: billing.line2,
          billingCity: billing.city,
          billingState: billing.state,
          billingPostalCode: billing.postalCode,
          billingCountryCode: billing.countryCode,
          playerId: identity.playerId,
          zoneId: identity.zoneId,
          verifiedNickname,
          verificationMode,
          customerId: customer.id,
          supplierProductId: selectedPackage.supplierProductId,
          supplierCategoryId: selectedPackage.supplierCategoryId,
          supplierOfferId: selectedPackage.supplierOfferId,
          events: {
            create: {
              type: "ORDER_CREATED",
              message: `Integrated checkout order persisted for ${selectedPackage.marketLabel}.`,
              metadata: {
                checkoutMode: customer.emailVerifiedAt
                  ? "linked-account"
                  : "billing-email",
                catalogueSource: selectedPackage.source,
                supplierProductId: selectedPackage.supplierProductId,
                supplierCategoryId: selectedPackage.supplierCategoryId,
                supplierOfferId: selectedPackage.supplierOfferId,
                marketCode: selectedPackage.marketCode,
                marketLabel: selectedPackage.marketLabel,
                settlementCurrency: "INR",
                settlementAmountInPaise: selectedPackage.amountInPaise,
                presentmentCurrency,
                presentmentAmountMinor,
                fxRateFromInrMicros,
                fxQuotedAt: fxQuotedAt.toISOString(),
                fxMode: fxSnapshot.mode,
                billingCountryCode: billing.countryCode,
                verificationMode,
                customerRole: customer.role,
              },
            },
          },
        },
        include: { customer: true },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicateOrder = await findExistingOrder(idempotencyKey);
        const duplicateEmail = duplicateOrder
          ? normalizeEmail(
              duplicateOrder.billingEmail ?? duplicateOrder.customer.email,
            )
          : null;

        if (
          duplicateOrder &&
          duplicateEmail === billingEmail &&
          duplicateOrder.gameSlug === gameSlug
        ) {
          const duplicateToken = deriveOrderAccessToken(
            duplicateOrder.publicId,
            idempotencyKey,
          );
          return Response.json(
            createCheckoutResponse(duplicateOrder, duplicateToken, true),
            { status: 200, headers: rateHeaders },
          );
        }
      }

      throw error;
    }

    try {
      await sendOrderCreatedLifecycleEmail({
        databaseOrderId: order.id,
        publicOrderId: order.publicId,
        customerId: order.customerId,
        email: order.billingEmail ?? order.customer.email,
        gameSlug: order.gameSlug,
        packageName: order.packageName,
        amountInPaise: order.amountInPaise,
        playerId: order.playerId,
        zoneId: order.zoneId,
        nickname: verifiedNickname,
        occurredAt: order.createdAt,
      });
    } catch (error) {
      console.error("Order-created email failed", error);
    }

    return Response.json(createCheckoutResponse(order, accessToken, false), {
      status: 201,
      headers: rateHeaders,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        {
          ok: false,
          code: "CONFIGURATION_ERROR",
          message: error.message,
        },
        { status: 503, headers: rateHeaders },
      );
    }

    if (error instanceof VolseverProviderError) {
      return Response.json(
        {
          ok: false,
          code: "VERIFICATION_UNAVAILABLE",
          message:
            "Account validation is temporarily unavailable. Your retry key remains reusable.",
        },
        { status: 502, headers: rateHeaders },
      );
    }

    console.error("Integrated supplier checkout failed", error);
    return Response.json(
      {
        ok: false,
        code: "CHECKOUT_FAILED",
        message:
          "Checkout could not be completed safely. Your retry key remains reusable.",
      },
      { status: 500, headers: rateHeaders },
    );
  }
}
