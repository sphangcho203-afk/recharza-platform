"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { useDisplayCurrency } from "@/components/display-price";
import { BillingAddressFields, initialBillingForm, type BillingFormState } from "@/components/billing-address-fields";
import { CheckoutProgressRail } from "@/components/checkout-progress-rail";
import { PrivateOrderTokenCard } from "@/components/private-order-token-card";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { ResilientImage } from "@/components/resilient-image";
import { StorefrontArtwork } from "@/components/storefront-artwork";
import { SavedAddressPicker } from "@/components/saved-address-picker";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { formatDisplayMinor } from "@/lib/commerce/display-currency";
import { getMerchandisingBadge, splitBonusQuantity } from "@/lib/commerce/merchandising";
import { toBillingFormState } from "@/lib/commerce/saved-address-form";
import type { SavedAddressView } from "@/lib/commerce/saved-addresses";
import type { CartSnapshot } from "@/lib/cart-snapshot";
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
  package: { id: string; name: string; amountInPaise: number; currency: string };
  presentment: { amountMinor: number; currency: SupportedCurrencyCode; fxQuotedAt: string | null } | null;
  billing: { fullName: string; email: string; countryCode: string; city: string } | null;
  player: { playerId: string; zoneId: string; nickname: string | null; verificationMode: string };
  ownership: { mode: "billing-email"; email: string; accountLinked: boolean };
  tracking: { path: string; accessToken: string };
};

type CheckoutStep = 1 | 2 | 3 | 4;

type CheckoutResponse = {
  ok: boolean;
  duplicate?: boolean;
  code?: string;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: { provider: string | null; sessionId: string | null; status: string; message: string };
};

const initialVerification: VerificationState = {
  status: "idle",
  message: "Enter your Player ID and Zone ID to confirm your account.",
  nickname: null,
};

const inputClassName = "storefront-checkout-field mt-2 w-full px-3.5 text-sm placeholder:text-slate-400 border-slate-200 focus:border-violet-600 focus:ring-violet-600/10";

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return `rz_${globalThis.crypto.randomUUID()}`;
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
  savedAddresses = [],
  isAuthenticated = false,
  initialCartItemId = null,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
  savedAddresses?: SavedAddressView[];
  isAuthenticated?: boolean;
  initialCartItemId?: string | null;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const marketCurrency = market.defaultCurrency;
  const { currency: displayCurrency, rates: displayRates } = useDisplayCurrency();
  const [packageId, setPackageId] = useState(firstPackage?.id ?? "");
  const [step, setStep] = useState<CheckoutStep>(1);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [billing, setBilling] = useState<BillingFormState>(() => {
    const defaultAddress = savedAddresses.find((item) => item.isDefault);
    if (defaultAddress) return toBillingFormState(defaultAddress, market.defaultCurrency);
    return {
      ...initialBillingForm,
      presentmentCurrency: market.defaultCurrency,
    };
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    () => savedAddresses.find((item) => item.isDefault)?.id ?? null,
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressSaveNote, setAddressSaveNote] = useState("");
  const [verification, setVerification] = useState<VerificationState>(initialVerification);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [restoredFromCart, setRestoredFromCart] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (!initialCartItemId) return;
    let active = true;

    fetch("/api/cart", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok?: boolean;
          cart?: CartSnapshot;
        };
        if (!active || !response.ok || !result.ok || !result.cart) return;
        const item = result.cart.items.find(
          (entry) => entry.id === initialCartItemId,
        );
        if (!item) return;
        if (!packages.some((entry) => entry.id === item.package.id)) return;
        setPackageId(item.package.id);
        setPlayerId(item.player.playerId ?? "");
        setZoneId(item.player.zoneId ?? "");
        setRestoredFromCart(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialCartItemId, packages]);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId) ?? packages[0],
    [packageId, packages],
  );
  const visiblePackages = packages;

  const billingComplete = billingIsComplete(billing);
  const playerComplete = verification.status === "success";
  const canCreateOrder = Boolean(selectedPackage && playerComplete && billingComplete);

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
    setAddressSaveNote("");
  }

  function applySavedAddress(address: SavedAddressView | null) {
    if (!address) {
      setSelectedAddressId(null);
      return;
    }
    setSelectedAddressId(address.id);
    setSaveNewAddress(false);
    setBilling(toBillingFormState(address, market.defaultCurrency));
    resetCreatedOrder();
  }

  async function saveBillingAddress() {
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: billing.fullName,
          email: billing.email,
          phone: billing.phone,
          line1: billing.line1,
          line2: billing.line2 || null,
          city: billing.city,
          state: billing.state,
          postalCode: billing.postalCode,
          countryCode: billing.countryCode,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  function resetVerification() {
    setVerification(initialVerification);
    setRestoredFromCart(false);
    resetCreatedOrder();
  }

  async function verifyPlayer() {
    if (!selectedPackage || !playerId || !zoneId) return;
    setVerification({
      status: "loading",
      message: `Checking account details for ${selectedPackage.name}...`,
      nickname: null,
    });
    resetCreatedOrder();

    try {
      const response = await fetch("/api/games/mobile-legends/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, zoneId, packageId: selectedPackage.id, marketCode: market.code }),
      });
      const result = (await response.json()) as { valid?: boolean; code?: string; message?: string; nickname?: string | null };
      if (!response.ok || !result.valid) {
        setVerification({
          status: "error",
          message: result.message ?? "We could not find a game account with those details. Double-check the IDs.",
          nickname: null,
        });
        return;
      }
      setVerification({
        status: "success",
        message: result.message ?? `Account confirmed for ${market.label}.`,
        nickname: result.nickname ?? null,
      });
    } catch {
      setVerification({
        status: "error",
        message: "The verification service is temporarily unavailable. Please retry shortly.",
        nickname: null,
      });
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateOrder || !selectedPackage) {
      setCheckoutError("Please confirm your account and complete billing details before payment.");
      return;
    }

    if (!isAuthenticated) {
      setCheckoutError(
        "Finish by signing in to your verified Recharza account — your package, player ID and billing details stay in place, and you will return to this page to complete payment.",
      );
      setCheckoutMessage("");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutMessage("Preparing your order...");
    setOrder(null);
    setPaymentVerified(false);

    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/checkout/mobile-legends", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
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
        setCheckoutError(result.message ?? "The checkout could not create an order.");
        setCheckoutMessage("");
        return;
      }

      sessionStorage.setItem(`recharza-order:${result.order.id}`, result.order.tracking.accessToken);
      setOrder(result.order);
      setDuplicate(Boolean(result.duplicate));
      setStep(4);
      setCheckoutMessage(result.paymentSession?.message ?? "Order confirmed. Please proceed to payment.");

      if (isAuthenticated && saveNewAddress && selectedAddressId === null) {
        void saveBillingAddress().then((saved) => {
          if (!saved) {
            setAddressSaveNote("Your billing address could not be saved to your account. Your order is unaffected.");
          }
        });
      }
    } catch {
      setCheckoutError("The checkout service could not be reached. Retrying uses the same safe order key.");
      setCheckoutMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function advanceStep(nextStep: CheckoutStep) {
    if (nextStep === 2 && !selectedPackage) { setCheckoutError("Choose a package before continuing."); return; }
    if (nextStep === 3 && verification.status !== "success") { setCheckoutError("Please confirm your account details before continuing."); return; }
    if (nextStep === 4 && !billingComplete) { setCheckoutError("Complete the billing details before continuing."); return; }
    setCheckoutError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedPackage) {
    return <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm text-amber-100">No approved packages are available for this market.</div>;
  }

  return (
    <form onSubmit={submitCheckout} className="grid gap-5">
      <div className="min-w-0 space-y-5">
        <CheckoutProgress step={step} onStepChange={setStep} />

        {step === 2 ? <>
        <section className="storefront-checkout-surface p-4 sm:p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Account Details</h2>
              <p className="mt-1 text-xs text-slate-600">Confirm your account to ensure accurate delivery.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.7fr_auto] sm:items-end">
            <label className="text-xs font-bold text-slate-500">
              Player ID
              <input
                required
                inputMode="numeric"
                autoComplete="off"
                value={playerId}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setPlayerId(event.target.value.replace(/\D/g, ""));
                  resetVerification();
                }}
                placeholder="123456789"
                className={inputClassName}
              />
            </label>
            <label className="text-xs font-bold text-slate-500">
              Zone ID
              <input
                required
                inputMode="numeric"
                autoComplete="off"
                value={zoneId}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setZoneId(event.target.value.replace(/\D/g, ""));
                  resetVerification();
                }}
                placeholder="2045"
                className={inputClassName}
              />
            </label>
            <button
              type="button"
              onClick={() => void verifyPlayer()}
              disabled={verification.status === "loading" || !playerId || !zoneId}
              className="storefront-checkout-primary px-4 text-xs disabled:cursor-not-allowed"
            >
              {verification.status === "loading" ? "Checking…" : "Verify"}
            </button>
          </div>

          <div
            aria-live="polite"
            className={`mt-3 rounded-xl border px-4 py-3 text-xs font-medium leading-relaxed transition-all ${
              verification.status === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : verification.status === "error"
                  ? "border-rose-100 bg-rose-50 text-rose-700"
                  : "border-slate-100 bg-slate-50 text-slate-500"
            }`}
          >
            {verification.message}
            {verification.nickname ? <strong className="ml-1.5 font-bold text-slate-900">{verification.nickname}</strong> : null}
          </div>

          {restoredFromCart ? (
            <p className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-medium leading-relaxed text-cyan-700">
              Package restored from your cart. Verify the player destination
              before paying for this order.
            </p>
          ) : null}
        </section>
        <StepActions current={step} onBack={() => setStep(1)} onNext={() => advanceStep(3)} nextLabel="Continue to payment" />
        </> : null}

        {step === 1 ? <>
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Select Package</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">{packages.length} items available · {market.flag} {market.label}</p>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {visiblePackages.map((item) => {
              const selected = item.id === selectedPackage.id;
              const badge = getMerchandisingBadge(item);
              const quantity = splitBonusQuantity(item.name);
              const badgeClass = badge?.tone === "rose"
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : badge?.tone === "emerald"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-violet-100 bg-violet-50 text-violet-700";
              return (
                <div
                  key={item.id}
                    className={`group overflow-hidden rounded-2xl border transition-all duration-200 ${
                    selected
                      ? "border-violet-600 bg-violet-50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPackageId(item.id);
                      resetVerification();
                    }}
                    aria-pressed={selected}
                    className="block w-full text-left"
                  >
                    <span className="relative block aspect-[16/9] overflow-hidden bg-slate-50">
                      <StorefrontArtwork
                        sources={item.media.sources}
                        alt={item.media.alt}
                        fallbackLabel={item.name.slice(0, 2).toUpperCase()}
                        className="h-full w-full p-4 sm:p-5 transition-transform duration-300 group-hover:scale-105"
                        objectFit="contain"
                        sizes="(max-width: 640px) 45vw, 190px"
                        fallbackClassName="absolute inset-0 h-full w-full"
                      />
                    </span>
                    <span className="block p-4">
                      {badge ? (
                        <span className={`mb-2 inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {badge.label}
                        </span>
                      ) : null}
                      <strong className="line-clamp-2 min-h-10 text-[13px] font-bold leading-5 tracking-tight text-slate-900 sm:text-[15px]">{quantity.bonus ? <><span>{quantity.base}</span> <span className="font-bold text-emerald-600">{quantity.plus} {quantity.bonus}</span></> : item.name}</strong>
                      <span className="mt-3 block text-lg font-bold tracking-tight text-violet-600">{formatPresentment(item.amountInPaise)}</span>
                      <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.source === "fazercards-live" ? "Instant delivery" : "Digital delivery"}</span>
                    </span>
                  </button>
                  <div className="px-4 pb-4">
                    <AddToCartButton
                      gameSlug="mobile-legends"
                      marketCode={market.code}
                      packageId={item.id}
                      packageName={item.name}
                      playerId={playerId || null}
                      zoneId={zoneId || null}
                      disabled={verification.status === "loading"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {visiblePackages.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm font-medium text-slate-500">No packages are currently available.</p> : null}
        </section>
        {step === 1 ? <StepActions current={step} onNext={() => advanceStep(2)} nextLabel="Continue to player info" /> : null}
        </> : null}

        {step === 3 ? <>
        <div id="billing" className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Order Summary</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Order Review</h2>
            <p className="mt-1 text-sm text-slate-600">Please review your purchase details and provide billing information to complete your order.</p>
            
            <dl className="mt-5 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-bold text-slate-500">Package</dt><dd className="mt-1 font-bold text-slate-900">{selectedPackage.name}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">Market</dt><dd className="mt-1 font-bold text-slate-900">{market.flag} {market.label}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><dt className="text-xs font-bold text-slate-500">Player ID</dt><dd className="mt-1 break-all font-mono text-sm font-bold tracking-wide text-slate-900">{playerId || "—"}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><dt className="text-xs font-bold text-slate-500">Zone ID</dt><dd className="mt-1 break-all font-mono text-sm font-bold tracking-wide text-slate-900">{zoneId || "—"}</dd></div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:col-span-2"><dt className="text-xs font-bold text-slate-500">Verified IGN</dt><dd className="mt-1 break-words font-bold text-emerald-600">{verification.nickname || "Verified player"}</dd></div>
              <div className="border-t border-slate-200 pt-4 sm:col-span-2"><dt className="text-xs font-bold text-slate-500">Total</dt><dd className="mt-1 text-3xl font-bold text-violet-600">{formatPresentment(selectedPackage.amountInPaise)}</dd></div>
            </dl>
          </section>

          {isAuthenticated && savedAddresses.length > 0 ? (
            <SavedAddressPicker
              addresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelect={applySavedAddress}
            />
          ) : null}

          <BillingAddressFields
            value={billing}
            onChange={(nextBilling) => {
              setBilling({ ...nextBilling, presentmentCurrency: marketCurrency });
              resetCreatedOrder();
            }}
            fixedCurrency={marketCurrency}
            stepNumber="03"
            stepLabel="Billing address"
          />

          {isAuthenticated && selectedAddressId === null ? (
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSaveNewAddress(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-violet-600"
              />
              <span className="text-sm text-slate-900">
                <strong className="font-bold text-slate-900">Save this billing address</strong>
                <span className="mt-0.5 block text-xs text-slate-600">Keep this address for faster checkout on your next top-up.</span>
              </span>
            </label>
          ) : null}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => setStep(2)} className="storefront-checkout-secondary px-4 text-sm">Back to player</button>
          <button type="submit" disabled={isSubmitting || !canCreateOrder || Boolean(order)} className="min-h-11 rounded-lg bg-violet-600 px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Processing order…" : "Pay Now"}</button>
        </div>
        </> : null}

        {checkoutError ? <p aria-live="assertive" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{checkoutError}</p> : null}
        {checkoutMessage && !order ? <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">{checkoutMessage}</p> : null}

        {step === 4 && order ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{duplicate ? "Order retrieved" : "Order confirmed"}</p>
                <h3 className="mt-1 break-all text-lg font-bold tracking-tight text-slate-900">{order.id}</h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-emerald-800/80">{checkoutMessage}</p>
                {addressSaveNote ? <p className="mt-2 text-xs font-medium leading-relaxed text-amber-700/80">{addressSaveNote}</p> : null}
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 shadow-sm">{order.ownership.accountLinked ? "Linked account" : "Guest checkout"}</span>
            </div>

            <PrivateOrderTokenCard token={order.tracking.accessToken} />

            {paymentVerified ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-100/50 p-4 text-sm font-bold text-emerald-800">Payment response verified. Fulfilment status remains available through secure tracking.</div>
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

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={order.tracking.path} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:-translate-y-1 hover:bg-emerald-700">Open tracking</Link>
              <button
                type="button"
                onClick={() => resetCreatedOrder()}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-[11px] font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900"
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


type CheckoutProgressProps = { step: number; onStepChange: (step: 1 | 2 | 3 | 4) => void };
type StepActionsProps = { current: number; onBack?: () => void; onNext: () => void; nextLabel: string };

function CheckoutProgress({ step, onStepChange }: CheckoutProgressProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-6">
      <CheckoutProgressRail current={step} />
    </nav>
  );
}

function StepActions({ current, onBack, onNext, nextLabel }: StepActionsProps) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    {current > 1 ? <button type="button" onClick={onBack} className="storefront-checkout-secondary px-4 text-sm">Back</button> : <span />}
    {current < 4 ? <button type="button" onClick={onNext} className="storefront-checkout-primary px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">{nextLabel}</button> : null}
  </div>;
}
