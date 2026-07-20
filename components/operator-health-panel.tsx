"use client";

import { useState } from "react";

type HealthResponse = {
  ok: boolean;
  message?: string;
  checkedAt?: string;
  database?: { ready: boolean };
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
    publishedCategoryCount: number;
    totalProducts: number;
    publishedProducts: number;
    unavailableProducts: number;
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
      className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${
        ready
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-amber-300/20 bg-amber-300/10 text-amber-100"
      }`}
    >
      {label}
    </span>
  );
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export function OperatorHealthPanel() {
  const [token, setToken] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Load protected health data before changing supplier or payment settings.",
  );
  const [isError, setIsError] = useState(false);

  async function loadHealth(currentToken = token) {
    const normalizedToken = currentToken.trim();

    if (!normalizedToken) {
      setIsError(true);
      setMessage("An operator token is required.");
      return;
    }

    setLoading(true);
    setIsError(false);
    setMessage("Checking database, supplier and payment configuration...");

    try {
      const response = await fetch("/api/operator/health", {
        headers: { Authorization: `Bearer ${normalizedToken}` },
        cache: "no-store",
      });
      const result = (await response.json()) as HealthResponse;

      if (!response.ok || !result.ok) {
        setHealth(null);
        setIsError(true);
        setMessage(result.message ?? "Operational health could not be loaded.");
        return;
      }

      sessionStorage.setItem("recharza-operator-token", normalizedToken);
      setHealth(result);
      setMessage(`Health checked at ${formatTimestamp(result.checkedAt)}.`);
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
      setMessage("No operator token is saved in this browser session.");
      return;
    }

    setToken(savedToken);
    void loadHealth(savedToken);
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Operational health
          </p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Check the machinery before opening the doors.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This panel reports configuration state only. It never returns API keys, webhook secrets,
            database credentials or unmasked customer data.
          </p>
        </div>

        <div className="w-full max-w-md">
          <label className="text-sm font-semibold text-slate-200">
            Temporary operator token
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ADMIN_ACCESS_TOKEN"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
            />
          </label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={useSavedToken}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              Use saved token
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadHealth()}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Checking..." : "Run health check"}
            </button>
          </div>
        </div>
      </div>

      <p
        aria-live="polite"
        className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
          isError
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : "border-white/10 bg-black/15 text-slate-400"
        }`}
      >
        {message}
      </p>

      {health?.database && health.payment && health.supplier ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <StatusBadge ready={health.database.ready} label={health.database.ready ? "Ready" : "Unavailable"} />
            <h3 className="mt-4 text-lg font-black text-white">Database</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              PostgreSQL answered the protected health query and operational counters loaded.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <StatusBadge
              ready={health.payment.ready && health.payment.webhookConfigured}
              label={health.payment.mode.replaceAll("-", " ")}
            />
            <h3 className="mt-4 text-lg font-black text-white">Payments</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Webhook secret</dt>
                <dd className="font-bold text-white">
                  {health.payment.webhookConfigured ? "Configured" : "Missing"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Pending orders</dt>
                <dd className="font-bold text-white">{health.payment.pendingOrders}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Failed webhook receipts</dt>
                <dd className="font-bold text-white">{health.payment.failedWebhookReceipts}</dd>
              </div>
            </dl>
            {health.payment.warning ? (
              <p className="mt-4 text-xs leading-5 text-amber-100">{health.payment.warning}</p>
            ) : null}
          </article>

          <article className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <StatusBadge
              ready={
                health.supplier.apiKeyConfigured &&
                health.supplier.publishedCategoryCount > 0 &&
                health.supplier.publishedProducts > 0
              }
              label={health.supplier.latestSync?.status ?? "not synced"}
            />
            <h3 className="mt-4 text-lg font-black text-white">Supplier catalogue</h3>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">API key</dt>
                <dd className="font-bold text-white">
                  {health.supplier.apiKeyConfigured ? "Configured" : "Missing"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Approved categories</dt>
                <dd className="font-bold text-white">{health.supplier.publishedCategoryCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Published offers</dt>
                <dd className="font-bold text-white">{health.supplier.publishedProducts}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Unavailable offers</dt>
                <dd className="font-bold text-white">{health.supplier.unavailableProducts}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Last sync: {formatTimestamp(health.supplier.latestSync?.completedAt ?? health.supplier.latestSync?.startedAt)}
            </p>
            {health.supplier.latestSync?.errorMessage ? (
              <p className="mt-2 text-xs leading-5 text-rose-200">
                {health.supplier.latestSync.errorMessage}
              </p>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}
