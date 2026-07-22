"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { formatInr } from "@/lib/mobile-legends";

type AccountCustomer = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: "customer" | "staff" | "admin";
  emailVerified: boolean;
};

type AccountOrder = {
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

type SessionResponse = {
  ok: boolean;
  authenticated: boolean;
  customer?: AccountCustomer;
  message?: string;
};

type OrdersResponse = {
  ok: boolean;
  orders?: AccountOrder[];
  message?: string;
};

async function fetchAccountSnapshot() {
  const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
  const session = (await sessionResponse.json()) as SessionResponse;

  if (!sessionResponse.ok || !session.ok || !session.authenticated || !session.customer) {
    return {
      customer: null,
      orders: [] as AccountOrder[],
      message: "Enter your email to receive a one-time sign-in link.",
      isError: false,
    };
  }

  const ordersResponse = await fetch("/api/account/orders", { cache: "no-store" });
  const orderResult = (await ordersResponse.json()) as OrdersResponse;

  return {
    customer: session.customer,
    orders: orderResult.ok && orderResult.orders ? orderResult.orders : [],
    message:
      ordersResponse.ok && orderResult.ok
        ? "Verified account session active."
        : orderResult.message ?? "Order history could not be loaded.",
    isError: !ordersResponse.ok || !orderResult.ok,
  };
}

export function AccountConsole() {
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState<AccountCustomer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("Checking your account session...");
  const [isError, setIsError] = useState(false);
  const [developmentPreviewUrl, setDevelopmentPreviewUrl] = useState("");

  const savedPlayers = useMemo(() => {
    const unique = new Map<string, AccountOrder>();
    for (const order of orders) {
      const key = `${order.gameSlug}:${order.market?.code ?? "global"}:${order.player.playerId}:${order.player.zoneId}`;
      if (!unique.has(key)) unique.set(key, order);
    }
    return Array.from(unique.values()).slice(0, 4);
  }, [orders]);

  const favoriteGames = useMemo(
    () => Array.from(new Set(orders.map((order) => order.gameSlug))).slice(0, 4),
    [orders],
  );

  async function loadAccount() {
    setLoading(true);
    setIsError(false);

    try {
      const snapshot = await fetchAccountSnapshot();
      setCustomer(snapshot.customer);
      setOrders(snapshot.orders);
      setMessage(snapshot.message);
      setIsError(snapshot.isError);
    } catch {
      setCustomer(null);
      setOrders([]);
      setIsError(true);
      setMessage("The account service could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetchAccountSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setCustomer(snapshot.customer);
        setOrders(snapshot.orders);
        setMessage(snapshot.message);
        setIsError(snapshot.isError);
      })
      .catch(() => {
        if (!active) return;
        setCustomer(null);
        setOrders([]);
        setIsError(true);
        setMessage("The account service could not be reached.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setIsError(false);
    setDevelopmentPreviewUrl("");
    setMessage("Preparing a secure sign-in link...");

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
      setIsError(!response.ok || !result.ok);
      setMessage(result.message ?? "Check your email for the secure sign-in link.");
      setDevelopmentPreviewUrl(result.developmentPreviewUrl ?? "");
    } catch {
      setIsError(true);
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
        <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/25 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Verified email access</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in without a password.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          A one-time link verifies email ownership and opens your private customer dashboard.
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
            isError
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

  const internalDestination = customer.role === "admin" ? "/admin" : "/staff";
  const rewardPoints = orders.length * 120;

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Verified customer account</p>
            <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
              {customer.displayName || customer.username || customer.email}
            </h2>
            <p className="mt-2 break-all text-sm text-slate-400">{customer.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              {customer.role}
            </span>
            {customer.role !== "customer" ? (
              <Link href={internalDestination} className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 py-3 text-xs font-black text-violet-100">
                Open {customer.role} workspace
              </Link>
            ) : null}
            <button type="button" onClick={logout} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-black text-slate-200">
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Account summary">
        {[
          ["Orders", String(orders.length), "Linked to this account"],
          ["Saved players", String(savedPlayers.length), "Recovered from order history"],
          ["Reward points", String(rewardPoints), "Demo rewards balance"],
          ["Support tickets", "0", "No open customer requests"],
        ].map(([label, value, note]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-600">{note}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="grid min-w-0 gap-6">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Your orders</p>
                <h2 className="mt-2 text-2xl font-black">Order history</h2>
              </div>
              <div className="flex gap-2">
                <Link href="/games/mobile-legends" className="min-h-11 rounded-xl bg-white px-3 py-3 text-xs font-black text-slate-950 hover:bg-violet-200">
                  New top-up
                </Link>
                <button type="button" onClick={() => void loadAccount()} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-black text-slate-200">
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="break-all text-xs font-bold uppercase tracking-[0.12em] text-violet-300">{order.id}</p>
                      <h3 className="mt-2 text-xl font-black">{order.package.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {order.market ? `${order.market.flag} ${order.market.label} · ` : ""}
                        Player {order.player.nickname || order.player.playerId} ({order.player.zoneId})
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase text-slate-200">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div className="text-sm text-slate-400">
                      <strong className="text-white">{formatInr(order.package.amountInPaise)}</strong>{" "}
                      · {new Date(order.createdAt).toLocaleDateString()} · {order.fulfilmentAttempts} fulfilment attempt(s)
                    </div>
                    <Link href={`/orders/${encodeURIComponent(order.id)}`} className="min-h-11 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-xs font-black text-violet-100">
                      Open tracking
                    </Link>
                  </div>
                </article>
              ))}
              {!orders.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-500">
                  No orders are linked to this verified account yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Saved player accounts</h2>
                <p className="mt-1 text-sm text-slate-500">Player details recovered safely from your account-owned orders.</p>
              </div>
              <button type="button" className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-bold text-slate-300 hover:bg-white/5">
                Add player
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {savedPlayers.map((order) => (
                <article key={`${order.player.playerId}-${order.player.zoneId}-${order.market?.code ?? "global"}`} className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate font-bold text-white">{order.player.nickname || "Mobile Legends player"}</h3>
                    {order.market ? <span className="shrink-0 text-sm" title={order.market.label}>{order.market.flag}</span> : null}
                  </div>
                  <p className="mt-3 break-all font-mono text-sm text-slate-300">{order.player.playerId} ({order.player.zoneId})</p>
                  <p className="mt-2 text-xs text-slate-600">{order.market?.label ?? "Global"} market</p>
                </article>
              ))}
              {!savedPlayers.length ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-600 sm:col-span-2">
                  Saved players will appear after an account-owned order is created.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Profile</h2>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-600">Display name</p>
                <p className="mt-1 font-bold text-white">{customer.displayName || customer.username || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Verified email</p>
                <p className="mt-1 break-all text-slate-300">{customer.email}</p>
              </div>
              <button type="button" className="min-h-11 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5">
                Edit profile
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Favorite games</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {favoriteGames.length ? favoriteGames.map((game) => (
                <span key={game} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">
                  {game.replaceAll("-", " ")}
                </span>
              )) : <p className="text-sm text-slate-600">Your played games will appear here.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Notifications</h2>
            <div className="mt-4 grid gap-3">
              <article className="rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-sm font-bold text-white">Account secured</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Your verified email session is active.</p>
              </article>
              <article className="rounded-xl border border-violet-300/10 bg-violet-300/[0.05] p-3">
                <p className="text-sm font-bold text-violet-100">Rewards progress</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">You currently have {rewardPoints} demo reward points.</p>
              </article>
            </div>
          </section>

          <section id="support" className="scroll-mt-24 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-5">
            <h2 className="text-lg font-black">Support</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Get help with an order, player ID, payment, or fulfilment problem.</p>
            <button type="button" className="mt-4 min-h-11 w-full rounded-xl bg-white px-4 text-xs font-black text-slate-950 hover:bg-violet-200">
              Create support ticket
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#10101a] p-5">
            <h2 className="text-lg font-black">Security and sessions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review account access and sign out sessions you no longer recognize.</p>
            <button type="button" className="mt-4 min-h-11 w-full rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5">
              Manage sessions
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}