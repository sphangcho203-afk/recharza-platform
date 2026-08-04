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
import { formatInr, type MobileLegendsPackage } from "@/lib/mobile-legends";
import type { MobileLegendsMarket } from "@/lib/mobile-legends-market";

type FxSnapshot = {
  base: "INR";
  mode: "live" | "inr-only";
  source: string;
  quotedAt: string;
  ratesFromInrMicros: Record<SupportedCurrencyCode, number>;
};

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

const steps = ["Package", "Player", "Billing", "Payment"] as const;

const initialVerification: VerificationState = {
  status: "idle",
  message: "Enter the player and zone IDs, then validate the destination.",
  nickname: null,
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

export function MobileLegendsCheckoutShell({
  packages,
  market,
  fxSnapshot,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
  fxSnapshot: FxSnapshot;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [activeStep, setActiveStep] = useState(0);
  const [packageId, setPackageId] = useState(firstPackage?.id ?? "");
  const [packageQuery, setPackageQuery] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [billing, setBilling] = useState<BillingFormState>(() => ({
    ...initialBillingForm,
    presentmentCurrency:
      fxSnapshot.mode === "live" ? market.defaultCurrency : "INR",
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

  const selectedRate =
    fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert =
    billing.presentmentCurrency === "INR" || selectedRate > 0;
  const billingComplete = billingIsComplete(billing);
  const playerComplete = verification.status === "success";
  const canCreateOrder = Boolean(
    selectedPackage && playerComplete && billingComplete && canConvert,
  );

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

  function canOpenStep(step: number) {
    if (step === 0) return true;
    if (step === 1) return Boolean(selectedPackage);
    if (step === 2) return playerComplete;
    return playerComplete && billingComplete;
  }

  async function verifyPlayer() {
    if (!selectedPackage || !playerId || !zoneId) return;

    setVerification({
      status: "loading",
      message: `Checking ${market.label} player details for ${selectedPackage.name}...`,
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
        code?: string;
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
      setActiveStep(2);
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

    if (!canCreateOrder || !selectedPackage) {
      setCheckoutError("Complete the player and billing steps before payment.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutMessage("Creating the order and preparing payment...");
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
            presentmentCurrency:
              fxSnapshot.mode === "live"
                ? billing.presentmentCurrency
                : "INR",
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
      setActiveStep(3);
    } catch {
      setCheckoutError(
        "The checkout service could not be reached. Retrying uses the same safe order key.",
      );
      setCheckoutMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedPackage) {
    return (
      <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
        No approved packages are available for this market.
      </div>
    );
  }

  return (
    <form onSubmit={submitCheckout} className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d17] shadow-2xl shadow-black/35">
        <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,124,255,0.16),transparent_45%),rgba(255,255,255,0.025)] p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                {market.flag} {market.label} · Mobile Legends
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                One checkout. Four controlled steps.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Package, player, billing, order, and Razorpay Test Mode stay inside this interface. No account detour.
              </p>
            </div>
            <Link
              href="/games/mobile-legends"
              className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:text-white"
            >
              Change region
            </Link>
          </div>

          <nav className="mt-5 grid grid-cols-4 gap-2" aria-label="Checkout steps">
            {steps.map((label, index) => {
              const complete =
                (index === 0 && Boolean(selectedPackage)) ||
                (index === 1 && playerComplete) ||
                (index === 2 && billingComplete) ||
                (index === 3 && Boolean(order));
              const enabled = canOpenStep(index);

              return (
                <button
                  key={label}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setActiveStep(index)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${
                    activeStep === index
                      ? "border-violet-400/40 bg-violet-400/15 text-white"
                      : complete
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                        : "border-white/10 bg-black/15 text-slate-500"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
                    0{index + 1}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-black sm:text-sm">
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 p-4 sm:p-6">
            {activeStep === 0 ? (
              <section>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                      01 · Package
                    </p>
                    <h3 className="mt-2 text-2xl font-black">Choose an offer</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Compact catalogue, because endless card walls are not a checkout strategy.
                    </p>
                  </div>
                  <label className="block w-full sm:max-w-xs">
                    <span className="sr-only">Search packages</span>
                    <input
                      type="search"
                      value={packageQuery}
                      onChange={(event) => setPackageQuery(event.target.value)}
                      placeholder="Search diamonds or passes"
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
                    />
                  </label>
                </div>

                <div className="mt-4 max-h-[24rem] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/15 p-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {visiblePackages.map((item) => {
                      const selected = item.id === selectedPackage.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPackageId(item.id);
                            resetVerification();
                          }}
                          className={`flex min-h-20 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                            selected
                              ? "border-violet-400/50 bg-violet-400/15"
                              : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="min-w-0">
                            <strong className="block truncate text-sm text-white">
                              {item.name}
                            </strong>
                            <span className="mt-1 block text-[11px] text-slate-500">
                              {item.source === "fazercards-live"
                                ? "Live supplier"
                                : "Preview catalogue"}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <strong className="block text-sm text-white">
                              {formatPresentment(item.amountInPaise)}
                            </strong>
                            {selected ? (
                              <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-violet-200">
                                Selected
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {visiblePackages.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                      No package matches that search.
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="mt-4 min-h-12 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-400"
                >
                  Continue with {selectedPackage.name}
                </button>
              </section>
            ) : null}

            {activeStep === 1 ? (
              <section>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                  02 · Player
                </p>
                <h3 className="mt-2 text-2xl font-black">Verify the destination</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Validation is locked to {selectedPackage.name} and the {market.label} market.
                </p>

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
                      className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
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
                      className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void verifyPlayer()}
                  disabled={verification.status === "loading" || !playerId || !zoneId}
                  className="mt-4 min-h-12 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {verification.status === "loading"
                    ? "Validating player..."
                    : "Validate and continue"}
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
                  {verification.nickname ? (
                    <strong className="mt-1 block text-white">
                      Nickname: {verification.nickname}
                    </strong>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className="mt-4 text-sm font-bold text-slate-400 underline underline-offset-4"
                >
                  Back to packages
                </button>
              </section>
            ) : null}

            {activeStep === 2 ? (
              <section>
                <BillingAddressFields
                  value={billing}
                  onChange={(nextBilling) => {
                    setBilling(nextBilling);
                    resetCreatedOrder();
                  }}
                  fxMode={fxSnapshot.mode}
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
                  >
                    Back to player
                  </button>
                  <button
                    type="button"
                    disabled={!billingComplete || !canConvert}
                    onClick={() => setActiveStep(3)}
                    className="min-h-12 rounded-xl bg-violet-500 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Review order
                  </button>
                </div>
                {!billingComplete ? (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Complete the required billing fields to continue.
                  </p>
                ) : null}
              </section>
            ) : null}

            {activeStep === 3 ? (
              <section>
                {!order ? (
                  <>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                      04 · Payment
                    </p>
                    <h3 className="mt-2 text-2xl font-black">Review and create the order</h3>
                    <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <span className="text-slate-500">Package</span>
                        <strong className="float-right max-w-[60%] truncate text-white">
                          {selectedPackage.name}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <span className="text-slate-500">Player</span>
                        <strong className="float-right max-w-[60%] truncate text-white">
                          {verification.nickname || playerId}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <span className="text-slate-500">Recovery</span>
                        <strong className="float-right max-w-[60%] truncate text-white">
                          {billing.email}
                        </strong>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <span className="text-slate-500">Total</span>
                        <strong className="float-right text-emerald-200">
                          {formatPresentment(selectedPackage.amountInPaise)}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !canCreateOrder}
                      className="mt-5 min-h-13 w-full rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSubmitting
                        ? "Creating order..."
                        : "Create order and open payment"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="mt-4 text-sm font-bold text-slate-400 underline underline-offset-4"
                    >
                      Edit billing
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                          {duplicate
                            ? "Existing order recovered"
                            : "Order created"}
                        </p>
                        <h3 className="mt-2 break-all text-2xl font-black text-white">
                          {order.id}
                        </h3>
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

                    {paymentVerified ? (
                      <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/15 p-4 text-sm font-bold text-emerald-50">
                        Payment response verified. Fulfilment status remains available through secure tracking.
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
                          setActiveStep(0);
                        }}
                        className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
                      >
                        Start another order
                      </button>
                    </div>
                  </div>
                )}

                {checkoutError ? (
                  <p
                    aria-live="assertive"
                    className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                  >
                    {checkoutError}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="border-t border-white/10 bg-black/15 p-4 lg:border-l lg:border-t-0 lg:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Live order summary
            </p>
            <h3 className="mt-2 text-lg font-black text-white">
              {selectedPackage.name}
            </h3>
            <p className="mt-1 text-3xl font-black text-white">
              {formatPresentment(selectedPackage.amountInPaise)}
            </p>
            {billing.presentmentCurrency !== "INR" ? (
              <p className="mt-1 text-xs text-slate-500">
                Settlement {formatInr(selectedPackage.amountInPaise)}
              </p>
            ) : null}

            <dl className="mt-5 grid gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <dt className="text-slate-500">Region</dt>
                <dd className="mt-1 font-bold text-white">
                  {market.flag} {market.label}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <dt className="text-slate-500">Player</dt>
                <dd className="mt-1 truncate font-bold text-white">
                  {verification.nickname || playerId || "Not validated"}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <dt className="text-slate-500">Recovery email</dt>
                <dd className="mt-1 truncate font-bold text-white">
                  {billing.email || "Not entered"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-3 text-xs leading-5 text-violet-100/75">
              Guest orders attach to the billing email and a private tracking token. Sign-in is optional.
            </div>
          </aside>
        </div>
      </section>
    </form>
  );
}
