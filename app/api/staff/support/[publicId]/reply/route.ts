import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { deliverStaffSupportReply } from "@/lib/support-service";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const PUBLIC_ID_PATTERN = /^RZS-[A-Z0-9]{16}$/;
const MAX_REPLY_LENGTH = 2_000;

function cleanReply(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_REPLY_LENGTH);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  try {
    const actor = await verifyOperatorAccess(request, "support.manage");
    if (!actor) {
      return Response.json(
        { ok: false, message: "Support-work permission is required." },
        { status: 401 },
      );
    }

    const { publicId } = await context.params;
    const normalized = publicId.trim().toUpperCase();
    if (!PUBLIC_ID_PATTERN.test(normalized)) {
      return Response.json({ ok: false, message: "Invalid ticket ID." }, { status: 400 });
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

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return Response.json(
        { ok: false, message: "A reply message is required." },
        { status: 400 },
      );
    }

    const reply = cleanReply((payload as Record<string, unknown>).text);
    if (reply.length < 1) {
      return Response.json(
        { ok: false, message: "Write a reply before sending it." },
        { status: 400 },
      );
    }

    const { ticket, delivery } = await deliverStaffSupportReply({
      publicId: normalized,
      text: reply,
      actorFingerprint: actor.actorFingerprint,
      actorLabel: `${actor.role} via ${actor.mode}`,
    });

    const prisma = getPrisma();
    await prisma.adminAuditLog.create({
      data: {
        action: "SUPPORT_REPLY_SENT",
        actorFingerprint: actor.actorFingerprint,
        actorCustomerId: actor.actorCustomerId,
        metadata: {
          publicId: normalized,
          channel: ticket?.replyChannel ?? null,
          delivery: delivery.status,
          reason: reply.slice(0, 240),
          actorRole: actor.role,
          accessMode: actor.mode,
        },
      },
    });

    return Response.json({
      ok: true,
      ticket,
      delivery: delivery.status.toLowerCase(),
      message:
        delivery.status === "SENT"
          ? "Reply delivered to the customer."
          : delivery.status === "SKIPPED"
            ? "Reply recorded, but no customer channel is connected yet."
            : "Reply recorded, but delivery failed. Review the ticket delivery status.",
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message === "Ticket not found") {
      return Response.json({ ok: false, message: "Ticket not found." }, { status: 404 });
    }

    console.error("Staff support reply failed", error);
    return Response.json(
      { ok: false, message: "The support reply could not be sent." },
      { status: 500 },
    );
  }
}
