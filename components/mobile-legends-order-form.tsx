"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  formatInr,
  mobileLegendsPackages,
} from "@/lib/mobile-legends";

type VerificationState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type CreatedOrder = {
  id: string;
  status: string;
  package: {
    name: string;
    amountInPaise: number;
    currency: "INR";
  };
  player: {
    playerId: string;
    zoneId: string;
    verificationMode: "format-only";
  };
  persistence: "not_configured";
};

type OrderResponse = {
  ok: boolean;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: {
    provider: string;
    status: "development_only";
    checkoutUrl: null;
    message: string;
  };
};

const initialVerification: VerificationState = {
  status: "idle",
  message: "Enter the player and zone IDs, then validate the format.",
};

export function MobileLegendsOrderForm() {
  const [packageId, setPackageId] = useState(
    mobileLegendsPackages.find((item) => item.featured)?.id ??
      mobileLegendsPackages[0].id,
  );
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [verification, setVerification] =
    useState<VerificationState>(initialVerification);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [orderError, setOrderError] = useState("");

  const selectedPackage = useMemo(
    () =>
      mobileLegendsPackages.find((item) => item.id === packageId) ??
      mobileLegendsPackages[0],
    [packageId],
  );

  function resetVerification() {
    setVerification(initialVerification);
    setOrder(null);
    setPaymentMessage("");
    setOrderError("");
  }

  async function verifyPlayer() {
    setVerification({
      status: "loading",
      message: "Checking the player and zone ID format...",
    });
    setOrder(null);
    setOrderError("");

    try {
      const response = await fetch("/api/games/mobile-legends/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, zoneId }),
      });
      const result = (await response.json()) as {
        valid: boolean;
        message: string;
      };

      setVerification({
        status: result.valid ? "success" : "error",
        message: result.message,
      });
    } catch {
      setVerification({
        status: "error",
        message: "Verification could not be completed. Check your connection and retry.",
      });
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (verification.status !== "success") {
      setOrderError("Validate the player details before creating the order.");
      return;
    }

    setIsCreatingOrder(true);
    setOrderError("");
    setOrder(null);
    setPaymentMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: "mobile-legends",
          packageId,
          playerId,
          zoneId,
          customerEmail,
        }),
      });
      const result = (await response.json()) as OrderResponse;

      if (!response.ok || !result.ok || !result.order) {
        setOrderError(result.message ?? "The order could not be created.");
        return;
      }

      setOrder(result.order);
      setPaymentMessage(
        result.paymentSession?.message ??
          "The development order was created without charging a payment.",
      );
    } catch {
      setOrderError("The order service could not be reached. Please retry.");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <form
      onSubmit={submitOrder}
      className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-bold">Choose a package</h2>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
            Demo prices
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          These amounts are development placeholders. Final prices must come from the connected
          fulfilment provider before launch.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {mobileLegendsPackages.map((item) => {
            const selected = item.id === packageId;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setPackageId(item.id);
                  setOrder(null);
                  setPaymentMessage("");
                  setOrderError("");
                }}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-violet-400 bg-violet-400/10 shadow-[0_0_0_1px_rgba(167,139,250,0.2)]"
                    : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                {item.featured ? (
                  <span className="absolute right-3 top-3 rounded-full bg-violet-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                    Popular
                  </span>
                ) : null}
                <span className="block pr-16 text-sm font-bold text-white">{item.name}</span>
                <span className="mt-2 block text-xl font-black text-white">
                  {formatInr(item.amountInPaise)}
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Steps 2 to 4
        </p>
        <h2 className="mt-2 text-2xl font-bold">Player and order details</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-200">
            Player ID
            <input
              required
              inputMode="numeric"
              autoComplete="off"
              value={playerId}
              onChange={(event) => {
                setPlayerId(event.target.value);
                resetVerification();
              }}
              placeholder="Example: 123456789"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
            />
          </label>

          <label className="text-sm font-semibold text-slate-200">
            Zone ID
            <input
              required
              inputMode="numeric"
              autoComplete="off"
              value={zoneId}
              onChange={(event) => {
                setZoneId(event.target.value);
                resetVerification();
              }}
              placeholder="Example: 2045"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={verifyPlayer}
          disabled={verification.status === "loading"}
          className="mt-4 w-full rounded-2xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-wait disabled:opacity-60"
        >
          {verification.status === "loading" ? "Validating..." : "Validate player format"}
        </button>

        <div
          aria-live="polite"
          className={`mt-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
            verification.status === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : verification.status === "error"
                ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                : "border-white/10 bg-black/15 text-slate-400"
          }`}
        >
          {verification.message}
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-200">
          Receipt email
          <input
            required
            type="email"
            autoComplete="email"
            value={customerEmail}
            onChange={(event) => {
              setCustomerEmail(event.target.value);
              setOrder(null);
              setPaymentMessage("");
              setOrderError("");
            }}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
          />
        </label>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{selectedPackage.name}</p>
              <p className="mt-1 text-xs text-slate-500">Development checkout only</p>
            </div>
            <p className="text-xl font-black text-white">
              {formatInr(selectedPackage.amountInPaise)}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreatingOrder || verification.status !== "success"}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_40px_rgba(139,92,246,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {isCreatingOrder ? "Creating order..." : "Create development order"}
        </button>

        {orderError ? (
          <p aria-live="assertive" className="mt-3 text-sm text-rose-300">
            {orderError}
          </p>
        ) : null}

        {order ? (
          <div
            aria-live="polite"
            className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Development order created
            </p>
            <p className="mt-2 text-2xl font-black text-white">{order.id}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Package</dt>
                <dd className="mt-1 font-semibold text-slate-200">{order.package.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Player</dt>
                <dd className="mt-1 font-semibold text-slate-200">
                  {order.player.playerId} ({order.player.zoneId})
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-semibold text-slate-200">Awaiting provider</dd>
              </div>
              <div>
                <dt className="text-slate-500">Storage</dt>
                <dd className="mt-1 font-semibold text-slate-200">Not persisted yet</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-emerald-100/80">{paymentMessage}</p>
          </div>
        ) : null}
      </section>
    </form>
  );
}
