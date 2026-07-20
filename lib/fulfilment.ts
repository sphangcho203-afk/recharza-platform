import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import {
  createFazerCardsTopup,
  getFazerCardsOperationConfiguration,
} from "@/lib/suppliers/fazercards-operations";

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

export async function ensureOrderFulfilment(input: {
  orderId: string;
  source: "payment-webhook" | "operator" | "maintenance";
}) {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { supplierProduct: true },
  });

  if (!order) {
    return { ok: false, state: "missing-order" as const };
  }

  if (!['PAID', 'FULFILLING'].includes(order.status)) {
    return {
      ok: false,
      state: "not-payable" as const,
      orderStatus: order.status.toLowerCase(),
    };
  }

  const idempotencyKey = `fazercards:${order.publicId}`;
  const existing = await prisma.fulfilmentAttempt.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return {
      ok: true,
      duplicate: true,
      state: existing.status.toLowerCase(),
      attemptId: existing.id,
      providerOrderId: existing.providerOrderId,
    };
  }

  const product = order.supplierProduct;
  const config = getFazerCardsOperationConfiguration();
  const canSubmit = Boolean(
    product &&
      order.supplierCategoryId &&
      order.supplierOfferId &&
      config.writeReady,
  );

  let attempt;
  try {
    attempt = await prisma.fulfilmentAttempt.create({
      data: {
        orderId: order.id,
        provider: "fazercards",
        mode: canSubmit ? "SUPPLIER_WRITE" : "DRY_RUN",
        status: canSubmit ? "SUBMITTING" : "PLANNED",
        idempotencyKey,
        requestPayload: {
          source: input.source,
          recharzaOrderId: order.publicId,
          supplierProductId: order.supplierProductId,
          categoryId: order.supplierCategoryId,
          offerId: order.supplierOfferId,
          playerId: order.playerId,
          zoneId: order.zoneId,
          writesEnabled: config.writesEnabled,
          writeReady: config.writeReady,
        },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicate = await prisma.fulfilmentAttempt.findUnique({
        where: { idempotencyKey },
      });
      if (duplicate) {
        return {
          ok: true,
          duplicate: true,
          state: duplicate.status.toLowerCase(),
          attemptId: duplicate.id,
          providerOrderId: duplicate.providerOrderId,
        };
      }
    }
    throw error;
  }

  if (!product || !order.supplierCategoryId || !order.supplierOfferId) {
    await prisma.$transaction([
      prisma.fulfilmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "PLANNED",
          responsePayload: {
            dryRun: true,
            reason:
              "The order uses an indicative package or has no approved supplier product reference.",
          },
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "FULFILMENT_DRY_RUN_PLANNED",
          message:
            "A dry-run fulfilment plan was recorded because no approved live supplier product was attached.",
          metadata: { attemptId: attempt.id, source: input.source },
        },
      }),
    ]);

    return { ok: true, state: "planned", dryRun: true, attemptId: attempt.id };
  }

  try {
    const result = await createFazerCardsTopup({
      recharzaOrderId: order.publicId,
      categoryId: order.supplierCategoryId,
      offerId: order.supplierOfferId,
      playerId: order.playerId,
      zoneId: order.zoneId,
      fieldSchema: product.fields,
      idempotencyKey,
    });

    if (result.mode === "dry-run") {
      await prisma.$transaction([
        prisma.fulfilmentAttempt.update({
          where: { id: attempt.id },
          data: {
            mode: "DRY_RUN",
            status: "PLANNED",
            requestPayload: result.requestPayload as Prisma.InputJsonValue,
            responsePayload: result.responsePayload as Prisma.InputJsonValue,
          },
        }),
        prisma.orderEvent.create({
          data: {
            orderId: order.id,
            type: "FULFILMENT_DRY_RUN_PLANNED",
            message:
              "A complete FazerCards dry-run request was recorded; supplier writes remain disabled.",
            metadata: { attemptId: attempt.id, source: input.source },
          },
        }),
      ]);

      return { ok: true, state: "planned", dryRun: true, attemptId: attempt.id };
    }

    await prisma.$transaction([
      prisma.fulfilmentAttempt.update({
        where: { id: attempt.id },
        data: {
          mode: "SUPPLIER_WRITE",
          status: "SUBMITTED",
          providerOrderId: result.providerOrderId,
          requestPayload: result.requestPayload as Prisma.InputJsonValue,
          responsePayload: result.responsePayload as Prisma.InputJsonValue,
          submittedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FULFILLING",
          events: {
            create: {
              type: "FAZERCARDS_ORDER_SUBMITTED",
              message: "The verified paid order was submitted to FazerCards.",
              metadata: {
                attemptId: attempt.id,
                providerOrderId: result.providerOrderId,
                providerStatus: result.providerStatus,
                source: input.source,
              },
            },
          },
        },
      }),
    ]);

    return {
      ok: true,
      state: "submitted",
      dryRun: false,
      attemptId: attempt.id,
      providerOrderId: result.providerOrderId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown fulfilment error.";

    await prisma.$transaction([
      prisma.fulfilmentAttempt.update({
        where: { id: attempt.id },
        data: { status: "FAILED", errorMessage: message },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "FAZERCARDS_ORDER_FAILED",
          message:
            "Supplier fulfilment failed after payment; the paid order remains available for staff recovery.",
          metadata: { attemptId: attempt.id, source: input.source, error: message },
        },
      }),
    ]);

    return { ok: false, state: "failed", attemptId: attempt.id, message };
  }
}
