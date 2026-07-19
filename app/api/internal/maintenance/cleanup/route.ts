import { verifyMaintenanceAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

const WEBHOOK_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    if (!verifyMaintenanceAccess(request)) {
      return Response.json(
        { ok: false, message: "Maintenance access is required." },
        { status: 401 },
      );
    }

    const prisma = getPrisma();
    const now = new Date();
    const webhookCutoff = new Date(now.getTime() - WEBHOOK_RETENTION_MS);
    const [rateLimitResult, webhookResult] = await prisma.$transaction([
      prisma.rateLimitBucket.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.paymentWebhook.deleteMany({
        where: {
          receivedAt: { lt: webhookCutoff },
          status: { in: ["PROCESSED", "IGNORED"] },
        },
      }),
    ]);

    return Response.json({
      ok: true,
      deleted: {
        rateLimitBuckets: rateLimitResult.count,
        webhookReceipts: webhookResult.count,
      },
      completedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Maintenance access is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Maintenance cleanup failed", error);
    return Response.json(
      { ok: false, message: "Maintenance cleanup temporarily failed." },
      { status: 500 },
    );
  }
}
