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
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
          Session closed
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sign in to reopen your account.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 font-medium">{message}</p>
        <a
          href="/account"
          className="mt-5 block min-h-12 rounded-lg bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition duration-150 ease-out hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
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
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
          <Link href="/account" className="relative z-10 inline-flex min-h-11 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70">
            <span aria-hidden="true">←</span> Back to account
          </Link>
          <p className="mt-8 relative z-10 text-[10px] font-black uppercase tracking-[0.25em] text-violet-600">Order history</p>
          <h2 className="mt-3 text-3xl font-black tracking-tighter text-slate-900 relative z-10 sm:text-4xl">Your purchases</h2>
          <p className="mt-4 max-w-2xl relative z-10 text-[15px] font-medium leading-relaxed text-slate-500">Every purchase has its own tracking link, payment state, player destination, and delivery timeline. This is your complete account-owned order workspace.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-widest relative z-10">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-600 shadow-sm">{orders.length} total orders</span>
            <StatusBadge state={activeOrders > 0 ? "pending" : "neutral"} label={`${activeOrders} active`} />
          </div>
        </section>
      ) : null}
      {!showOrders ? (
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 bg-slate-50 p-6 sm:p-10 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
                Account active
              </p>
              <h2 className="mt-3 break-words text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl">
                {customer.displayName || customer.username || customer.email}
              </h2>
              <p className="mt-3 break-all text-[15px] font-medium text-slate-500">
                {customer.username ? `@${customer.username} · ` : ""}
                {customer.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {customer.role !== "customer" ? (
                <Link
                  href={internalDestination}
                  className="min-h-12 rounded-2xl border border-violet-200 bg-violet-600 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
                >
                  Open {customer.role} workspace
                </Link>
              ) : null}
			              <button
			                type="button"
			                onClick={() => void logout()}
			                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
			              >
			                Sign out
			              </button>
            </div>
          </div>
        </div>

        <nav className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-4" aria-label="Account tools">
          {[
            ["Cart", "/cart", "Review packages and players", "cart", "#7c3aed"],
            ["Start a top-up", "/#games", "Choose a game and market", "games", "#0891b2"],
            ["Orders", "/account/orders", "View your complete order history", "track", "#10b981"],
            ["Get support", "/support", "Chat or create a request", "support", "#db2777"],
          ].map(([label, href, note, icon, accent]) => (
            <Link
              key={label}
              href={href as string}
              className="recharza-nav-row group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md hover:-translate-y-1"
            >
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md" style={{ color: accent } as React.CSSProperties}>
                <StorefrontIcon name={icon as Parameters<typeof StorefrontIcon>[0]["name"]} className="h-5 w-5" />
              </span>
              <strong className="relative mt-5 block text-base font-black tracking-tight text-slate-900">{label}</strong>
              <span className="relative mt-1.5 block text-xs font-medium leading-relaxed text-slate-500">{note}</span>
            </Link>
          ))}
        </nav>
      </section>
      ) : null}

      {!showOrders ? (
        <>
	          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Account summary">
            {            [
              ["Total orders", String(orders.length), "All account-owned orders", "#A78BFA"],
              ["Active orders", String(activeOrders), "Still moving through the flow", "#38BDF8"],
              ["Saved players", String(savedPlayers.length), "Derived from order history", "#34D399"],
            ].map(([label, value, note, accent], tileIndex) => (
	              <article key={label as string} className={`recharza-stat-tile group relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-lg border border-slate-200 sm:p-7 transition-all duration-300 hover:border-violet-200 hover:shadow-xl hover:-translate-y-1 ${tileIndex === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-violet-50/50 transition-colors" />
                <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-violet-600 transition-colors">{label}</p>
                <p className="relative mt-4 text-4xl font-black tracking-tighter text-slate-900">{value}</p>
                <p className="relative mt-2 text-[11px] font-medium text-slate-400">{note}</p>
              </article>
            ))}
          </section>
	          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6" aria-labelledby="account-next-step">
	            <p className="recharza-eyebrow text-violet-600">Account overview</p>
	            <h2 id="account-next-step" className="recharza-section-head mt-3 text-slate-900">What would you like to do?</h2>
	            <p className="recharza-body mt-3 max-w-2xl text-slate-500">Use the account tools above to review your cart, open your order history, or contact support. Games stay in the storefront where they belong.</p>
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

          <div className="mt-8 space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="recharza-surface-raised relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:border-violet-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <StorefrontArtwork artworkKey={games.find((game) => game.slug === order.gameSlug)?.artworkKey} sources={artworkSourcesForGame(order.gameSlug)} alt={`${gameTitle(order.gameSlug)} artwork`} fallbackLabel={gameTitle(order.gameSlug).slice(0, 2)} className="h-20 w-20 shrink-0 rounded-[1.5rem] object-cover shadow-md ring-1 ring-slate-200/50" fallbackClassName="h-20 w-20 shrink-0 rounded-[1.5rem]" />
                      <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-2xl border border-slate-200 bg-white text-violet-600 shadow-md">
                        <StorefrontIcon name="games" className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-600">Purchase Item</span>
                        <div className="h-px w-10 bg-slate-100" />
                      </div>
                      <p className="mt-2 text-xl font-black tracking-tight text-slate-900 break-words leading-tight">{order.package.name}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-500">ID: <span className="text-violet-600">{order.id}</span></span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{gameTitle(order.gameSlug)}</span>
                        {order.market && (
                          <>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{order.market.label}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 lg:flex-row lg:items-center lg:gap-8 lg:border-none lg:pt-0">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Status</span>
                      <div className="mt-2">
                        <StatusBadge state={statusStateFor(order.status)} label={order.status.replaceAll("_", " ")} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction</span>
                      <p className="mt-1 text-xl font-black text-slate-900 tracking-tight">{formatInr(order.package.amountInPaise)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Securely processed · {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <Link
                    href={`/orders/${encodeURIComponent(order.id)}`}
                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-violet-600 transition-all hover:text-violet-700 hover:gap-3"
                  >
                    Details
                    <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
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
