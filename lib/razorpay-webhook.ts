import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { requireEnvironmentVariable } from "@/lib/runtime-config";

type RazorpayEntity = Record<string, unknown>;

type RazorpayWebhookPayload = {
  event?: unknown;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

export type ReconciledRazorpayEvent = {
  eventType: string;
  paymentId: string | null;
  providerOrderId: string | null;
  amountInPaise: number | null;
  currency: string | null;
  paymentStatus: string | null;
  payload: RazorpayWebhookPayload;
};

function constantTimeHexEqual(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  receivedSignature: string,
) {
  const secret = requireEnvironmentVariable("RAZORPAY_WEBHOOK_SECRET", {
    minLength: 16,
  });
  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return constantTimeHexEqual(expectedSignature, receivedSignature.trim());
}

export function hashWebhookPayload(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function readString(entity: RazorpayEntity | undefined, key: string) {
  const value = entity?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readInteger(entity: RazorpayEntity | undefined, key: string) {
  const value = entity?.[key];
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

export function parseRazorpayWebhook(rawBody: string): ReconciledRazorpayEvent {
  const parsed = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const eventType =
    typeof parsed.event === "string" && parsed.event.trim()
      ? parsed.event.trim()
      : "unknown";
  const payment = parsed.payload?.payment?.entity;
  const order = parsed.payload?.order?.entity;

  return {
    eventType,
    paymentId: readString(payment, "id"),
    providerOrderId:
      readString(payment, "order_id") ?? readString(order, "id"),
    amountInPaise:
      readInteger(payment, "amount") ?? readInteger(order, "amount_paid"),
    currency: readString(payment, "currency") ?? readString(order, "currency"),
    paymentStatus: readString(payment, "status") ?? readString(order, "status"),
    payload: parsed,
  };
}
