"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SavedAddressesPanel } from "@/components/saved-addresses-panel";
import { StatusBadge } from "@/components/status-badge";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { StorefrontIcon } from "@/components/storefront-icon";
import { games } from "@/lib/games";
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

function gameAccent(gameSlug: string) {
  const game = games.find((entry) => entry.slug === gameSlug) ?? games.find((entry) => entry.slug === gameSlug.split("-").slice(0, -1).join("-"));
  return game?.accent ?? "#9b7cff";
}


function artworkSourcesForGame(gameSlug: string) {
  const game = games.find((entry) => entry.slug === gameSlug) ?? games.find((entry) => entry.slug === gameSlug.split("-").slice(0, -1).join("-"));
  if (!game) return [];
  return Array.from(new Set([...game.artworkSources.filter((source) => source.startsWith("/")), ...game.artworkSources]));
}

function gameTitle(gameSlug: string) {
  return games.find((entry) => entry.slug === gameSlug)?.title ?? gameSlug.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusStateFor(status: string): "pending" | "success" | "error" | "info" {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "paid") return "success";
  if (normalized === "failed" || normalized === "cancelled") return "error";
  if (normalized.includes("payment") || normalized === "created") return "pending";
  return "info";
}

export function CustomerDashboard({ showOrders = false }: { showOrders?: boolean }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed">("all");

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => {
      const status = order.status.toLowerCase();
      if (statusFilter === "pending") return !["completed", "failed", "cancelled"].includes(status);
      if (statusFilter === "completed") return status === "completed";
      if (statusFilter === "failed") return status === "failed" || status === "cancelled";
      return true;
    });
  }, [orders, statusFilter]);

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
        <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
          <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        </div>
      </div>
    );
  }

  if (!customer || sessionEnded) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
          Session closed
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sign in to reopen your account.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <a
          href="/account"
          className="mt-5 block min-h-12 rounded-lg bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
        >
          Return to login
        </a>
      </section>
    );
  }

  const internalDestination = customer.role === "admin" ? "/admin" : "/staff";
  return (
    <div className="grid gap-6">
      {showOrders ? (
        <section className="rounded-2xl border border-violet-100 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.05),transparent_48%),#FFFFFF] p-5 shadow-sm sm:p-7">
          <Link href="/account" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 transition duration-150 ease-out hover:border-violet-300 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
            <span aria-hidden="true">←</span> Back to account
          </Link>
          <p className="recharza-eyebrow mt-7">Order history</p>
          <h2 className="recharza-section-head mt-3 text-slate-900">Your purchases</h2>
          <p className="recharza-body mt-3 max-w-2xl">Every purchase has its own tracking link, payment state, player destination, and delivery timeline. This is your complete account-owned order workspace.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{orders.length} total orders</span>
            <StatusBadge state={activeOrders > 0 ? "pending" : "neutral"} label={`${activeOrders} active`} />
          </div>
        </section>
      ) : null}
      {!showOrders ? (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.05),transparent_50%),rgba(0,0,0,0.01)] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Account active
              </p>
              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {customer.displayName || customer.username || customer.email}
              </h2>
              <p className="mt-2 break-all text-sm text-slate-600">
                {customer.username ? `@${customer.username} · ` : ""}
                {customer.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {customer.role !== "customer" ? (
                <Link
                  href={internalDestination}
                  className="min-h-11 rounded-lg border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-semibold text-violet-100 transition duration-150 ease-out hover:bg-violet-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
                >
                  Open {customer.role} workspace
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void logout()}
                className="recharza-btn recharza-btn-secondary px-4 text-xs"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <nav className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4" aria-label="Account tools">
          {[
            ["Cart", "/cart", "Review packages and players", "cart", "#7C3AED"],
            ["Start a top-up", "/#games", "Choose a game and market", "games", "#0EA5E9"],
            ["Orders", "/account/orders", "View your complete order history", "track", "#10B981"],
            ["Get support", "/support", "Chat or create a request", "support", "#EC4899"],
          ].map(([label, href, note, icon, accent]) => (
            <Link
              key={label}
              href={href as string}
              className="recharza-nav-row group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 30%, transparent) 50%, transparent)` }} />
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105" style={{ color: accent } as React.CSSProperties}>
                <StorefrontIcon name={icon as Parameters<typeof StorefrontIcon>[0]["name"]} className="h-4 w-4" />
              </span>
              <strong className="relative mt-4 block text-sm font-bold text-slate-900">{label}</strong>
              <span className="relative mt-1 block text-xs leading-5 text-slate-600">{note}</span>
            </Link>
          ))}
        </nav>
      </section>
      ) : null}

      {!showOrders ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Account summary">
            {            [
              ["Total orders", String(orders.length), "All account-owned orders", "#8d5cff"],
              ["Active orders", String(activeOrders), "Still moving through the flow", "#22d3ee"],
              ["Saved players", String(savedPlayers.length), "Derived from order history", "#34d399"],
            ].map(([label, value, note, accent], tileIndex) => (
              <article key={label as string} className="recharza-stat-tile relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-slate-200">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 30%, transparent) 50%, transparent)` }} />
                <p className="relative text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p>
                <p className="relative mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                <p className="relative mt-2 text-xs text-slate-600">{note}</p>
              </article>
            ))}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="account-next-step">
            <p className="recharza-eyebrow">Account overview</p>
            <h2 id="account-next-step" className="recharza-section-head mt-3 text-slate-900">What would you like to do?</h2>
            <p className="recharza-body mt-3 max-w-2xl">Use the account tools above to review your cart, open your order history, or contact support. Games stay in the storefront where they belong.</p>
          </section>
          <SavedAddressesPanel />
        </>
      ) : null}

      {showOrders ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="recharza-eyebrow">
                Order history
              </p>
              <h2 className="recharza-section-head mt-3 text-slate-900">
                Your purchases
              </h2>
            </div>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void refresh()}
              className="recharza-btn recharza-btn-tertiary px-4 text-xs disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "all", label: "All Orders", count: orders.length },
              { id: "pending", label: "Pending", count: orders.filter(o => !["completed", "failed", "cancelled"].includes(o.status.toLowerCase())).length },
              { id: "completed", label: "Completed", count: orders.filter(o => o.status.toLowerCase() === "completed").length },
              { id: "failed", label: "Failed", count: orders.filter(o => ["failed", "cancelled"].includes(o.status.toLowerCase())).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 ${
                  statusFilter === tab.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span className={`grid h-5 min-w-[1.25rem] place-items-center rounded-lg px-1.5 text-[10px] ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="recharza-surface-raised relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-md">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <StorefrontArtwork artworkKey={games.find((game) => game.slug === order.gameSlug)?.artworkKey} sources={artworkSourcesForGame(order.gameSlug)} alt={`${gameTitle(order.gameSlug)} artwork`} fallbackLabel={gameTitle(order.gameSlug).slice(0, 2)} className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm" fallbackClassName="h-16 w-16 shrink-0 rounded-2xl" />
                      <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl border border-slate-200 bg-white text-violet-600 shadow-sm">
                        <StorefrontIcon name="games" className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600/60">Purchase Item</span>
                        <div className="h-px w-8 bg-slate-200" />
                      </div>
                      <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">{order.package.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[11px] font-medium text-slate-500">ID: <span className="text-violet-600">{order.id}</span></span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[11px] font-medium text-slate-600">{gameTitle(order.gameSlug)}</span>
                        {order.market && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className="text-[11px] font-medium text-slate-600">{order.market.label}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-none sm:pt-0">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Order Status</span>
                      <div className="mt-1.5">
                        <StatusBadge state={statusStateFor(order.status)} label={order.status.replaceAll("_", " ")} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right sm:mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Transaction</span>
                      <p className="mt-0.5 text-base font-bold text-slate-900">{formatInr(order.package.amountInPaise)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-[11px] font-medium text-slate-600">Securely processed · {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <Link
                    href={`/orders/${encodeURIComponent(order.id)}`}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 transition-all hover:text-violet-700 hover:gap-2"
                  >
                    View Details
                    <StorefrontIcon name="arrow" className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}

            {!filteredOrders.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-base font-bold text-slate-900">
                  {statusFilter === "all" ? "No orders yet." : `No ${statusFilter} orders.`}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Your completed and active purchases will appear here.
                </p>
                <Link
                  href="/#games"
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-4 py-3 text-xs font-bold text-white transition duration-150 ease-out hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                >
                  Browse games
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
            Saved players
          </p>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
            Recent destinations
          </h2>
          <div className="mt-4 recharza-order-rows">
            {savedPlayers.map((order) => {
              const accent = gameAccent(order.gameSlug);
              return (
              <div
                key={`${order.gameSlug}:${order.player.playerId}:${order.player.zoneId}:${order.market?.code ?? "global"}`}
                className="recharza-order-row border-slate-100"
              >
                <div className="recharza-order-row-main min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <StorefrontArtwork artworkKey={games.find((game) => game.slug === order.gameSlug)?.artworkKey} sources={artworkSourcesForGame(order.gameSlug)} alt={`${gameTitle(order.gameSlug)} artwork`} fallbackLabel={gameTitle(order.gameSlug).slice(0, 2)} className="h-10 w-10 shrink-0 rounded-lg object-cover" fallbackClassName="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <p className="recharza-order-row-title text-slate-900">{order.player.nickname || "Mobile Legends player"}</p>
                      <p className="recharza-order-row-meta break-all font-mono text-[.68rem] text-slate-500">
                        {order.player.playerId}{order.player.zoneId ? ` (${order.player.zoneId})` : ""}
                        {" · "}<span style={{ color: accent, fontWeight: 'bold' }}>{gameTitle(order.gameSlug)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="recharza-order-row-side">
                  <span className="text-[.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {order.market?.code ?? "global"}
                  </span>
                </div>
              </div>
              );
            })}
            {!savedPlayers.length ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                Validated player destinations will be collected from your order
                history.
              </p>
            ) : null}
          </div>
        </aside>
              </div>
      ) : null}
      <p
        className={`rounded-lg border px-4 py-3 text-sm ${
          error
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
