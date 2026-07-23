import "server-only";

import { getPrisma } from "@/lib/prisma";

export type PaymentCaseType =
  | "RECONCILIATION"
  | "REFUND_REVIEW"
  | "DISPUTE"
  | "PAYMENT_FAILURE";

export type PaymentCaseStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "AWAITING_EVIDENCE"
  | "READY_FOR_APPROVAL"
  | "RESOLVED"
  | "DISMISSED";

export type PaymentProviderState =
  | "test-ready"
  | "partial"
  | "unconfigured"
  | "blocked-live";

export type AdminPaymentMetric = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "neutral" | "positive" | "warning" | "danger";
};

export type AdminPaymentOrder = {
  id: string;
  status: string;
  game: string;
  packageName: string;
  customerEmail: string;
  amountInPaise: number;
  currency: string;
  presentmentCurrency: string;
  presentmentAmountMinor: number | null;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paymentState: string;
  paymentEventCount: number;
  webhookCount: number;
  failedWebhookCount: number;
  fulfilmentCount: number;
  latestPaymentEvent: string | null;
  latestPaymentEventAt: string | null;
  createdAt: string;
  updatedAt: string;
  caseCount: number;
};

export type AdminPaymentWebhook = {
  id: string;
  provider: string;
  eventId: string | null;
  eventType: string;
  status: string;
  errorMessage: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paymentStatus: string | null;
  amountInPaise: number | null;
  currency: string | null;
  orderId: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export type PaymentCaseEvent = {
  action: "created" | "updated";
  status: PaymentCaseStatus;
  message: string;
  actorEmail: string | null;
  createdAt: string;
};

export type AdminPaymentCase = {
  id: string;
  type: PaymentCaseType;
  status: PaymentCaseStatus;
  title: string;
  reason: string;
  requestedAmountInPaise: number | null;
  currency: string | null;
  orderId: string | null;
  webhookId: string | null;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  events: PaymentCaseEvent[];
};

export type AdminPaymentSnapshot = {
  provider: {
    name: "Razorpay";
    state: PaymentProviderState;
    mode: "test" | "live-blocked" | "unconfigured";
    keyConfigured: boolean;
    secretConfigured: boolean;
    webhookConfigured: boolean;
    liveMoneyMovementEnabled: false;
  };
  metrics: AdminPaymentMetric[];
  orders: AdminPaymentOrder[];
  webhooks: AdminPaymentWebhook[];
  cases: AdminPaymentCase[];
  generatedAt: string;
};

type InternalPaymentCase = AdminPaymentCase & {
  orderDatabaseId: string | null;
};

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

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function readPaymentPayload(payload: unknown) {
  const root = asObject(payload);
  const payloadObject = asObject(root.payload);
  const payment = asObject(asObject(payloadObject.payment).entity);
  const order = asObject(asObject(payloadObject.order).entity);

  return {
    providerPaymentId: readString(payment.id),
    providerOrderId: readString(payment.order_id) ?? readString(order.id),
    paymentStatus: readString(payment.status) ?? readString(order.status),
    amountInPaise: readInteger(payment.amount) ?? readInteger(order.amount_paid),
    currency: readString(payment.currency) ?? readString(order.currency),
  };
}

function readMetadataString(metadata: unknown, key: string) {
  return readString(asObject(metadata)[key]);
}

function resolveProviderState(): AdminPaymentSnapshot["provider"] {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  const keyConfigured = keyId.length > 0;
  const secretConfigured = keySecret.length >= 16;
  const webhookConfigured = webhookSecret.length >= 16;

  if (keyId.startsWith("rzp_live_")) {
    return {
      name: "Razorpay",
      state: "blocked-live",
      mode: "live-blocked",
      keyConfigured,
      secretConfigured,
      webhookConfigured,
      liveMoneyMovementEnabled: false,
    };
  }

  if (keyId.startsWith("rzp_test_") && secretConfigured && webhookConfigured) {
    return {
      name: "Razorpay",
      state: "test-ready",
      mode: "test",
      keyConfigured,
      secretConfigured,
      webhookConfigured,
      liveMoneyMovementEnabled: false,
    };
  }

  const anyConfigured = keyConfigured || secretConfigured || webhookConfigured;
  return {
    name: "Razorpay",
    state: anyConfigured ? "partial" : "unconfigured",
    mode: "unconfigured",
    keyConfigured,
    secretConfigured,
    webhookConfigured,
    liveMoneyMovementEnabled: false,
  };
}

function resolvePaymentState(order: {
  status: string;
  paymentProvider: string | null;
  paymentSessionId: string | null;
}) {
  if (order.paymentProvider === "razorpay-test-creating") return "creating_session";
  if (!order.paymentSessionId) return "not_started";
  if (order.status === "PAYMENT_PENDING") return "awaiting_webhook";
  if (["PAID", "FULFILLING", "COMPLETED"].includes(order.status)) return "reconciled_paid";
  if (order.status === "FAILED") return "payment_failed";
  if (order.status === "CANCELLED") return "cancelled";
  if (order.status === "AWAITING_PAYMENT") return "awaiting_customer";
  return order.status.toLowerCase();
}

function serializeCase(paymentCase: InternalPaymentCase): AdminPaymentCase {
  return {
    id: paymentCase.id,
    type: paymentCase.type,
    status: paymentCase.status,
    title: paymentCase.title,
    reason: paymentCase.reason,
    requestedAmountInPaise: paymentCase.requestedAmountInPaise,
    currency: paymentCase.currency,
    orderId: paymentCase.orderId,
    webhookId: paymentCase.webhookId,
    provider: paymentCase.provider,
    providerOrderId: paymentCase.providerOrderId,
    providerPaymentId: paymentCase.providerPaymentId,
    createdByEmail: paymentCase.createdByEmail,
    createdAt: paymentCase.createdAt,
    updatedAt: paymentCase.updatedAt,
    events: paymentCase.events,
  };
}

export async function getAdminPaymentCaseLedger(): Promise<InternalPaymentCase[]> {
  const logs = await getPrisma().adminAuditLog.findMany({
    where: {
      action: { in: ["PAYMENT_CASE_CREATED", "PAYMENT_CASE_UPDATED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      action: true,
      metadata: true,
      createdAt: true,
      actorCustomer: { select: { email: true } },
      order: { select: { id: true, publicId: true } },
    },
  });

  const cases = new Map<string, InternalPaymentCase>();

  for (const log of [...logs].reverse()) {
    const metadata = asObject(log.metadata);
    const caseId = readString(metadata.caseId);
    if (!caseId) continue;

    if (log.action === "PAYMENT_CASE_CREATED") {
      const type = readString(metadata.type) as PaymentCaseType | null;
      const status = readString(metadata.status) as PaymentCaseStatus | null;
      if (!type || !CASE_TYPES.has(type) || !status || !CASE_STATUSES.has(status)) continue;

      const title = readString(metadata.title) ?? "Payment case";
      const reason = readString(metadata.reason) ?? "No case reason recorded.";
      cases.set(caseId, {
        id: caseId,
        type,
        status,
        title,
        reason,
        requestedAmountInPaise: readInteger(metadata.requestedAmountInPaise),
        currency: readString(metadata.currency),
        orderId: log.order?.publicId ?? readString(metadata.orderId),
        orderDatabaseId: log.order?.id ?? null,
        webhookId: readString(metadata.webhookId),
        provider: readString(metadata.provider),
        providerOrderId: readString(metadata.providerOrderId),
        providerPaymentId: readString(metadata.providerPaymentId),
        createdByEmail: log.actorCustomer?.email ?? null,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.createdAt.toISOString(),
        events: [
          {
            action: "created",
            status,
            message: reason,
            actorEmail: log.actorCustomer?.email ?? null,
            createdAt: log.createdAt.toISOString(),
          },
        ],
      });
      continue;
    }

    const paymentCase = cases.get(caseId);
    const status = readString(metadata.status) as PaymentCaseStatus | null;
    if (!paymentCase || !status || !CASE_STATUSES.has(status)) continue;
    const note = readString(metadata.note) ?? `Case moved to ${status}.`;
    paymentCase.status = status;
    paymentCase.updatedAt = log.createdAt.toISOString();
    paymentCase.events.push({
      action: "updated",
      status,
      message: note,
      actorEmail: log.actorCustomer?.email ?? null,
      createdAt: log.createdAt.toISOString(),
    });
  }

  return Array.from(cases.values()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function getAdminPaymentSnapshot(): Promise<AdminPaymentSnapshot> {
  const prisma = getPrisma();
  const [orders, webhooks, cases] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { paymentSessionId: { not: null } },
          { paymentProvider: { not: null } },
          { status: { in: ["PAYMENT_PENDING", "PAID", "FULFILLING", "COMPLETED", "FAILED"] } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        publicId: true,
        status: true,
        gameSlug: true,
        packageName: true,
        amountInPaise: true,
        currency: true,
        presentmentCurrency: true,
        presentmentAmountMinor: true,
        paymentProvider: true,
        paymentSessionId: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { email: true } },
        events: {
          where: {
            OR: [
              { type: { contains: "RAZORPAY" } },
              { type: { contains: "PAYMENT" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { type: true, metadata: true, createdAt: true },
        },
        webhooks: {
          orderBy: { receivedAt: "desc" },
          select: { status: true },
        },
        fulfilmentAttempts: { select: { id: true } },
      },
    }),
    prisma.paymentWebhook.findMany({
      orderBy: { receivedAt: "desc" },
      take: 250,
      select: {
        id: true,
        provider: true,
        eventId: true,
        eventType: true,
        payload: true,
        status: true,
        errorMessage: true,
        receivedAt: true,
        processedAt: true,
        order: { select: { publicId: true } },
      },
    }),
    getAdminPaymentCaseLedger(),
  ]);

  const casesByOrder = new Map<string, number>();
  for (const paymentCase of cases) {
    if (paymentCase.orderId) {
      casesByOrder.set(paymentCase.orderId, (casesByOrder.get(paymentCase.orderId) ?? 0) + 1);
    }
  }

  const serializedOrders: AdminPaymentOrder[] = orders.map((order) => {
    const latestEvent = order.events[0] ?? null;
    const providerPaymentId =
      order.events
        .map((event) => readMetadataString(event.metadata, "paymentId"))
        .find(Boolean) ?? null;

    return {
      id: order.publicId,
      status: order.status,
      game: order.gameSlug,
      packageName: order.packageName,
      customerEmail: order.customer.email,
      amountInPaise: order.amountInPaise,
      currency: order.currency,
      presentmentCurrency: order.presentmentCurrency,
      presentmentAmountMinor: order.presentmentAmountMinor,
      provider: order.paymentProvider,
      providerOrderId: order.paymentSessionId,
      providerPaymentId,
      paymentState: resolvePaymentState(order),
      paymentEventCount: order.events.length,
      webhookCount: order.webhooks.length,
      failedWebhookCount: order.webhooks.filter((webhook) => webhook.status === "FAILED").length,
      fulfilmentCount: order.fulfilmentAttempts.length,
      latestPaymentEvent: latestEvent?.type ?? null,
      latestPaymentEventAt: latestEvent?.createdAt.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      caseCount: casesByOrder.get(order.publicId) ?? 0,
    };
  });

  const serializedWebhooks: AdminPaymentWebhook[] = webhooks.map((webhook) => {
    const payload = readPaymentPayload(webhook.payload);
    return {
      id: webhook.id,
      provider: webhook.provider,
      eventId: webhook.eventId,
      eventType: webhook.eventType,
      status: webhook.status,
      errorMessage: webhook.errorMessage,
      providerOrderId: payload.providerOrderId,
      providerPaymentId: payload.providerPaymentId,
      paymentStatus: payload.paymentStatus,
      amountInPaise: payload.amountInPaise,
      currency: payload.currency,
      orderId: webhook.order?.publicId ?? null,
      receivedAt: webhook.receivedAt.toISOString(),
      processedAt: webhook.processedAt?.toISOString() ?? null,
    };
  });

  const paidOrders = serializedOrders.filter((order) =>
    ["PAID", "FULFILLING", "COMPLETED"].includes(order.status),
  );
  const capturedValue = paidOrders.reduce((sum, order) => sum + order.amountInPaise, 0);
  const failedWebhookCount = serializedWebhooks.filter(
    (webhook) => webhook.status === "FAILED",
  ).length;
  const awaitingWebhookCount = serializedOrders.filter(
    (order) => order.paymentState === "awaiting_webhook",
  ).length;
  const openCases = cases.filter(
    (paymentCase) => !["RESOLVED", "DISMISSED"].includes(paymentCase.status),
  );
  const refundExposure = openCases
    .filter((paymentCase) => paymentCase.type === "REFUND_REVIEW")
    .reduce((sum, paymentCase) => sum + (paymentCase.requestedAmountInPaise ?? 0), 0);
  const provider = resolveProviderState();

  const formatInr = (amountInPaise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amountInPaise / 100);

  return {
    provider,
    metrics: [
      {
        id: "captured-value",
        label: "Reconciled value",
        value: formatInr(capturedValue),
        note: `${paidOrders.length} paid, fulfilling, or completed order(s)`,
        tone: "positive",
      },
      {
        id: "awaiting-webhook",
        label: "Awaiting webhook",
        value: String(awaitingWebhookCount),
        note: "Checkout verified but durable payment receipt not yet processed",
        tone: awaitingWebhookCount ? "warning" : "neutral",
      },
      {
        id: "failed-webhooks",
        label: "Failed webhooks",
        value: String(failedWebhookCount),
        note: "Stored receipts requiring reconciliation review",
        tone: failedWebhookCount ? "danger" : "positive",
      },
      {
        id: "open-cases",
        label: "Open payment cases",
        value: String(openCases.length),
        note: "Reconciliation, refund-review, dispute, and failure cases",
        tone: openCases.length ? "warning" : "neutral",
      },
      {
        id: "refund-exposure",
        label: "Refund review exposure",
        value: formatInr(refundExposure),
        note: "Prepared for review only; no provider refunds are executed",
        tone: refundExposure ? "warning" : "neutral",
      },
    ],
    orders: serializedOrders,
    webhooks: serializedWebhooks,
    cases: cases.map(serializeCase),
    generatedAt: new Date().toISOString(),
  };
}
