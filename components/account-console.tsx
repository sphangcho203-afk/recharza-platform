"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

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

export function AccountConsole() {
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState<AccountCustomer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("Checking your account session...");
  const [isError, setIsError] = useState(false);
  const [developmentPreviewUrl, setDevelopmentPreviewUrl] = useState("");

  async function loadAccount() {
    setLoading(true);
    setIsError(false);
    try {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await sessionResponse.json()) as SessionResponse;
      if (!sessionResponse.ok || !session.ok || !session.authenticated || !session.customer) {
        setCustomer(null);
        setOrders([]);
        setMessage("Enter your email to receive a one-time sign-in link.");
        return;
      }

      setCustomer(session.customer);
      setMessage("Verified account session active.");
      const ordersResponse = await fetch("/api/account/orders", { cache: "no-store" });
      const orderResult = (await ordersResponse.json()) as OrdersResponse;
      setOrders(orderResult.ok && orderResult.orders ? orderResult.orders : []);
      if (!ordersResponse.ok || !orderResult.ok) {
        setIsError(true);
        setMessage(orderResult.message ?? "Order history could not be loaded.");
      }
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
    void loadAccount();
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
    return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-sm text-slate-400">Loading account...</div>;
  }

  if (!customer) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/25 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Verified email access</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">Sign in without a password.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Recharza sends a one-time link that verifies email ownership and creates a private HTTP-only session.</p>
        <form onSubmit={requestLink} className="mt-6">
          <label className="text-sm font-semibold text-slate-200">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
            />
          </label>
          <button disabled={sending} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
            {sending ? "Preparing link..." : "Email me a secure sign-in link"}
          </button>
        </form>
        <p aria-live="polite" className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>{message}</p>
        {developmentPreviewUrl ? (
          <a href={developmentPreviewUrl} className="mt-3 block rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm font-black text-amber-100">Open development sign-in link</a>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Verified account</p>
            <h2 className="mt-2 text-3xl font-black">{customer.displayName || customer.username || customer.email}</h2>
            <p className="mt-2 text-sm text-slate-400">{customer.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">{customer.role}</span>
            {customer.role !== "customer" ? <Link href="/operator" className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-xs font-black text-violet-100">Open operator</Link> : null}
            <button type="button" onClick={logout} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200">Sign out</button>
          </div>
        </div>
        <p className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-400">{message}</p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Your orders</p><h2 className="mt-2 text-2xl font-black">Verified-account history</h2></div>
          <button type="button" onClick={() => void loadAccount()} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200">Refresh</button>
        </div>
        <div className="mt-5 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">{order.id}</p><h3 className="mt-2 text-xl font-black">{order.package.name}</h3><p className="mt-1 text-sm text-slate-400">Player {order.player.nickname || order.player.playerId} ({order.player.zoneId})</p></div>
                <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase text-slate-200">{order.status.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="text-sm text-slate-400"><strong className="text-white">{formatInr(order.package.amountInPaise)}</strong> · {new Date(order.createdAt).toLocaleDateString()} · {order.fulfilmentAttempts} fulfilment attempt(s)</div>
                <Link href={`/orders/${encodeURIComponent(order.id)}`} className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100">Open tracking</Link>
              </div>
            </article>
          ))}
          {!orders.length ? <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-slate-500">No orders are linked to this verified account yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
