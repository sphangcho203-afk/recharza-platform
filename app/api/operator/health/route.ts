import { verifyOperatorAccess } from "@/lib/operator-auth";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

function resolvePaymentMode() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";

  if (!keyId && !keySecret) {
    return {
      mode: "mock",
      ready: false,
      warning: "Razorpay Test Mode keys are not configured.",
    };
  }

  if (!keyId || !keySecret) {
    return {
      mode: "misconfigured",
      ready: false,
      warning: "Razorpay key ID and key secret must be configured together.",
    };
  }

  if (!keyId.startsWith("rzp_test_")) {
    return {
      mode: "live-key-blocked",
      ready: false,
      warning: "A non-test Razorpay key is present. This build intentionally blocks live charging.",
    };
  }

  return { mode: "razorpay-test", ready: true, warning: null };
}

export async function GET(request: Request) {
  try {
    const actor = await verifyOperatorAccess(request);

    if (!actor) {
      return Response.json(
        { ok: false, message: "Verified staff access is required." },
        { status: 401 },
      );
    }

    const prisma = getPrisma();
    const [
      latestSync,
      totalProducts,
      publishedProducts,
      unavailableProducts,
      webhookFailures,
      pendingPayments,
      pendingFulfilments,
      failedFulfilments,
      verifiedCustomers,
      staffAccounts,
    ] = await Promise.all([
      prisma.supplierSyncRun.findFirst({ orderBy: { startedAt: "desc" } }),
      prisma.supplierProduct.count(),
      prisma.supplierProduct.count({ where: { published: true, available: true } }),
      prisma.supplierProduct.count({ where: { available: false } }),
      prisma.paymentWebhook.count({ where: { status: "FAILED" } }),
      prisma.order.count({
        where: { status: { in: ["AWAITING_PAYMENT", "PAYMENT_PENDING"] } },
      }),
      prisma.fulfilmentAttempt.count({
        where: { status: { in: ["PLANNED", "SUBMITTING", "SUBMITTED", "PROCESSING"] } },
      }),
      prisma.fulfilmentAttempt.count({ where: { status: "FAILED" } }),
      prisma.customer.count({ where: { emailVerifiedAt: { not: null } } }),
      prisma.customer.count({ where: { role: { in: ["STAFF", "ADMIN"] } } }),
    ]);

    const payment = resolvePaymentMode();
    const supplierKeyConfigured = Boolean(process.env.FAZERCARDS_API_KEY?.trim());
    const publishedCategoryCount = (process.env.FAZERCARDS_PUBLISHED_CATEGORY_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean).length;
    const writesEnabled = process.env.FAZERCARDS_ORDER_WRITES_ENABLED === "true";

    return Response.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      access: { mode: actor.mode, role: actor.role },
      database: { ready: true },
      accounts: {
        verifiedCustomers,
        staffAccounts,
      },
      payment: {
        ...payment,
        webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim()),
        pendingOrders: pendingPayments,
        failedWebhookReceipts: webhookFailures,
      },
      supplier: {
        apiKeyConfigured: supplierKeyConfigured,
        orderWritesEnabled: writesEnabled,
        validationPathConfigured: Boolean(process.env.FAZERCARDS_PLAYER_VALIDATION_PATH?.trim()),
        orderCreatePathConfigured: Boolean(process.env.FAZERCARDS_ORDER_CREATE_PATH?.trim()),
        publishedCategoryCount,
        totalProducts,
        publishedProducts,
        unavailableProducts,
        pendingFulfilments,
        failedFulfilments,
        latestSync: latestSync
          ? {
              status: latestSync.status.toLowerCase(),
              categoriesSynced: latestSync.categoriesSynced,
              offersSynced: latestSync.offersSynced,
              startedAt: latestSync.startedAt.toISOString(),
              completedAt: latestSync.completedAt?.toISOString() ?? null,
              errorMessage: latestSync.errorMessage,
            }
          : null,
      },
      actorFingerprint: actor.actorFingerprint,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message: error.message }, { status: 503 });
    }

    console.error("Operator health check failed", error);
    return Response.json(
      { ok: false, message: "Operational health could not be loaded." },
      { status: 500 },
    );
  }
}
