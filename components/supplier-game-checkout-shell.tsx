"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useRef, useState } from "react";

import {
  BillingAddressFields,
  initialBillingForm,
  type BillingFormState,
} from "@/components/billing-address-fields";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import {
  getSupplierSelectOptions,
  validateSupplierCheckoutIdentity,
} from "@/lib/commerce/game-identity";
import { formatInr } from "@/lib/mobile-legends";
import type { SupplierCheckoutGameSlug } from "@/lib/storefront-game-catalog";

type CheckoutPackage = {
  id: string;
  gameSlug: SupplierCheckoutGameSlug;
  name: string;
  description: string;
  amountInPaise: number;
  marketCode: string;
  marketLabel: string;
  region: string | null;
  fields: unknown;
};

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
  package: {
    id: string;
    name: string;
    amountInPaise: number;
    currency: string;
  };
  presentment: {
    amountMinor: number;
    currency: SupportedCurrencyCode;
    fxQuotedAt: string | null;
  } | null;
  billing: {
    fullName: string;
    email: string;
    countryCode: string;
    city: string;
  } | null;
  player: {
    playerId: string;
    zoneId: string;
    nickname: string | null;
    verificationMode: string;
  };
  tracking: {
    path: string;
    accessToken: string;
  };
};

type CheckoutResponse = {
  ok: boolean;
  duplicate?: boolean;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: {
    message?: string;
  };
};

type IdentityState = {
  playerId: string;
  riotId: string;
  serverId: string;
};

const initialIdentity: IdentityState = {
  playerId: "",
  riotId: "",
  serverId: "",
};

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return `rz_${globalThis.crypto.randomUUID()}`;
  }
  return `rz_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

function billingIsComplete(billing: BillingFormState) {
  return Boolean(
    billing.fullName.trim() &&
      billing.email.trim() &&
      billing.phone.trim() &&
      billing.line1.trim() &&
      billing.city.trim() &&
      billing.state.trim() &&
      billing.postalCode.trim() &&
      billing.countryCode &&
      billing.presentmentCurrency,
  );
}

export function SupplierGameCheckoutShell({
  gameSlug,
  gameTitle,
  packages,
  fxSnapshot,
}: {
  gameSlug: SupplierCheckoutGameSlug;
  gameTitle: string;
  packages: CheckoutPackage[];
  fxSnapshot: FxSnapshot;
}) {
  const markets = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of packages) map.set(item.marketCode, item.marketLabel);
    return Array.from(map, ([code, label]) => ({ code, label }));
  }, [packages]);
  const firstMarketCode = markets[0]?.code ?? "";
  const [marketCode, setMarketCode] = useState(firstMarketCode);
  const marketPackages = useMemo(
    () => packages.filter((item) => item.marketCode === marketCode),
    [marketCode, packages],
  );
  const [packageId, setPackageId] = useState(
    packages.find((item) => item.marketCode === firstMarketCode)?.id ?? "",
  );
  const [identity, setIdentity] = useState<IdentityState>(initialIdentity);
  const [billing, setBilling] = useState<BillingFormState>(initialBillingForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  const selectedPackage =
    marketPackages.find((item) => item.id === packageId) ?? marketPackages[0];
  const serverOptions = getSupplierSelectOptions(selectedPackage?.fields, /server/);
  const identityResult = selectedPackage
    ? validateSupplierCheckoutIdentity(gameSlug, identity, selectedPackage.fields)
    : null;
  const selectedRate = fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert = billing.presentmentCurrency === "INR" || selectedRate > 0;
  const canSubmit = Boolean(
    selectedPackage &&
      identityResult?.valid &&
      billingIsComplete(billing) &&
      canConvert,
  );

  function resetOrder() {
    idempotencyKey.current = null;
    setOrder(null);
    setPaymentVerified(false);
    setMessage("");
    setError("");
  }

  function chooseMarket(nextMarketCode: string) {
    const nextPackage = packages.find((item) => item.marketCode === nextMarketCode);
    setMarketCode(nextMarketCode);
    setPackageId(nextPackage?.id ?? "");
    setIdentity(initialIdentity);
    resetOrder();
  }

  function formatPresentment(amountInPaise: number) {
    if (billing.presentmentCurrency === "INR" || !selectedRate) {
      return formatInr(amountInPaise);
    }
    return formatCurrencyMinor(
      convertInrPaiseToCurrencyMinor(
        amountInPaise,
        billing.presentmentCurrency,
        selectedRate,
      ),
      billing.presentmentCurrency,
    );
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !selectedPackage || !identityResult?.valid) {
      setError(
        identityResult && !identityResult.valid
          ? identityResult.message
          : "Complete the player, package, billing and payment details before continuing.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("Creating the protected order...");
    setOrder(null);
    setPaymentVerified(false);

    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/checkout/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({
          gameSlug,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          identity,
          billing: {
            ...billing,
            presentmentCurrency:
              fxSnapshot.mode === "live" ? billing.presentmentCurrency : "INR",
          },
        }),
      });
      const result = (await response.json()) as CheckoutResponse;

      if (!response.ok || !result.ok || !result.order) {
        setError(result.message ?? "The checkout could not create an order.");
        setMessage("");
        return;
      }

      sessionStorage.setItem(
        `recharza-order:${result.order.id}`,
        result.order.tracking.accessToken,
      );
      setOrder(result.order);
      setMessage(
        result.paymentSession?.message ??
          "Order saved. Select a method in secure checkout and complete payment.",
      );
    } catch {
      setError(
        "The checkout service could not be reached. Retrying uses the same protected order key.",
      );
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedPackage) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
        <div>
          <p className="font-black">This market is not available yet.</p>
          <p className="mt-1 text-amber-100/70">
            No curated supplier packs are published for this game and region.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitCheckout} className="mx-auto grid max-w-6xl gap-5">
      {markets.length > 1 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Account market
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Choose the exact region used by the game account.
              </p>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {markets.map((market) => (
                <button
                  key={market.code}
                  type="button"
                  onClick={() => chooseMarket(market.code)}
                  className={`min-h-10 shrink-0 rounded-xl border px-4 py-2 text-sm font-black transition ${
                    market.code === marketCode
                      ? "border-violet-400/50 bg-violet-400/15 text-white"
                      : "border-white/10 bg-black/20 text-slate-400 hover:text-white"
                  }`}
                >
                  {market.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          01 · Player ID
        </p>
        <h2 className="mt-2 text-2xl font-black">Confirm where the pack goes</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {gameSlug === "valorant" ? (
            <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
              Riot ID
              <input
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                value={identity.riotId}
                onChange={(event) => {
                  setIdentity({ ...identity, riotId: event.target.value.slice(0, 32) });
                  resetOrder();
                }}
                placeholder="PlayerName#TAG"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
              />
            </label>
          ) : (
            <label className="text-sm font-semibold text-slate-200">
              {gameSlug === "genshin-impact" ? "UID" : "Player ID"}
              <input
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                value={identity.playerId}
                onChange={(event) => {
                  const playerId = event.target.value.replace(/\D/g, "").slice(0, 20);
                  setIdentity({ ...identity, playerId });
                  resetOrder();
                }}
                placeholder={gameSlug === "genshin-impact" ? "9 or 10 digit UID" : "Numeric player ID"}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
              />
            </label>
          )}

          {gameSlug === "genshin-impact" ? (
            <label className="text-sm font-semibold text-slate-200">
              Server
              <select
                required
                value={identity.serverId}
                onChange={(event) => {
                  setIdentity({ ...identity, serverId: event.target.value });
                  resetOrder();
                }}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
              >
                <option value="">Choose server</option>
                {serverOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            identityResult?.valid
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-white/10 bg-black/20 text-slate-500"
          }`}
        >
          {identityResult?.valid
            ? `Format confirmed for ${selectedPackage.marketLabel}. The server validates it again when creating the order.`
            : identityResult?.message ?? "Enter the destination details exactly as shown inside the game."}
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0d0d17] p-4 shadow-2xl shadow-black/30 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              02 · Package
            </p>
            <h2 className="mt-2 text-2xl font-black">Choose a curated pack</h2>
          </div>
          <span className="text-sm font-bold text-emerald-200">
            {marketPackages.length} live offers
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
          {marketPackages.map((item) => {
            const selected = item.id === selectedPackage.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPackageId(item.id);
                  resetOrder();
                }}
                className={`min-h-24 rounded-2xl border p-3 text-left transition sm:p-4 ${
                  selected
                    ? "border-violet-400/50 bg-violet-400/15"
                    : "border-white/10 bg-white/[0.025] hover:bg-white/[0.055]"
                }`}
              >
                <strong className="line-clamp-2 block text-sm text-white">{item.name}</strong>
                <span className="mt-2 block text-base font-black text-cyan-200 sm:text-lg">
                  {formatPresentment(item.amountInPaise)}
                </span>
                <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                  {item.marketLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <BillingAddressFields
        value={billing}
        onChange={(nextBilling) => {
          setBilling(nextBilling);
          resetOrder();
        }}
        fxMode={fxSnapshot.mode}
        stepNumber="03"
        stepLabel="Payment details"
      />

      <section className="rounded-2xl border border-white/10 bg-[#0d0d17] p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Select payment method and pay
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {selectedPackage.name} · {formatPresentment(selectedPackage.amountInPaise)}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {gameTitle} · {selectedPackage.marketLabel}
            </p>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || Boolean(order)}
            className="min-h-12 rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating order..." : order ? "Order created" : "Continue to payment"}
          </button>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>
        ) : null}

        {order ? (
          <div className="mt-5">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              <strong>Order {order.id}</strong> is saved and recoverable.
              <Link
                href={`${order.tracking.path}?token=${encodeURIComponent(order.tracking.accessToken)}`}
                className="ml-2 font-black underline"
              >
                Open tracking
              </Link>
            </div>
            <RazorpayTestCheckout
              orderId={order.id}
              orderStatus={order.status}
              accessToken={order.tracking.accessToken}
              amountInPaise={order.package.amountInPaise}
              packageName={order.package.name}
              onVerified={() => {
                setPaymentVerified(true);
                setMessage("Payment verified. Order processing has started.");
              }}
            />
            {paymentVerified ? (
              <p className="mt-4 text-sm font-bold text-emerald-200">
                Payment verification completed for this order.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </form>
  );
}
