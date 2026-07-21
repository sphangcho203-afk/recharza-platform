import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { verifyOrderAccessToken } from "@/lib/order-security";

export const runtime = "nodejs";

const TRACKING_LIMIT = 30;
const TRACKING_WINDOW_MS = 10 * 60 * 1000;

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "hidden";
  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, localPart.length - 2))}@${domain}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "GET:/api/orders/:orderId",
      limit: TRACKING_LIMIT,
      windowMs: TRACKING_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { ok: false, message: "Too many tracking requests. Try again later." },
        { status: 429, headers: rateHeaders },
      );
    }

    const { orderId } = await context.params;
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!accessToken) {
      return Response.json(
        { ok: false, message: "An order access token is required." },
        { status: 401, headers: rateHeaders },
      );
    }

    const order = await getPrisma().order.findUnique({
      where: { publicId: orderId },
      include: {
        customer: true,
        events: { orderBy: { createdAt: "asc" } },
        fulfilmentAttempts: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            provider: true,
            mode: true,
            status: true,
            providerOrderId: true,
            errorMessage: true,
            submittedAt: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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

    return Response.json(
      {
        ok: true,
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
          customerEmail: maskEmail(order.customer.email),
          paymentProvider: order.paymentProvider,
          supplier: {
            categoryAttached: Boolean(order.supplierCategoryId),
            offerAttached: Boolean(order.supplierOfferId),
          },
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          events: order.events.map((event) => ({
            id: event.id,
            type: event.type,
            message: event.message,
            createdAt: event.createdAt.toISOString(),
          })),
          fulfilment: order.fulfilmentAttempts.map((attempt) => ({
            id: attempt.id,
            provider: attempt.provider,
            mode: attempt.mode.toLowerCase(),
            status: attempt.status.toLowerCase(),
            providerOrderId: attempt.providerOrderId,
            errorMessage: attempt.errorMessage,
            submittedAt: attempt.submittedAt?.toISOString() ?? null,
            completedAt: attempt.completedAt?.toISOString() ?? null,
            createdAt: attempt.createdAt.toISOString(),
            updatedAt: attempt.updatedAt.toISOString(),
          })),
        },
      },
      { headers: rateHeaders },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Order tracking is not configured yet." },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Order tracking failed", error);
    return Response.json(
      { ok: false, message: "Order tracking is temporarily unavailable." },
      { status: 500, headers: rateHeaders },
    );
  }
}
