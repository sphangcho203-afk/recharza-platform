"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useRef, useState } from "react";

import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";

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
    currency: string;
  };
  player: {
    playerId: string;
    zoneId: string;
    verificationMode: string;
  };
  persistence: "database";
  tracking: {
    path: string;
    accessToken: string;
  };
};

type OrderResponse = {
  ok: boolean;
  duplicate?: boolean;
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

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return `rz_${globalThis.crypto.randomUUID()}`;
  }

  return `rz_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

export function MobileLegendsOrderForm({
  packages,
}: {
  packages: MobileLegendsPackage[];
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [packageId, setPackageId] = useState(firstPackage.id);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [verification, setVerification] =
    useState<VerificationState>(initialVerification);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [wasDuplicate, setWasDuplicate] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId) ?? packages[0],
    [packageId, packages],
  );
  const usesLiveSupplierPricing = packages.some(
    (item) => item.source === "fazercards-live",
  );

  function resetOrderState() {
    idempotencyKey.current = null;
    setOrder(null);
    setWasDuplicate(false);
    setPaymentMessage("");
    setOrderError("");
  }

  function resetVerification() {
    setVerification(initialVerification);
    resetOrderState();
  }

  async function verifyPlayer() {
    setVerification({
      status: "loading",
      message: "Checking the player and zone ID format...",
    });
    resetOrderState();

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

    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
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

      sessionStorage.setItem(
        `recharza-order:${result.order.id}`,
        result.order.tracking.accessToken,
      );
      setOrder(result.order);
      setWasDuplicate(Boolean(result.duplicate));
      setPaymentMessage(
        result.paymentSession?.message ??
          "The persistent development order was created without charging a payment.",
      );
    } catch {
      setOrderError("The order service could not be reached. Retrying will not create a duplicate.");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <form
      onSubmit={submitOrder}
      className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]"
    >
      <section className="reveal-card rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              01 · Package
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose your top-up</h2>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
              usesLiveSupplierPricing
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : "border-amber-300/20 bg-amber-300/10 text-amber-200"
            }`}
          >
            {usesLiveSupplierPricing ? "Live supplier pricing" : "Protected fallback pricing"}
          </span>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {usesLiveSupplierPricing
            ? "Approved FazerCards offers are priced by Recharza's FX, fee, overhead, and profit policy."
            : "Live supplier credentials are not configured here, so the page uses guarded indicative supplier rates instead of unsafe old placeholders."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {packages.map((item, index) => {
            const selected = item.id === packageId;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setPackageId(item.id);
                  resetOrderState();
                }}
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                className={`package-card relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 ${
                  selected
                    ? "border-violet-400 bg-violet-400/12 shadow-[0_0_0_1px_rgba(167,139,250,0.22),0_18px_50px_rgba(76,29,149,0.16)]"
                    : "border-white/10 bg-black/15 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055]"
                }`}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {item.featured ? (
                  <span className="absolute right-3 top-3 rounded-full bg-violet-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                    Popular
                  </span>
                ) : null}
                <span className="block pr-16 text-sm font-bold text-white">{item.name}</span>
                <span className="mt-2 block text-2xl font-black tracking-tight text-white">
                  {formatInr(item.amountInPaise)}
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  {item.description}
                </span>
                <span className="mt-4 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <span className="text-slate-500">{item.deliveryLabel}</span>
                  {item.region ? (
                    <span className="rounded-full border border-blue-300/15 bg-blue-300/10 px-2 py-1 text-blue-200">
                      {item.region}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="reveal-card rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              02 · Player and receipt
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Confirm the destination</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20 text-xs font-black text-violet-200">
            ML
          </span>
        </div>

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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={verifyPlayer}
          disabled={verification.status === "loading"}
          className="mt-4 w-full rounded-2xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/16 disabled:cursor-wait disabled:opacity-60"
        >
          {verification.status === "loading" ? "Validating..." : "Validate player details"}
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
              resetOrderState();
            }}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Order total
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{selectedPackage.name}</p>
            </div>
            <p className="text-2xl font-black tracking-tight text-white">
              {formatInr(selectedPackage.amountInPaise)}
            </p>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">
            The server resolves this package again before writing the order. Browser prices are never trusted.
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreatingOrder || verification.status !== "success"}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_45px_rgba(139,92,246,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(139,92,246,0.36)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {isCreatingOrder ? "Creating protected order..." : "Create protected development order"}
        </button>

        {orderError ? (
          <p aria-live="assertive" className="mt-3 text-sm text-rose-300">
            {orderError}
          </p>
        ) : null}

        {order ? (
          <div
            aria-live="polite"
            className="success-rise mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              {wasDuplicate ? "Existing order safely recovered" : "Persistent order created"}
            </p>
            <p className="mt-2 break-all text-2xl font-black text-white">{order.id}</p>
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
                <dd className="mt-1 font-semibold capitalize text-slate-200">
                  {order.status.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Storage</dt>
                <dd className="mt-1 font-semibold text-slate-200">PostgreSQL</dd>
              </div>
            </dl>

            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-emerald-200">
              Private tracking token
              <textarea
                readOnly
                rows={3}
                value={order.tracking.accessToken}
                className="mt-2 w-full resize-none rounded-2xl border border-emerald-400/15 bg-black/20 px-3 py-3 font-mono text-xs font-normal normal-case tracking-normal text-emerald-100 outline-none"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-emerald-100/70">
              Keep this token private. It is required to open the persisted order timeline.
            </p>

            <Link
              href={order.tracking.path}
              className="mt-4 block rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15"
            >
              Open secure order tracking
            </Link>
            <p className="mt-4 text-sm leading-6 text-emerald-100/80">{paymentMessage}</p>
          </div>
        ) : null}
      </section>
    </form>
  );
}
