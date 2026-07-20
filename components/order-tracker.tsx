"use client";

import { type FormEvent, useState } from "react";

import { formatInr } from "@/lib/mobile-legends";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";

type TrackedOrder = {
  id: string;
  status: string;
  package: {
    name: string;
    amountInPaise: number;
    currency: string;
  };
  player: {
    playerId: string;
    zoneId: string;
    verificationMode: string;
  };
  customerEmail: string;
  paymentProvider: string | null;
  createdAt: string;
  updatedAt: string;
  events: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
};

type TrackingResponse = {
  ok: boolean;
  message?: string;
  order?: TrackedOrder;
};

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
    <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <form
        onSubmit={submit}
        className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
          Private order access
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">{orderId}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The order ID is public-facing. The access token is separate and should be kept private.
        </p>

        <label className="mt-6 block text-sm font-semibold text-slate-200">
          Access token
          <textarea
            required
            rows={4}
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="Paste the token issued after order creation"
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
          />
        </label>

        <button
          type="button"
          onClick={useSavedToken}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          Use saved token from this browser
        </button>

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
        >
          {status === "loading" ? "Loading order..." : "Open secure order"}
        </button>

        <p
          aria-live="polite"
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
            status === "error"
              ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
              : "border-white/10 bg-black/15 text-slate-400"
          }`}
        >
          {message}
        </p>
      </form>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        {order ? (
          <>
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Persisted order
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">{order.package.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {order.player.playerId} ({order.player.zoneId})
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                {order.status.replaceAll("_", " ")}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <dt className="text-slate-500">Amount</dt>
                <dd className="mt-1 text-lg font-black text-white">
                  {formatInr(order.package.amountInPaise)}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <dt className="text-slate-500">Receipt</dt>
                <dd className="mt-1 font-semibold text-white">{order.customerEmail}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <dt className="text-slate-500">Payment provider</dt>
                <dd className="mt-1 font-semibold text-white">
                  {order.paymentProvider ?? "Not assigned"}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="mt-1 font-semibold text-white">
                  {new Date(order.updatedAt).toLocaleString()}
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
              <h3 className="text-lg font-black text-white">Order timeline</h3>
              <div className="mt-4 space-y-3">
                {order.events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                        {event.type.replaceAll("_", " ")}
                      </p>
                      <time className="text-xs text-slate-600">
                        {new Date(event.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{event.message}</p>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
            <div>
              <p className="text-4xl font-black text-white/15">RZ</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The persisted order timeline appears here after token verification.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
