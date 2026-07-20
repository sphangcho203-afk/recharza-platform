"use client";

import { useMemo, useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type OperatorOrder = {
  id: string;
  status: string;
  gameSlug: string;
  package: {
    id: string;
    name: string;
    amountInPaise: number;
    currency: string;
  };
  player: {
    playerId: string;
    zoneId: string;
    nickname: string | null;
    verificationMode: string;
  };
  customerEmail: string;
  paymentProvider: string | null;
  paymentSessionId: string | null;
  supplier: {
    productId: string | null;
    categoryId: string | null;
    offerId: string | null;
  };
  createdAt: string;
  updatedAt: string;
  counts: {
    events: number;
    webhooks: number;
    auditLogs: number;
    fulfilmentAttempts: number;
  };
};

type OrdersResponse = {
  ok: boolean;
  message?: string;
  access?: { mode: string; role: string };
  orders?: OperatorOrder[];
};

const FILTERS = [
  "all",
  "created",
  "awaiting_payment",
  "payment_pending",
  "paid",
  "fulfilling",
  "completed",
  "failed",
  "cancelled",
];

const TRANSITIONS: Record<string, string[]> = {
  created: ["failed", "cancelled"],
  awaiting_payment: ["failed", "cancelled"],
  payment_pending: ["failed", "cancelled"],
  paid: ["fulfilling"],
  fulfilling: ["completed", "failed"],
};

function buildHeaders(token: string, json = false) {
  const headers: Record<string, string> = {};
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export function OperatorConsole() {
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<OperatorOrder[]>([]);
  const [access, setAccess] = useState<OrdersResponse["access"]>(undefined);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState("");
  const [message, setMessage] = useState(
    "Use a verified staff session, or the emergency operator token, to load protected orders.",
  );
  const [isError, setIsError] = useState(false);

  const visibleTotal = useMemo(() => orders.length, [orders]);

  async function loadOrders(currentToken = token, currentFilter = filter) {
    setLoading(true);
    setIsError(false);
    setMessage("Loading protected order records...");

    try {
      const query =
        currentFilter === "all"
          ? "?limit=50"
          : `?limit=50&status=${encodeURIComponent(currentFilter)}`;
      const response = await fetch(`/api/operator/orders${query}`, {
        headers: buildHeaders(currentToken),
        cache: "no-store",
      });
      const result = (await response.json()) as OrdersResponse;

      if (!response.ok || !result.ok || !result.orders) {
        setOrders([]);
        setIsError(true);
        setMessage(
          result.message ??
            "Staff access was not accepted. Sign in with an approved staff email or use the emergency token.",
        );
        return;
      }

      if (currentToken.trim()) {
        sessionStorage.setItem("recharza-operator-token", currentToken.trim());
      }
      setOrders(result.orders);
      setAccess(result.access);
      setMessage(
        `${result.orders.length} protected order record(s) loaded through ${result.access?.mode ?? "protected access"}.`,
      );
    } catch {
      setOrders([]);
      setIsError(true);
      setMessage("The operator service could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  function useSavedToken() {
    const savedToken = sessionStorage.getItem("recharza-operator-token");
    if (!savedToken) {
      setIsError(true);
      setMessage("No emergency token is saved. Leave the field empty to use your staff session.");
      return;
    }
    setToken(savedToken);
    void loadOrders(savedToken, filter);
  }

  function getReason(orderId: string) {
    return reasons[orderId]?.trim() ?? "";
  }

  async function transitionOrder(order: OperatorOrder, targetStatus: string) {
    const reason = getReason(order.id);
    if (reason.length < 5) {
      setIsError(true);
      setMessage(`Add a clear reason before changing ${order.id}.`);
      return;
    }

    setActiveOrder(order.id);
    setIsError(false);
    setMessage(`Moving ${order.id} to ${targetStatus.replaceAll("_", " ")}...`);

    try {
      const response = await fetch(
        `/api/operator/orders/${encodeURIComponent(order.id)}/status`,
        {
          method: "POST",
          headers: buildHeaders(token, true),
          body: JSON.stringify({ status: targetStatus, reason }),
        },
      );
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        status?: string;
      };

      if (!response.ok || !result.ok) {
        setIsError(true);
        setMessage(result.message ?? "The operator action failed.");
        return;
      }

      setReasons((current) => ({ ...current, [order.id]: "" }));
      setMessage(`${order.id} moved to ${result.status?.replaceAll("_", " ")}.`);
      await loadOrders(token, filter);
    } catch {
      setIsError(true);
      setMessage("The operator action could not reach the server.");
    } finally {
      setActiveOrder("");
    }
  }

  async function runFulfilment(order: OperatorOrder, retry: boolean) {
    const reason = getReason(order.id);
    if (reason.length < 5) {
      setIsError(true);
      setMessage(`Add a clear reason before ${retry ? "retrying" : "planning"} fulfilment for ${order.id}.`);
      return;
    }

    setActiveOrder(order.id);
    setIsError(false);
    setMessage(`${retry ? "Retrying" : "Ensuring"} fulfilment for ${order.id}...`);

    try {
      const response = await fetch(
        `/api/operator/orders/${encodeURIComponent(order.id)}/fulfilment`,
        {
          method: "POST",
          headers: buildHeaders(token, true),
          body: JSON.stringify({ reason, retry }),
        },
      );
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        result?: { state?: string; dryRun?: boolean; message?: string };
      };

      if (!response.ok || !result.ok) {
        setIsError(true);
        setMessage(result.message ?? result.result?.message ?? "The fulfilment action failed.");
        return;
      }

      setReasons((current) => ({ ...current, [order.id]: "" }));
      setMessage(
        `${order.id} fulfilment is ${result.result?.state?.replaceAll("_", " ") ?? "recorded"}${result.result?.dryRun ? " in dry-run mode" : ""}.`,
      );
      await loadOrders(token, filter);
    } catch {
      setIsError(true);
      setMessage("The fulfilment service could not be reached.");
    } finally {
      setActiveOrder("");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-200">
              Emergency operator token, optional
              <textarea
                rows={3}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Leave empty to use verified staff session"
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
              />
            </label>
            {access ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                {access.role} · {access.mode}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={useSavedToken} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">
              Use saved fallback
            </button>
            <button type="button" disabled={loading} onClick={() => void loadOrders()} className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
              {loading ? "Loading..." : "Open operator console"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-semibold text-slate-300">
            Status filter
            <select
              value={filter}
              onChange={(event) => {
                const nextFilter = event.target.value;
                setFilter(nextFilter);
                if (orders.length) void loadOrders(token, nextFilter);
              }}
              className="ml-3 rounded-xl border border-white/10 bg-[#11111d] px-3 py-2 text-sm text-white outline-none"
            >
              {FILTERS.map((item) => (
                <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <p className="text-sm text-slate-500">Visible orders: {visibleTotal}</p>
        </div>

        <p aria-live="polite" className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
          {message}
        </p>
      </section>

      <section className="grid gap-4">
        {orders.map((order) => {
          const transitions = TRANSITIONS[order.status] ?? [];
          const canFulfil = order.status === "paid" || order.status === "fulfilling";
          return (
            <article key={order.id} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">{order.id}</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{order.package.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Player {order.player.nickname || order.player.playerId} ({order.player.zoneId})
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{order.player.verificationMode.replaceAll("-", " ")}</p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div><dt className="text-slate-500">Amount</dt><dd className="mt-1 font-bold text-white">{formatInr(order.package.amountInPaise)}</dd></div>
                <div><dt className="text-slate-500">Customer</dt><dd className="mt-1 font-semibold text-white">{order.customerEmail}</dd></div>
                <div><dt className="text-slate-500">Payment</dt><dd className="mt-1 font-semibold text-white">{order.paymentProvider ?? "Not assigned"}</dd></div>
                <div><dt className="text-slate-500">Supplier</dt><dd className="mt-1 font-semibold text-white">{order.supplier.offerId ? "Offer attached" : "Indicative"}</dd></div>
                <div><dt className="text-slate-500">Records</dt><dd className="mt-1 font-semibold text-white">{order.counts.events} events · {order.counts.fulfilmentAttempts} fulfilment</dd></div>
              </dl>

              {(transitions.length || canFulfil) ? (
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-4">
                  <label className="text-sm font-semibold text-slate-200">
                    Required audit reason
                    <input
                      value={reasons[order.id] ?? ""}
                      onChange={(event) => setReasons((current) => ({ ...current, [order.id]: event.target.value }))}
                      placeholder="Explain the staff action"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canFulfil ? (
                      <>
                        <button type="button" disabled={activeOrder === order.id} onClick={() => void runFulfilment(order, false)} className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-100 disabled:opacity-50">
                          Ensure fulfilment
                        </button>
                        {order.counts.fulfilmentAttempts > 0 ? (
                          <button type="button" disabled={activeOrder === order.id} onClick={() => void runFulfilment(order, true)} className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-100 disabled:opacity-50">
                            Retry failed / dry run
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {transitions.map((target) => (
                      <button key={target} type="button" disabled={activeOrder === order.id} onClick={() => void transitionOrder(order, target)} className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-100 disabled:opacity-50">
                        Move to {target.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">No manual transitions or fulfilment actions are allowed from this state.</p>
              )}
            </article>
          );
        })}

        {!orders.length ? (
          <div className="grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-500">
            Protected orders will appear after verified staff authentication.
          </div>
        ) : null}
      </section>
    </div>
  );
}
