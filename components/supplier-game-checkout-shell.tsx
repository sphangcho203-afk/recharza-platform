"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

  if (!selectedPackage) {
    return (
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100">
        <p className="font-black">This market is not available yet.</p>
        <p className="mt-1 text-amber-100/65">No curated supplier packs are published for this game and region.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submitCheckout} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
        {markets.length > 1 && gameSlug !== "free-fire" ? (
          <section className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2">
              {markets.map((market) => (
                <button
                  key={market.code}
                  type="button"
                  onClick={() => chooseMarket(market.code)}
                  className={`min-h-10 rounded-lg border px-4 text-xs font-black transition ${
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

        <section className="rounded-xl border border-white/[0.08] bg-[#0d0f16] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white">Order information</h2>
              <p className="mt-1 text-xs text-slate-500">Enter the destination exactly as shown in-game.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">Step 1</span>
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

        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-[-0.025em] text-white">Choose a package</h2>
              <p className="mt-1 text-xs text-slate-500">
                {marketPackages.length} published offers{gameSlug === "free-fire" ? " across supported regions" : ` for ${selectedPackage.marketLabel}`}.
              </p>
            </div>
            <Link href="/cart" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-[11px] font-black text-slate-300 transition hover:border-white/[0.16] hover:text-white">
              <StorefrontIcon name="cart" className="h-3.5 w-3.5" />
              My cart
            </Link>
          </div>

          {restoredFromCart ? (
            <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2.5 text-xs leading-5 text-cyan-100">
              Package restored from your cart. Confirm the destination details
              before paying for this order.
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {marketPackages.map((item) => {
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
                      setRestoredFromCart(false);
                      resetVerification();
                      resetOrder();
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
                      {gameSlug === "free-fire" && item.marketLabel ? (
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.marketLabel}</span>
                      ) : null}
                      <span className="mt-1.5 block text-base font-black text-violet-300">{formatPresentment(item.amountInPaise)}</span>
                      {selected ? <span className="mt-1 block text-[10px] font-black text-emerald-300">Selected</span> : null}
                    </span>
                  </button>
                  <div className="px-3 pb-3">
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

        {error ? <p className="rounded-lg border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100">{error}</p> : null}
        {message ? <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">{message}</p> : null}

        {order ? (
          <section className="rounded-xl border border-emerald-300/20 bg-[#0c1110] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-emerald-100">Order {order.id} created</h2>
                <p className="mt-1 text-xs text-emerald-100/60">The order is saved and recoverable before payment.</p>
                {addressSaveNote ? <p className="mt-2 text-xs leading-5 text-amber-200/80">{addressSaveNote}</p> : null}
              </div>
              <Link href={`${order.tracking.path}?token=${encodeURIComponent(order.tracking.accessToken)}`} className="text-xs font-black text-emerald-300 underline">Open tracking</Link>
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
            {paymentVerified ? <p className="mt-4 text-sm font-bold text-emerald-200">Payment verification completed for this order.</p> : null}
          </section>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-xl border border-white/[0.09] bg-[#0d0f16] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-5">
          <h2 className="text-base font-black text-white">Order summary</h2>
          <dl className="mt-4 grid gap-3 text-xs">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Product</dt>
              <dd className="max-w-[11rem] text-right font-bold text-slate-200">{selectedPackage.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Market</dt>
              <dd className="font-bold text-slate-200">{selectedPackage.marketLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/[0.08] pt-3">
              <dt className="font-black text-slate-300">Total</dt>
              <dd className="text-xl font-black text-violet-300">{formatPresentment(selectedPackage.amountInPaise)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || Boolean(order)}
            className="mt-5 min-h-12 w-full rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? "Creating order…" : order ? "Order created" : canSubmit ? "Continue to payment" : verification?.valid ? "Complete details" : "Verify account first"}
          </button>

          {!billingIsComplete(billing) ? (
            <a href="#billing" className="mt-3 block text-center text-[11px] font-black text-slate-500 hover:text-white">Complete billing details</a>
          ) : null}

          <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-4">
            <SummaryPoint icon="shield" title="Secure checkout" text="Server-side order and payment verification." />
            <SummaryPoint icon="track" title="Private tracking" text="Recoverable order status after creation." />
            <SummaryPoint icon="support" title="Support ready" text="Ticket system linked to order IDs." />
          </div>
        </div>
      </aside>
    </form>
  );
}

function SummaryPoint({ icon, title, text }: { icon: Parameters<typeof StorefrontIcon>[0]["name"]; title: string; text: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-slate-400">
        <StorefrontIcon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-black text-slate-300">{title}</p>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
