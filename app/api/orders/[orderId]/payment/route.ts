import { verifyOrderAccessToken } from "@/lib/order-security";
import {
  sendOrderCompletedEmail,
  sendOrderFailedEmail,
} from "@/lib/order-email";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const PAYMENT_LIMIT = 10;
const PAYMENT_WINDOW_MS = 10 * 60 * 1000;
const PAYABLE_STATUSES = new Set([
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "FAILED",
]);

const gameLabels: Record<string, string> = {
  "mobile-legends": "Mobile Legends",
  "free-fire": "Free Fire MAX",
  "pubg-mobile": "PUBG Mobile",
  valorant: "VALORANT",
  "genshin-impact": "Genshin Impact",
};

function getGameLabel(gameSlug: string) {
  return (
    gameLabels[gameSlug] ??
    gameSlug
      .replaceAll("-", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getPlayerLabel(order: {
  gameSlug: string;
  playerId: string;
  zoneId: string;
  verifiedNickname: string | null;
}) {
  if (order.verifiedNickname) {
    return order.zoneId
      ? `${order.verifiedNickname} · ${order.playerId} (${order.zoneId})`
      : `${order.verifiedNickname} · ${order.playerId}`;
  }

  if (order.gameSlug === "genshin-impact" && order.zoneId) {
    return `${order.playerId} · ${order.zoneId}`;
  }

  return order.zoneId
    ? `${order.playerId} (${order.zoneId})`
    : order.playerId;
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

function internalPaymentEnabled() {
  const mode = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (mode === "internal") return true;
  if (mode === "razorpay") return false;
  return process.env.DEPLOYMENT_ENV !== "production";
}

function resolveInternalOutcome(requestedOutcome: unknown) {
  const configured = process.env.INTERNAL_PAYMENT_OUTCOME
    ?.trim()
    .toLowerCase();
  if (configured === "failed") return "failed" as const;
  if (configured === "completed") return "completed" as const;
  return requestedOutcome === "failed"
    ? ("failed" as const)
    : ("completed" as const);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/orders/:orderId/payment",
      limit: PAYMENT_LIMIT,
      windowMs: PAYMENT_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          message: "Too many payment attempts. Wait before retrying.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    if (!internalPaymentEnabled()) {
      return Response.json(
        {
          ok: false,
          code: "EXTERNAL_PAYMENT_REQUIRED",
          message: "Continue with the configured payment provider.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const accessToken = readBearerToken(request);
    if (!accessToken) {
      return Response.json(
        { ok: false, message: "An order access token is required." },
        { status: 401, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => ({}));
    const data =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const outcome = resolveInternalOutcome(data.outcome);

    const { orderId } = await context.params;
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
      include: { customer: true },
    });

    if (!order) {
      return Response.json(
        { ok: false, message: "Order not found." },
        { status: 404, headers: rateHeaders },
      );
    }

    if (!verifyOrderAccessToken(accessToken, order.accessTokenHash)) {
      return Response.json(
        { ok: false, message: "The order access token is invalid." },
        { status: 401, headers: rateHeaders },
      );
    }

    if (order.status === "COMPLETED" && outcome === "completed") {
      return Response.json(
        {
          ok: true,
          status: "completed",
          message: "Payment and order completion were already recorded.",
        },
        { headers: rateHeaders },
      );
    }

    if (!PAYABLE_STATUSES.has(order.status)) {
      return Response.json(
        {
          ok: false,
          message: `This order cannot accept payment while it is ${order.status.toLowerCase()}.`,
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const occurredAt = new Date();
    const providerSessionId = `internal_${order.id}`;
    const updated = await prisma.order.update({
      where: { id: order.id },
      data:
        outcome === "completed"
          ? {
              status: "COMPLETED",
              paymentProvider: "internal",
              paymentSessionId: providerSessionId,
              events: {
                create: [
                  {
                    type: "PAYMENT_RECEIVED",
                    message: "Payment was recorded successfully.",
                    metadata: { provider: "internal" },
                  },
                  {
                    type: "ORDER_COMPLETED",
                    message: "The order completed successfully.",
                    metadata: { provider: "internal" },
                  },
                ],
              },
            }
          : {
              status: "FAILED",
              paymentProvider: "internal",
              paymentSessionId: providerSessionId,
              events: {
                create: {
                  type: "PAYMENT_FAILED",
                  message: "The payment attempt was not completed.",
                  metadata: { provider: "internal" },
                },
              },
            },
      include: { customer: true },
    });

    const email = updated.billingEmail ?? updated.customer.email;
    const emailInput = {
      orderId: updated.publicId,
      databaseOrderId: updated.id,
      customerId: updated.customerId,
      email,
      gameLabel: getGameLabel(updated.gameSlug),
      packageName: updated.packageName,
      playerLabel: getPlayerLabel(updated),
      amountInPaise: updated.amountInPaise,
      occurredAt,
    };

    try {
      if (outcome === "completed") {
        await sendOrderCompletedEmail(emailInput);
      } else {
        await sendOrderFailedEmail({
          ...emailInput,
          reason: "Payment was not completed.",
        });
      }
    } catch (error) {
      console.error("Order outcome email could not be recorded", error);
    }

    return Response.json(
      {
        ok: true,
        status: outcome,
        message:
          outcome === "completed"
            ? "Payment received. Order completed successfully."
            : "Payment failed. The order remains available for review.",
      },
      { headers: { ...rateHeaders, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Internal payment flow failed", error);
    }
    return Response.json(
      {
        ok: false,
        message:
          "Payment could not be completed safely. The order remains saved.",
      },
      { status: 503, headers: rateHeaders },
    );
  }
}
