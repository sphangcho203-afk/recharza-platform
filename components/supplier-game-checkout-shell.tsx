"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { useDisplayCurrency } from "@/components/display-price";

import { BillingAddressFields, initialBillingForm, type BillingFormState } from "@/components/billing-address-fields";
import { CheckoutProgressRail } from "@/components/checkout-progress-rail";
import { Shimmer } from "@/components/shimmer";
import { StatusBadge } from "@/components/status-badge";
import { PrivateOrderTokenCard } from "@/components/private-order-token-card";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { ResilientImage } from "@/components/resilient-image";
import { SavedAddressPicker } from "@/components/saved-address-picker";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { formatDisplayMinor } from "@/lib/commerce/display-currency";
import { getSupplierSelectOptions, validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
import { getMerchandisingBadge, splitBonusQuantity } from "@/lib/commerce/merchandising";
import { toBillingFormState } from "@/lib/commerce/saved-address-form";
import type { SavedAddressView } from "@/lib/commerce/saved-addresses";
import type { CartSnapshot } from "@/lib/cart-snapshot";
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
  marketCurrency: SupportedCurrencyCode;
  region: string | null;
  fields: unknown;
  media: {
    sources: string[];
    alt: string;
    source: string;
  };
};

type CreatedOrder = {
  id: string;
  status: string;
  package: { id: string; name: string; amountInPaise: number; currency: string };
  presentment: { amountMinor: number; currency: SupportedCurrencyCode; fxQuotedAt: string | null } | null;
  billing: { fullName: string; email: string; countryCode: string; city: string } | null;
  player: { playerId: string; zoneId: string; nickname: string | null; verificationMode: string };
  tracking: { path: string; accessToken: string };
};

type CheckoutResponse = {
  ok: boolean;
  duplicate?: boolean;
  message?: string;
  order?: CreatedOrder;
  paymentSession?: { message?: string };
};

type IdentityVerification = {
  valid: boolean;
  confirmed: boolean;
  nickname: string | null;
  region: string | null;
  verificationMode: string;
  message: string;
};

type IdentityState = {
  playerId: string;
  riotId: string;
  serverId: string;
};

type CheckoutStep = 1 | 2 | 3 | 4;

const initialIdentity: IdentityState = { playerId: "", riotId: "", serverId: "" };
const fieldClassName = "storefront-checkout-field mt-2 w-full px-3.5 text-sm placeholder:text-slate-500 border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-600 focus:ring-violet-600/10";

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

export function SupplierGameCheckoutShell({
  gameSlug,
  packages,
  savedAddresses = [],
  isAuthenticated = false,
  initialCartItemId = null,
}: {
  gameSlug: SupplierCheckoutGameSlug;
  packages: CheckoutPackage[];
  savedAddresses?: SavedAddressView[];
  isAuthenticated?: boolean;
  initialCartItemId?: string | null;
}) {
  const markets = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of packages) map.set(item.marketCode, item.marketLabel);
    return Array.from(map, ([code, label]) => ({ code, label }));
  }, [packages]);

  const firstMarketCode = markets[0]?.code ?? "";
  const initialMarketCurrency = packages.find((item) => item.marketCode === firstMarketCode)?.marketCurrency ?? "INR";
  const [marketCode, setMarketCode] = useState(firstMarketCode);
  const marketPackages = useMemo(
    () => (gameSlug === "free-fire" ? packages : packages.filter((item) => item.marketCode === marketCode)),
    [gameSlug, marketCode, packages],
  );
  const [packageId, setPackageId] = useState(packages.find((item) => item.marketCode === firstMarketCode)?.id ?? "");
  const [step, setStep] = useState<CheckoutStep>(1);
  const [identity, setIdentity] = useState<IdentityState>(initialIdentity);
  const [billing, setBilling] = useState<BillingFormState>(() => {
    const defaultAddress = savedAddresses.find((item) => item.isDefault);
    if (defaultAddress) return toBillingFormState(defaultAddress, initialMarketCurrency);
    return { ...initialBillingForm, presentmentCurrency: initialMarketCurrency };
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    () => savedAddresses.find((item) => item.isDefault)?.id ?? null,
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressSaveNote, setAddressSaveNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
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
        const restoredPackage = packages.find(
          (entry) => entry.id === item.package.id,
        );
        if (!restoredPackage) return;
        setMarketCode(restoredPackage.marketCode);
        setPackageId(item.package.id);
        setIdentity((current) => ({
          ...current,
          playerId: item.player.playerId ?? "",
        }));
        setRestoredFromCart(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialCartItemId, packages]);

  const selectedPackage = packages.find((item) => item.id === packageId) ?? marketPackages[0];
  const serverOptions = getSupplierSelectOptions(selectedPackage?.fields, /server/);
  const identityResult = selectedPackage ? validateSupplierCheckoutIdentity(gameSlug, identity, selectedPackage.fields) : null;
  const marketCurrency = selectedPackage?.marketCurrency ?? initialMarketCurrency;
  const { currency: displayCurrency, rates: displayRates } = useDisplayCurrency();
  const canConvert = billing.presentmentCurrency === marketCurrency;
  const canSubmit = Boolean(
    selectedPackage &&
      identityResult?.valid &&
      verification?.valid &&
      billingIsComplete(billing) &&
      canConvert,
  );

  function resetVerification() {
    setVerification(null);
    setError("");
  }

  function resetOrder() {
    idempotencyKey.current = null;
    setOrder(null);
    setPaymentVerified(false);
    setMessage("");
    setError("");
    setAddressSaveNote("");
  }

  async function verifyIdentity() {
    if (!selectedPackage || !identityResult?.valid) {
      setError(
        identityResult && !identityResult.valid
          ? identityResult.message
          : "Enter valid player details before verifying.",
      );
      return;
    }

    setIsVerifying(true);
    setVerification(null);
    setError("");
    setMessage("Checking account details...");

    try {
      const response = await fetch(`/api/games/${gameSlug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          marketCode: selectedPackage.marketCode,
          identity,
        }),
      });
      const result = (await response.json()) as IdentityVerification;
      if (!response.ok || !result.valid) {
        setError(result.message ?? "We could not find a game account with those details. Double-check the IDs.");
        setMessage("");
        return;
      }

      setVerification(result);
      setMessage(
        result.confirmed && result.nickname
          ? `Account verified as ${result.nickname}${result.region ? ` (${result.region} account)` : ""}.`
          : "Player details verified. Live account lookup is not enabled.",
      );
    } catch {
      setError("The verification service is temporarily unavailable. Please retry shortly.");
      setMessage("");
    } finally {
      setIsVerifying(false);
    }
  }

  function applySavedAddress(address: SavedAddressView | null) {
    if (!address) {
      setSelectedAddressId(null);
      return;
    }
    setSelectedAddressId(address.id);
    setSaveNewAddress(false);
    setBilling(toBillingFormState(address, marketCurrency));
    resetOrder();
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

  function chooseMarket(nextMarketCode: string) {
    const nextPackage = packages.find((item) => item.marketCode === nextMarketCode);
    setMarketCode(nextMarketCode);
    setPackageId(nextPackage?.id ?? "");
    setIdentity(initialIdentity);
    resetVerification();
    setRestoredFromCart(false);
    resetOrder();
  }

  function formatPresentment(amountInPaise: number) {
    return formatDisplayMinor(amountInPaise, displayCurrency, displayRates);
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !selectedPackage || !identityResult?.valid) {
      setError(
        identityResult && !identityResult.valid
          ? identityResult.message
          : "Please confirm your account and complete billing details before payment.",
      );
      return;
    }

    if (!isAuthenticated) {
      setError(
        "Finish by signing in to your verified Recharza account — your package, player ID and billing details stay in place, and you will return to this page to complete payment.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("Preparing your order...");
    setOrder(null);
    setPaymentVerified(false);

    const requestKey = idempotencyKey.current ?? createIdempotencyKey();
    idempotencyKey.current = requestKey;

    try {
      const response = await fetch("/api/checkout/game", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
        body: JSON.stringify({
          gameSlug,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          identity,
          billing: {
            ...billing,
            presentmentCurrency: marketCurrency,
          },
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (!response.ok || !result.ok || !result.order) {
        setError(result.message ?? "The checkout could not create an order.");
        setMessage("");
        return;
      }

      sessionStorage.setItem(`recharza-order:${result.order.id}`, result.order.tracking.accessToken);
      setOrder(result.order);
      setStep(4);
      setMessage(result.paymentSession?.message ?? "Order confirmed. Please proceed to payment.");

      if (isAuthenticated && saveNewAddress && selectedAddressId === null) {
        void saveBillingAddress().then((saved) => {
          if (!saved) {
            setAddressSaveNote("Your billing address could not be saved to your account. Your order is unaffected.");
          }
        });
      }
    } catch {
      setError("The checkout service is temporarily unavailable. Please retry shortly.");
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function advanceStep(nextStep: CheckoutStep) {
    if (nextStep === 2 && !selectedPackage) { setError("Choose a package before continuing."); return; }
    if (nextStep === 3 && !verification?.confirmed) { setError("Please confirm your account details before continuing."); return; }
    const billingComplete = billingIsComplete(billing);
    if (nextStep === 4 && !billingComplete) { setError("Complete the billing details before continuing."); return; }
    setError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const selectedMarketLabel = markets.find((market) => market.code === marketCode)?.label ?? "Selected market";
  const gameLabel = gameSlug === "free-fire" ? "Free Fire MAX" : gameSlug === "valorant" ? "VALORANT" : gameSlug === "pubg-mobile" ? "PUBG Mobile" : gameSlug === "genshin-impact" ? "Genshin Impact" : "Game top-up";

  if (!selectedPackage) {
    return (
      <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100">
        <p className="font-semibold">This market is not available yet.</p>
        <p className="mt-1 text-amber-100/65">No curated supplier packs are published for this game and region.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submitCheckout}
      className="space-y-8"
    >
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
                    <p className="text-sm text-white/50">Confirm your identity for instant delivery.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gameSlug === "valorant" ? (
                      <label className="flex flex-col gap-2 sm:col-span-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Riot ID</span>
                        <input
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={32}
                          value={identity.riotId}
                          onChange={(event) => {
                            setIdentity({ ...identity, riotId: event.target.value.slice(0, 32) });
                            resetVerification();
                            resetOrder();
                          }}
                          placeholder="PlayerName#TAG"
                          className="recharza-checkout-input h-14 px-5 font-bold outline-none"
                        />
                      </label>
                    ) : (
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                          {gameSlug === "genshin-impact" ? "UID" : "Player ID"}
                        </span>
                        <input
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={20}
                          value={identity.playerId}
                          onChange={(event) => {
                            const playerId = event.target.value.replace(/\D/g, "").slice(0, 20);
                            setIdentity({ ...identity, playerId });
                            resetVerification();
                            resetOrder();
                          }}
                          placeholder={gameSlug === "genshin-impact" ? "9 or 10 digit UID" : "Numeric player ID"}
                          className="recharza-checkout-input h-14 px-5 font-bold outline-none"
                        />
                      </label>
                    )}

                    {gameSlug === "genshin-impact" ? (
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Select Server</span>
                        <select
                          required
                          value={identity.serverId}
                          onChange={(event) => {
                            setIdentity({ ...identity, serverId: event.target.value });
                            resetVerification();
                            resetOrder();
                          }}
                          className="recharza-checkout-input h-14 px-5 font-bold outline-none appearance-none"
                        >
                          <option value="" className="bg-[#1a1b2e]">Choose server</option>
                          {serverOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[#1a1b2e]">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => void verifyIdentity()}
                    disabled={!identityResult?.valid || isVerifying}
                    className="recharza-checkout-button h-14 px-8 text-sm tracking-widest"
                  >
                    {isVerifying ? "Checking…" : verification?.valid ? "Verify again" : "Verify account"}
                  </button>
                </div>

                <div
                  aria-live="polite"
                  className={`rounded-2xl border p-5 text-sm font-bold leading-relaxed transition-all ${
                    verification?.valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : error
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        : "border-white/5 bg-white/5 text-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StorefrontIcon name={verification?.valid ? "check" : error ? "close" : "info"} className="h-5 w-5 shrink-0" />
                    <span>{message || error || "Verification status pending."}</span>
                  </div>
                </div>

                {restoredFromCart ? (
                  <p className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-sm font-bold text-cyan-400">
                    Your selected package has been restored. Please confirm your account details to continue.
                  </p>
                ) : null}
              </div>
            </section>
            <StepActions
              current={step}
              onBack={() => setStep(1)}
              onNext={() => advanceStep(3)}
              nextLabel="Continue to payment"
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <section className="space-y-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1 bg-violet-500 rounded-full" />
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                    Select Package
                  </h2>
                </div>

                {markets.length > 1 && gameSlug !== "free-fire" ? (
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Market Region</span>
                    <select
                      value={marketCode}
                      onChange={(event) => chooseMarket(event.target.value)}
                      className="h-12 rounded-xl border border-white/10 bg-[#1a1b2e] px-4 text-sm font-bold text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
                    >
                      {markets.map((market) => (
                        <option key={market.code} value={market.code} className="bg-[#1a1b2e]">
                          {market.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {marketPackages.map((item) => {
                  const selected = item.id === selectedPackage.id;
                  const badge = getMerchandisingBadge(item);
                  const quantity = splitBonusQuantity(item.name);
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPackageId(item.id);
                        setRestoredFromCart(false);
                        resetVerification();
                        resetOrder();
                      }}
                      className={`group relative flex flex-col items-start p-6 rounded-[2.5rem] border-2 transition-all duration-300 text-left ${
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
                        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>

                      {badge && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
                          <StorefrontIcon name="coin" className="h-3 w-3" />
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
                        <div className="flex items-center gap-1.5 text-white/40 font-bold text-xs mt-1">
                          <StorefrontIcon name="coin" className="h-3.5 w-3.5" />
                          <span>{item.name}</span>
                          <StorefrontIcon name="track" className="h-3.5 w-3.5 ml-1 text-orange-500/50" />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col w-full">
                        <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price</span>
                            <span className="recharza-package-price text-2xl italic">
                              {formatPresentment(item.amountInPaise)}
                            </span>
                          </div>
                          <div
                            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
                              selected ? "bg-violet-600 text-white" : "bg-white/5 text-white/20 group-hover:bg-white/10"
                            }`}
                          >
                            <StorefrontIcon name="track" className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            <StepActions
              current={step}
              onNext={() => advanceStep(2)}
              nextLabel="Continue to player info"
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div id="billing" className="space-y-6">
              <section className="recharza-checkout-card p-6 sm:p-8">
                <div className="relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-400">Order Summary</p>
                  <h2 className="mt-2 text-3xl font-black text-white italic">Order Review</h2>
                  
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Package</span>
                      <p className="mt-2 text-lg font-bold text-white">{selectedPackage.name}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Market</span>
                      <p className="mt-2 text-lg font-bold text-white">{selectedPackage.marketLabel}</p>
                    </div>
                    {identity.riotId ? (
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Riot ID</span>
                        <p className="mt-2 font-mono text-xl font-black text-white tracking-widest">{identity.riotId}</p>
                      </div>
                    ) : null}
                    {identity.playerId ? (
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Player ID / UID</span>
                        <p className="mt-2 font-mono text-xl font-black text-white tracking-widest">{identity.playerId}</p>
                      </div>
                    ) : null}
                    {identity.serverId ? (
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Server / Zone ID</span>
                        <p className="mt-2 font-mono text-xl font-black text-white tracking-widest">{identity.serverId}</p>
                      </div>
                    ) : null}
                    <div className="sm:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/50">Verified Nickname</span>
                      <p className="mt-2 text-xl font-black text-emerald-400">{verification?.nickname || "Verified Player"}</p>
                    </div>
                    <div className="sm:col-span-2 mt-4 pt-6 border-t border-white/5">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Total Amount</span>
                      <p className="mt-2 text-5xl font-black text-violet-400 tracking-tighter italic">{formatPresentment(selectedPackage.amountInPaise)}</p>
                    </div>
                  </div>
                </div>
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
              setBilling(nextBilling);
              resetOrder();
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
                onChange={(event) => setSaveNewAddress(event.target.checked)}
                className="mt-1 h-5 w-5 rounded-md border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500/50 accent-violet-600"
              />
              <span className="text-sm text-white/80">
                <strong className="font-black uppercase tracking-wider text-white">Save this billing address</strong>
                <span className="mt-1 block text-xs text-white/40 font-bold">Keep this address for faster checkout on your next top-up.</span>
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
            disabled={!canSubmit || isSubmitting || Boolean(order)} 
            className="recharza-checkout-primary h-14 px-10 text-sm tracking-widest"
          >
            {isSubmitting ? "Processing…" : "Pay Now"}
          </button>
        </div>
        </> : null}

        {error ? <p className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm font-bold text-rose-400">{error}</p> : null}
        {message && !order ? <p className="rounded-[1.5rem] border border-cyan-500/30 bg-cyan-500/10 px-6 py-4 text-sm font-bold text-cyan-400">{message}</p> : null}

        {step === 4 && order ? (
          <section className="rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5 p-8 shadow-2xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">Order Confirmed</p>
                <h3 className="mt-3 break-all text-2xl font-black tracking-tight text-white italic uppercase leading-none">{order.id}</h3>
                <p className="mt-4 text-sm font-bold leading-relaxed text-emerald-100/60">Review your order details and proceed to payment.</p>
                {addressSaveNote ? <p className="mt-2 text-xs font-bold leading-relaxed text-amber-400/80 italic">{addressSaveNote}</p> : null}
              </div>
              <Link 
                href={`${order.tracking.path}?token=${encodeURIComponent(order.tracking.accessToken)}`} 
                className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 shadow-lg hover:text-white hover:bg-white/10 transition-all"
              >
                Open tracking
              </Link>
            </div>
            <div className="mt-8">
              <PrivateOrderTokenCard token={order.tracking.accessToken} />
            </div>
            <div className="mt-8">
              <RazorpayTestCheckout
                orderId={order.id}
                orderStatus={order.status}
                accessToken={order.tracking.accessToken}
                amountInPaise={order.package.amountInPaise}
                packageName={order.package.name}
                onVerified={() => {
                  setPaymentVerified(true);
                  setMessage("Payment successful. You can track your order status below.");
                }}
              />
            </div>
            {paymentVerified ? (
              <div className="mt-8 rounded-[1.5rem] border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-black uppercase tracking-wider text-emerald-400 text-center">Payment confirmed. Fulfillment in progress.</div>
            ) : null}
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
    <nav aria-label="Checkout progress" className="mb-10">
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
