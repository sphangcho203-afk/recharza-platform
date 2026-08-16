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
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }

  if (state === "active") {
    return "border-violet-400/35 bg-violet-400/15 text-white";
  }

  return "border-white/10 bg-white/[0.035] text-slate-500";
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
      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
        No approved packages are available for this market. Run the reviewed supplier
        sync or choose another region.
      </div>
    );
  }

  return (
    <form onSubmit={submitCheckout} className="grid gap-5">
      <section className="sticky top-0 z-20 -mx-4 border-y border-white/10 bg-[#080810]/92 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
        <div className="grid grid-cols-4 gap-2">
          {stageLabels.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-2 py-2.5 text-center transition ${stageTone(stages[index])}`}
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
                0{index + 1}
              </span>
              <span className="mt-0.5 block truncate text-xs font-black sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          One interface. No account detour. Billing email and the private order token
          protect recovery.
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,124,255,0.15),transparent_42%),rgba(255,255,255,0.04)] shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                01 · Package
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Choose the top-up
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Search the approved {market.label} catalogue. The selected package
                remains visible while you finish the flow.
              </p>
            </div>
            <label className="block w-full max-w-sm text-xs font-bold text-slate-300">
              Find package
              <input
                type="search"
                value={packageQuery}
                onChange={(event) => setPackageQuery(event.target.value)}
                placeholder="Diamonds, pass, amount..."
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
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
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                No package matches that search.
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4 lg:sticky lg:top-24">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-200">
              Selected offer
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {selectedPackage.name}
            </p>
            <p className="mt-2 text-3xl font-black text-white">
              {formatPresentment(selectedPackage.amountInPaise)}
            </p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs text-violet-100/65">
                Settlement {formatInr(selectedPackage.amountInPaise)}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 text-xs text-violet-100/75">
              <span>{market.flag} {market.label} account region</span>
              <span>{packages.length} approved offers loaded</span>
              <span>
                {packages.some((item) => item.source === "fazercards-live")
                  ? "Live supplier catalogue"
                  : "Protected fallback catalogue"}
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              02 · Player
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Verify the game destination
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Package and region are sent with the player details so validation cannot
              drift into another catalogue.
            </p>
          </div>
          <Link
            href="/games/mobile-legends"
            className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            Change region
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
          onClick={() => void verifyPlayer()}
          disabled={
            verification.status === "loading" || !playerId || !zoneId
          }
          className="mt-4 min-h-12 w-full rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verification.status === "loading"
            ? "Validating player..."
            : `Validate ${market.label} player`}
        </button>

        <div
          aria-live="polite"
          className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-6 ${
            verification.status === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : verification.status === "error"
                ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                : "border-white/10 bg-black/15 text-slate-400"
          }`}
        >
          {verification.message}
          {verification.status === "success" && verification.nickname ? (
            <strong className="mt-1 block text-white">
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

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(17,17,29,0.98),rgba(8,8,16,0.98))] shadow-2xl shadow-black/30">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
              04 · Review and payment
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Create once, then pay here
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              The server resolves the current package, validates billing and player
              details, saves the order, and returns a private recovery token. Login is
              optional instead of blocking checkout.
            </p>
            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                <span className="text-slate-500">Region</span>
                <strong className="float-right text-white">
                  {market.flag} {market.label}
                </strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                <span className="text-slate-500">Player</span>
                <strong className="float-right max-w-[60%] truncate text-white">
                  {verification.nickname || playerId || "Not validated"}
                </strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                <span className="text-slate-500">Package</span>
                <strong className="float-right max-w-[60%] truncate text-white">
                  {selectedPackage.name}
                </strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                <span className="text-slate-500">Recovery email</span>
                <strong className="float-right max-w-[58%] truncate text-white">
                  {billing.email || "Required"}
                </strong>
              </div>
            </div>
          </div>

          <div className="min-w-56 rounded-2xl border border-white/10 bg-black/25 p-4 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Total
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {formatPresentment(selectedPackage.amountInPaise)}
            </p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs text-slate-500">
                Settlement {formatInr(selectedPackage.amountInPaise)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 p-4 sm:p-6">
          <button
            type="submit"
            disabled={isSubmitting || !canCreateOrder}
            className="min-h-13 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting
              ? "Creating order..."
              : "Create order and continue to payment"}
          </button>

          {!canCreateOrder && !order ? (
            <p className="mt-3 text-center text-xs text-slate-500">
              Complete player validation and billing to unlock payment.
            </p>
          ) : null}

          {checkoutError ? (
            <p
              aria-live="assertive"
              className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              {checkoutError}
            </p>
          ) : null}

          {checkoutMessage && !order ? (
            <p
              aria-live="polite"
              className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-slate-300"
            >
              {checkoutMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div ref={paymentSection} className="scroll-mt-24">
        {order ? (
          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 shadow-2xl shadow-black/25 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                  {duplicate
                    ? "Existing order safely recovered"
                    : "Order created"}
                </p>
                <h2 className="mt-2 break-all text-2xl font-black text-white">
                  {order.id}
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                  {checkoutMessage}
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                {order.ownership.accountLinked
                  ? "Linked account"
                  : "Guest checkout"}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-300/15 bg-black/15 px-3 py-3">
                <span className="text-emerald-100/60">Package</span>
                <strong className="float-right text-white">
                  {order.package.name}
                </strong>
              </div>
              <div className="rounded-xl border border-emerald-300/15 bg-black/15 px-3 py-3">
                <span className="text-emerald-100/60">Player</span>
                <strong className="float-right text-white">
                  {order.player.nickname || order.player.playerId}
                </strong>
              </div>
            </div>

            {paymentVerified ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/15 p-4 text-sm font-bold text-emerald-50">
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={order.tracking.path}
                className="min-h-12 rounded-xl border border-emerald-300/25 bg-black/15 px-4 py-3 text-center text-sm font-black text-emerald-100"
              >
                Open secure tracking
              </Link>
              <button
                type="button"
                onClick={() => {
                  resetCreatedOrder();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
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
