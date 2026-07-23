import { ensureOrderFulfilment } from "@/lib/fulfilment";
import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const actor = await verifyOperatorAccess(request, "fulfilment.manage");
    if (!actor) {
      return Response.json(
        { ok: false, message: "Fulfilment-management permission is required." },
        { status: 401 },
      );
    }

    const payload = (await request.json().catch(() => null)) as
      | { reason?: unknown; retry?: unknown }
      | null;
    const reason =
      typeof payload?.reason === "string" ? payload.reason.trim().slice(0, 240) : "";
    const forceRetry = payload?.retry === true;

    if (reason.length < 5) {
      return Response.json(
        { ok: false, message: "Add a clear fulfilment reason of at least 5 characters." },
        { status: 400 },
      );
    }

    const { orderId } = await context.params;
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { publicId: orderId },
      select: { id: true, publicId: true, status: true },
    });

    if (!order) {
      return Response.json({ ok: false, message: "Order not found." }, { status: 404 });
    }

    if (!["PAID", "FULFILLING"].includes(order.status)) {
      return Response.json(
        {
          ok: false,
          message: "Fulfilment can only be planned after verified payment.",
        },
        { status: 409 },
      );
    }

    const result = await ensureOrderFulfilment({
      orderId: order.id,
      source: "operator",
      forceRetry,
    });

    await prisma.adminAuditLog.create({
      data: {
        action: forceRetry ? "FULFILMENT_RETRY_REQUESTED" : "FULFILMENT_ENSURED",
        actorFingerprint: actor.actorFingerprint,
        actorCustomerId: actor.actorCustomerId,
        orderId: order.id,
        metadata: {
          reason,
          result,
          actorRole: actor.role,
          accessMode: actor.mode,
        },
      },
    });

    return Response.json({ ok: result.ok, orderId: order.publicId, result }, {
      status: result.ok ? 200 : 409,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message: error.message }, { status: 503 });
    }

    console.error("Operator fulfilment action failed", error);
    return Response.json(
      { ok: false, message: "The fulfilment action could not be completed safely." },
      { status: 500 },
    );
  }
}
