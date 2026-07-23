import "server-only";

import type {
  AdminAlert,
  AdminControlSnapshot,
  AdminDataset,
  AdminTableValue,
} from "@/lib/admin-control-types";
import { getPrisma } from "@/lib/prisma";

const DATASET_LIMIT = 75;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asRow(values: Record<string, AdminTableValue>) {
  return values;
}

function formatInr(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100);
}

export async function getAdminControlSnapshot(): Promise<AdminControlSnapshot> {
  const prisma = getPrisma();
  const now = new Date();

  const [
    orderTotal,
    customerTotal,
    productTotal,
    paymentTotal,
    fulfilmentTotal,
    sessionTotal,
    auditTotal,
    syncTotal,
    awaitingReview,
    publishedProducts,
    failedFulfilments,
    failedWebhooks,
    activeSessions,
    revenue,
    orders,
    customers,
    products,
    payments,
    fulfilments,
    sessions,
    auditLogs,
    supplierSyncRuns,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.customer.count(),
    prisma.supplierProduct.count(),
    prisma.paymentWebhook.count(),
    prisma.fulfilmentAttempt.count(),
    prisma.authSession.count(),
    prisma.adminAuditLog.count(),
    prisma.supplierSyncRun.count(),
    prisma.order.count({
      where: {
        status: { in: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_PENDING"] },
      },
    }),
    prisma.supplierProduct.count({ where: { published: true, available: true } }),
    prisma.fulfilmentAttempt.count({ where: { status: "FAILED" } }),
    prisma.paymentWebhook.count({ where: { status: "FAILED" } }),
    prisma.authSession.count({
      where: { revokedAt: null, expiresAt: { gt: now } },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLING", "COMPLETED"] } },
      _sum: { amountInPaise: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        publicId: true,
        status: true,
        gameSlug: true,
        marketCode: true,
        packageName: true,
        amountInPaise: true,
        currency: true,
        presentmentCurrency: true,
        presentmentAmountMinor: true,
        playerId: true,
        zoneId: true,
        verifiedNickname: true,
        paymentProvider: true,
        customer: { select: { email: true } },
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        role: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { orders: true, sessions: true } },
      },
    }),
    prisma.supplierProduct.findMany({
      orderBy: { syncedAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        provider: true,
        gameSlug: true,
        name: true,
        region: true,
        retailPriceInPaise: true,
        expectedMarginInPaise: true,
        expectedMarginBps: true,
        published: true,
        available: true,
        syncedAt: true,
      },
    }),
    prisma.paymentWebhook.findMany({
      orderBy: { receivedAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        provider: true,
        eventId: true,
        eventType: true,
        status: true,
        errorMessage: true,
        receivedAt: true,
        processedAt: true,
        order: { select: { publicId: true } },
      },
    }),
    prisma.fulfilmentAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        provider: true,
        mode: true,
        status: true,
        providerOrderId: true,
        errorMessage: true,
        submittedAt: true,
        completedAt: true,
        createdAt: true,
        order: { select: { publicId: true } },
      },
    }),
    prisma.authSession.findMany({
      orderBy: { createdAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        customer: { select: { email: true, role: true } },
      },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        action: true,
        actorFingerprint: true,
        createdAt: true,
        actorCustomer: { select: { email: true, role: true } },
        order: { select: { publicId: true } },
      },
    }),
    prisma.supplierSyncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: DATASET_LIMIT,
      select: {
        id: true,
        provider: true,
        status: true,
        categoriesSynced: true,
        offersSynced: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
      },
    }),
  ]);

  const datasets: AdminDataset[] = [
    {
      id: "orders",
      label: "Orders",
      description: "Customer-owned orders, pricing snapshots, game identities, and payment state.",
      total: orderTotal,
      columns: [
        { key: "id", label: "Order", format: "code" },
        { key: "status", label: "Status", format: "status" },
        { key: "game", label: "Game" },
        { key: "market", label: "Market" },
        { key: "package", label: "Package" },
        { key: "amount", label: "Settlement", format: "money" },
        { key: "customer", label: "Customer" },
        { key: "player", label: "Player", format: "code" },
        { key: "payment", label: "Payment" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: orders.map((order) =>
        asRow({
          id: order.publicId,
          status: order.status,
          game: order.gameSlug,
          market: order.marketCode,
          package: order.packageName,
          amount: order.amountInPaise,
          customer: order.customer.email,
          player: order.verifiedNickname ?? `${order.playerId}${order.zoneId ? ` (${order.zoneId})` : ""}`,
          payment: order.paymentProvider,
          created: iso(order.createdAt),
        }),
      ),
    },
    {
      id: "customers",
      label: "Customers",
      description: "Verified identities, access roles, login activity, and owned records.",
      total: customerTotal,
      columns: [
        { key: "id", label: "Customer ID", format: "code" },
        { key: "email", label: "Email" },
        { key: "name", label: "Display name" },
        { key: "username", label: "Username" },
        { key: "role", label: "Role", format: "status" },
        { key: "verified", label: "Verified", format: "date" },
        { key: "lastLogin", label: "Last login", format: "date" },
        { key: "orders", label: "Orders" },
        { key: "sessions", label: "Sessions" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: customers.map((customer) =>
        asRow({
          id: customer.id,
          email: customer.email,
          name: customer.displayName,
          username: customer.username,
          role: customer.role,
          verified: iso(customer.emailVerifiedAt),
          lastLogin: iso(customer.lastLoginAt),
          orders: customer._count.orders,
          sessions: customer._count.sessions,
          created: iso(customer.createdAt),
        }),
      ),
    },
    {
      id: "products",
      label: "Products",
      description: "Supplier products, storefront publication, availability, price, and margin snapshots.",
      total: productTotal,
      columns: [
        { key: "id", label: "Product ID", format: "code" },
        { key: "provider", label: "Provider" },
        { key: "game", label: "Game" },
        { key: "name", label: "Product" },
        { key: "region", label: "Region" },
        { key: "price", label: "Retail price", format: "money" },
        { key: "margin", label: "Margin", format: "money" },
        { key: "marginBps", label: "Margin BPS" },
        { key: "published", label: "Published", format: "boolean" },
        { key: "available", label: "Available", format: "boolean" },
        { key: "synced", label: "Synced", format: "date" },
      ],
      rows: products.map((product) =>
        asRow({
          id: product.id,
          provider: product.provider,
          game: product.gameSlug,
          name: product.name,
          region: product.region,
          price: product.retailPriceInPaise,
          margin: product.expectedMarginInPaise,
          marginBps: product.expectedMarginBps,
          published: product.published,
          available: product.available,
          synced: iso(product.syncedAt),
        }),
      ),
    },
    {
      id: "payments",
      label: "Payment events",
      description: "Stored webhook events, reconciliation state, failures, and linked orders.",
      total: paymentTotal,
      columns: [
        { key: "id", label: "Webhook ID", format: "code" },
        { key: "provider", label: "Provider" },
        { key: "event", label: "Event" },
        { key: "eventId", label: "Provider event", format: "code" },
        { key: "status", label: "Status", format: "status" },
        { key: "order", label: "Order", format: "code" },
        { key: "error", label: "Error" },
        { key: "received", label: "Received", format: "date" },
        { key: "processed", label: "Processed", format: "date" },
      ],
      rows: payments.map((payment) =>
        asRow({
          id: payment.id,
          provider: payment.provider,
          event: payment.eventType,
          eventId: payment.eventId,
          status: payment.status,
          order: payment.order?.publicId ?? null,
          error: payment.errorMessage,
          received: iso(payment.receivedAt),
          processed: iso(payment.processedAt),
        }),
      ),
    },
    {
      id: "fulfilment",
      label: "Fulfilment",
      description: "Dry-run and supplier-write attempts with provider state and recovery evidence.",
      total: fulfilmentTotal,
      columns: [
        { key: "id", label: "Attempt ID", format: "code" },
        { key: "order", label: "Order", format: "code" },
        { key: "provider", label: "Provider" },
        { key: "mode", label: "Mode", format: "status" },
        { key: "status", label: "Status", format: "status" },
        { key: "providerOrder", label: "Provider order", format: "code" },
        { key: "error", label: "Error" },
        { key: "submitted", label: "Submitted", format: "date" },
        { key: "completed", label: "Completed", format: "date" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: fulfilments.map((attempt) =>
        asRow({
          id: attempt.id,
          order: attempt.order.publicId,
          provider: attempt.provider,
          mode: attempt.mode,
          status: attempt.status,
          providerOrder: attempt.providerOrderId,
          error: attempt.errorMessage,
          submitted: iso(attempt.submittedAt),
          completed: iso(attempt.completedAt),
          created: iso(attempt.createdAt),
        }),
      ),
    },
    {
      id: "sessions",
      label: "Sessions",
      description: "Active, expired, and revoked customer or staff access sessions.",
      total: sessionTotal,
      columns: [
        { key: "id", label: "Session ID", format: "code" },
        { key: "customer", label: "Customer" },
        { key: "role", label: "Role", format: "status" },
        { key: "state", label: "State", format: "status" },
        { key: "lastUsed", label: "Last used", format: "date" },
        { key: "expires", label: "Expires", format: "date" },
        { key: "revoked", label: "Revoked", format: "date" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: sessions.map((session) =>
        asRow({
          id: session.id,
          customer: session.customer.email,
          role: session.customer.role,
          state: session.revokedAt
            ? "REVOKED"
            : session.expiresAt <= now
              ? "EXPIRED"
              : "ACTIVE",
          lastUsed: iso(session.lastUsedAt),
          expires: iso(session.expiresAt),
          revoked: iso(session.revokedAt),
          created: iso(session.createdAt),
        }),
      ),
    },
    {
      id: "audit",
      label: "Audit logs",
      description: "Administrator actions, actor evidence, affected orders, and timestamps.",
      total: auditTotal,
      columns: [
        { key: "id", label: "Audit ID", format: "code" },
        { key: "action", label: "Action" },
        { key: "actor", label: "Actor" },
        { key: "role", label: "Role", format: "status" },
        { key: "fingerprint", label: "Fingerprint", format: "code" },
        { key: "order", label: "Order", format: "code" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: auditLogs.map((log) =>
        asRow({
          id: log.id,
          action: log.action,
          actor: log.actorCustomer?.email ?? "Emergency operator",
          role: log.actorCustomer?.role ?? "TOKEN",
          fingerprint: log.actorFingerprint,
          order: log.order?.publicId ?? null,
          created: iso(log.createdAt),
        }),
      ),
    },
    {
      id: "supplier-sync",
      label: "Supplier sync",
      description: "Supplier catalogue synchronization history and imported record counts.",
      total: syncTotal,
      columns: [
        { key: "id", label: "Sync ID", format: "code" },
        { key: "provider", label: "Provider" },
        { key: "status", label: "Status", format: "status" },
        { key: "categories", label: "Categories" },
        { key: "offers", label: "Offers" },
        { key: "error", label: "Error" },
        { key: "started", label: "Started", format: "date" },
        { key: "completed", label: "Completed", format: "date" },
      ],
      rows: supplierSyncRuns.map((run) =>
        asRow({
          id: run.id,
          provider: run.provider,
          status: run.status,
          categories: run.categoriesSynced,
          offers: run.offersSynced,
          error: run.errorMessage,
          started: iso(run.startedAt),
          completed: iso(run.completedAt),
        }),
      ),
    },
  ];

  const alerts: AdminAlert[] = [
    ...(failedFulfilments > 0
      ? [
          {
            id: "failed-fulfilments",
            title: `${failedFulfilments} failed fulfilment attempt${failedFulfilments === 1 ? "" : "s"}`,
            detail: "Review the fulfilment database and operator queue before retrying anything.",
            severity: "critical" as const,
            href: "#orders",
          },
        ]
      : []),
    ...(failedWebhooks > 0
      ? [
          {
            id: "failed-webhooks",
            title: `${failedWebhooks} failed payment webhook${failedWebhooks === 1 ? "" : "s"}`,
            detail: "Payment reconciliation requires investigation. Do not change order state manually without evidence.",
            severity: "critical" as const,
            href: "#database",
          },
        ]
      : []),
    ...(awaitingReview > 0
      ? [
          {
            id: "awaiting-review",
            title: `${awaitingReview} order${awaitingReview === 1 ? "" : "s"} awaiting review`,
            detail: "These orders are created or waiting for payment confirmation.",
            severity: "warning" as const,
            href: "#orders",
          },
        ]
      : []),
    ...(publishedProducts === 0
      ? [
          {
            id: "empty-storefront",
            title: "No published supplier products",
            detail: "The storefront will rely on protected fallback catalogue entries.",
            severity: "warning" as const,
            href: "#catalogue",
          },
        ]
      : []),
    {
      id: "supplier-write-lock",
      title: "Supplier writes remain locked",
      detail: "The control center is private and supplier fulfilment stays dry-run until the exact contract is approved.",
      severity: "info",
      href: "#suppliers",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      {
        id: "revenue",
        label: "Captured order value",
        value: formatInr(revenue._sum.amountInPaise ?? 0),
        note: "Paid, fulfilling, and completed orders",
        tone: "positive",
      },
      {
        id: "orders",
        label: "Total orders",
        value: String(orderTotal),
        note: `${awaitingReview} currently need attention`,
        tone: awaitingReview > 0 ? "warning" : "neutral",
      },
      {
        id: "customers",
        label: "Customer records",
        value: String(customerTotal),
        note: `${activeSessions} active session${activeSessions === 1 ? "" : "s"}`,
        tone: "neutral",
      },
      {
        id: "products",
        label: "Published products",
        value: String(publishedProducts),
        note: `${productTotal} supplier product records`,
        tone: publishedProducts > 0 ? "positive" : "warning",
      },
      {
        id: "payments",
        label: "Payment events",
        value: String(paymentTotal),
        note: `${failedWebhooks} failed reconciliation event${failedWebhooks === 1 ? "" : "s"}`,
        tone: failedWebhooks > 0 ? "danger" : "neutral",
      },
      {
        id: "fulfilment",
        label: "Fulfilment attempts",
        value: String(fulfilmentTotal),
        note: `${failedFulfilments} failed attempt${failedFulfilments === 1 ? "" : "s"}`,
        tone: failedFulfilments > 0 ? "danger" : "neutral",
      },
      {
        id: "security",
        label: "Stored sessions",
        value: String(sessionTotal),
        note: `${activeSessions} active now`,
        tone: "neutral",
      },
      {
        id: "audit",
        label: "Audit records",
        value: String(auditTotal),
        note: `${syncTotal} supplier sync run${syncTotal === 1 ? "" : "s"}`,
        tone: "neutral",
      },
    ],
    alerts,
    datasets,
  };
}
