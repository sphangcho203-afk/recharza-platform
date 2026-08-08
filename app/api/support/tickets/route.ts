import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { createTelegramStartUrl } from "@/lib/support-config";
import { createAndDeliverSupportTicket } from "@/lib/support-service";
import { validateSupportTicketInput } from "@/lib/support";

export const runtime = "nodejs";

const SUPPORT_LIMIT = 6;
const SUPPORT_WINDOW_MS = 30 * 60 * 1000;
const MAX_BODY_BYTES = 16_000;

function withSessionIdentity(
  payload: unknown,
  session: Awaited<ReturnType<typeof getRequestSession>>,
) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !session) {
    return payload;
  }

  const data = payload as Record<string, unknown>;
  const suppliedEmail =
    typeof data.email === "string" && data.email.trim() ? data.email : null;
  const suppliedName =
    typeof data.name === "string" && data.name.trim() ? data.name : null;

  return {
    ...data,
    email: suppliedEmail || session.customer.email,
    name: suppliedName || session.customer.displayName || "",
  };
}

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return Response.json(
        {
          ok: false,
          code: "REQUEST_TOO_LARGE",
          message: "The support request is too large.",
        },
        { status: 413 },
      );
    }

    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/support/tickets",
      limit: SUPPORT_LIMIT,
      windowMs: SUPPORT_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message: "Too many support requests. Wait before submitting another ticket.",
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

    const [payload, session] = await Promise.all([
      request.json().catch(() => null),
      getRequestSession(request).catch(() => null),
    ]);
    const validation = validateSupportTicketInput(
      withSessionIdentity(payload, session),
    );
    if (!validation.ok) {
      return Response.json(
        {
          ok: false,
          code: "INVALID_SUPPORT_REQUEST",
          field: validation.field,
          message: validation.message,
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = validation.data;
    let orderDatabaseId: string | null = null;

    if (data.orderId && session) {
      const ownedOrder = await getPrisma().order.findFirst({
        where: {
          publicId: data.orderId,
          customerId: session.customer.id,
        },
        select: { id: true },
      });
      orderDatabaseId = ownedOrder?.id ?? null;
    }

    const ticket = await createAndDeliverSupportTicket({
      ...data,
      source: "WEB",
      customerId: session?.customer.id ?? null,
      orderDatabaseId,
      metadata: {
        authenticated: Boolean(session),
        orderLinked: Boolean(orderDatabaseId),
        userAgent: request.headers.get("user-agent")?.slice(0, 240) || null,
      },
    });

    const telegramConnectUrl =
      ticket.telegramConnectToken && ticket.persisted
        ? createTelegramStartUrl(
            `link_${ticket.publicId}_${ticket.telegramConnectToken}`,
          )
        : null;

    return Response.json(
      {
        ok: true,
        ticket: {
          id: ticket.publicId,
          persisted: ticket.persisted,
          replyChannel: data.replyChannel.toLowerCase(),
          telegramConnectUrl,
        },
        delivery: {
          telegram: ticket.telegramDelivery.status.toLowerCase(),
          email: ticket.emailDelivery.status.toLowerCase(),
        },
        message:
          "Your support request was received. Keep the ticket ID for follow-up.",
      },
      { status: 201, headers: rateHeaders },
    );
  } catch (error) {
    console.error("Support ticket creation failed", error);
    return Response.json(
      {
        ok: false,
        code: "SUPPORT_UNAVAILABLE",
        message:
          "Support submission is temporarily unavailable. Use Telegram, WhatsApp, Instagram, or email instead.",
      },
      { status: 503, headers: rateHeaders },
    );
  }
}
