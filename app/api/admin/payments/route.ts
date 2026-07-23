import { randomUUID } from "node:crypto";

import {
  getAdminPaymentCaseLedger,
  getAdminPaymentSnapshot,
  type PaymentCaseStatus,
  type PaymentCaseType,
} from "@/lib/admin-payments";
import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

const CASE_TYPES = new Set<PaymentCaseType>([
  "RECONCILIATION",
  "REFUND_REVIEW",
  "DISPUTE",
  "PAYMENT_FAILURE",
]);
const CASE_STATUSES = new Set<PaymentCaseStatus>([
  "OPEN",
  "INVESTIGATING",
  "AWAITING_EVIDENCE",
  "READY_FOR_APPROVAL",
  "RESOLVED",
  "DISMISSED",
]);
const TRANSITIONS: Record<PaymentCaseStatus, Set<PaymentCaseStatus>> = {
  OPEN: new Set(["INVESTIGATING", "AWAITING_EVIDENCE", "DISMISSED"]),
  INVESTIGATING: new Set([
    "AWAITING_EVIDENCE",
    "READY_FOR_APPROVAL",
    "RESOLVED",
    "DISMISSED",
  ]),
  AWAITING_EVIDENCE: new Set(["INVESTIGATING", "READY_FOR_APPROVAL", "DISMISSED"]),
  READY_FOR_APPROVAL: new Set(["INVESTIGATING", "RESOLVED", "DISMISSED"]),
  RESOLVED: new Set(),
  DISMISSED: new Set(),
};

async function requireAdmin(request: Request) {
  const session = await getRequestSession(request);
  return session?.customer.role === "ADMIN" ? session : null;
}

function readString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

function readAmount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function createCaseId() {
  return `PC-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  return Response.json(
    { ok: true, snapshot: await getAdminPaymentSnapshot() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = readString(body?.type, 40)?.toUpperCase() as PaymentCaseType | null;
  const title = readString(body?.title, 120);
  const reason = readString(body?.reason, 500);
  const orderPublicId = readString(body?.orderId, 80);
  const webhookId = readString(body?.webhookId, 100);
  const requestedAmountInPaise = readAmount(body?.requestedAmountInPaise);

  if (!type || !CASE_TYPES.has(type) || !title || title.length < 5 || !reason || reason.length < 8) {
    return Response.json(
      {
        ok: false,
        message: "A valid case type, title, and audit reason of at least 8 characters are required.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const [requestedOrder, webhook] = await Promise.all([
    orderPublicId
      ? prisma.order.findUnique({
          where: { publicId: orderPublicId },
          select: {
            id: true,
            publicId: true,
            amountInPaise: true,
            currency: true,
            paymentProvider: true,
            paymentSessionId: true,
          },
        })
      : null,
    webhookId
      ? prisma.paymentWebhook.findUnique({
          where: { id: webhookId },
          select: {
            id: true,
            provider: true,
            order: {
              select: {
                id: true,
                publicId: true,
                amountInPaise: true,
                currency: true,
                paymentProvider: true,
                paymentSessionId: true,
              },
            },
          },
        })
      : null,
  ]);

  if (orderPublicId && !requestedOrder) {
    return Response.json({ ok: false, message: "The selected order was not found." }, { status: 404 });
  }
  if (webhookId && !webhook) {
    return Response.json({ ok: false, message: "The selected webhook was not found." }, { status: 404 });
  }

  const order = requestedOrder ?? webhook?.order ?? null;
  if (!order && !webhook) {
    return Response.json(
      { ok: false, message: "Attach the case to an order or stored webhook receipt." },
      { status: 400 },
    );
  }

  if (type === "REFUND_REVIEW") {
    if (!order || !requestedAmountInPaise) {
      return Response.json(
        { ok: false, message: "Refund review requires an order and a positive review amount." },
        { status: 400 },
      );
    }
    if (requestedAmountInPaise > order.amountInPaise) {
      return Response.json(
        { ok: false, message: "The refund review amount cannot exceed the stored order amount." },
        { status: 409 },
      );
    }
  }

  const snapshot = await getAdminPaymentSnapshot();
  const safeWebhook = webhook
    ? snapshot.webhooks.find((item) => item.id === webhook.id) ?? null
    : null;
  const caseId = createCaseId();

  await prisma.adminAuditLog.create({
    data: {
      action: "PAYMENT_CASE_CREATED",
      actorFingerprint: session.sessionId,
      actorCustomerId: session.customer.id,
      orderId: order?.id ?? null,
      metadata: {
        caseId,
        type,
        status: "OPEN",
        title,
        reason,
        orderId: order?.publicId ?? null,
        webhookId: webhook?.id ?? null,
        requestedAmountInPaise: type === "REFUND_REVIEW" ? requestedAmountInPaise : null,
        currency: order?.currency ?? safeWebhook?.currency ?? null,
        provider: order?.paymentProvider ?? webhook?.provider ?? null,
        providerOrderId: order?.paymentSessionId ?? safeWebhook?.providerOrderId ?? null,
        providerPaymentId: safeWebhook?.providerPaymentId ?? null,
        moneyMovementExecuted: false,
      },
    },
  });

  const updatedSnapshot = await getAdminPaymentSnapshot();
  return Response.json(
    {
      ok: true,
      message: `${caseId} created without executing any provider action.`,
      paymentCase: updatedSnapshot.cases.find((item) => item.id === caseId) ?? null,
      snapshot: updatedSnapshot,
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const caseId = readString(body?.caseId, 80);
  const status = readString(body?.status, 40)?.toUpperCase() as PaymentCaseStatus | null;
  const note = readString(body?.note, 500);

  if (!caseId || !status || !CASE_STATUSES.has(status) || !note || note.length < 8) {
    return Response.json(
      { ok: false, message: "A valid case, target state, and note of at least 8 characters are required." },
      { status: 400 },
    );
  }

  const cases = await getAdminPaymentCaseLedger();
  const paymentCase = cases.find((item) => item.id === caseId);
  if (!paymentCase) {
    return Response.json({ ok: false, message: "Payment case not found." }, { status: 404 });
  }

  if (!TRANSITIONS[paymentCase.status].has(status)) {
    return Response.json(
      {
        ok: false,
        message: `The case cannot move from ${paymentCase.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`,
      },
      { status: 409 },
    );
  }

  await getPrisma().adminAuditLog.create({
    data: {
      action: "PAYMENT_CASE_UPDATED",
      actorFingerprint: session.sessionId,
      actorCustomerId: session.customer.id,
      orderId: paymentCase.orderDatabaseId,
      metadata: {
        caseId,
        previousStatus: paymentCase.status,
        status,
        note,
        moneyMovementExecuted: false,
      },
    },
  });

  const snapshot = await getAdminPaymentSnapshot();
  return Response.json({
    ok: true,
    message: `${caseId} moved to ${status.replaceAll("_", " ")}. No provider action was executed.`,
    paymentCase: snapshot.cases.find((item) => item.id === caseId) ?? null,
    snapshot,
  });
}
