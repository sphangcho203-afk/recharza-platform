"use client";

import { useMemo, useState } from "react";

import type {
  AdminPaymentCase,
  AdminPaymentOrder,
  AdminPaymentSnapshot,
  AdminPaymentWebhook,
  PaymentCaseStatus,
  PaymentCaseType,
} from "@/lib/admin-payments";

type View = "orders" | "webhooks" | "cases" | "attention";
type Selection =
  | { kind: "order"; id: string }
  | { kind: "webhook"; id: string }
  | { kind: "case"; id: string }
  | null;

const CASE_TYPES: Array<{ value: PaymentCaseType; label: string; note: string }> = [
  {
    value: "RECONCILIATION",
    label: "Reconciliation",
    note: "Investigate a mismatch between Checkout, webhook, order, and fulfilment state.",
  },
  {
    value: "REFUND_REVIEW",
    label: "Refund review",
    note: "Prepare evidence and an amount for approval without moving money.",
  },
  {
    value: "DISPUTE",
    label: "Dispute",
    note: "Track provider or customer dispute evidence and response readiness.",
  },
  {
    value: "PAYMENT_FAILURE",
    label: "Payment failure",
    note: "Record a failed Checkout, failed receipt, or recoverability problem.",
  },
];

const CASE_TRANSITIONS: Record<PaymentCaseStatus, PaymentCaseStatus[]> = {
  OPEN: ["INVESTIGATING", "AWAITING_EVIDENCE", "DISMISSED"],
  INVESTIGATING: ["AWAITING_EVIDENCE", "READY_FOR_APPROVAL", "RESOLVED", "DISMISSED"],
  AWAITING_EVIDENCE: ["INVESTIGATING", "READY_FOR_APPROVAL", "DISMISSED"],
  READY_FOR_APPROVAL: ["INVESTIGATING", "RESOLVED", "DISMISSED"],
  RESOLVED: [],
  DISMISSED: [],
};

function formatMoney(amountInPaise: number | null, currency = "INR") {
  if (amountInPaise === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function stateTone(value: string) {
  const normalized = value.toUpperCase();
  if (["PROCESSED", "PAID", "COMPLETED", "RESOLVED", "RECONCILED_PAID"].includes(normalized)) {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }
  if (["FAILED", "DISMISSED", "PAYMENT_FAILED"].includes(normalized)) {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }
  if (["OPEN", "INVESTIGATING", "AWAITING_WEBHOOK", "AWAITING_EVIDENCE", "READY_FOR_APPROVAL"].includes(normalized)) {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-white/10 bg-white/5 text-slate-300";
}

function metricTone(tone: "neutral" | "positive" | "warning" | "danger") {
  if (tone === "positive") return "border-emerald-300/20 bg-emerald-300/[0.055]";
  if (tone === "warning") return "border-amber-300/20 bg-amber-300/[0.055]";
  if (tone === "danger") return "border-rose-300/20 bg-rose-300/[0.055]";
  return "border-white/10 bg-white/[0.025]";
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadRows(name: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const content = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recharza-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminPaymentConsole({
  initialSnapshot,
}: {
  initialSnapshot: AdminPaymentSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [view, setView] = useState<View>("attention");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [caseType, setCaseType] = useState<PaymentCaseType>("RECONCILIATION");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseReason, setCaseReason] = useState("");
  const [refundRupees, setRefundRupees] = useState("");
  const [targetStatus, setTargetStatus] = useState<PaymentCaseStatus>("INVESTIGATING");
  const [caseNote, setCaseNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Payment records are loaded from protected orders, signed webhook receipts, and the append-only case ledger.",
  );
  const [isError, setIsError] = useState(false);

  const selectedOrder =
    selection?.kind === "order"
      ? snapshot.orders.find((order) => order.id === selection.id) ?? null
      : null;
  const selectedWebhook =
    selection?.kind === "webhook"
      ? snapshot.webhooks.find((webhook) => webhook.id === selection.id) ?? null
      : null;
  const selectedCase =
    selection?.kind === "case"
      ? snapshot.cases.find((paymentCase) => paymentCase.id === selection.id) ?? null
      : null;

  const attentionItems = useMemo(() => {
    const orderItems = snapshot.orders
      .filter(
        (order) =>
          order.paymentState === "awaiting_webhook" ||
          order.paymentState === "payment_failed" ||
          order.failedWebhookCount > 0,
      )
      .map((order) => ({
        kind: "order" as const,
        id: order.id,
        label: order.id,
        title: order.packageName,
        state: order.paymentState,
        note: `${order.failedWebhookCount} failed receipt(s) · ${order.caseCount} case(s)`,
        updatedAt: order.updatedAt,
      }));
    const webhookItems = snapshot.webhooks
      .filter((webhook) => webhook.status === "FAILED" || (webhook.status === "IGNORED" && webhook.errorMessage))
      .map((webhook) => ({
        kind: "webhook" as const,
        id: webhook.id,
        label: webhook.eventId ?? webhook.id,
        title: webhook.eventType,
        state: webhook.status,
        note: webhook.errorMessage ?? "Receipt requires review.",
        updatedAt: webhook.receivedAt,
      }));
    return [...orderItems, ...webhookItems].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }, [snapshot.orders, snapshot.webhooks]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrders = useMemo(
    () =>
      snapshot.orders.filter((order) =>
        [
          order.id,
          order.status,
          order.paymentState,
          order.game,
          order.packageName,
          order.customerEmail,
          order.provider,
          order.providerOrderId,
          order.providerPaymentId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [snapshot.orders, normalizedQuery],
  );
  const visibleWebhooks = useMemo(
    () =>
      snapshot.webhooks.filter((webhook) =>
        [
          webhook.id,
          webhook.eventId,
          webhook.eventType,
          webhook.status,
          webhook.errorMessage,
          webhook.providerOrderId,
          webhook.providerPaymentId,
          webhook.orderId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [snapshot.webhooks, normalizedQuery],
  );
  const visibleCases = useMemo(
    () =>
      snapshot.cases.filter((paymentCase) =>
        [
          paymentCase.id,
          paymentCase.type,
          paymentCase.status,
          paymentCase.title,
          paymentCase.reason,
          paymentCase.orderId,
          paymentCase.webhookId,
          paymentCase.providerOrderId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [snapshot.cases, normalizedQuery],
  );
  const visibleAttention = useMemo(
    () =>
      attentionItems.filter((item) =>
        [item.label, item.title, item.state, item.note]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [attentionItems, normalizedQuery],
  );

  const selectedEvidence = selectedOrder ?? selectedWebhook ?? selectedCase;
  const selectedCaseTransitions = selectedCase ? CASE_TRANSITIONS[selectedCase.status] : [];

  function chooseOrder(order: AdminPaymentOrder) {
    setSelection({ kind: "order", id: order.id });
    setCaseType(
      order.paymentState === "payment_failed" ? "PAYMENT_FAILURE" : "RECONCILIATION",
    );
    setCaseTitle(`Review payment state for ${order.id}`);
    setCaseReason("");
    setRefundRupees("");
  }

  function chooseWebhook(webhook: AdminPaymentWebhook) {
    setSelection({ kind: "webhook", id: webhook.id });
    setCaseType(webhook.status === "FAILED" ? "PAYMENT_FAILURE" : "RECONCILIATION");
    setCaseTitle(`Review ${webhook.eventType} receipt`);
    setCaseReason(webhook.errorMessage ?? "");
    setRefundRupees("");
  }

  function chooseCase(paymentCase: AdminPaymentCase) {
    setSelection({ kind: "case", id: paymentCase.id });
    setTargetStatus(CASE_TRANSITIONS[paymentCase.status][0] ?? paymentCase.status);
    setCaseNote("");
  }

  async function refresh() {
    setLoading(true);
    setIsError(false);
    setMessage("Refreshing payment records and case ledger...");
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        snapshot?: AdminPaymentSnapshot;
      };
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Payment records could not be refreshed.");
      }
      setSnapshot(result.snapshot);
      setMessage(`Payment command center refreshed at ${formatDate(result.snapshot.generatedAt)}.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Payment refresh failed.");
    } finally {
      setLoading(false);
    }
  }

  async function createCase() {
    if (!selectedOrder && !selectedWebhook) {
      setIsError(true);
      setMessage("Select an order or webhook receipt before creating a case.");
      return;
    }
    const requestedAmountInPaise = Math.round(Number(refundRupees) * 100);
    if (caseType === "REFUND_REVIEW" && (!Number.isSafeInteger(requestedAmountInPaise) || requestedAmountInPaise <= 0)) {
      setIsError(true);
      setMessage("Enter a positive refund-review amount.");
      return;
    }

    setLoading(true);
    setIsError(false);
    setMessage("Creating append-only payment case...");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: caseType,
          title: caseTitle,
          reason: caseReason,
          orderId: selectedOrder?.id ?? selectedWebhook?.orderId ?? null,
          webhookId: selectedWebhook?.id ?? null,
          requestedAmountInPaise:
            caseType === "REFUND_REVIEW" ? requestedAmountInPaise : null,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        snapshot?: AdminPaymentSnapshot;
        paymentCase?: AdminPaymentCase | null;
      };
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Payment case creation failed.");
      }
      setSnapshot(result.snapshot);
      if (result.paymentCase) {
        setSelection({ kind: "case", id: result.paymentCase.id });
        setView("cases");
        setTargetStatus(CASE_TRANSITIONS[result.paymentCase.status][0] ?? result.paymentCase.status);
      }
      setCaseReason("");
      setRefundRupees("");
      setMessage(result.message ?? "Payment case created.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Payment case creation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateCase() {
    if (!selectedCase) return;
    setLoading(true);
    setIsError(false);
    setMessage(`Updating ${selectedCase.id}...`);
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          status: targetStatus,
          note: caseNote,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        snapshot?: AdminPaymentSnapshot;
        paymentCase?: AdminPaymentCase | null;
      };
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Payment case update failed.");
      }
      setSnapshot(result.snapshot);
      setCaseNote("");
      if (result.paymentCase) {
        setSelection({ kind: "case", id: result.paymentCase.id });
        setTargetStatus(CASE_TRANSITIONS[result.paymentCase.status][0] ?? result.paymentCase.status);
      }
      setMessage(result.message ?? "Payment case updated.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Payment case update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyEvidence() {
    if (!selectedEvidence) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedEvidence, null, 2));
    setMessage("Selected payment evidence copied as JSON.");
    setIsError(false);
  }

  function exportCurrentView() {
    if (view === "orders") downloadRows("payment-orders", visibleOrders);
    if (view === "webhooks") downloadRows("payment-webhooks", visibleWebhooks);
    if (view === "cases") downloadRows("payment-cases", visibleCases);
    if (view === "attention") downloadRows("payment-attention", visibleAttention);
  }

  return (
    <section id="payments" className="mt-10 scroll-mt-24">
      <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))]">
        <div className="border-b border-white/10 p-5 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Payment evidence, reconciliation, refund review, and disputes
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                Payment Command Center
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                Inspect every stored Checkout session and signed webhook receipt, open append-only payment cases, prepare refund evidence, and track disputes without granting this screen authority to move money.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {loading ? "Working..." : "Refresh ledger"}
              </button>
              <button
                type="button"
                onClick={exportCurrentView}
                className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10"
              >
                Export current view
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {snapshot.metrics.map((metric) => (
              <article key={metric.id} className={`rounded-xl border p-4 ${metricTone(metric.tone)}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{metric.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-b border-white/10 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center sm:p-7">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["attention", `Attention ${attentionItems.length}`],
              ["orders", `Sessions ${snapshot.orders.length}`],
              ["webhooks", `Webhooks ${snapshot.webhooks.length}`],
              ["cases", `Cases ${snapshot.cases.length}`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setView(value as View);
                  setSelection(null);
                }}
                className={`min-h-11 rounded-xl border px-3 text-sm font-black transition ${
                  view === value
                    ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                    : "border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders, provider IDs, events, cases..."
            className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40 lg:w-[24rem]"
          />
        </div>

        <p
          aria-live="polite"
          className={`mx-5 mt-5 rounded-xl border px-4 py-3 text-sm sm:mx-7 ${
            isError
              ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
              : "border-white/10 bg-black/20 text-slate-400"
          }`}
        >
          {message}
        </p>

        <div className="grid min-w-0 gap-5 p-5 2xl:grid-cols-[minmax(24rem,0.9fr)_minmax(0,1.1fr)] sm:p-7">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/15">
            <div className="max-h-[50rem] overflow-y-auto p-2">
              {view === "orders"
                ? visibleOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => chooseOrder(order)}
                      className={`mb-2 grid w-full gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                        selection?.kind === "order" && selection.id === order.id
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-black text-cyan-200">{order.id}</span>
                        <span className="mt-1 block truncate text-sm font-black text-white">{order.packageName}</span>
                        <span className="mt-2 block text-xs text-slate-500">
                          {formatMoney(order.amountInPaise, order.currency)} · {order.customerEmail}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-600">
                          {order.webhookCount} webhook(s) · {order.caseCount} case(s) · updated {formatDate(order.updatedAt)}
                        </span>
                      </span>
                      <span className={`h-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${stateTone(order.paymentState)}`}>
                        {order.paymentState.replaceAll("_", " ")}
                      </span>
                    </button>
                  ))
                : null}

              {view === "webhooks"
                ? visibleWebhooks.map((webhook) => (
                    <button
                      key={webhook.id}
                      type="button"
                      onClick={() => chooseWebhook(webhook)}
                      className={`mb-2 grid w-full gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                        selection?.kind === "webhook" && selection.id === webhook.id
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-white">{webhook.eventType}</span>
                        <span className="mt-1 block font-mono text-[10px] text-cyan-200">{webhook.eventId ?? webhook.id}</span>
                        <span className="mt-2 block text-xs text-slate-500">
                          {webhook.orderId ?? "Unmatched order"} · {formatDate(webhook.receivedAt)}
                        </span>
                        {webhook.errorMessage ? (
                          <span className="mt-1 block line-clamp-2 text-[10px] text-rose-300/80">{webhook.errorMessage}</span>
                        ) : null}
                      </span>
                      <span className={`h-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${stateTone(webhook.status)}`}>
                        {webhook.status}
                      </span>
                    </button>
                  ))
                : null}

              {view === "cases"
                ? visibleCases.map((paymentCase) => (
                    <button
                      key={paymentCase.id}
                      type="button"
                      onClick={() => chooseCase(paymentCase)}
                      className={`mb-2 grid w-full gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                        selection?.kind === "case" && selection.id === paymentCase.id
                          ? "border-violet-300/35 bg-violet-300/10"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-black text-violet-200">{paymentCase.id}</span>
                        <span className="mt-1 block truncate text-sm font-black text-white">{paymentCase.title}</span>
                        <span className="mt-2 block text-xs text-slate-500">
                          {paymentCase.type.replaceAll("_", " ")} · {paymentCase.orderId ?? "No order"}
                        </span>
                        <span className="mt-1 block text-[10px] text-slate-600">Updated {formatDate(paymentCase.updatedAt)}</span>
                      </span>
                      <span className={`h-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${stateTone(paymentCase.status)}`}>
                        {paymentCase.status.replaceAll("_", " ")}
                      </span>
                    </button>
                  ))
                : null}

              {view === "attention"
                ? visibleAttention.map((item) => (
                    <button
                      key={`${item.kind}:${item.id}`}
                      type="button"
                      onClick={() => {
                        if (item.kind === "order") {
                          const order = snapshot.orders.find((entry) => entry.id === item.id);
                          if (order) chooseOrder(order);
                        } else {
                          const webhook = snapshot.webhooks.find((entry) => entry.id === item.id);
                          if (webhook) chooseWebhook(webhook);
                        }
                      }}
                      className={`mb-2 grid w-full gap-3 rounded-xl border p-4 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                        selection?.kind === item.kind && selection.id === item.id
                          ? "border-amber-300/35 bg-amber-300/10"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-xs font-black text-amber-100">{item.label}</span>
                        <span className="mt-1 block truncate text-sm font-black text-white">{item.title}</span>
                        <span className="mt-2 block line-clamp-2 text-xs text-slate-500">{item.note}</span>
                      </span>
                      <span className={`h-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${stateTone(item.state)}`}>
                        {item.state.replaceAll("_", " ")}
                      </span>
                    </button>
                  ))
                : null}

              {((view === "orders" && !visibleOrders.length) ||
                (view === "webhooks" && !visibleWebhooks.length) ||
                (view === "cases" && !visibleCases.length) ||
                (view === "attention" && !visibleAttention.length)) ? (
                <p className="p-10 text-center text-sm text-slate-500">No payment records matched this view.</p>
              ) : null}
            </div>
          </article>

          <article className="min-w-0 rounded-2xl border border-white/10 bg-black/15 p-5 sm:p-6">
            {!selectedEvidence ? (
              <div className="grid min-h-[30rem] place-items-center text-center">
                <div>
                  <p className="text-lg font-black text-white">Select payment evidence</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Choose an order, webhook receipt, or payment case to inspect identifiers, create a case, export evidence, or advance an existing investigation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      {selection?.kind} evidence
                    </p>
                    <h3 className="mt-2 truncate text-xl font-black text-white">
                      {selectedOrder?.id ?? selectedWebhook?.eventType ?? selectedCase?.id}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Stored evidence only. Provider secrets and raw customer credentials are never exposed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyEvidence()}
                    className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white hover:bg-white/10"
                  >
                    Copy evidence JSON
                  </button>
                </div>

                {selectedOrder ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-slate-500">Order state</dt><dd className="mt-1 font-black text-white">{selectedOrder.status}</dd></div>
                    <div><dt className="text-slate-500">Payment state</dt><dd className="mt-1 font-black text-white">{selectedOrder.paymentState.replaceAll("_", " ")}</dd></div>
                    <div><dt className="text-slate-500">Settlement</dt><dd className="mt-1 font-black text-white">{formatMoney(selectedOrder.amountInPaise, selectedOrder.currency)}</dd></div>
                    <div><dt className="text-slate-500">Provider</dt><dd className="mt-1 font-black text-white">{selectedOrder.provider ?? "Not assigned"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-slate-500">Provider order ID</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-200">{selectedOrder.providerOrderId ?? "Not created"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-slate-500">Provider payment ID</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-200">{selectedOrder.providerPaymentId ?? "Not recorded"}</dd></div>
                    <div><dt className="text-slate-500">Webhooks</dt><dd className="mt-1 font-black text-white">{selectedOrder.webhookCount}</dd></div>
                    <div><dt className="text-slate-500">Fulfilment attempts</dt><dd className="mt-1 font-black text-white">{selectedOrder.fulfilmentCount}</dd></div>
                  </dl>
                ) : null}

                {selectedWebhook ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-slate-500">Receipt state</dt><dd className="mt-1 font-black text-white">{selectedWebhook.status}</dd></div>
                    <div><dt className="text-slate-500">Linked order</dt><dd className="mt-1 font-black text-white">{selectedWebhook.orderId ?? "Unmatched"}</dd></div>
                    <div><dt className="text-slate-500">Amount</dt><dd className="mt-1 font-black text-white">{formatMoney(selectedWebhook.amountInPaise, selectedWebhook.currency ?? "INR")}</dd></div>
                    <div><dt className="text-slate-500">Provider state</dt><dd className="mt-1 font-black text-white">{selectedWebhook.paymentStatus ?? "Unknown"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-slate-500">Provider order ID</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-200">{selectedWebhook.providerOrderId ?? "Missing"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-slate-500">Provider payment ID</dt><dd className="mt-1 break-all font-mono text-xs text-cyan-200">{selectedWebhook.providerPaymentId ?? "Missing"}</dd></div>
                    {selectedWebhook.errorMessage ? <div className="sm:col-span-2"><dt className="text-slate-500">Reconciliation error</dt><dd className="mt-1 text-rose-200">{selectedWebhook.errorMessage}</dd></div> : null}
                  </dl>
                ) : null}

                {selectedCase ? (
                  <div className="grid gap-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-slate-500">Type</dt><dd className="mt-1 font-black text-white">{selectedCase.type.replaceAll("_", " ")}</dd></div>
                      <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-black text-white">{selectedCase.status.replaceAll("_", " ")}</dd></div>
                      <div><dt className="text-slate-500">Order</dt><dd className="mt-1 font-black text-white">{selectedCase.orderId ?? "None"}</dd></div>
                      <div><dt className="text-slate-500">Review amount</dt><dd className="mt-1 font-black text-white">{formatMoney(selectedCase.requestedAmountInPaise, selectedCase.currency ?? "INR")}</dd></div>
                    </dl>
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-sm font-black text-white">{selectedCase.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{selectedCase.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Append-only case timeline</p>
                      <div className="mt-3 grid gap-2">
                        {selectedCase.events.map((event) => (
                          <div key={`${event.createdAt}:${event.status}`} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${stateTone(event.status)}`}>{event.status.replaceAll("_", " ")}</span>
                              <span className="text-[10px] text-slate-600">{formatDate(event.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-400">{event.message}</p>
                            <p className="mt-1 text-[10px] text-slate-600">{event.actorEmail ?? "System actor"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {!selectedCase ? (
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.055] p-4">
                    <h4 className="text-sm font-black text-violet-100">Create payment case</h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-slate-300">
                        Case type
                        <select value={caseType} onChange={(event) => setCaseType(event.target.value as PaymentCaseType)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white">
                          {CASE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-bold text-slate-300">
                        Review amount in rupees
                        <input value={refundRupees} onChange={(event) => setRefundRupees(event.target.value)} disabled={caseType !== "REFUND_REVIEW"} inputMode="decimal" placeholder="0.00" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-35" />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{CASE_TYPES.find((type) => type.value === caseType)?.note}</p>
                    <label className="mt-4 block text-xs font-bold text-slate-300">
                      Case title
                      <input value={caseTitle} onChange={(event) => setCaseTitle(event.target.value)} placeholder="Describe the payment problem" className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600" />
                    </label>
                    <label className="mt-4 block text-xs font-bold text-slate-300">
                      Required audit reason
                      <textarea rows={4} value={caseReason} onChange={(event) => setCaseReason(event.target.value)} placeholder="Explain the evidence, mismatch, or customer request" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
                    </label>
                    <button type="button" onClick={() => void createCase()} disabled={loading} className="mt-4 min-h-11 w-full rounded-xl bg-white px-4 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-40">
                      Create append-only case
                    </button>
                  </div>
                ) : null}

                {selectedCase ? (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                    <h4 className="text-sm font-black text-cyan-100">Advance case workflow</h4>
                    {selectedCaseTransitions.length ? (
                      <>
                        <select value={targetStatus} onChange={(event) => setTargetStatus(event.target.value as PaymentCaseStatus)} className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white">
                          {selectedCaseTransitions.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                        </select>
                        <textarea rows={4} value={caseNote} onChange={(event) => setCaseNote(event.target.value)} placeholder="Required investigation note" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
                        <button type="button" onClick={() => void updateCase()} disabled={loading} className="mt-3 min-h-11 w-full rounded-xl bg-cyan-200 px-4 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-40">
                          Save case transition
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">This case is closed. Its timeline remains permanent.</p>
                    )}
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {["Replay webhook", "Mark order paid", "Execute refund", "Submit dispute"].map((label) => (
                    <button key={label} type="button" disabled title="Locked until provider-backed approval and recovery controls exist" className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/10 bg-rose-300/[0.025] px-3 text-xs font-black text-rose-300/45">
                      {label} · locked
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        <div className="grid gap-4 border-t border-white/10 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black text-white">Provider boundary: {snapshot.provider.name}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {snapshot.provider.state.replaceAll("-", " ")} · key {snapshot.provider.keyConfigured ? "configured" : "missing"} · secret {snapshot.provider.secretConfigured ? "configured" : "missing"} · webhook {snapshot.provider.webhookConfigured ? "configured" : "missing"}
            </p>
          </div>
          <span className="rounded-full border border-rose-300/15 bg-rose-300/[0.04] px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-200/70">
            Live money movement locked
          </span>
        </div>
      </div>
    </section>
  );
}
