import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import {
  changeSupportTicketStatus,
  getSupportTicketDetail,
} from "@/lib/support-service";
import {
  isSupportTicketStatus,
  SUPPORT_TICKET_STATUSES,
  supportTicketStatusLabel,
  type SupportTicketStatus,
} from "@/lib/support";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const PUBLIC_ID_PATTERN = /^RZS-[A-Z0-9]{16}$/;

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
        { ok: false, message: "A target status and reason are required." },
        { status: 400 },
      );
    }

    const data = payload as Record<string, unknown>;
    const targetStatus =
      typeof data.status === "string" ? data.status.trim().toUpperCase() : "";
    const reason =
      typeof data.reason === "string" ? data.reason.trim().slice(0, 240) : "";

    if (!isSupportTicketStatus(targetStatus)) {
      return Response.json(
        {
          ok: false,
          message: `Choose a valid support status: ${SUPPORT_TICKET_STATUSES.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    if (!reason || reason.length < 5) {
      return Response.json(
        { ok: false, message: "Explain the status change in at least 5 characters." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const current = await prisma.supportTicket.findUnique({
      where: { publicId: normalized },
      select: { id: true, status: true },
    });
    if (!current) {
      return Response.json({ ok: false, message: "Ticket not found." }, { status: 404 });
    }

    await changeSupportTicketStatus(normalized, targetStatus as SupportTicketStatus);

    await prisma.adminAuditLog.create({
      data: {
        action: "SUPPORT_TICKET_STATUS_CHANGED",
        actorFingerprint: actor.actorFingerprint,
        actorCustomerId: actor.actorCustomerId,
        metadata: {
          publicId: normalized,
          from: current.status,
          to: targetStatus,
          reason,
          actorRole: actor.role,
          accessMode: actor.mode,
        },
      },
    });

    const ticket = await getSupportTicketDetail(normalized);
    return Response.json({
      ok: true,
      ticket,
      previousStatus: current.status.toLowerCase(),
      status: targetStatus.toLowerCase(),
      message: `Ticket moved to ${supportTicketStatusLabel(targetStatus as SupportTicketStatus)}.`,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Staff support status change failed", error);
    return Response.json(
      { ok: false, message: "The support status change could not be completed." },
      { status: 500 },
    );
  }
}
