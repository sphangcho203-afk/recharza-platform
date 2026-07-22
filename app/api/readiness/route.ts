import { evaluateDeploymentReadiness } from "@/lib/deployment-readiness";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkDatabase() {
  try {
    await Promise.race([
      getPrisma().$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database readiness timeout")), 5_000),
      ),
    ]);
    return { ready: true, message: "Database connection succeeded." };
  } catch {
    return {
      ready: false,
      message: "Database connection failed or timed out.",
    };
  }
}

export async function GET() {
  const configuration = evaluateDeploymentReadiness();
  const database = await checkDatabase();
  const ready = configuration.coreReady && database.ready;

  return Response.json(
    {
      service: "recharza-platform",
      status: ready ? "ready" : "not_ready",
      environment: configuration.environment,
      checkedAt: new Date().toISOString(),
      liveChargingBlocked: configuration.liveChargingBlocked,
      supplierWritesEnabled: configuration.supplierWritesEnabled,
      database,
      summary: {
        requiredChecks: configuration.checks.filter((check) => check.required).length,
        requiredChecksReady: configuration.checks.filter(
          (check) => check.required && check.ready,
        ).length,
        optionalChecksReady: configuration.checks.filter(
          (check) => !check.required && check.ready,
        ).length,
      },
      checks: configuration.checks,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
