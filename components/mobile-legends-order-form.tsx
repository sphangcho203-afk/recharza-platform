"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  BillingAddressFields,
  initialBillingForm,
  type BillingFormState,
} from "@/components/billing-address-fields";
import { ProductOfferCard } from "@/components/product-offer-card";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";
import type { MobileLegendsMarket } from "@/lib/mobile-legends-market";

type VerificationState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  nickname: string | null;
};

type AccountState =
  | { status: "loading"; email: null }
  | { status: "guest"; email: null }
  | { status: "authenticated"; email: string };

type FxSnapshot = {
  base: "INR";
  mode: "live" | "inr-only";
  source: string;
  quotedAt: string;
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>;
};

type CreatedOrder = {
  id: string;
  status: string;
  market: { code: string; label: string } | null;
  package: { name: string; amountInPaise: number; currency: string };
  presentment?: {
    amountMinor: number;
    currency: SupportedCurrencyCode;
    fxQuotedAt: string | null;
  } | null;
  billing?: {
    fullName: string;
    countryCode: string;
    city: string;
  } | null;
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
  message?: string;
  order?: CreatedOrder;
  paymentSession?: { message: string };
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
  fxSnapshot,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
  fxSnapshot: FxSnapshot;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [packageId, setPackageId] = useState(firstPackage?.id ?? "");
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [billing, setBilling] = useState<BillingFormState>(() => ({
    ...initialBillingForm,
    presentmentCurrency:
      fxSnapshot.mode === "live" ? market.defaultCurrency : "INR",
  }));
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
  const selectedRate = fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert = billing.presentmentCurrency === "INR" || selectedRate > 0;

  function formatPresentment(amountInPaise: number) {
    if (billing.presentmentCurrency === "INR" || !selectedRate) return formatInr(amountInPaise);
    return formatCurrencyMinor(
      convertInrPaiseToCurrencyMinor(
        amountInPaise,
        billing.presentmentCurrency,
        selectedRate,
      ),
      billing.presentmentCurrency,
    );
  }

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; customer?: { email?: string } }) => {
        if (!active) return;
        if (result.authenticated && result.customer?.email) {
          setAccount({ status: "authenticated", email: result.customer.email });
          setBilling((current) => current.email ? current : { ...current, email: result.customer!.email! });
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
        body: JSON.stringify({ playerId, zoneId, packageId, marketCode: market.code }),
      });
      const result = (await response.json()) as {
        valid: boolean;
        message: string;
        nickname?: string | null;
      };

      setVerification({
        status: result.valid ? "success" : "error",
        message: result.message,
        nickname: result.valid ? (result.nickname ?? null) : null,
      });
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
    if (!selectedPackage) {
      setOrderError("Choose an available package before creating the order.");
      return;
    }
    if (!canConvert) {
      setOrderError("The selected currency quote is unavailable. Choose INR or refresh the page.");
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
          billing: {
            ...billing,
            presentmentCurrency:
              fxSnapshot.mode === "live" ? billing.presentmentCurrency : "INR",
          },
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

  if (!selectedPackage) {
    return (
      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
        No approved packages are available for this market yet. Run a reviewed supplier sync or choose another market.
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,124,255,0.14),transparent_42%),rgba(255,255,255,0.04)] p-4 shadow-2xl shadow-black/20 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">01 · Package</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Choose a regional offer</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Each offer uses supplier media first, then a verified product-specific image fallback.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-bold text-blue-100">
              {market.flag} {market.label} version
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${usesLiveSupplierPricing ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
              {usesLiveSupplierPricing ? "Live supplier pricing" : "Indicative fallback pricing"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {packages.map((item) => (
            <ProductOfferCard
              key={item.id}
              item={item}
              selected={item.id === packageId}
              displayPrice={formatPresentment(item.amountInPaise)}
              settlementPrice={billing.presentmentCurrency !== "INR" ? formatInr(item.amountInPaise) : undefined}
              onSelect={() => {
                setPackageId(item.id);
                resetVerification();
              }}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">02 · Player destination</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Verify the game account</h2>

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
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
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
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={verifyPlayer}
            disabled={verification.status === "loading" || !playerId || !zoneId}
            className="mt-4 min-h-12 w-full rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verification.status === "loading" ? "Validating..." : `Validate ${market.label} player`}
          </button>

          <div aria-live="polite" className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-6 ${verification.status === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : verification.status === "error" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-white/10 bg-black/15 text-slate-400"}`}>
            {verification.message}
            {verification.status === "success" && verification.nickname ? (
              <strong className="mt-1 block text-white">Nickname: {verification.nickname}</strong>
            ) : null}
          </div>
        </section>

        <BillingAddressFields value={billing} onChange={setBilling} fxMode={fxSnapshot.mode} />
      </div>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(17,17,29,0.98),rgba(8,8,16,0.98))] shadow-2xl shadow-black/30">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">04 · Review</p>
            <h2 className="mt-2 text-2xl font-black">Confirm the protected order snapshot</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{market.flag} {market.label}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{selectedPackage.name}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Billing {billing.countryCode}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Display {billing.presentmentCurrency}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              The server rechecks the supplier offer, market, INR amount, currency quote and billing fields before saving anything.
            </p>
          </div>
          <div className="min-w-56 rounded-2xl border border-white/10 bg-black/25 p-4 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Displayed total</p>
            <p className="mt-1 text-3xl font-black text-white">{formatPresentment(selectedPackage.amountInPaise)}</p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs text-slate-500">Settlement {formatInr(selectedPackage.amountInPaise)}</p>
            ) : null}
            <p className="mt-2 text-[10px] text-slate-600">FX snapshot {new Date(fxSnapshot.quotedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="border-t border-white/10 p-4 sm:p-6">
          <button
            type="submit"
            disabled={isCreatingOrder || verification.status !== "success" || account.status !== "authenticated" || !canConvert}
            className="min-h-13 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isCreatingOrder ? "Creating protected order..." : `Create ${market.label} order`}
          </button>

          {orderError ? <p aria-live="assertive" className="mt-3 text-sm text-rose-300">{orderError}</p> : null}

          {order ? (
            <div aria-live="polite" className="success-rise mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">{wasDuplicate ? "Existing order safely recovered" : "Verified order created"}</p>
              <p className="mt-2 break-all text-xl font-black text-white">{order.id}</p>
              <p className="mt-2 text-sm text-emerald-100/80">
                {order.package.name} · {order.market?.label ?? market.label} · {order.player.nickname || order.player.playerId}
              </p>
              {order.presentment ? (
                <p className="mt-2 text-sm font-bold text-emerald-100">
                  Displayed {formatCurrencyMinor(order.presentment.amountMinor, order.presentment.currency)} · Settlement {formatInr(order.package.amountInPaise)}
                </p>
              ) : null}
              <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-emerald-200">
                Private tracking token
                <textarea readOnly rows={3} value={order.tracking.accessToken} className="mt-2 w-full resize-none rounded-xl border border-emerald-400/15 bg-black/20 px-3 py-3 font-mono text-xs font-normal normal-case tracking-normal text-emerald-100 outline-none" />
              </label>
              <p className="mt-2 text-xs leading-5 text-emerald-100/70">Keep this token private. It unlocks sensitive tracking details.</p>
              <Link href={order.tracking.path} className="mt-4 block min-h-12 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-center text-sm font-black text-emerald-100">Open secure order tracking</Link>
              <p className="mt-3 text-sm leading-6 text-emerald-100/80">{paymentMessage}</p>
            </div>
          ) : null}
        </div>
      </section>
    </form>
  );
}
