import { verifyOperatorAccess } from "@/lib/operator-auth";
import { listSupportTickets } from "@/lib/support-service";
import {
  isSupportTicketStatus,
  SUPPORT_TICKET_STATUSES,
} from "@/lib/support";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await verifyOperatorAccess(request, "support.manage");
    if (!actor) {
      return Response.json(
        { ok: false, message: "Support-work permission is required." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status")?.trim().toUpperCase() ?? "";
    const status = isSupportTicketStatus(requestedStatus) ? requestedStatus : undefined;
    const search = url.searchParams.get("q")?.trim().slice(0, 120) || undefined;
    const requestedAssignee = url.searchParams.get("assignee")?.trim() ?? "";
    const assignee =
      requestedAssignee === "me" || requestedAssignee === "unassigned"
        ? requestedAssignee
        : undefined;
    const parsedLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, Math.floor(parsedLimit)))
      : 50;

    const tickets = await listSupportTickets({
      status,
      search,
      assignee,
      actorCustomerId: actor.actorCustomerId,
      limit,
    });

    return Response.json(
      {
        ok: true,
        access: { mode: actor.mode, role: actor.role },
        filters: { statuses: SUPPORT_TICKET_STATUSES },
        tickets,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Staff support ticket listing failed", error);
    return Response.json(
      { ok: false, message: "Support tickets are temporarily unavailable." },
      { status: 500 },
    );
  }
}
