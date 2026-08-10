import { verifyOperatorAccess } from "@/lib/operator-auth";
import { listSupportAssigneeCandidates } from "@/lib/support-service";
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

    const assignees = await listSupportAssigneeCandidates();

    return Response.json(
      { ok: true, assignees },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Staff support access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Support assignee listing failed", error);
    return Response.json(
      { ok: false, message: "Support assignees are temporarily unavailable." },
      { status: 500 },
    );
  }
}
