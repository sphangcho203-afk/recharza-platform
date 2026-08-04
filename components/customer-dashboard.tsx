"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type Customer = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: "customer" | "staff" | "admin";
  emailVerified: boolean;
};

type CustomerOrder = {
  id: string;
  status: string;
  gameSlug: string;
  market: { code: string; label: string; flag: string } | null;
  package: { name: string; amountInPaise: number; currency: string };
  player: { playerId: string; zoneId: string; nickname: string | null };
  paymentProvider: string | null;
  fulfilmentAttempts: number;
  createdAt: string;
  updatedAt: string;
};

type Snapshot = {
  customer: Customer | null;
  orders: CustomerOrder[];
  message: string;
  error: boolean;
};

async function fetchSnapshot(): Promise<Snapshot> {
  const sessionResponse = await fetch("/api/auth/session", {
    cache: "no-store",
  });
  const session = (await sessionResponse.json()) as {
    ok: boolean;
    authenticated: boolean;
    customer?: Customer;
    message?: string;
  };

  if (
    !sessionResponse.ok ||
    !session.ok ||
    !session.authenticated ||
    !session.customer
  ) {
    return {
      customer: null,
      orders: [],
      message: "Your session ended. Sign in again to continue.",
      error: false,
    };
  }

  const ordersResponse = await fetch("/api/account/orders", {
    cache: "no-store",
  });
  const ordersResult = (await ordersResponse.json()) as {
    ok: boolean;
    orders?: CustomerOrder[];
    message?: string;
  };

  return {
    customer: session.customer,
    orders: ordersResult.ok && ordersResult.orders ? ordersResult.orders : [],
    message:
      ordersResponse.ok && ordersResult.ok
        ? "Account workspace ready."
        : ordersResult.message ?? "Order history could not be loaded.",
    error: !ordersResponse.ok || !ordersResult.ok,
  };
}

function statusClassName(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "paid") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  if (normalized === "failed" || normalized === "cancelled") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }
  if (normalized.includes("payment") || normalized === "created") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-violet-400/20 bg-violet-400/10 text-violet-100";
}

export function CustomerDashboard() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("Loading your account...");
  const [error, setError] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const savedPlayers = useMemo(() => {
    const unique = new Map<string, CustomerOrder>();
    for (const order of orders) {
      const key = `${order.gameSlug}:${order.market?.code ?? "global"}:${order.player.playerId}:${order.player.zoneId}`;
      if (!unique.has(key)) unique.set(key, order);
    }
    return Array.from(unique.values()).slice(0, 6);
  }, [orders]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          !["completed", "failed", "cancelled"].includes(
            order.status.toLowerCase(),
          ),
      ).length,
    [orders],
  );

  async function refresh() {
    setRefreshing(true);
    setError(false);
    try {
      const snapshot = await fetchSnapshot();
      setCustomer(snapshot.customer);
      setOrders(snapshot.orders);
      setMessage(snapshot.message);
      setError(snapshot.error);
      setSessionEnded(!snapshot.customer);
    } catch {
      setError(true);
      setMessage("The account service could not be reached.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetchSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setCustomer(snapshot.customer);
        setOrders(snapshot.orders);
        setMessage(snapshot.message);
        setError(snapshot.error);
        setSessionEnded(!snapshot.customer);
      })
      .catch(() => {
        if (!active) return;
        setCustomer(null);
        setOrders([]);
        setMessage("The account service could not be reached.");
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setCustomer(null);
    setOrders([]);
    setSessionEnded(true);
    setMessage("Signed out successfully.");
    setError(false);
  }

  if (loading) {
    return (
      <div className="grid gap-4" aria-label="Loading account">
        <div className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
          <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
          <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
        </div>
      </div>
    );
  }

  if (!customer || sessionEnded) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#0f0f19] p-6 text-center shadow-2xl shadow-black/25 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          Session closed
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">
          Sign in to reopen your account.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <a
          href="/account"
          className="mt-5 block min-h-12 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400"
        >
          Return to login
        </a>
      </section>
    );
  }

  const internalDestination = customer.role === "admin" ? "/admin" : "/staff";

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f19] shadow-2xl shadow-black/25">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_50%),rgba(255,255,255,0.025)] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Account active
              </p>
              <h2 className="mt-2 break-words text-3xl font-black text-white">
                {customer.displayName || customer.username || customer.email}
              </h2>
              <p className="mt-2 break-all text-sm text-slate-400">
                {customer.username ? `@${customer.username} · ` : ""}
                {customer.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {customer.role !== "customer" ? (
                <Link
                  href={internalDestination}
                  className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-black text-violet-100"
                >
                  Open {customer.role} workspace
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-black text-slate-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <nav className="grid gap-2 p-4 sm:grid-cols-4 sm:p-5" aria-label="Account tools">
          {[
            ["Cart", "/cart", "Packages and players"],
            ["New top-up", "/games/mobile-legends", "Start an order"],
            ["Security", "/forgot-password", "Reset password"],
            ["Support", "/support", "Get assistance"],
          ].map(([label, href, note]) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-violet-400/25 hover:bg-violet-400/[0.08]"
            >
              <strong className="block text-sm text-white">{label}</strong>
              <span className="mt-1 block text-xs text-slate-500">{note}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Account summary">
        {[
          ["Total orders", String(orders.length), "All account-owned orders"],
          ["Active orders", String(activeOrders), "Still moving through the flow"],
          ["Saved players", String(savedPlayers.length), "Derived from order history"],
        ].map(([label, value, note]) => (
          <article
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.13em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-600">{note}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                Order history
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Your purchases
              </h2>
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void refresh()}
              className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-slate-200 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="break-all text-xs font-black uppercase tracking-[0.12em] text-violet-300">
                      {order.id}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {order.package.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {order.market
                        ? `${order.market.flag} ${order.market.label} · `
                        : ""}
                      {order.player.nickname || order.player.playerId}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${statusClassName(order.status)}`}
                  >
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-sm text-slate-400">
                    <strong className="text-white">
                      {formatInr(order.package.amountInPaise)}
                    </strong>{" "}
                    · {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <Link
                    href={`/orders/${encodeURIComponent(order.id)}`}
                    className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-black text-violet-100"
                  >
                    Open tracking
                  </Link>
                </div>
              </article>
            ))}

            {!orders.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="font-black text-slate-300">No orders yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Your completed and active purchases will appear here.
                </p>
                <Link
                  href="/games/mobile-legends"
                  className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950"
                >
                  Start a top-up
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="h-fit rounded-3xl border border-white/10 bg-[#0f0f19] p-5 lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
            Saved players
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Recent destinations
          </h2>
          <div className="mt-4 grid gap-3">
            {savedPlayers.map((order) => (
              <article
                key={`${order.gameSlug}:${order.player.playerId}:${order.player.zoneId}:${order.market?.code ?? "global"}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="truncate text-sm text-white">
                    {order.player.nickname || "Mobile Legends player"}
                  </strong>
                  <span className="shrink-0 text-sm">
                    {order.market?.flag ?? "🌐"}
                  </span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-slate-400">
                  {order.player.playerId} ({order.player.zoneId})
                </p>
              </article>
            ))}
            {!savedPlayers.length ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-500">
                Validated player destinations will be collected from your order
                history.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <p
        className={`rounded-xl border px-4 py-3 text-sm ${
          error
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : "border-white/10 bg-black/20 text-slate-400"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
