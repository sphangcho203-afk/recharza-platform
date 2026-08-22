"use client";

import { type FormEvent, useState } from "react";

import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { formatInr } from "@/lib/mobile-legends";

type TrackedOrder = {
  id: string;
  status: string;
  gameSlug: string;
  market: { code: string; label: string; flag: string | null } | null;
  package: {
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
  supplier: {
    categoryAttached: boolean;
    offerAttached: boolean;
  };
  createdAt: string;
  updatedAt: string;
  events: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
  fulfilment: Array<{
    id: string;
    provider: string;
    mode: string;
    status: string;
    providerOrderId: string | null;
    errorMessage: string | null;
    submittedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

type TrackingResponse = {
  ok: boolean;
  message?: string;
  order?: TrackedOrder;
};

const gameLabels: Record<string, string> = {
  "mobile-legends": "Mobile Legends",
  "free-fire": "Free Fire MAX",
  "pubg-mobile": "PUBG Mobile",
  valorant: "VALORANT",
  "genshin-impact": "Genshin Impact",
};

function getGameLabel(gameSlug: string) {
  return (
    gameLabels[gameSlug] ??
    gameSlug
      .replaceAll("-", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getDestinationLabel(order: TrackedOrder) {
  if (order.player.nickname) {
    return order.player.zoneId
      ? `${order.player.nickname} · ${order.player.playerId} (${order.player.zoneId})`
      : `${order.player.nickname} · ${order.player.playerId}`;
  }

  if (order.gameSlug === "genshin-impact" && order.player.zoneId) {
    return `${order.player.playerId} · ${order.player.zoneId}`;
  }

  return order.player.zoneId
    ? `${order.player.playerId} (${order.player.zoneId})`
    : order.player.playerId;
}

function getMarketLabel(order: TrackedOrder) {
  if (!order.market) return "Not specified";
  return order.market.flag
    ? `${order.market.flag} ${order.market.label}`
    : order.market.label;
}

export function OrderTracker({ orderId }: { orderId: string }) {
  const [accessToken, setAccessToken] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState(
    "Enter the private access token issued when this order was created.",
  );

  async function loadOrder(token: string) {
    if (!token.trim()) {
      setStatus("error");
      setMessage("An order access token is required.");
      return;
    }

    setStatus("loading");
    setMessage("Loading the persisted order timeline...");

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
        cache: "no-store",
      });
      const result = (await response.json()) as TrackingResponse;

      if (!response.ok || !result.ok || !result.order) {
        setOrder(null);
        setStatus("error");
        setMessage(result.message ?? "The order could not be loaded.");
        return;
      }

      setOrder(result.order);
      setStatus("idle");
      setMessage("Order access verified.");
    } catch {
      setOrder(null);
      setStatus("error");
      setMessage("The tracking service could not be reached.");
    }
  }

  function useSavedToken() {
    const storedToken = sessionStorage.getItem(`recharza-order:${orderId}`);

    if (!storedToken) {
      setStatus("error");
      setMessage("No saved token was found in this browser session.");
      return;
    }

    setAccessToken(storedToken);
    void loadOrder(storedToken);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sessionStorage.setItem(`recharza-order:${orderId}`, accessToken.trim());
    void loadOrder(accessToken);
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <form
        onSubmit={submit}
        className="min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
          Private order access
        </p>
        <h2 className="mt-2 break-all text-xl font-bold tracking-tight text-white sm:text-2xl">
          {orderId}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400 font-medium">
          Your account may list the order. This separate token unlocks its
          sensitive timeline.
        </p>

        <label className="mt-5 block text-sm font-bold text-white">
          Access token
          <textarea
            required
            rows={4}
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="Paste the token issued after order creation"
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm font-medium text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 shadow-sm"
          />
        </label>

        <button
          type="button"
          onClick={useSavedToken}
          className="mt-3 min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
        >
          Use saved token from this browser
        </button>
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-3 min-h-12 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] disabled:cursor-wait disabled:opacity-60"
        >
          {status === "loading" ? "Loading order..." : "Open secure order"}
        </button>

        <p
          aria-live="polite"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 font-medium ${
            status === "error"
              ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
              : "border-white/5 bg-white/5 text-slate-400"
          }`}
        >
          {message}
        </p>
      </form>

      <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:p-6">
        {order ? (
          <>
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                  {getGameLabel(order.gameSlug)} order
                </p>
                <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {order.package.name}
                </h2>
                <p className="mt-2 break-words text-sm text-slate-400 font-medium">
                  {order.market ? `${getMarketLabel(order)} · ` : ""}
                  {getDestinationLabel(order)}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-bold">
                  Validation: {order.player.verificationMode.replaceAll("-", " ")}
                </p>
              </div>
              <span className="w-fit shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 shadow-sm">
                {order.status.replaceAll("_", " ")}
              </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount</dt>
                <dd className="mt-1 text-lg font-bold text-white">
                  {formatInr(order.package.amountInPaise)}
                </dd>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Market</dt>
                <dd className="mt-1 break-words font-bold text-white">
                  {getMarketLabel(order)}
                </dd>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Receipt</dt>
                <dd className="mt-1 break-words font-bold text-white">
                  {order.customerEmail}
                </dd>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier product</dt>
                <dd className="mt-1 font-bold text-white">
                  {order.supplier.offerAttached
                    ? "Approved offer attached"
                    : "Indicative / not attached"}
                </dd>
              </div>
            </dl>

            <RazorpayTestCheckout
              orderId={order.id}
              orderStatus={order.status}
              accessToken={accessToken.trim()}
              amountInPaise={order.package.amountInPaise}
              packageName={order.package.name}
              onVerified={() => loadOrder(accessToken)}
            />

            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Fulfilment</h3>
                <span className="text-xs text-slate-500 font-bold">
                  {order.fulfilment.length} attempt(s)
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {order.fulfilment.map((attempt, index) => (
                  <article
                    key={attempt.id}
                    className={`rounded-xl border p-4 shadow-sm ${
                      attempt.status === "failed"
                        ? "border-rose-500/20 bg-rose-500/10"
                        : attempt.mode === "dry_run"
                          ? "border-amber-500/20 bg-amber-500/10"
                          : "border-emerald-500/20 bg-emerald-500/10"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <p className="text-xs font-bold uppercase tracking-wider text-white">
                        Attempt {index + 1} · {attempt.mode.replaceAll("_", " ")}
                      </p>
                      <span className={`text-xs font-bold uppercase ${
                        attempt.status === "failed" ? "text-rose-400" : 
                        attempt.status === "completed" ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        {attempt.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className={`mt-2 break-words text-sm leading-6 font-medium ${
                      attempt.status === "failed" ? "text-rose-400/80" : "text-slate-400"
                    }`}>
                      {attempt.status === "planned"
                        ? "A safe supplier request plan is stored. No supplier write occurred."
                        : attempt.status === "failed"
                          ? attempt.errorMessage ??
                            "The supplier attempt failed and needs staff review."
                          : attempt.providerOrderId
                            ? `Supplier order ${attempt.providerOrderId}`
                            : "The supplier attempt is being processed."}
                    </p>
                    <time className="mt-2 block text-xs text-slate-500 font-bold">
                      {new Date(attempt.updatedAt).toLocaleString()}
                    </time>
                  </article>
                ))}
                {!order.fulfilment.length ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-500 font-medium text-center">
                    Fulfilment begins only after a verified paid webhook.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="text-lg font-bold text-white">Order timeline</h3>
              <div className="mt-4 space-y-3">
                {order.events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <p className="break-words text-xs font-bold uppercase tracking-wider text-violet-400">
                        {event.type.replaceAll("_", " ")}
                      </p>
                      <time className="text-xs text-slate-500 font-bold">
                        {new Date(event.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-400 font-medium">
                      {event.message}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white/10">RZ</p>
              <p className="mt-3 text-sm leading-6 text-slate-500 font-medium">
                The persisted order timeline appears here after token
                verification.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
