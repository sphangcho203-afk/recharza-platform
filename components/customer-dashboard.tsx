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
        <div className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.025]" />
          <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.025]" />
          <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.025]" />
        </div>
      </div>
    );
  }

  if (!customer || sessionEnded) {
    return (
      <section className="mx-auto max-w-xl rounded-lg border border-white/10 bg-[#0f0f19] p-6 text-center sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          Session closed
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Sign in to reopen your account.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
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
        <section className="rounded-lg border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_48%),#0f0f19] p-5 sm:p-7">
          <Link href="/account" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-300 transition duration-150 ease-out hover:border-violet-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
            <span aria-hidden="true">←</span> Back to account
          </Link>
          <p className="recharza-eyebrow mt-7">Order history</p>
          <h2 className="recharza-section-head mt-3 text-white">Your purchases</h2>
          <p className="recharza-body mt-3 max-w-2xl">Every purchase has its own tracking link, payment state, player destination, and delivery timeline. This is your complete account-owned order workspace.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
            <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">{orders.length} total orders</span>
            <StatusBadge state={activeOrders > 0 ? "pending" : "neutral"} label={`${activeOrders} active`} />
          </div>
        </section>
      ) : null}
      {!showOrders ? (
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0f0f19]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_50%),rgba(255,255,255,0.025)] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Account active
              </p>
              <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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

        <nav className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4" aria-label="Account tools">
          {[
            ["Cart", "/cart", "Review packages and players", "cart", "#a78bfa"],
            ["Start a top-up", "/#games", "Choose a game and market", "games", "#22d3ee"],
            ["Orders", "/account/orders", "View your complete order history", "track", "#34d399"],
            ["Get support", "/support", "Chat or create a request", "support", "#f472b6"],
          ].map(([label, href, note, icon, accent]) => (
            <Link
              key={label}
              href={href as string}
              className="recharza-nav-row group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[linear-gradient(160deg,rgba(30,33,56,.9),rgba(13,15,25,.95))] p-4 shadow-[0_12px_32px_rgba(0,0,0,.25)]"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 motion-safe:group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 55%, transparent) 50%, transparent)` }} />
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] transition-transform duration-200 group-hover:scale-105" style={{ color: accent } as React.CSSProperties}>
                <StorefrontIcon name={icon as Parameters<typeof StorefrontIcon>[0]["name"]} className="h-4 w-4" />
              </span>
              <strong className="relative mt-4 block text-sm font-semibold text-white">{label}</strong>
              <span className="relative mt-1 block text-xs leading-5 text-slate-500">{note}</span>
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
              <article key={label as string} className="recharza-stat-tile relative overflow-hidden rounded-xl p-5">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 50%, transparent) 50%, transparent)` }} />
                <p className="relative text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
                <p className="relative mt-3 text-3xl font-semibold tracking-tight recharza-stat-value">{value}</p>
                <p className="relative mt-2 text-xs text-slate-600">{note}</p>
              </article>
            ))}
          </section>
          <section className="rounded-lg border border-white/10 bg-white/[0.025] p-5 sm:p-6" aria-labelledby="account-next-step">
            <p className="recharza-eyebrow">Account overview</p>
            <h2 id="account-next-step" className="recharza-section-head mt-3 text-white">What would you like to do?</h2>
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
              <h2 className="recharza-section-head mt-3 text-white">
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

          <div className="recharza-order-rows mt-4">
            {orders.map((order) => (
              <div key={order.id} className="recharza-order-row">
                <div className="recharza-order-row-main min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <StorefrontArtwork artworkKey={games.find((game) => game.slug === order.gameSlug)?.artworkKey} sources={artworkSourcesForGame(order.gameSlug)} alt={`${gameTitle(order.gameSlug)} artwork`} fallbackLabel={gameTitle(order.gameSlug).slice(0, 2)} className="h-10 w-10 shrink-0 rounded-lg object-cover" fallbackClassName="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <p className="recharza-order-row-title">{order.package.name}</p>
                      <p className="recharza-order-row-meta">
                        <span className="font-mono text-[.68rem] uppercase tracking-[0.1em] text-violet-300/80">{order.id}</span>
                        {" · "}{gameTitle(order.gameSlug)}
                        {order.market ? ` · ${order.market.label}` : ""}
                        {" · "}<b>{formatInr(order.package.amountInPaise)}</b>
                        {" · "}{new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="recharza-order-row-side">
                  <StatusBadge state={statusStateFor(order.status)} label={order.status.replaceAll("_", " ")} />
                  <Link
                    href={`/orders/${encodeURIComponent(order.id)}`}
                    className="text-xs font-semibold text-cyan-200 transition hover:text-white"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))}

            {!orders.length ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="text-base font-semibold text-slate-300">No orders yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Your completed and active purchases will appear here.
                </p>
                <Link
                  href="/#games"
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-4 py-3 text-xs font-semibold text-slate-950 transition duration-150 ease-out hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Browse games
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-white/10 bg-[#0f0f19] p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Saved players
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
            Recent destinations
          </h2>
          <div className="mt-4 recharza-order-rows">
            {savedPlayers.map((order) => {
              const accent = gameAccent(order.gameSlug);
              return (
              <div
                key={`${order.gameSlug}:${order.player.playerId}:${order.player.zoneId}:${order.market?.code ?? "global"}`}
                className="recharza-order-row"
              >
                <div className="recharza-order-row-main min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <StorefrontArtwork artworkKey={games.find((game) => game.slug === order.gameSlug)?.artworkKey} sources={artworkSourcesForGame(order.gameSlug)} alt={`${gameTitle(order.gameSlug)} artwork`} fallbackLabel={gameTitle(order.gameSlug).slice(0, 2)} className="h-10 w-10 shrink-0 rounded-lg object-cover" fallbackClassName="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <p className="recharza-order-row-title">{order.player.nickname || "Mobile Legends player"}</p>
                      <p className="recharza-order-row-meta break-all font-mono text-[.68rem]">
                        {order.player.playerId}{order.player.zoneId ? ` (${order.player.zoneId})` : ""}
                        {" · "}<span style={{ color: accent }}>{gameTitle(order.gameSlug)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="recharza-order-row-side">
                  <span className="text-[.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {order.market?.code ?? "global"}
                  </span>
                </div>
              </div>
              );
            })}
            {!savedPlayers.length ? (
              <p className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-500">
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
            ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
            : "border-white/10 bg-black/20 text-slate-400"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
