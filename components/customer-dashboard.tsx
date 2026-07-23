"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { ModuleStateBadge } from "@/components/module-state-badge";
import { formatInr } from "@/lib/mobile-legends";

type Customer = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
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

const customerModules = [
  ["overview", "Overview"],
  ["orders", "Orders"],
  ["game-accounts", "Game accounts"],
  ["wallet", "Wallet"],
  ["rewards", "Rewards"],
  ["redeem-codes", "Redeem codes"],
  ["addresses", "Addresses"],
  ["support", "Support"],
  ["notifications", "Notifications"],
  ["security", "Security"],
] as const;

async function fetchSnapshot(): Promise<Snapshot> {
  const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
  const session = (await sessionResponse.json()) as {
    ok: boolean;
    authenticated: boolean;
    customer?: Customer;
  };

  if (!sessionResponse.ok || !session.ok || !session.authenticated || !session.customer) {
    return {
      customer: null,
      orders: [],
      message: "Enter your email to receive a secure one-time sign-in link.",
      error: false,
    };
  }

  const ordersResponse = await fetch("/api/account/orders", { cache: "no-store" });
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
        ? "Customer account session active."
        : ordersResult.message ?? "Order history could not be loaded.",
    error: !ordersResponse.ok || !ordersResult.ok,
  };
}

function gameLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CustomerDashboard() {
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("Checking your customer session...");
  const [error, setError] = useState(false);
  const [developmentPreviewUrl, setDevelopmentPreviewUrl] = useState("");

  const savedAccounts = useMemo(() => {
    const unique = new Map<string, CustomerOrder>();
    for (const order of orders) {
      const key = `${order.gameSlug}:${order.market?.code ?? "global"}:${order.player.playerId}:${order.player.zoneId}`;
      if (!unique.has(key)) unique.set(key, order);
    }
    return Array.from(unique.values()).slice(0, 8);
  }, [orders]);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status.toLowerCase() === "completed").length,
    [orders],
  );
  const totalSpent = useMemo(
    () => orders.reduce((total, order) => total + order.package.amountInPaise, 0),
    [orders],
  );
  const rewardPoints = Math.floor(totalSpent / 1000);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const snapshot = await fetchSnapshot();
      setCustomer(snapshot.customer);
      setOrders(snapshot.orders);
      setMessage(snapshot.message);
      setError(snapshot.error);
    } catch {
      setCustomer(null);
      setOrders([]);
      setMessage("The account service could not be reached.");
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(false);
    setDevelopmentPreviewUrl("");
    setMessage("Preparing a secure customer sign-in link...");

    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo: "/account" }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        developmentPreviewUrl?: string;
      };
      setError(!response.ok || !result.ok);
      setMessage(result.message ?? "Check your email for the secure sign-in link.");
      setDevelopmentPreviewUrl(result.developmentPreviewUrl ?? "");
    } catch {
      setError(true);
      setMessage("The sign-in service could not be reached.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setCustomer(null);
    setOrders([]);
    setMessage("Signed out. Enter your email to sign in again.");
  }

  if (loading) {
    return (
      <div className="grid gap-3" aria-label="Loading account">
        <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/25 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          Customer account
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in without a password.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Every public sign-in opens a customer account. Staff and administrator permissions are assigned only through protected internal controls and never through this page.
        </p>
        <form onSubmit={requestLink} className="mt-5">
          <label className="text-sm font-semibold text-slate-200">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
            />
          </label>
          <button
            disabled={sending}
            className="mt-4 min-h-12 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? "Preparing link..." : "Email me a secure sign-in link"}
          </button>
        </form>
        <p
          aria-live="polite"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-white/10 bg-black/15 text-slate-400"
          }`}
        >
          {message}
        </p>
        {developmentPreviewUrl ? (
          <a
            href={developmentPreviewUrl}
            className="mt-3 block min-h-11 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm font-black text-amber-100"
          >
            Open development sign-in link
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.025] p-2 lg:sticky lg:top-24">
        <nav className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid" aria-label="Customer dashboard">
          {customerModules.map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={`min-h-11 shrink-0 rounded-xl px-3 py-3 text-sm font-bold transition ${index === 0 ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        <section id="overview" className="system-panel scroll-mt-24 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Verified customer account
              </p>
              <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                {customer.displayName || customer.username || customer.email}
              </h2>
              <p className="mt-2 break-all text-sm text-slate-400">{customer.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/#games" className="min-h-11 rounded-xl bg-white px-3 py-3 text-xs font-black text-slate-950 hover:bg-violet-200">
                Browse games
              </Link>
              <button type="button" onClick={logout} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-black text-slate-200">
                Sign out
              </button>
            </div>
          </div>
          <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
            {message}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account summary">
          {[
            ["Total orders", String(orders.length), "Account-owned records"],
            ["Completed", String(completedOrders), "Delivered orders"],
            ["Total spent", formatInr(totalSpent), "Recorded settlement value"],
            ["Reward points", String(rewardPoints), "Preview points balance"],
          ].map(([label, value, note]) => (
            <article key={label} className="system-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-white">{value}</p>
              <p className="mt-2 text-xs text-slate-600">{note}</p>
            </article>
          ))}
        </section>

        <section id="orders" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Orders</p>
                <ModuleStateBadge state="live" />
              </div>
              <h2 className="mt-2 text-2xl font-black">Order history</h2>
            </div>
            <button type="button" onClick={() => void load()} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-black text-slate-200">
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {orders.map((order) => (
              <article key={order.id} className="system-card p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="break-all text-xs font-bold uppercase tracking-[0.12em] text-violet-300">{order.id}</p>
                    <h3 className="mt-2 text-xl font-black">{order.package.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {gameLabel(order.gameSlug)}
                      {order.market ? ` · ${order.market.flag} ${order.market.label}` : ""}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase text-slate-200">
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="text-sm text-slate-400">
                    <strong className="text-white">{formatInr(order.package.amountInPaise)}</strong> · {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <Link href={`/orders/${encodeURIComponent(order.id)}`} className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-black text-violet-100">
                    Open tracking
                  </Link>
                </div>
              </article>
            ))}
            {!orders.length ? (
              <div className="system-empty-state">
                <div>
                  <p className="font-black text-slate-300">No orders yet</p>
                  <p className="mt-2 text-sm">Browse the multi-game catalogue to create your first order.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="game-accounts" className="system-panel scroll-mt-24 p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black">Saved game accounts</h2>
            <ModuleStateBadge state="beta" />
          </div>
          <p className="mt-1 text-sm text-slate-500">Read-only destinations derived from account-owned orders.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {savedAccounts.map((order) => (
              <article key={`${order.gameSlug}-${order.player.playerId}-${order.player.zoneId}`} className="rounded-xl border border-white/8 bg-black/20 p-4">
                <h3 className="font-bold text-white">{gameLabel(order.gameSlug)}</h3>
                <p className="mt-2 break-all font-mono text-xs text-slate-300">{order.player.playerId}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{order.player.zoneId}</p>
              </article>
            ))}
            {!savedAccounts.length ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-600 sm:col-span-2">
                Saved accounts appear after an order is created.
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            ["wallet", "Wallet and credits", "Planned", "Store credits, refunds, and transaction history."],
            ["rewards", "Rewards", "Planned", "Points, tiers, referrals, and redemption rules."],
            ["redeem-codes", "Redeem-code history", "Planned", "Purchased codes, delivery status, and secure reveal history."],
            ["addresses", "Billing addresses", "Planned", "Saved addresses with customer-controlled editing and deletion."],
            ["support", "Support tickets", "Planned", "Create cases, attach evidence, receive replies, and track resolution."],
            ["notifications", "Notifications", "Planned", "Order, payment, fulfilment, security, and promotion preferences."],
            ["security", "Security and sessions", "Beta", "Current sign-out works. Device review and session revocation are next."],
          ].map(([id, title, state, description]) => (
            <section id={id} key={id} className="system-panel scroll-mt-24 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">{title}</h2>
                <ModuleStateBadge state={state === "Beta" ? "beta" : "planned"} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-xs font-bold text-slate-600">
                {state === "Beta" ? "Partially active" : "Not active yet"}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
