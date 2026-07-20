import { reconcilePendingFulfilments } from "@/lib/fulfilment-reconciliation";
import { verifyMaintenanceAccess } from "@/lib/operator-auth";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!verifyMaintenanceAccess(request)) {
      return Response.json(
        { ok: false, message: "Maintenance access is required." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 25);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
      : 25;
    const results = await reconcilePendingFulfilments(limit);

    return Response.json({
      ok: true,
      checked: results.length,
      completed: results.filter((result) => result.state === "completed").length,
      processing: results.filter((result) => result.state === "processing").length,
      failed: results.filter((result) => !result.ok).length,
      results,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message: error.message }, { status: 503 });
    }

    console.error("Fulfilment reconciliation failed", error);
    return Response.json(
      { ok: false, message: "Fulfilment reconciliation temporarily failed." },
      { status: 500 },
    );
  }
}
