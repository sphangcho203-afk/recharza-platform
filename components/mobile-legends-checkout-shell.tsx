"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BillingAddressFields, initialBillingForm, type BillingFormState } from "@/components/billing-address-fields";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { ResilientImage } from "@/components/resilient-image";
import { SavedAddressPicker } from "@/components/saved-address-picker";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { toBillingFormState } from "@/lib/commerce/saved-address-form";
import type { SavedAddressView } from "@/lib/commerce/saved-addresses";
import type { CartSnapshot } from "@/lib/cart-snapshot";
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
  package: { id: string; name: string; amountInPaise: number; currency: string };
  presentment: { amountMinor: number; currency: SupportedCurrencyCode; fxQuotedAt: string | null } | null;
  billing: { fullName: string; email: string; countryCode: string; city: string } | null;
  player: { playerId: string; zoneId: string; nickname: string | null; verificationMode: string };
  ownership: { mode: "billing-email"; email: string; accountLinked: boolean };
  tracking: { path: string; accessToken: string };
};

type CheckoutStep = 1 | 2 | 3 | 4 | 5;

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
  message: "Enter the player and zone IDs, then verify the destination.",
  nickname: null,
};

const inputClassName = "mt-2 min-h-12 w-full rounded-lg border border-white/[0.09] bg-[#080a10] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

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
  fxSnapshot,
  savedAddresses = [],
  isAuthenticated = false,
  initialCartItemId = null,
}: {
  packages: MobileLegendsPackage[];
  market: MobileLegendsMarket;
  fxSnapshot: FxSnapshot;
  savedAddresses?: SavedAddressView[];
  isAuthenticated?: boolean;
  initialCartItemId?: string | null;
}) {
  const firstPackage = packages.find((item) => item.featured) ?? packages[0];
  const [packageId, setPackageId] = useState(firstPackage?.id ?? "");
  const [step, setStep] = useState<CheckoutStep>(1);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [billing, setBilling] = useState<BillingFormState>(() => {
    const defaultAddress = savedAddresses.find((item) => item.isDefault);
    if (defaultAddress) return toBillingFormState(defaultAddress, fxSnapshot.mode);
    return {
      ...initialBillingForm,
      presentmentCurrency: fxSnapshot.mode === "live" ? market.defaultCurrency : "INR",
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

  const selectedRate = fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert = billing.presentmentCurrency === "INR" || selectedRate > 0;
  const billingComplete = billingIsComplete(billing);
  const playerComplete = verification.status === "success";
  const canCreateOrder = Boolean(selectedPackage && playerComplete && billingComplete && canConvert);

  function formatPresentment(amountInPaise: number) {
    if (billing.presentmentCurrency === "INR" || !selectedRate) return formatInr(amountInPaise);
    return formatCurrencyMinor(
      convertInrPaiseToCurrencyMinor(amountInPaise, billing.presentmentCurrency, selectedRate),
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
    setAddressSaveNote("");
  }

  function applySavedAddress(address: SavedAddressView | null) {
    if (!address) {
      setSelectedAddressId(null);
      return;
    }
    setSelectedAddressId(address.id);
    setSaveNewAddress(false);
    setBilling(toBillingFormState(address, fxSnapshot.mode));
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
      message: `Checking ${market.label} player details for ${selectedPackage.name}...`,
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
          message: result.message ?? "The player destination could not be validated for this package.",
          nickname: null,
        });
        return;
      }
      setVerification({
        status: "success",
        message: result.message ?? `Player destination confirmed for ${market.label}.`,
        nickname: result.nickname ?? null,
      });
    } catch {
      setVerification({
        status: "error",
        message: "The verification service could not be reached. Check the server and retry.",
        nickname: null,
      });
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateOrder || !selectedPackage) {
      setCheckoutError("Verify the player and complete billing details before payment.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutMessage("Creating the protected order...");
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
            presentmentCurrency: fxSnapshot.mode === "live" ? billing.presentmentCurrency : "INR",
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
      setStep(5);
      setCheckoutMessage(result.paymentSession?.message ?? "Order saved. Continue to payment below.");

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
    if (nextStep === 3 && verification.status !== "success") { setCheckoutError("Verify the player destination before continuing."); return; }
    if (nextStep === 4 && (!billingComplete || !canConvert)) { setCheckoutError("Complete the billing details before continuing."); return; }
    if (nextStep === 5 && (!canCreateOrder || order)) { setCheckoutError("Review the verified player and billing details before payment."); return; }
    setCheckoutError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedPackage) {
    return <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm text-amber-100">No approved packages are available for this market.</div>;
  }

  return (
    <form onSubmit={submitCheckout} className="grid gap-5">
      <div className="min-w-0 space-y-5">
        <CheckoutProgress step={step} onStepChange={setStep} />

        {step === 2 ? <>
        <section className="rounded-xl border border-white/[0.08] bg-[#0d0f16] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white">Order information</h2>
              <p className="mt-1 text-xs text-slate-500">Verify the Mobile Legends destination before creating an order.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.7fr_auto] sm:items-end">
            <label className="text-xs font-black text-slate-400">
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
            <label className="text-xs font-black text-slate-400">
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
              className="min-h-12 rounded-lg border border-violet-400/35 bg-violet-500/12 px-4 text-xs font-black text-white transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verification.status === "loading" ? "Checking…" : "Verify"}
            </button>
          </div>

          <div
            aria-live="polite"
            className={`mt-3 rounded-lg border px-3 py-2.5 text-xs leading-5 ${
              verification.status === "success"
                ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
                : verification.status === "error"
                  ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-200"
                  : "border-white/[0.08] bg-black/10 text-slate-600"
            }`}
          >
            {verification.message}
            {verification.nickname ? <strong className="ml-1 text-white">{verification.nickname}</strong> : null}
          </div>

          {restoredFromCart ? (
            <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2.5 text-xs leading-5 text-cyan-100">
              Package restored from your cart. Verify the player destination
              before paying for this order.
            </p>
          ) : null}
        </section>
        <StepActions current={step} onBack={() => setStep(1)} onNext={() => advanceStep(3)} nextLabel="Continue to billing" />
        </> : null}

        {step === 1 ? <>
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-[-0.025em] text-white">Choose a package</h2>
              <p className="mt-1 text-xs text-slate-500">{packages.length} offers · {market.flag} {market.label}</p>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {visiblePackages.map((item) => {
              const selected = item.id === selectedPackage.id;
              return (
                <div
                  key={item.id}
                  className={`group overflow-hidden rounded-xl border text-left transition ${
                    selected
                      ? "border-violet-400/55 bg-violet-500/[0.08] shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                      : "border-white/[0.08] bg-[#0d0f16] hover:border-white/[0.17]"
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
                    <span className="relative block aspect-[4/3] overflow-hidden bg-[#141821]">
                      <ResilientImage
                        sources={item.media.sources}
                        alt={item.media.alt}
                        fallbackLabel={item.name.slice(0, 2).toUpperCase()}
                        fill
                        sizes="(max-width: 640px) 45vw, 190px"
                        className="object-contain p-4 transition duration-300 group-hover:scale-[1.035]"
                        fallbackClassName="absolute inset-0 h-full w-full"
                      />
                    </span>
                    <span className="block p-3">
                      <strong className="line-clamp-2 min-h-10 text-xs leading-5 text-white sm:text-[13px]">{item.name}</strong>
                      <span className="mt-1.5 block text-base font-black text-violet-300">{formatPresentment(item.amountInPaise)}</span>
                      <span className="mt-1 block text-[10px] text-slate-600">{item.source === "fazercards-live" ? "Live offer" : "Preview offer"}</span>
                    </span>
                  </button>
                  <div className="px-3 pb-3">
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
          {visiblePackages.length === 0 ? <p className="mt-3 rounded-lg border border-dashed border-white/[0.1] p-8 text-center text-sm text-slate-500">No packages are currently available.</p> : null}
        </section>
        {step === 1 ? <StepActions current={step} onNext={() => advanceStep(2)} nextLabel="Continue to player info" /> : null}
        </> : null}

        {step === 3 ? <>
        <div id="billing" className="space-y-5">
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
              setBilling(nextBilling);
              resetCreatedOrder();
            }}
            fxMode={fxSnapshot.mode}
            stepNumber="03"
            stepLabel="Billing and currency"
          />

          {isAuthenticated && selectedAddressId === null ? (
            <label className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSaveNewAddress(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-violet-500"
              />
              <span className="text-sm text-slate-200">
                <strong className="font-black text-white">Save this billing address</strong>
                <span className="mt-0.5 block text-xs text-slate-500">Keep this address for faster checkout on your next top-up.</span>
              </span>
            </label>
          ) : null}
        </div>
        <StepActions current={step} onBack={() => setStep(2)} onNext={() => advanceStep(4)} nextLabel="Review order" />
        </> : null}

        {step === 4 ? <>
        <section className="rounded-xl border border-violet-300/20 bg-[#0d0f16] p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">Review before payment</p>
          <h2 className="mt-1 text-xl font-black text-white">Confirm your top-up</h2>
          <p className="mt-1 text-sm text-slate-500">Check the verified player, package, market, and billing details before creating the order.</p>
          <dl className="mt-5 grid gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-bold text-slate-500">Pack</dt><dd className="mt-1 font-black text-white">{selectedPackage.name}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">Market</dt><dd className="mt-1 font-black text-white">{market.flag} {market.label}</dd></div>
            <div className="rounded-lg border border-violet-300/15 bg-violet-400/[0.06] p-3"><dt className="text-xs font-bold text-slate-500">Player ID</dt><dd className="mt-1 break-all font-mono text-sm font-black tracking-wide text-white">{playerId || "—"}</dd></div>
            <div className="rounded-lg border border-violet-300/15 bg-violet-400/[0.06] p-3"><dt className="text-xs font-bold text-slate-500">Zone ID</dt><dd className="mt-1 break-all font-mono text-sm font-black tracking-wide text-white">{zoneId || "—"}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">Verified IGN</dt><dd className="mt-1 break-words font-black text-emerald-200">{verification.nickname || "Verified player"}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">Currency</dt><dd className="mt-1 font-black text-white">{billing.presentmentCurrency}</dd></div>
            <div className="border-t border-white/[0.08] pt-4 sm:col-span-2"><dt className="text-xs font-bold text-slate-500">Total</dt><dd className="mt-1 text-3xl font-black text-violet-300">{formatPresentment(selectedPackage.amountInPaise)}</dd></div>
          </dl>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setStep(3)} className="min-h-11 rounded-xl border border-white/[0.1] px-4 text-sm font-black text-slate-300 transition hover:border-white/[0.2] hover:text-white">Back to billing</button>
            <button type="submit" disabled={isSubmitting || !canCreateOrder || Boolean(order)} className="min-h-11 rounded-xl bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45">{isSubmitting ? "Creating protected order…" : "Continue to payment"}</button>
          </div>
        </section>
        </> : null}

        {checkoutError ? <p aria-live="assertive" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{checkoutError}</p> : null}
        {checkoutMessage && !order ? <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">{checkoutMessage}</p> : null}

        {step === 5 && order ? (
          <section className="rounded-xl border border-emerald-400/20 bg-[#0c1110] p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">{duplicate ? "Existing order recovered" : "Order created"}</p>
                <h3 className="mt-1 break-all text-lg font-black text-white">{order.id}</h3>
                <p className="mt-1 text-xs leading-5 text-emerald-100/65">{checkoutMessage}</p>
                {addressSaveNote ? <p className="mt-2 text-xs leading-5 text-amber-200/80">{addressSaveNote}</p> : null}
              </div>
              <span className="w-fit rounded-md border border-emerald-300/20 bg-emerald-300/[0.07] px-2 py-1 text-[10px] font-black text-emerald-200">{order.ownership.accountLinked ? "Linked account" : "Guest checkout"}</span>
            </div>

            {paymentVerified ? (
              <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-3 text-sm font-bold text-emerald-50">Payment response verified. Fulfilment status remains available through secure tracking.</div>
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

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={order.tracking.path} className="inline-flex min-h-10 items-center rounded-lg border border-emerald-300/20 px-3 text-xs font-black text-emerald-200">Open tracking</Link>
              <button
                type="button"
                onClick={() => resetCreatedOrder()}
                className="inline-flex min-h-10 items-center rounded-lg border border-white/[0.08] px-3 text-xs font-black text-slate-400 hover:text-white"
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


type CheckoutProgressProps = { step: number; onStepChange: (step: 1 | 2 | 3 | 4 | 5) => void };
type StepActionsProps = { current: number; onBack?: () => void; onNext: () => void; nextLabel: string };

function CheckoutProgress({ step, onStepChange }: CheckoutProgressProps) {
  const labels = ["Package", "Player", "Billing", "Review", "Payment"];
  return (
    <nav aria-label="Checkout progress" className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0d0f16] p-3">
      <ol className="grid grid-cols-5 gap-1">
        {labels.map((label, index) => {
          const number = index + 1;
          const active = number === step;
          const complete = number < step;
          return <li key={label}>
            <button type="button" onClick={() => complete ? onStepChange(number as 1 | 2 | 3 | 4 | 5) : undefined} disabled={!complete && !active} className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition ${active ? "bg-violet-500/15 text-violet-200" : complete ? "text-emerald-200 hover:bg-white/[0.05]" : "text-slate-600"}`}>
              <span className="grid h-7 w-7 place-items-center rounded-full border border-current text-[10px] font-black">{complete ? "✓" : number}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] sm:text-[10px]">{label}</span>
            </button>
          </li>;
        })}
      </ol>
    </nav>
  );
}

function StepActions({ current, onBack, onNext, nextLabel }: StepActionsProps) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    {current > 1 ? <button type="button" onClick={onBack} className="min-h-11 rounded-xl border border-white/[0.1] px-4 text-sm font-black text-slate-300 transition hover:border-white/[0.2] hover:text-white">Back</button> : <span />}
    {current < 5 ? <button type="button" onClick={onNext} className="min-h-11 rounded-xl bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">{nextLabel}</button> : null}
  </div>;
}
