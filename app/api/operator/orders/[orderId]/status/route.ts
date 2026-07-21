import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const TRANSITIONS: Record<string, Set<string>> = {
  CREATED: new Set(["FAILED", "CANCELLED"]),
  AWAITING_PAYMENT: new Set(["FAILED", "CANCELLED"]),
  PAYMENT_PENDING: new Set(["FAILED", "CANCELLED"]),
  PAID: new Set(["FULFILLING"]),
  FULFILLING: new Set(["COMPLETED", "FAILED"]),
  COMPLETED: new Set(),
  FAILED: new Set(),
  CANCELLED: new Set(),
};

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const operator = await verifyOperatorAccess(request);

    if (!operator) {
      return Response.json(
        { ok: false, message: "Verified staff access is required." },
        { status: 401 },
      );
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { ok: false, message: "The request body must be valid JSON." },
        { status: 400 },
      );
    }

    if (!payload || typeof payload !== "object") {
      return Response.json(
        { ok: false, message: "A target status and reason are required." },
        { status: 400 },
      );
    }

    const data = payload as Record<string, unknown>;
    const targetStatus =
      typeof data.status === "string" ? data.status.trim().toUpperCase() : "";
    const reason =
      typeof data.reason === "string" ? data.reason.trim().slice(0, 240) : "";

    if (!reason || reason.length < 5) {
      return Response.json(
        { ok: false, message: "Explain the operator action in at least 5 characters." },
        { status: 400 },
      );
    }

    const { orderId } = await context.params;
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({ where: { publicId: orderId } });

    if (!order) {
      return Response.json({ ok: false, message: "Order not found." }, { status: 404 });
    }

    const allowedTargets = TRANSITIONS[order.status] ?? new Set<string>();
    if (!allowedTargets.has(targetStatus)) {
      return Response.json(
        {
          ok: false,
          message:
            targetStatus === "PAID"
              ? "Operators cannot mark orders paid. A verified payment webhook is required."
              : `The order cannot move from ${order.status} to ${targetStatus || "that state"}.`,
        },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus as never,
          events: {
            create: {
              type: "OPERATOR_STATUS_CHANGED",
              message: `Operator moved the order from ${order.status} to ${targetStatus}.`,
              metadata: {
                reason,
                actorRole: operator.role,
                accessMode: operator.mode,
              },
            },
          },
        },
      }),
      prisma.adminAuditLog.create({
        data: {
          action: "ORDER_STATUS_CHANGED",
          actorFingerprint: operator.actorFingerprint,
          actorCustomerId: operator.actorCustomerId,
          orderId: order.id,
          metadata: {
            from: order.status,
            to: targetStatus,
            reason,
            actorRole: operator.role,
            accessMode: operator.mode,
          },
        },
      }),
    ]);

    return Response.json({
      ok: true,
      orderId: order.publicId,
      previousStatus: order.status.toLowerCase(),
      status: targetStatus.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Operator access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Operator status transition failed", error);
    return Response.json(
      { ok: false, message: "The operator action could not be completed." },
      { status: 500 },
    );
  }
}
