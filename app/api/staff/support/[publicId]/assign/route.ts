import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import {
  assignSupportTicket,
  getSupportTicketDetail,
} from "@/lib/support-service";
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
        { ok: false, message: "An assignee and reason are required." },
        { status: 400 },
      );
    }

    const data = payload as Record<string, unknown>;
    const assigneeCustomerId =
      typeof data.assigneeCustomerId === "string" && data.assigneeCustomerId.trim()
        ? data.assigneeCustomerId.trim().slice(0, 64)
        : null;
    const reason =
      typeof data.reason === "string" ? data.reason.trim().slice(0, 240) : "";

    if (!reason || reason.length < 5) {
      return Response.json(
        { ok: false, message: "Explain the assignment in at least 5 characters." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const current = await prisma.supportTicket.findUnique({
      where: { publicId: normalized },
      select: { id: true, assigneeCustomerId: true },
    });
    if (!current) {
      return Response.json({ ok: false, message: "Ticket not found." }, { status: 404 });
    }

    if (assigneeCustomerId) {
      const assignee = await prisma.customer.findUnique({
        where: { id: assigneeCustomerId },
        select: {
          id: true,
          role: true,
          accessStatus: true,
          staffPermissions: true,
          staffPermissionsConfigured: true,
        },
      });
      const allowed =
        assignee &&
        assignee.accessStatus === "ACTIVE" &&
        (assignee.role === "ADMIN" ||
          assignee.role === "STAFF" &&
            (assignee.staffPermissions.includes("support.manage") ||
              !assignee.staffPermissionsConfigured));
      if (!allowed) {
        return Response.json(
          { ok: false, message: "That account cannot be assigned support work." },
          { status: 400 },
        );
      }
    }

    await assignSupportTicket({
      publicId: normalized,
      assigneeCustomerId,
    });

    await prisma.adminAuditLog.create({
      data: {
        action: "SUPPORT_TICKET_ASSIGNED",
        actorFingerprint: actor.actorFingerprint,
        actorCustomerId: actor.actorCustomerId,
        metadata: {
          publicId: normalized,
          assigneeCustomerId,
          previousAssigneeCustomerId: current.assigneeCustomerId,
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
      previousAssigneeCustomerId: current.assigneeCustomerId,
      message: assigneeCustomerId
        ? "Ticket assigned to the selected staff member."
        : "Ticket unassigned.",
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Staff support assignment failed", error);
    return Response.json(
      { ok: false, message: "The support assignment could not be completed." },
      { status: 500 },
    );
  }
}
