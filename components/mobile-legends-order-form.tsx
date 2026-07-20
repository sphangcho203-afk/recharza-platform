"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";

type VerificationState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type AccountState =
  | { status: "loading"; email: null }
  | { status: "guest"; email: null }
  | { status: "authenticated"; email: string };

type CreatedOrder = {
  id: string;
  status: string;
  package: { name: string; amountInPaise: number; currency: string };
  player: { playerId: string; zoneId: string; verificationMode: string };
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
  message: "Enter the player and zone IDs, then validate the destination.",
};

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return `rz_${globalThis.crypto.randomUUID()}`;
  return `rz_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

export function MobileLegendsOrderForm({ packages }: { packages: MobileLegendsPackage[] }) {
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
    setVerification({ status: "loading", message: "Checking player and zone details..." });
    resetOrderState();

    try {
      const response = await fetch("/api/games/mobile-legends/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, zoneId, packageId }),
      });
      const result = (await response.json()) as { valid: boolean; message: string };
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
    <form onSubmit={submitOrder} className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">01 · Package</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose your top-up</h2>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${usesLiveSupplierPricing ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
            {usesLiveSupplierPricing ? "Live supplier pricing" : "Protected fallback pricing"}
          </span>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {usesLiveSupplierPricing
            ? "Approved FazerCards offers are repriced by Recharza before checkout."
            : "Guarded fallback prices remain visible until approved supplier offers are synchronized."}
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
                className={`package-card relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 ${selected ? "border-violet-400 bg-violet-400/12 shadow-[0_0_0_1px_rgba(167,139,250,0.22),0_18px_50px_rgba(76,29,149,0.16)]" : "border-white/10 bg-black/15 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055]"}`}
              >
                {item.featured ? <span className="absolute right-3 top-3 rounded-full bg-violet-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">Popular</span> : null}
                <span className="block pr-16 text-sm font-bold text-white">{item.name}</span>
                <span className="mt-2 block text-2xl font-black tracking-tight text-white">{formatInr(item.amountInPaise)}</span>
                <span className="mt-2 block text-xs leading-5 text-slate-400">{item.description}</span>
                <span className="mt-4 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <span className="text-slate-500">{item.deliveryLabel}</span>
                  {item.region ? <span className="rounded-full border border-blue-300/15 bg-blue-300/10 px-2 py-1 text-blue-200">{item.region}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">02 · Account and player</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Confirm the destination</h2>

        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${account.status === "authenticated" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
          {account.status === "loading" ? "Checking verified account..." : account.status === "authenticated" ? <>Signed in as <strong>{account.email}</strong>. This account will own the order.</> : <><strong>Verified account required.</strong> <Link href="/account" className="underline underline-offset-4">Sign in by email</Link> before checkout.</>}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-200">
            Player ID
            <input required inputMode="numeric" autoComplete="off" value={playerId} onChange={(event) => { setPlayerId(event.target.value); resetVerification(); }} placeholder="Example: 123456789" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400" />
          </label>
          <label className="text-sm font-semibold text-slate-200">
            Zone ID
            <input required inputMode="numeric" autoComplete="off" value={zoneId} onChange={(event) => { setZoneId(event.target.value); resetVerification(); }} placeholder="Example: 2045" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400" />
          </label>
        </div>

        <button type="button" onClick={verifyPlayer} disabled={verification.status === "loading"} className="mt-4 w-full rounded-2xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 disabled:cursor-wait disabled:opacity-60">
          {verification.status === "loading" ? "Validating..." : "Validate player details"}
        </button>

        <div aria-live="polite" className={`mt-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${verification.status === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : verification.status === "error" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
          {verification.message}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <div className="flex items-center justify-between gap-4 p-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Order total</p><p className="mt-1 text-sm font-semibold text-white">{selectedPackage.name}</p></div>
            <p className="text-2xl font-black tracking-tight text-white">{formatInr(selectedPackage.amountInPaise)}</p>
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">The server resolves the package, price, supplier reference, and account owner again before writing the order.</div>
        </div>

        <button type="submit" disabled={isCreatingOrder || verification.status !== "success" || account.status !== "authenticated"} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
          {isCreatingOrder ? "Creating verified order..." : "Create verified order"}
        </button>

        {orderError ? <p aria-live="assertive" className="mt-3 text-sm text-rose-300">{orderError}</p> : null}

        {order ? (
          <div aria-live="polite" className="success-rise mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">{wasDuplicate ? "Existing order safely recovered" : "Verified order created"}</p>
            <p className="mt-2 break-all text-2xl font-black text-white">{order.id}</p>
            <p className="mt-3 text-sm text-emerald-100/80">{order.package.name} for {order.player.playerId} ({order.player.zoneId})</p>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-emerald-200">Private tracking token<textarea readOnly rows={3} value={order.tracking.accessToken} className="mt-2 w-full resize-none rounded-2xl border border-emerald-400/15 bg-black/20 px-3 py-3 font-mono text-xs font-normal normal-case tracking-normal text-emerald-100 outline-none" /></label>
            <p className="mt-2 text-xs leading-5 text-emerald-100/70">Keep this token private. Your verified account lists the order, while the token unlocks sensitive tracking details.</p>
            <Link href={order.tracking.path} className="mt-4 block rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center text-sm font-black text-emerald-100">Open secure order tracking</Link>
            <p className="mt-4 text-sm leading-6 text-emerald-100/80">{paymentMessage}</p>
          </div>
        ) : null}
      </section>
    </form>
  );
}
