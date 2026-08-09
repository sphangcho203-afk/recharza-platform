import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getSupportTicketDetail } from "@/lib/support-service";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const PUBLIC_ID_PATTERN = /^RZS-[A-Z0-9]{16}$/;

export async function GET(
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

    const ticket = await getSupportTicketDetail(normalized);
    if (!ticket) {
      return Response.json({ ok: false, message: "Ticket not found." }, { status: 404 });
    }

    return Response.json(
      { ok: true, ticket },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Staff support ticket detail failed", error);
    return Response.json(
      { ok: false, message: "The support ticket could not be loaded." },
      { status: 500 },
    );
  }
}
