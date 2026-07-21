"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";
import type { MobileLegendsMarket } from "@/lib/mobile-legends-market";

type VerificationState =
  | { status: "idle"; message: string; nickname: null }
  | { status: "loading"; message: string; nickname: null }
  | { status: "success"; message: string; nickname: string | null }
  | { status: "error"; message: string; nickname: null };

type AccountState =
  | { status: "loading"; email: null }
  | { status: "guest"; email: null }
  | { status: "authenticated"; email: string };

type CreatedOrder = {
  id: string;
  status: string;
  market: { code: string; label: string } | null;
  package: { name: string; amountInPaise: number; currency: string };
  player: {
    playerId: string;
    zoneId: string;
    nickname: string | null;
    verificationMode: string;
  };
  persistence: "database";
  tracking: { path: string; accessToken: string };
};

type OrderResponse = {
  ok: boolean;
  duplicate?: boolean;
  code?: string;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: {
    provider: string | null;
    status: "not_started";
    checkoutUrl: null;
    message: string;
  };
};

const initialVerification: VerificationState = {
  status: "idle",
  message: "Enter the player and zone IDs, then validate the locked market destination.",
  nickname: null,
};

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return `rz_${globalThis.crypto.randomUUID()}`;
  return `rz_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

export function MobileLegendsOrderForm({
  packages,
  market,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [packageId, setPackageId] = useState(firstPackage.id);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [account, setAccount] = useState<AccountState>({ status: "loading", email: null });
  const [verification, setVerification] = useState<VerificationState>(initialVerification);
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
  const usesLiveSupplierPricing = packages.some((item) => item.source === "fazercards-live");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; customer?: { email?: string } }) => {
        if (!active) return;
        if (result.authenticated && result.customer?.email) {
          setAccount({ status: "authenticated", email: result.customer.email });
        } else {
          setAccount({ status: "guest", email: null });
        }
      })
      .catch(() => {
        if (active) setAccount({ status: "guest", email: null });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPackageId(firstPackage.id);
    setVerification(initialVerification);
    setOrder(null);
    setOrderError("");
    setPaymentMessage("");
    idempotencyKey.current = null;
  }, [firstPackage.id, market.code]);

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
      message: `Checking ${market.label} player and zone details...`,
      nickname: null,
    });
    resetOrderState();

    try {
      const response = await fetch("/api/games/mobile-legends/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          zoneId,
          packageId,
          marketCode: market.code,
        }),
      });
      const result = (await response.json()) as {
        valid: boolean;
        message: string;
        nickname?: string | null;
      };

      setVerification(
        result.valid
          ? {
              status: "success",
              message: result.message,
              nickname: result.nickname ?? null,
            }
          : { status: "error", message: result.message, nickname: null },
      );
    } catch {
      setVerification({
        status: "error",
        message: "Verification could not be completed. Check your connection and retry.",
        nickname: null,
      });
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (account.status !== "authenticated") {
      setOrderError("Sign in with a verified email before creating an order.");
      return;
    }
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
          marketCode: market.code,
        }),
      });
      const result = (await response.json()) as OrderResponse;

      if (!response.ok || !result.ok || !result.order) {
        setOrderError(result.message ?? "The order could not be created.");
        if (response.status === 401) setAccount({ status: "guest", email: null });
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
          "The verified order is saved. Continue from secure tracking when Test Mode is configured.",
      );
    } catch {
      setOrderError("The order service could not be reached. Retrying will not create a duplicate.");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <form onSubmit={submitOrder} className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">01 · Package</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose your top-up</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-100">
              {market.flag} {market.label} locked
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${usesLiveSupplierPricing ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
              {usesLiveSupplierPricing ? "Live pricing" : "Fallback pricing"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
          {packages.map((item) => {
            const selected = item.id === packageId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setPackageId(item.id);
                  resetVerification();
                }}
                className={`relative overflow-hidden rounded-2xl border p-3 text-left transition sm:p-4 ${selected ? "border-violet-400 bg-violet-400/12 shadow-[0_0_0_1px_rgba(167,139,250,0.2)]" : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.05]"}`}
              >
                {item.featured ? (
                  <span className="absolute right-2 top-2 rounded-full bg-violet-400/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-violet-200">Popular</span>
                ) : null}
                <span className="block pr-12 text-sm font-bold leading-5 text-white">{item.name}</span>
                <span className="mt-3 block text-xl font-black tracking-tight text-white sm:text-2xl">{formatInr(item.amountInPaise)}</span>
                <span className="mt-2 hidden text-xs leading-5 text-slate-400 sm:block">{item.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6 lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">02 · Account and player</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Confirm the destination</h2>

        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${account.status === "authenticated" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
          {account.status === "loading" ? (
            "Checking verified account..."
          ) : account.status === "authenticated" ? (
            <>Signed in as <strong>{account.email}</strong>.</>
          ) : (
            <><strong>Verified account required.</strong> <Link href="/account" className="underline underline-offset-4">Sign in by email</Link>.</>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-200">
            Player ID
            <input
              required
              inputMode="numeric"
              autoComplete="off"
              value={playerId}
              onChange={(event) => {
                setPlayerId(event.target.value.replace(/\D/g, ""));
                resetVerification();
              }}
              placeholder="Example: 123456789"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
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
                setZoneId(event.target.value.replace(/\D/g, ""));
                resetVerification();
              }}
              placeholder="Example: 2045"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={verifyPlayer}
          disabled={verification.status === "loading" || !playerId || !zoneId}
          className="mt-4 w-full rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verification.status === "loading" ? "Validating..." : `Validate ${market.label} player`}
        </button>

        <div aria-live="polite" className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-6 ${verification.status === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : verification.status === "error" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
          {verification.message}
          {verification.status === "success" && verification.nickname ? (
            <strong className="mt-1 block text-white">Nickname: {verification.nickname}</strong>
          ) : null}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <div className="grid grid-cols-[1fr_auto] gap-4 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Locked order</p>
              <p className="mt-1 text-sm font-semibold text-white">{selectedPackage.name}</p>
              <p className="mt-1 text-xs text-slate-500">{market.flag} {market.label} market</p>
            </div>
            <p className="self-center text-2xl font-black tracking-tight text-white">{formatInr(selectedPackage.amountInPaise)}</p>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">
            The server checks the market, package and price again before saving the order.
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreatingOrder || verification.status !== "success" || account.status !== "authenticated"}
          className="mt-4 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCreatingOrder ? "Creating verified order..." : `Create ${market.label} order`}
        </button>

        {orderError ? <p aria-live="assertive" className="mt-3 text-sm text-rose-300">{orderError}</p> : null}

        {order ? (
          <div aria-live="polite" className="success-rise mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">{wasDuplicate ? "Existing order safely recovered" : "Verified order created"}</p>
            <p className="mt-2 break-all text-xl font-black text-white">{order.id}</p>
            <p className="mt-2 text-sm text-emerald-100/80">
              {order.package.name} · {order.market?.label ?? market.label} · {order.player.nickname || order.player.playerId}
            </p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-emerald-200">
              Private tracking token
              <textarea readOnly rows={3} value={order.tracking.accessToken} className="mt-2 w-full resize-none rounded-xl border border-emerald-400/15 bg-black/20 px-3 py-3 font-mono text-xs font-normal normal-case tracking-normal text-emerald-100 outline-none" />
            </label>
            <p className="mt-2 text-xs leading-5 text-emerald-100/70">Keep this token private. It unlocks sensitive tracking details.</p>
            <Link href={order.tracking.path} className="mt-4 block rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center text-sm font-black text-emerald-100">Open secure order tracking</Link>
            <p className="mt-3 text-sm leading-6 text-emerald-100/80">{paymentMessage}</p>
          </div>
        ) : null}
      </section>
    </form>
  );
}
