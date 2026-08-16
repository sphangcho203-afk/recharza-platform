import type { Prisma } from "@/generated/prisma/client";
import { ensureOrderFulfilment } from "@/lib/fulfilment";
import { sendPaymentConfirmedLifecycleEmail } from "@/lib/lifecycle-email";
import { sendOrderFailedEmail } from "@/lib/order-email";
import { getPrisma } from "@/lib/prisma";
import {
  hashWebhookPayload,
  parseRazorpayWebhook,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay-webhook";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

type OrderStatusValue =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FULFILLING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const SUPPORTED_EVENTS = new Set([
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "order.paid",
]);

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

function canMoveToPaid(status: OrderStatusValue) {
  return !["FULFILLING", "COMPLETED", "CANCELLED"].includes(status);
}

function resolveTargetStatus(
  eventType: string,
  currentStatus: OrderStatusValue,
): OrderStatusValue {
  if (["payment.captured", "order.paid"].includes(eventType)) {
    return canMoveToPaid(currentStatus) ? "PAID" : currentStatus;
  }

  if (eventType === "payment.authorized") {
    return ["CREATED", "AWAITING_PAYMENT", "PAYMENT_PENDING"].includes(currentStatus)
      ? "PAYMENT_PENDING"
      : currentStatus;
  }

  if (eventType === "payment.failed") {
    return ["CREATED", "AWAITING_PAYMENT", "PAYMENT_PENDING"].includes(currentStatus)
      ? "FAILED"
      : currentStatus;
  }

  return currentStatus;
}

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

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature")?.trim();

    if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
      return Response.json(
        { ok: false, message: "Webhook signature verification failed." },
        { status: 401 },
      );
    }

    let event;
    try {
      event = parseRazorpayWebhook(rawBody);
    } catch {
      return Response.json(
        { ok: false, message: "Webhook payload must be valid JSON." },
        { status: 400 },
      );
    }

    const eventId = request.headers.get("x-razorpay-event-id")?.trim() || null;
    const payloadHash = hashWebhookPayload(rawBody);
    const prisma = getPrisma();
    const duplicateFilters: Prisma.PaymentWebhookWhereInput[] = [{ payloadHash }];
    if (eventId) duplicateFilters.push({ provider: "razorpay", eventId });

    const existingReceipt = await prisma.paymentWebhook.findFirst({
      where: { OR: duplicateFilters },
      select: { id: true, status: true },
    });

    if (existingReceipt) {
      return Response.json({
        ok: true,
        duplicate: true,
        receiptId: existingReceipt.id,
        status: existingReceipt.status.toLowerCase(),
      });
    }

    let receipt;
    try {
      receipt = await prisma.paymentWebhook.create({
        data: {
          provider: "razorpay",
          eventId,
          eventType: event.eventType,
          payloadHash,
          payload: event.payload as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return Response.json({ ok: true, duplicate: true });
      }
      throw error;
    }

    if (!SUPPORTED_EVENTS.has(event.eventType)) {
      await prisma.paymentWebhook.update({
        where: { id: receipt.id },
        data: { status: "IGNORED", processedAt: new Date() },
      });
      return Response.json({ ok: true, ignored: true });
    }

    if (!event.providerOrderId) {
      await prisma.paymentWebhook.update({
        where: { id: receipt.id },
        data: {
          status: "FAILED",
          errorMessage: "Supported event did not include a provider order ID.",
          processedAt: new Date(),
        },
      });
      return Response.json({ ok: true, reconciled: false });
    }

    const order = await prisma.order.findUnique({
      where: { paymentSessionId: event.providerOrderId },
      include: { customer: true },
    });

    if (!order) {
      await prisma.paymentWebhook.update({
        where: { id: receipt.id },
        data: {
          status: "IGNORED",
          errorMessage: "No Recharza order matched the provider order ID.",
          processedAt: new Date(),
        },
      });
      return Response.json({ ok: true, reconciled: false });
    }

    const batchOrders = order.checkoutBatchId
      ? await prisma.order.findMany({ where: { checkoutBatchId: order.checkoutBatchId }, select: { id: true, amountInPaise: true, status: true } })
      : [{ id: order.id, amountInPaise: order.amountInPaise, status: order.status }];
    const batchAmountInPaise = batchOrders.reduce((total, item) => total + item.amountInPaise, 0);
    const currencyMatches = event.currency?.toUpperCase() === order.currency.toUpperCase();
    const amountMatches = event.amountInPaise === batchAmountInPaise;

    if (!currencyMatches || !amountMatches) {
      await prisma.paymentWebhook.update({
        where: { id: receipt.id },
        data: {
          status: "FAILED",
          orderId: order.id,
          errorMessage: "Payment amount or currency did not match the order.",
          processedAt: new Date(),
        },
      });
      return Response.json({ ok: true, reconciled: false });
    }

    const targetStatus = resolveTargetStatus(event.eventType, order.status);

    await prisma.$transaction([
      prisma.order.updateMany({
        where: order.checkoutBatchId ? { checkoutBatchId: order.checkoutBatchId } : { id: order.id },
        data: {
          status: targetStatus,
          paymentProvider: "razorpay",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          paymentProvider: "razorpay",
          events: {
            create: {
              type: `RAZORPAY_${event.eventType.replaceAll(".", "_").toUpperCase()}`,
              message:
                targetStatus === order.status
                  ? "Verified webhook recorded without changing the current order state."
                  : `Verified webhook moved the order from ${order.status} to ${targetStatus}.`,
              metadata: {
                eventId,
                paymentId: event.paymentId,
                paymentStatus: event.paymentStatus,
                payloadHash,
              },
            },
          },
        },
      }),
      prisma.paymentWebhook.update({
        where: { id: receipt.id },
        data: {
          status: "PROCESSED",
          orderId: order.id,
          processedAt: new Date(),
        },
      }),
    ]);

    const occurredAt = new Date();
    const recipient = order.billingEmail ?? order.customer.email;

    if (targetStatus === "PAID" && order.status !== "PAID") {
      try {
        await sendPaymentConfirmedLifecycleEmail({
          databaseOrderId: order.id,
          publicOrderId: order.publicId,
          customerId: order.customerId,
          email: recipient,
          gameSlug: order.gameSlug,
          packageName: order.packageName,
          amountInPaise: order.amountInPaise,
          playerId: order.playerId,
          zoneId: order.zoneId,
          nickname: order.verifiedNickname,
          occurredAt,
        });
      } catch (error) {
        console.error("Payment-confirmed email failed", error);
      }
    }

    if (targetStatus === "FAILED" && order.status !== "FAILED") {
      try {
        await sendOrderFailedEmail({
          orderId: order.publicId,
          databaseOrderId: order.id,
          customerId: order.customerId,
          email: recipient,
          gameLabel: getGameLabel(order.gameSlug),
          packageName: order.packageName,
          playerLabel: getPlayerLabel(order),
          amountInPaise: order.amountInPaise,
          occurredAt,
          reason: "The payment provider reported that the payment failed.",
        });
      } catch (error) {
        console.error("Payment-failed email failed", error);
      }
    }

    let fulfilment: unknown = null;
    if (targetStatus === "PAID") {
      try {
        const fulfilmentResults = [];
        for (const batchOrder of batchOrders) {
          fulfilmentResults.push(await ensureOrderFulfilment({ orderId: batchOrder.id, source: "payment-webhook" }));
        }
        fulfilment = { ok: fulfilmentResults.every((result) => result.ok), items: fulfilmentResults };
      } catch (error) {
        console.error("Post-payment fulfilment orchestration failed", error);
        fulfilment = { ok: false, state: "orchestration-error" };
      }
    }

    return Response.json({
      ok: true,
      reconciled: true,
      orderId: order.publicId,
      status: targetStatus.toLowerCase(),
      fulfilment,
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { ok: false, message: "Webhook processing is not configured yet." },
        { status: 503 },
      );
    }

    console.error("Razorpay webhook processing failed", error);
    return Response.json(
      { ok: false, message: "Webhook processing temporarily failed." },
      { status: 500 },
    );
  }
}
