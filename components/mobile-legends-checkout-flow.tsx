"use client";

import Link from "next/link";
import {
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BillingAddressFields,
  initialBillingForm,
  type BillingFormState,
} from "@/components/billing-address-fields";
import { DisplayPrice, useDisplayCurrency } from "@/components/display-price";
import { ProductOfferCard } from "@/components/product-offer-card";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import {
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { formatDisplayMinor } from "@/lib/commerce/display-currency";
import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";
import type { MobileLegendsMarket } from "@/lib/mobile-legends-market";

type VerificationState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  nickname: string | null;
};

type CreatedOrder = {
  id: string;
  status: string;
  market: { code: string; label: string } | null;
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
  ownership: {
    mode: "billing-email";
    email: string;
    accountLinked: boolean;
  };
  tracking: {
    path: string;
    accessToken: string;
  };
};

type CheckoutResponse = {
  ok: boolean;
  duplicate?: boolean;
  code?: string;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: {
    provider: string | null;
    sessionId: string | null;
    status: string;
    message: string;
  };
};

const initialVerification: VerificationState = {
  status: "idle",
  message: "Enter the player and zone IDs, then validate the destination.",
  nickname: null,
};

const stageLabels = ["Package", "Player", "Billing", "Payment"] as const;

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

function stageTone(state: "complete" | "active" | "waiting") {
  if (state === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100";
  }

  if (state === "active") {
    return "border-violet-200 bg-violet-600 text-white shadow-lg shadow-violet-200";
  }

  return "border-slate-100 bg-slate-50/50 text-slate-400";
}

export function MobileLegendsCheckoutFlow({
  packages,
  market,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [packageId, setPackageId] = useState(firstPackage?.id ?? "");
  const [packageQuery, setPackageQuery] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [billing, setBilling] = useState<BillingFormState>(() => ({
    ...initialBillingForm,
    presentmentCurrency: market.defaultCurrency,
  }));
  const [verification, setVerification] =
    useState<VerificationState>(initialVerification);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const paymentSection = useRef<HTMLDivElement | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId) ?? packages[0],
    [packageId, packages],
  );

  const visiblePackages = useMemo(() => {
    const query = packageQuery.trim().toLowerCase();
    if (!query) return packages;

    return packages.filter((item) =>
      `${item.name} ${item.amountInPaise}`.toLowerCase().includes(query),
    );
  }, [packageQuery, packages]);

  const marketCurrency = market.defaultCurrency;
  const { currency: displayCurrency, rates: displayRates } = useDisplayCurrency();
  const marketCurrencyMatches = billing.presentmentCurrency === marketCurrency;
  const billingComplete = billingIsComplete(billing);
  const playerComplete = verification.status === "success";
  const canCreateOrder = Boolean(
    selectedPackage && playerComplete && billingComplete && marketCurrencyMatches,
  );

  const stages: Array<"complete" | "active" | "waiting"> = [
    selectedPackage ? "complete" : "active",
    playerComplete ? "complete" : selectedPackage ? "active" : "waiting",
    billingComplete
      ? "complete"
      : playerComplete
        ? "active"
        : "waiting",
    order ? "complete" : canCreateOrder ? "active" : "waiting",
  ];

  function formatPresentment(amountInPaise: number) {
    return formatDisplayMinor(amountInPaise, displayCurrency, displayRates);
  }

  function resetCreatedOrder() {
    idempotencyKey.current = null;
    setOrder(null);
    setDuplicate(false);
    setPaymentVerified(false);
    setCheckoutError("");
    setCheckoutMessage("");
  }

  function resetVerification() {
    setVerification(initialVerification);
    resetCreatedOrder();
  }

  async function verifyPlayer() {
    if (!selectedPackage || !playerId || !zoneId) return;

    setVerification({
      status: "loading",
      message: `Checking ${market.label} player details against the selected package...`,
      nickname: null,
    });
    resetCreatedOrder();

    try {
      const response = await fetch("/api/games/mobile-legends/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          zoneId,
          packageId: selectedPackage.id,
          marketCode: market.code,
        }),
      });
      const result = (await response.json()) as {
        valid?: boolean;
        confirmed?: boolean;
        message?: string;
        nickname?: string | null;
      };

      if (!response.ok || !result.valid) {
        setVerification({
          status: "error",
          message:
            result.message ??
            "The player destination could not be validated for this package.",
          nickname: null,
        });
        return;
      }

      setVerification({
        status: "success",
        message:
          result.message ??
          `Player destination confirmed for ${market.label}.`,
        nickname: result.nickname ?? null,
      });
    } catch {
      setVerification({
        status: "error",
        message:
          "The verification service could not be reached. Check the server and retry.",
        nickname: null,
      });
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPackage) {
      setCheckoutError("Choose an available package first.");
      return;
    }

    if (!playerComplete) {
      setCheckoutError("Validate the player destination before creating the order.");
      return;
    }

    if (!billingComplete) {
      setCheckoutError("Complete the billing section before continuing.");
      return;
    }

    if (!marketCurrencyMatches) {
      setCheckoutError(
        "This market uses a fixed price in its local currency. Return to the package step and continue with the market currency.",
      );
      return;
    }

    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutMessage("Creating the order and preparing the payment handoff...");
    setOrder(null);
    setPaymentVerified(false);

    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/checkout/mobile-legends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({
          gameSlug: "mobile-legends",
          packageId: selectedPackage.id,
          playerId,
          zoneId,
          marketCode: market.code,
          billing: {
            ...billing,
            presentmentCurrency: marketCurrency,
          },
        }),
      });
      const result = (await response.json()) as CheckoutResponse;

      if (!response.ok || !result.ok || !result.order) {
        setCheckoutError(
          result.message ?? "The checkout could not create an order.",
        );
        setCheckoutMessage("");
        return;
      }

      sessionStorage.setItem(
        `recharza-order:${result.order.id}`,
        result.order.tracking.accessToken,
      );
      setOrder(result.order);
      setDuplicate(Boolean(result.duplicate));
      setCheckoutMessage(
        result.paymentSession?.message ??
          "Order saved. Continue to payment below.",
      );

      window.setTimeout(() => {
        paymentSection.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch {
      setCheckoutError(
        "The checkout service could not be reached. Retry safely with the same details.",
      );
      setCheckoutMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedPackage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-700 font-bold shadow-lg shadow-amber-100">
        No approved packages are available for this market. Run the reviewed supplier
        sync or choose another region.
      </div>
    );
  }

  return (
    <form onSubmit={submitCheckout} className="grid gap-5">
      <section className="sticky top-0 z-20 -mx-4 border-y border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border shadow-lg shadow-slate-200/50">
        <div className="grid grid-cols-4 gap-2">
          {stageLabels.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-2 py-2.5 text-center transition-all ${stageTone(stages[index])}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">
                0{index + 1}
              </span>
              <span className="mt-0.5 block truncate text-xs font-bold sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          One interface · Secure billing · Private tracking
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="border-b border-slate-100 p-4 sm:p-6 bg-slate-50/50">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                01 · Package
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Choose the top-up
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Search the approved {market.label} catalogue. The selected package
                remains visible while you finish the flow.
              </p>
            </div>
            <label className="block w-full max-w-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
              Find package
              <input
                type="search"
                value={packageQuery}
                onChange={(event) => setPackageQuery(event.target.value)}
                placeholder="Diamonds, pass, amount..."
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-50 transition-all"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="max-h-[34rem] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
              {visiblePackages.map((item) => (
                <ProductOfferCard
                  key={item.id}
                  item={item}
                  selected={item.id === selectedPackage.id}
                  displayPrice={formatPresentment(item.amountInPaise)}
                  settlementPrice={
                    billing.presentmentCurrency !== "INR"
                      ? formatInr(item.amountInPaise)
                      : undefined
                  }
                  onSelect={() => {
                    setPackageId(item.id);
                    resetVerification();
                  }}
                />
              ))}
            </div>

            {visiblePackages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
                No package matches that search.
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-2xl border border-violet-100 bg-violet-50/50 p-5 lg:sticky lg:top-24 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
              Selected offer
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {selectedPackage.name}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatPresentment(selectedPackage.amountInPaise)}
            </p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Settlement {formatInr(selectedPackage.amountInPaise)}
              </p>
            ) : null}
            <div className="mt-6 grid gap-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-2">{market.flag} {market.label} Region</span>
              <span className="flex items-center gap-2">✓ {packages.length} Offers Loaded</span>
              <span className="flex items-center gap-2">
                ✓ {packages.some((item) => item.source === "fazercards-live")
                  ? "Live Supplier"
                  : "Protected Fallback"}
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
              02 · Player
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Verify the game destination
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Package and region are sent with the player details so validation cannot
              drift into another catalogue.
            </p>
          </div>
          <Link
            href="/games/mobile-legends"
            className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            Change region
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-900 outline-none focus:border-violet-600 focus:bg-white transition-all"
            />
          </label>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-900 outline-none focus:border-violet-600 focus:bg-white transition-all"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void verifyPlayer()}
          disabled={
            verification.status === "loading" || !playerId || !zoneId
          }
          className="mt-4 min-h-12 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 transition-all hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verification.status === "loading"
            ? "Validating player..."
            : `Validate ${market.label} player`}
        </button>

        <div
          aria-live="polite"
          className={`mt-3 rounded-xl border px-4 py-3 text-sm font-bold ${
            verification.status === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : verification.status === "error"
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          {verification.message}
          {verification.status === "success" && verification.nickname ? (
            <strong className="mt-1 block text-slate-900">
              Nickname: {verification.nickname}
            </strong>
          ) : null}
        </div>
      </section>

      <BillingAddressFields
        value={billing}
        onChange={(nextBilling) => {
          setBilling(nextBilling);
          resetCreatedOrder();
        }}
        fixedCurrency={marketCurrency}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
              04 · Review and payment
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Create once, then pay here
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              The server resolves the current package, validates billing and player
              details, saves the order, and returns a private recovery token. Login is
              optional instead of blocking checkout.
            </p>
            <div className="mt-6 grid gap-2 text-[11px] sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Region</span>
                <strong className="float-right text-slate-900 font-bold">
                  {market.flag} {market.label}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Player</span>
                <strong className="float-right max-w-[60%] truncate text-slate-900 font-bold">
                  {verification.nickname || playerId || "Not validated"}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Package</span>
                <strong className="float-right max-w-[60%] truncate text-slate-900 font-bold">
                  {selectedPackage.name}
                </strong>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Recovery email</span>
                <strong className="float-right max-w-[58%] truncate text-slate-900 font-bold">
                  {billing.email || "Required"}
                </strong>
              </div>
            </div>
          </div>

          <div className="min-w-56 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-right shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Total
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {formatPresentment(selectedPackage.amountInPaise)}
            </p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Settlement {formatInr(selectedPackage.amountInPaise)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/30">
          <button
            type="submit"
            disabled={isSubmitting || !canCreateOrder}
            className="min-h-13 w-full rounded-xl bg-violet-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
          >
            {isSubmitting
              ? "Creating order..."
              : "Create order and continue to payment"}
          </button>

          {!canCreateOrder && !order ? (
            <p className="mt-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              Complete player validation and billing to unlock payment.
            </p>
          ) : null}

          {checkoutError ? (
            <p
              aria-live="assertive"
              className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            >
              {checkoutError}
            </p>
          ) : null}

          {checkoutMessage && !order ? (
            <p
              aria-live="polite"
              className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500"
            >
              {checkoutMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div ref={paymentSection} className="scroll-mt-24">
        {order ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xl shadow-emerald-100 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  {duplicate
                    ? "Existing order safely recovered"
                    : "Order created"}
                </p>
                <h2 className="mt-2 break-all text-2xl font-bold text-slate-900">
                  {order.id}
                </h2>
                <p className="mt-2 text-sm font-medium text-emerald-800/80">
                  {checkoutMessage}
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-200 bg-white/50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                {order.ownership.accountLinked
                  ? "Linked account"
                  : "Guest checkout"}
              </span>
            </div>

            <div className="mt-6 grid gap-2 text-[11px] sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-white/40 px-3 py-3">
                <span className="font-bold text-emerald-700/60 uppercase tracking-wider">Package</span>
                <strong className="float-right text-slate-900 font-bold">
                  {order.package.name}
                </strong>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white/40 px-3 py-3">
                <span className="font-bold text-emerald-700/60 uppercase tracking-wider">Player</span>
                <strong className="float-right text-slate-900 font-bold">
                  {order.player.nickname || order.player.playerId}
                </strong>
              </div>
            </div>

            {paymentVerified ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-100 p-4 text-sm font-bold text-emerald-900 shadow-sm">
                Payment response verified. The order remains in this interface and can
                also be recovered from secure tracking.
              </div>
            ) : (
              <RazorpayTestCheckout
                orderId={order.id}
                orderStatus={order.status}
                accessToken={order.tracking.accessToken}
                amountInPaise={order.package.amountInPaise}
                packageName={order.package.name}
                onVerified={() => setPaymentVerified(true)}
              />
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href={order.tracking.path}
                className="min-h-12 rounded-xl border border-emerald-200 bg-white/50 px-4 py-3 text-center text-sm font-bold text-emerald-700 hover:bg-white transition-all shadow-sm"
              >
                Open secure tracking
              </Link>
              <button
                type="button"
                onClick={() => {
                  resetCreatedOrder();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                Start another order
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </form>
  );
}
