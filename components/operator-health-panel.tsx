"use client";

import Link from "next/link";
import { useState } from "react";

type HealthResponse = {
  ok: boolean;
  message?: string;
  checkedAt?: string;
  access?: { mode: string; role: string };
  database?: { ready: boolean };
  accounts?: { verifiedCustomers: number; staffAccounts: number };
  payment?: {
    mode: string;
    ready: boolean;
    warning: string | null;
    webhookConfigured: boolean;
    pendingOrders: number;
    failedWebhookReceipts: number;
  };
  supplier?: {
    apiKeyConfigured: boolean;
    orderWritesEnabled: boolean;
    validationPathConfigured: boolean;
    orderCreatePathConfigured: boolean;
    publishedCategoryCount: number;
    totalProducts: number;
    publishedProducts: number;
    unavailableProducts: number;
    pendingFulfilments: number;
    failedFulfilments: number;
    latestSync: {
      status: string;
      categoriesSynced: number;
      offersSynced: number;
      startedAt: string;
      completedAt: string | null;
      errorMessage: string | null;
    } | null;
  };
};

function StatusBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
        ready
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}

function formatTimestamp(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function buildHeaders(token: string) {
  const normalized = token.trim();
  return normalized ? { Authorization: `Bearer ${normalized}` } : undefined;
}

export function OperatorHealthPanel() {
  const [token, setToken] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Use your verified staff session, or provide the emergency operator token.",
  );
  const [isError, setIsError] = useState(false);

  async function loadHealth(currentToken = token) {
    const normalizedToken = currentToken.trim();
    setLoading(true);
    setIsError(false);
    setMessage("Checking database, accounts, supplier, fulfilment and payment configuration...");

    try {
      const response = await fetch("/api/operator/health", {
        headers: buildHeaders(normalizedToken),
        cache: "no-store",
      });
      const result = (await response.json()) as HealthResponse;

      if (!response.ok || !result.ok) {
        setHealth(null);
        setIsError(true);
        setMessage(
          result.message ??
            "Staff access was not accepted. Sign in with an approved staff email or use the emergency token.",
        );
        return;
      }

      if (normalizedToken) {
        sessionStorage.setItem("recharza-operator-token", normalizedToken);
      }
      setHealth(result);
      setMessage(
        `Health checked at ${formatTimestamp(result.checkedAt)} using ${result.access?.mode ?? "protected access"}.`,
      );
    } catch {
      setHealth(null);
      setIsError(true);
      setMessage("The operational health service could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  function useSavedToken() {
    const savedToken = sessionStorage.getItem("recharza-operator-token");
    if (!savedToken) {
      setIsError(true);
      setMessage("No emergency token is saved in this browser session. Your staff session can still be used.");
      return;
    }
    setToken(savedToken);
    void loadHealth(savedToken);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Operational health
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Check the machinery before opening the doors.
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Verified staff sessions are the normal access path. The shared token remains an emergency fallback only.
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Preferred access
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Sign in through <Link href="/account" className="font-bold text-slate-900 underline underline-offset-4">Account</Link> with an email listed in the staff or admin allowlist.
          </p>
          <label className="mt-4 block text-sm font-bold text-slate-900">
            Emergency token, optional
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Leave empty to use staff session"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 shadow-sm"
            />
          </label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={useSavedToken} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
              Use saved fallback
            </button>
            <button type="button" disabled={loading} onClick={() => void loadHealth()} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-violet-700 hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? "Checking..." : "Run health check"}
            </button>
          </div>
        </div>
      </div>

      <p aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${isError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
        {message}
      </p>

      {health?.database && health.accounts && health.payment && health.supplier ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <StatusBadge ready={health.database.ready} label={health.access?.role ?? "ready"} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Accounts</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified customers</dt><dd className="font-bold text-slate-900">{health.accounts.verifiedCustomers}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff accounts</dt><dd className="font-bold text-slate-900">{health.accounts.staffAccounts}</dd></div>
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <StatusBadge ready={health.payment.ready && health.payment.webhookConfigured} label={health.payment.mode.replaceAll("-", " ")} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Payments</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Webhook</dt><dd className="font-bold text-slate-900">{health.payment.webhookConfigured ? "Configured" : "Missing"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</dt><dd className="font-bold text-slate-900">{health.payment.pendingOrders}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed receipts</dt><dd className="font-bold text-slate-900">{health.payment.failedWebhookReceipts}</dd></div>
            </dl>
            {health.payment.warning ? <p className="mt-4 text-xs font-medium leading-5 text-amber-600">{health.payment.warning}</p> : null}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <StatusBadge ready={health.supplier.apiKeyConfigured && health.supplier.publishedProducts > 0} label={health.supplier.latestSync?.status ?? "not synced"} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Supplier catalogue</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">API key</dt><dd className="font-bold text-slate-900">{health.supplier.apiKeyConfigured ? "Configured" : "Missing"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved categories</dt><dd className="font-bold text-slate-900">{health.supplier.publishedCategoryCount}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Published offers</dt><dd className="font-bold text-slate-900">{health.supplier.publishedProducts}</dd></div>
            </dl>
            <p className="mt-4 text-xs font-bold text-slate-400">Last sync: {formatTimestamp(health.supplier.latestSync?.completedAt ?? health.supplier.latestSync?.startedAt)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <StatusBadge ready={health.supplier.orderWritesEnabled && health.supplier.orderCreatePathConfigured} label={health.supplier.orderWritesEnabled ? "writes enabled" : "dry run"} />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Fulfilment</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Player validation</dt><dd className="font-bold text-slate-900">{health.supplier.validationPathConfigured ? "Configured" : "Local only"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Create path</dt><dd className="font-bold text-slate-900">{health.supplier.orderCreatePathConfigured ? "Configured" : "Missing"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending attempts</dt><dd className="font-bold text-slate-900">{health.supplier.pendingFulfilments}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed attempts</dt><dd className="font-bold text-slate-900">{health.supplier.failedFulfilments}</dd></div>
            </dl>
          </article>
        </div>
      ) : null}
    </section>
  );
}
