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

const inputClassName = "storefront-checkout-field mt-2 w-full px-3.5 text-sm placeholder:text-slate-400 border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-600 focus:ring-violet-600/10";

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
          message: result.message ?? "We couldn't find an account with these details. Please verify your IDs.",
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
      setCheckoutError("We couldn't reach the checkout service. Please try again in a moment.");
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
      <div className="min-w-0 space-y-8">
        <CheckoutProgress step={step} onStepChange={setStep} />

        {step === 2 ? (
          <>
            <section className="recharza-checkout-card p-6 sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600/20 text-violet-400">
                    <StorefrontIcon name="account" className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Account Details</h2>
                    <p className="text-sm text-white/50">Enter your IDs to confirm your account.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_0.7fr_auto] sm:items-end">
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Player ID</span>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      value={playerId}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setPlayerId(event.target.value.replace(/\D/g, ""));
                        resetVerification();
                      }}
                      placeholder="1548126076"
                      className="recharza-checkout-input h-14 px-5 font-bold outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Zone ID</span>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      value={zoneId}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setZoneId(event.target.value.replace(/\D/g, ""));
                        resetVerification();
                      }}
                      placeholder="1234"
                      className="recharza-checkout-input h-14 px-5 font-bold outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void verifyPlayer()}
                    disabled={verification.status === "loading" || !playerId || !zoneId}
                    className="recharza-checkout-button h-14 px-8 text-sm tracking-widest"
                  >
                    {verification.status === "loading" ? "Checking…" : "Verify"}
                  </button>
                </div>

                <div
                  aria-live="polite"
                  className={`rounded-2xl border p-5 text-sm font-bold leading-relaxed transition-all ${
                    verification.status === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : verification.status === "error"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        : "border-white/5 bg-white/5 text-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StorefrontIcon
                      name={verification.status === "success" ? "check" : verification.status === "error" ? "close" : "info"}
                      className="h-5 w-5 shrink-0"
                    />
                    <span>
                      {verification.message}
                      {verification.nickname ? <strong className="ml-2 text-white">{verification.nickname}</strong> : null}
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <StepActions current={step} onBack={() => setStep(1)} onNext={() => advanceStep(3)} nextLabel="Continue to payment" />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/10">
                  <StorefrontIcon name="coin" className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Diamond Packs</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {visiblePackages.map((item) => {
                  const selected = item.id === selectedPackage.id;
                  const badge = getMerchandisingBadge(item);
                  const quantity = splitBonusQuantity(item.name);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPackageId(item.id);
                        resetVerification();
                      }}
                      className={`group relative flex flex-col items-start p-6 rounded-[2rem] border-2 transition-all duration-300 text-left ${
                        selected
                          ? "border-violet-500 bg-[#1a1b2e] shadow-2xl shadow-violet-500/20 -translate-y-1"
                          : "border-white/5 bg-[#161722] hover:border-white/20 hover:bg-[#1a1b2e]"
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div
                        className={`absolute top-5 left-5 h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center ${
                          selected ? "bg-violet-500 border-violet-500" : "bg-transparent border-white/20"
                        }`}
                      >
                        {selected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                      </div>

                      {badge && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
                          <StorefrontIcon name="info" className="h-3 w-3" />
                          {badge.label}
                        </div>
                      )}

                      <div className="mt-8 flex flex-col w-full">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xl font-black text-white italic">{quantity.base}</span>
                          {quantity.bonus && (
                            <span className="recharza-package-bonus text-lg italic">
                              +{quantity.plus} {quantity.bonus}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/40 font-bold text-[11px] mt-1">
                          <StorefrontIcon name="coin" className="h-3 w-3 text-blue-400/50" />
                          <span>{quantity.base} gems</span>
                          <StorefrontIcon name="info" className="h-3 w-3 ml-1 text-amber-500/50" />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col w-full">
                        <span className="recharza-package-price text-2xl italic">
                          {formatPresentment(item.amountInPaise)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <StepActions current={step} onNext={() => advanceStep(2)} nextLabel="Continue to player info" />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div id="billing" className="space-y-8">
              <section className="recharza-checkout-card p-6 sm:p-10">
                <div className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/10">
                      <StorefrontIcon name="check" className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Review & Pay</p>
                      <h2 className="text-2xl font-black text-white italic uppercase">Order Summary</h2>
                    </div>
                  </div>

                  <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Product</span>
                      <p className="mt-2 text-lg font-black text-white italic">{selectedPackage.name}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Region</span>
                      <p className="mt-2 text-lg font-black text-white italic">
                        {market.flag} {market.label}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Player ID</span>
                      <p className="mt-2 font-mono text-xl font-black text-white tracking-[0.2em]">{playerId || "—"}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Zone ID</span>
                      <p className="mt-2 font-mono text-xl font-black text-white tracking-[0.2em]">{zoneId || "—"}</p>
                    </div>
                    <div className="sm:col-span-2 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/50">
                          Verified Player
                        </span>
                        <p className="mt-2 text-xl font-black text-emerald-400 italic">{verification.nickname || "CONFIRMED"}</p>
                      </div>
                      <StorefrontIcon name="check" className="h-8 w-8 text-emerald-500/40" />
                    </div>
                    <div className="sm:col-span-2 mt-6 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Total Payment</span>
                        <p className="mt-2 text-5xl sm:text-6xl font-black text-violet-400 tracking-tighter italic leading-none">
                          {formatPresentment(selectedPackage.amountInPaise)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
                        <StorefrontIcon name="shield" className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Secure Checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {isAuthenticated && savedAddresses.length > 0 ? (
                <SavedAddressPicker addresses={savedAddresses} selectedAddressId={selectedAddressId} onSelect={applySavedAddress} />
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
                <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-6 py-5 shadow-xl">
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSaveNewAddress(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded-md border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500/50 accent-violet-600"
                  />
                  <span className="text-sm text-white/80">
                    <strong className="font-black uppercase tracking-wider text-white">Save this billing address</strong>
                    <span className="mt-1 block text-xs text-white/40 font-bold">
                      Keep this address for faster checkout on your next top-up.
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
            <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="recharza-checkout-secondary h-14 px-8 text-sm tracking-widest"
              >
                Back to player
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canCreateOrder || Boolean(order)}
                className="recharza-checkout-primary h-14 px-10 text-sm tracking-widest"
              >
                {isSubmitting ? "Processing…" : "Pay Now"}
              </button>
            </div>
          </>
        ) : null}

        {checkoutError ? <p aria-live="assertive" className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm font-bold text-rose-400">{checkoutError}</p> : null}
        {checkoutMessage && !order ? <p className="rounded-[1.5rem] border border-cyan-500/30 bg-cyan-500/10 px-6 py-4 text-sm font-bold text-cyan-400">{checkoutMessage}</p> : null}

        {step === 4 && order ? (
          <section className="rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5 p-8 shadow-2xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">{duplicate ? "Order Found" : "Order Confirmed"}</p>
                <h3 className="mt-3 break-all text-2xl font-black tracking-tight text-white italic uppercase leading-none">{order.id}</h3>
                <p className="mt-4 text-sm font-bold leading-relaxed text-emerald-100/60">{checkoutMessage}</p>
                {addressSaveNote ? <p className="mt-2 text-xs font-bold leading-relaxed text-amber-400/80 italic">{addressSaveNote}</p> : null}
              </div>
              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 shadow-lg">{order.ownership.accountLinked ? "Linked account" : "Guest checkout"}</span>
            </div>

            <div className="mt-8">
              <PrivateOrderTokenCard token={order.tracking.accessToken} />
            </div>

            {paymentVerified ? (
              <div className="mt-8 rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-black uppercase tracking-wider text-emerald-400 text-center">Payment confirmed. Fulfillment in progress.</div>
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
  return (
    <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
      {current > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="recharza-checkout-secondary h-14 px-10 text-sm tracking-[0.15em]"
        >
          Back
        </button>
      ) : <div />}
      {current < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="recharza-checkout-primary h-14 px-12 text-sm tracking-[0.15em]"
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  );
}
