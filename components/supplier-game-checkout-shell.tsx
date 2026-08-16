"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";

import { BillingAddressFields, initialBillingForm, type BillingFormState } from "@/components/billing-address-fields";
import { PrivateOrderTokenCard } from "@/components/private-order-token-card";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { ResilientImage } from "@/components/resilient-image";
import { SavedAddressPicker } from "@/components/saved-address-picker";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  convertInrPaiseToCurrencyMinor,
  formatCurrencyMinor,
  type SupportedCurrencyCode,
} from "@/lib/commerce/currencies";
import { getSupplierSelectOptions, validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
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
  region: string | null;
  fields: unknown;
  media: {
    sources: string[];
    alt: string;
    source: string;
  };
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
  verificationMode: string;
  message: string;
};

type IdentityState = {
  playerId: string;
  riotId: string;
  serverId: string;
};

type CheckoutStep = 1 | 2 | 3 | 4 | 5;

const initialIdentity: IdentityState = { playerId: "", riotId: "", serverId: "" };
const fieldClassName = "mt-2 min-h-12 w-full rounded-lg border border-white/[0.09] bg-[#080a10] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

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
  fxSnapshot,
  savedAddresses = [],
  isAuthenticated = false,
  initialCartItemId = null,
}: {
  gameSlug: SupplierCheckoutGameSlug;
  packages: CheckoutPackage[];
  fxSnapshot: FxSnapshot;
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
    if (defaultAddress) return toBillingFormState(defaultAddress, fxSnapshot.mode);
    return initialBillingForm;
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
  const selectedRate = fxSnapshot.ratesFromInrMicros[billing.presentmentCurrency] ?? 0;
  const canConvert = billing.presentmentCurrency === "INR" || selectedRate > 0;
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
    setMessage("Checking the game account...");

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
        setError(result.message ?? "We could not verify that game account.");
        setMessage("");
        return;
      }

      setVerification(result);
      setMessage(
        result.confirmed && result.nickname
          ? `Account verified as ${result.nickname}.`
          : "Player details verified. Live account lookup is not enabled.",
      );
    } catch {
      setError("The account verification service could not be reached. Please retry.");
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
    setBilling(toBillingFormState(address, fxSnapshot.mode));
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
    if (billing.presentmentCurrency === "INR" || !selectedRate) return formatInr(amountInPaise);
    return formatCurrencyMinor(
      convertInrPaiseToCurrencyMinor(amountInPaise, billing.presentmentCurrency, selectedRate),
      billing.presentmentCurrency,
    );
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !selectedPackage || !identityResult?.valid) {
      setError(
        identityResult && !identityResult.valid
          ? identityResult.message
          : "Complete the player, package and billing details before continuing.",
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
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
        body: JSON.stringify({
          gameSlug,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          identity,
          billing: {
            ...billing,
            presentmentCurrency: fxSnapshot.mode === "live" ? billing.presentmentCurrency : "INR",
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
      setStep(5);
      setMessage(result.paymentSession?.message ?? "Order saved. Complete payment in the secure checkout below.");

      if (isAuthenticated && saveNewAddress && selectedAddressId === null) {
        void saveBillingAddress().then((saved) => {
          if (!saved) {
            setAddressSaveNote("Your billing address could not be saved to your account. Your order is unaffected.");
          }
        });
      }
    } catch {
      setError("The checkout service could not be reached. Retrying uses the same protected order key.");
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function advanceStep(nextStep: CheckoutStep) {
    if (nextStep === 2 && !selectedPackage) { setError("Choose a package before continuing."); return; }
    if (nextStep === 3 && (!identityResult?.valid || !verification?.valid)) { setError("Verify the player destination before continuing."); return; }
    if (nextStep === 4 && (!billingIsComplete(billing) || !canConvert)) { setError("Complete the billing details before continuing."); return; }
    setError("");
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const selectedMarketLabel = markets.find((market) => market.code === marketCode)?.label ?? "Selected market";
  const gameLabel = gameSlug === "free-fire" ? "Free Fire MAX" : gameSlug === "valorant" ? "VALORANT" : gameSlug === "pubg-mobile" ? "PUBG Mobile" : gameSlug === "genshin-impact" ? "Genshin Impact" : "Game top-up";

  if (!selectedPackage) {
    return (
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100">
        <p className="font-black">This market is not available yet.</p>
        <p className="mt-1 text-amber-100/65">No curated supplier packs are published for this game and region.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submitCheckout}
      className="space-y-5"
    >
      <div className="min-w-0 space-y-5">
        <section className="relative overflow-hidden rounded-2xl border border-violet-300/[0.16] bg-[radial-gradient(circle_at_0%_0%,rgba(139,92,246,0.18),transparent_42%),#0d0f18] p-5 sm:p-6">
          <div className="relative">
            <Link href="/#games" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 transition hover:text-white">
              <StorefrontIcon name="arrow" className="h-3 w-3 rotate-180" /> Browse games <span className="text-slate-700">/</span> {gameLabel}
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Verified checkout</span>
                  <span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{selectedMarketLabel}</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Build your top-up</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Choose a package, verify the player destination, and review the final amount in your selected display currency before payment.</p>
              </div>
              <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-right"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Protected flow</div><div className="mt-1 text-xs font-bold text-emerald-200">ID check · clear pricing</div></div>
            </div>
          </div>
        </section>
        {false && markets.length > 1 && gameSlug !== "free-fire" ? (
          <section className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {markets.map((market) => (
                <button
                  key={market.code}
                  type="button"
                  onClick={() => chooseMarket(market.code)}
                  className={`min-h-9 rounded-lg border px-3 text-xs font-black transition ${
                    market.code === marketCode
                      ? "border-violet-400/45 bg-violet-500/12 text-white"
                      : "border-white/[0.08] bg-[#0d0f16] text-slate-500 hover:border-white/[0.16] hover:text-white"
                  }`}
                >
                  {market.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <CheckoutProgress step={step} onStepChange={setStep} />

        {step === 2 ? <>
        <section className="rounded-xl border border-white/[0.08] bg-[#0d0f16] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white">Order information</h2>
              <p className="mt-1 text-xs text-slate-500">Enter the destination exactly as shown in-game.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">Step 3</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {gameSlug === "valorant" ? (
              <label className="text-xs font-black text-slate-400 sm:col-span-2">
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
                    resetVerification();
                    resetOrder();
                  }}
                  placeholder="PlayerName#TAG"
                  className={fieldClassName}
                />
              </label>
            ) : (
                <label className="text-xs font-black text-slate-400">
                {gameSlug === "genshin-impact" ? "UID" : "Player ID"}
                {gameSlug === "free-fire" ? <span className="ml-2 font-normal text-slate-600">works across supported regions</span> : null}
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
                  className={fieldClassName}
                />
              </label>
            )}

            {gameSlug === "genshin-impact" ? (
              <label className="text-xs font-black text-slate-400">
                Server
                <select
                  required
                  value={identity.serverId}
                  onChange={(event) => {
                    setIdentity({ ...identity, serverId: event.target.value });
                    resetVerification();
                    resetOrder();
                  }}
                  className={fieldClassName}
                >
                  <option value="">Choose server</option>
                  {serverOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-xs ${verification?.confirmed ? "text-emerald-300" : identityResult?.valid ? "text-slate-300" : "text-slate-600"}`}>
              {verification?.confirmed && verification.nickname
                ? `Verified IGN: ${verification.nickname}`
                : identityResult?.valid
                  ? `Destination format confirmed for ${selectedPackage.marketLabel}. Verify before continuing.`
                  : identityResult?.message ?? "Enter the destination details to continue."}
            </p>
            <button
              type="button"
              onClick={() => void verifyIdentity()}
              disabled={!identityResult?.valid || isVerifying}
              className="min-h-10 shrink-0 rounded-lg border border-emerald-300/25 bg-emerald-300/[0.08] px-4 text-xs font-black text-emerald-200 transition hover:border-emerald-300/45 hover:bg-emerald-300/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isVerifying ? "Verifying…" : verification?.valid ? "Verify again" : "Verify account"}
            </button>
          </div>
        </section>
        <StepActions current={step} onBack={() => setStep(1)} onNext={() => advanceStep(3)} nextLabel="Continue to billing" />
        </> : null}

        {step === 1 ? <>
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.025em] text-white">Choose a package</h2>
              <p className="mt-1 text-xs text-slate-500">
                {marketPackages.length} published offers{gameSlug === "free-fire" ? " across supported regions" : ` for ${selectedPackage.marketLabel}`}.
              </p>
            </div>
          </div>

          {restoredFromCart ? (
            <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2.5 text-xs leading-5 text-cyan-100">
              Package restored from your cart. Confirm the destination details
              before paying for this order.
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {marketPackages.map((item) => {
              const selected = item.id === selectedPackage.id;
              return (
                <div
                  key={item.id}
                  className={`group overflow-hidden rounded-lg border text-left transition ${
                    selected
                      ? "border-violet-400/55 bg-violet-500/[0.08] shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                      : "border-white/[0.08] bg-[#0d0f16] hover:border-white/[0.17]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPackageId(item.id);
                      setRestoredFromCart(false);
                      resetVerification();
                      resetOrder();
                    }}
                    aria-pressed={selected}
                    className="block w-full text-left"
                  >
                    <span className="relative block aspect-[16/9] overflow-hidden bg-[#141821]">
                      <ResilientImage
                        sources={item.media.sources}
                        alt={item.media.alt}
                        fallbackLabel={item.name.slice(0, 2).toUpperCase()}
                        fill
                        sizes="(max-width: 640px) 45vw, 190px"
                        className="object-contain p-4 sm:p-5 transition duration-300 group-hover:scale-[1.035]"
                        fallbackClassName="absolute inset-0 h-full w-full"
                      />
                    </span>
                    <span className="block p-2.5 sm:p-3">
                      <strong className="line-clamp-2 min-h-9 text-xs leading-4 text-white sm:text-[13px] sm:leading-5">{item.name}</strong>
                      {gameSlug === "free-fire" && item.marketLabel ? (
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.marketLabel}</span>
                      ) : null}
                      <span className="mt-1.5 block text-base font-black text-violet-300">{formatPresentment(item.amountInPaise)}</span>
                      {selected ? <span className="mt-1 block text-[10px] font-black text-emerald-300">Selected</span> : null}
                    </span>
                  </button>
                  <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                    <AddToCartButton
                      gameSlug={gameSlug}
                      marketCode={item.marketCode}
                      packageId={item.id}
                      packageName={item.name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
              resetOrder();
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
                onChange={(event) => setSaveNewAddress(event.target.checked)}
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
        <section className="rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(139,92,246,0.16),transparent_42%),#0d0f16] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">Step 4 · Final review</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Review your order</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Confirm the player destination, package, market, currency, and total before continuing to secure payment.</p>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200">Ready for payment</span>
          </div>
          <dl className="mt-6 grid gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-bold text-slate-500">Pack</dt><dd className="mt-1 font-black text-white">{selectedPackage.name}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">Market</dt><dd className="mt-1 font-black text-white">{selectedPackage.marketLabel}</dd></div>
            {identity.riotId ? <div className="rounded-lg border border-violet-300/15 bg-violet-400/[0.06] p-3"><dt className="text-xs font-bold text-slate-500">Riot ID</dt><dd className="mt-1 break-all font-mono text-sm font-black tracking-wide text-white">{identity.riotId}</dd></div> : null}
            {identity.playerId ? <div className="rounded-lg border border-violet-300/15 bg-violet-400/[0.06] p-3"><dt className="text-xs font-bold text-slate-500">Player ID / UID</dt><dd className="mt-1 break-all font-mono text-sm font-black tracking-wide text-white">{identity.playerId}</dd></div> : null}
            {identity.serverId ? <div className="rounded-lg border border-violet-300/15 bg-violet-400/[0.06] p-3"><dt className="text-xs font-bold text-slate-500">Server / Zone ID</dt><dd className="mt-1 break-all font-mono text-sm font-black tracking-wide text-white">{identity.serverId}</dd></div> : null}
            <div><dt className="text-xs font-bold text-slate-500">Verified IGN</dt><dd className="mt-1 break-words font-black text-emerald-200">{verification?.nickname ?? "Verified player"}</dd></div>
            <div><dt className="text-xs font-bold text-slate-500">Currency</dt><dd className="mt-1 font-black text-white">{billing.presentmentCurrency}</dd></div>
            <div className="border-t border-white/[0.08] pt-4 sm:col-span-2"><dt className="text-xs font-bold text-slate-500">Total</dt><dd className="mt-1 text-3xl font-black text-violet-300">{formatPresentment(selectedPackage.amountInPaise)}</dd></div>
          </dl>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setStep(3)} className="min-h-11 rounded-xl border border-white/[0.1] px-4 text-sm font-black text-slate-300 transition hover:border-white/[0.2] hover:text-white">Back to billing</button>
            <button type="submit" disabled={!canSubmit || isSubmitting || Boolean(order)} className="min-h-11 rounded-xl bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-45">{isSubmitting ? "Preparing payment…" : "Continue to payment"}</button>
          </div>
        </section>
        </> : null}

        {error ? <p className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100">{error}</p> : null}
        {message ? <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">{message}</p> : null}

        {step === 5 && order ? (
          <section className="rounded-xl border border-emerald-300/20 bg-[#0c1110] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-emerald-100">Order {order.id} created</h2>
                <p className="mt-1 text-xs text-emerald-100/60">The order is saved and recoverable before payment.</p>
                {addressSaveNote ? <p className="mt-2 text-xs leading-5 text-amber-200/80">{addressSaveNote}</p> : null}
              </div>
              <Link href={`${order.tracking.path}?token=${encodeURIComponent(order.tracking.accessToken)}`} className="text-xs font-black text-emerald-300 underline">Open tracking</Link>
            </div>
            <PrivateOrderTokenCard token={order.tracking.accessToken} />
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
            {paymentVerified ? <p className="mt-4 text-sm font-bold text-emerald-200">Payment verification completed for this order.</p> : null}
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
            <button type="button" onClick={() => complete ? onStepChange(number as 1 | 2 | 3 | 4 | 5) : undefined} disabled={!complete && !active} aria-current={active ? "step" : undefined} aria-label={`${label} step${active ? ", current step" : complete ? ", completed" : ", locked"}`} className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition ${active ? "bg-violet-500/15 text-violet-200" : complete ? "text-emerald-200 hover:bg-white/[0.05]" : "text-slate-600"}`}>
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
    {current < 4 ? <button type="button" onClick={onNext} className="min-h-11 rounded-xl bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60">{nextLabel}</button> : null}
  </div>;
}
