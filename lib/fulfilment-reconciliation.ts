import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { sendOrderCancelledLifecycleEmail } from "@/lib/lifecycle-email";
import {
  sendOrderCompletedEmail,
  sendOrderFailedEmail,
} from "@/lib/order-email";
import { getPrisma } from "@/lib/prisma";
import { getFazerCardsTopupStatus } from "@/lib/suppliers/fazercards-operations";

function getGameLabel(gameSlug: string) {
  const labels: Record<string, string> = {
    "mobile-legends": "Mobile Legends",
    "free-fire": "Free Fire MAX",
    "pubg-mobile": "PUBG Mobile",
    valorant: "VALORANT",
    "genshin-impact": "Genshin Impact",
    bgmi: "BGMI",
  };
  return labels[gameSlug] ?? gameSlug.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPlayerLabel(order: {
  playerId: string;
  zoneId: string;
  verifiedNickname: string | null;
}) {
  if (order.verifiedNickname) {
    return order.zoneId
      ? `${order.verifiedNickname} · ${order.playerId} (${order.zoneId})`
      : `${order.verifiedNickname} · ${order.playerId}`;
  }
  return order.zoneId ? `${order.playerId} (${order.zoneId})` : order.playerId;
}

function orderEmailInput(order: {
  id: string;
  publicId: string;
  customerId: string;
  billingEmail: string | null;
  gameSlug: string;
  packageName: string;
  amountInPaise: number;
  playerId: string;
  zoneId: string;
  verifiedNickname: string | null;
  customer: { email: string };
}, occurredAt: Date) {
  return {
    orderId: order.publicId,
    databaseOrderId: order.id,
    customerId: order.customerId,
    email: order.billingEmail ?? order.customer.email,
    gameLabel: getGameLabel(order.gameSlug),
    packageName: order.packageName,
    playerLabel: getPlayerLabel(order),
    amountInPaise: order.amountInPaise,
    occurredAt,
  };
}

export async function reconcileFulfilmentAttempt(attemptId: string) {
  const prisma = getPrisma();
  const attempt = await prisma.fulfilmentAttempt.findUnique({
    where: { id: attemptId },
    include: { order: { include: { customer: true } } },
  });

  if (!attempt) {
    return { ok: false, state: "missing-attempt" as const };
  }

  if (!["SUBMITTED", "PROCESSING"].includes(attempt.status)) {
    return {
      ok: true,
      state: attempt.status.toLowerCase(),
      unchanged: true,
    };
  }

  if (!attempt.providerOrderId) {
    await prisma.fulfilmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FAILED",
        errorMessage: "A submitted supplier attempt has no provider order ID.",
      },
    });
    return { ok: false, state: "failed", message: "Provider order ID is missing." };
  }

  const status = await getFazerCardsTopupStatus(attempt.providerOrderId);
  if (!status.configured) {
    return { ok: true, state: "unconfigured" as const, unchanged: true };
  }

  const responsePayload = status.responsePayload as Prisma.InputJsonValue;

  if (status.state === "unknown") {
    await prisma.fulfilmentAttempt.update({
      where: { id: attempt.id },
      data: { responsePayload },
    });
    return {
      ok: true,
      state: "unknown" as const,
      rawStatus: status.rawStatus,
      unchanged: true,
    };
  }

  if (status.state === "processing") {
    const changed = attempt.status !== "PROCESSING";
    await prisma.$transaction([
      prisma.fulfilmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "PROCESSING",
          responsePayload,
        },
      }),
      ...(changed
        ? [
            prisma.orderEvent.create({
              data: {
                orderId: attempt.orderId,
                type: "FAZERCARDS_ORDER_PROCESSING",
                message: "FazerCards reports that the supplier order is processing.",
                metadata: {
                  attemptId: attempt.id,
                  providerOrderId: attempt.providerOrderId,
                  rawStatus: status.rawStatus,
                },
              },
            }),
          ]
        : []),
    ]);

    return { ok: true, state: "processing" as const, rawStatus: status.rawStatus };
  }

  if (status.state === "completed") {
    const completedAt = new Date();
    await prisma.$transaction([
      prisma.fulfilmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "COMPLETED",
          responsePayload,
          completedAt,
          errorMessage: null,
        },
      }),
      prisma.order.update({
        where: { id: attempt.orderId },
        data: {
          status: "COMPLETED",
          events: {
            create: {
              type: "FAZERCARDS_ORDER_COMPLETED",
              message: "FazerCards explicitly reported successful fulfilment.",
              metadata: {
                attemptId: attempt.id,
                providerOrderId: attempt.providerOrderId,
                rawStatus: status.rawStatus,
              },
            },
          },
        },
      }),
    ]);

    try {
      await sendOrderCompletedEmail(orderEmailInput(attempt.order, completedAt));
    } catch (error) {
      console.error("Supplier completion email failed", error);
    }

    return { ok: true, state: "completed" as const, rawStatus: status.rawStatus };
  }

  const failureMessage =
    status.state === "cancelled"
      ? "FazerCards reported that the supplier order was cancelled. Staff review and refund handling are required."
      : "FazerCards reported that the supplier order failed. Staff review is required.";
  const failedAt = new Date();

  await prisma.$transaction([
    prisma.fulfilmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: status.state === "cancelled" ? "CANCELLED" : "FAILED",
        responsePayload,
        completedAt: failedAt,
        errorMessage: failureMessage,
      },
    }),
    prisma.order.update({
      where: { id: attempt.orderId },
      data: {
        status: "FAILED",
        events: {
          create: {
            type:
              status.state === "cancelled"
                ? "FAZERCARDS_ORDER_CANCELLED"
                : "FAZERCARDS_ORDER_FAILED",
            message: failureMessage,
            metadata: {
              attemptId: attempt.id,
              providerOrderId: attempt.providerOrderId,
              rawStatus: status.rawStatus,
              refundRequired: true,
            },
          },
        },
      },
    }),
  ]);

  try {
    if (status.state === "cancelled") {
      await sendOrderCancelledLifecycleEmail({
        databaseOrderId: attempt.order.id,
        publicOrderId: attempt.order.publicId,
        customerId: attempt.order.customerId,
        email: attempt.order.billingEmail ?? attempt.order.customer.email,
        gameSlug: attempt.order.gameSlug,
        packageName: attempt.order.packageName,
        amountInPaise: attempt.order.amountInPaise,
        playerId: attempt.order.playerId,
        zoneId: attempt.order.zoneId,
        nickname: attempt.order.verifiedNickname,
        occurredAt: failedAt,
        reason: failureMessage,
      });
    } else {
      await sendOrderFailedEmail({
        ...orderEmailInput(attempt.order, failedAt),
        reason: failureMessage,
      });
    }
  } catch (error) {
    console.error("Supplier failure email failed", error);
  }

  return {
    ok: false,
    state: status.state,
    rawStatus: status.rawStatus,
    message: failureMessage,
  };
}

export async function reconcilePendingFulfilments(limit = 25) {
  const attempts = await getPrisma().fulfilmentAttempt.findMany({
    where: {
      provider: "fazercards",
      status: { in: ["SUBMITTED", "PROCESSING"] },
      providerOrderId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    take: Math.min(100, Math.max(1, limit)),
    select: { id: true },
  });

  const results = [];
  for (const attempt of attempts) {
    try {
      results.push({ attemptId: attempt.id, ...(await reconcileFulfilmentAttempt(attempt.id)) });
    } catch (error) {
      results.push({
        attemptId: attempt.id,
        ok: false,
        state: "error",
        message: error instanceof Error ? error.message.slice(0, 300) : "Unknown reconciliation error.",
      });
    }
  }

  return results;
}
