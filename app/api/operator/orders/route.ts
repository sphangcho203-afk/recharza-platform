import type { Prisma } from "@/generated/prisma/client";
import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

type OrderStatusValue =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FULFILLING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const ORDER_STATUSES = new Set<OrderStatusValue>([
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "PAID",
  "FULFILLING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

function isOrderStatus(value: string): value is OrderStatusValue {
  return ORDER_STATUSES.has(value as OrderStatusValue);
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "hidden";
  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(2, localPart.length - 2))}@${domain}`;
}

export async function GET(request: Request) {
  try {
    const actor = await verifyOperatorAccess(request);
    if (!actor) {
      return Response.json(
        { ok: false, message: "Verified staff access is required." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status")?.toUpperCase() ?? "";
    const parsedLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, Math.floor(parsedLimit)))
      : 50;
    const where: Prisma.OrderWhereInput = isOrderStatus(requestedStatus)
      ? { status: requestedStatus }
      : {};

    const orders = await getPrisma().order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        customer: true,
        _count: {
          select: {
            events: true,
            webhooks: true,
            auditLogs: true,
            fulfilmentAttempts: true,
          },
        },
      },
    });

    return Response.json(
      {
        ok: true,
        access: { mode: actor.mode, role: actor.role },
        orders: orders.map((order) => ({
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
          paymentSessionId: order.paymentSessionId,
          supplier: {
            productId: order.supplierProductId,
            categoryId: order.supplierCategoryId,
            offerId: order.supplierOfferId,
          },
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          counts: order._count,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Operator access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Operator order listing failed", error);
    return Response.json(
      { ok: false, message: "Operator orders are temporarily unavailable." },
      { status: 500 },
    );
  }
}
