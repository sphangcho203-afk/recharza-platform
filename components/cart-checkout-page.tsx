"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DisplayPrice } from "@/components/display-price";
import { RazorpayTestCheckout } from "@/components/razorpay-test-checkout";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { CartItemView, CartSnapshot } from "@/lib/cart-snapshot";

const gameLabels: Record<string, string> = {
  "free-fire": "Free Fire",
  "pubg-mobile": "PUBG Mobile",
  valorant: "VALORANT",
  "genshin-impact": "Genshin Impact",
  "mobile-legends": "Mobile Legends",
};

type Identity = { playerId: string; zoneId: string; nickname: string };
type Billing = { fullName: string; email: string; phone: string; countryCode: string; city: string; state: string; postalCode: string; line1: string; presentmentCurrency: string };

function deliveryLabel(item: CartItemView) {
  const match = item.package.name.match(/([\d,]+(?:\s*\+\s*[\d,]+)?)\s*(diamonds?|uc|vp|points?|crystals?|genesis crystals?)/i);
  if (match) return `${match[1]} ${match[2]}`;
  return item.package.name;
}

function gameLabel(item: CartItemView) {
  return gameLabels[item.gameSlug] ?? item.gameSlug;
}

function identityLabel(item: CartItemView) {
  return item.gameSlug === "valorant" ? "Riot ID" : "Player ID";
}

export function CartCheckoutPage() {
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identities, setIdentities] = useState<Record<string, Identity>>({});
  const [billing, setBilling] = useState<Billing>({ fullName: "", email: "", phone: "", countryCode: "IN", city: "", state: "", postalCode: "", line1: "", presentmentCurrency: "INR" });
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [orderSession, setOrderSession] = useState<{ orderId: string; accessToken: string; totalInPaise: number } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean }) => setIsAuthenticated(Boolean(result.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { cart?: CartSnapshot }) => setCart(result.cart ?? null))
      .catch(() => setMessage("The cart could not be loaded. Please return to the cart and retry."));
  }, []);

  const total = useMemo(() => cart?.totalInPaise ?? 0, [cart]);

  function updateIdentity(itemId: string, patch: Partial<Identity>) {
    setIdentities((current) => {
      const previous = current[itemId] ?? { playerId: "", zoneId: "", nickname: "" };
      return { ...current, [itemId]: { ...previous, ...patch } };
    });
  }

  function continueFromIdentity() {
    if (!cart) return;
    const incomplete = cart.items.find((item) => !identities[item.id]?.playerId.trim() || (item.gameSlug !== "valorant" && !identities[item.id]?.zoneId.trim()));
    if (incomplete) {
      setMessage(`Enter the ${identityLabel(incomplete)} and server or zone for ${gameLabel(incomplete)} before continuing.`);
      return;
    }
    setMessage("");
    setStep(2);
  }

  async function createUnifiedOrder() {
    if (!cart || creating) return;
    if (!isAuthenticated) {
      setMessage("Sign in to your verified Recharza account to finish the order — your cart, player IDs and billing details stay in place.");
      return;
    }
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          billing,
          items: cart.items.map((item) => ({ cartItemId: item.id, identity: identities[item.id] })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "The unified checkout could not be created.");
      setOrderSession({ orderId: result.orderId, accessToken: result.accessToken, totalInPaise: result.totalInPaise });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The unified checkout could not be created.");
    } finally {
      setCreating(false);
    }
  }

  function continueFromBilling() {
    if (!billing.fullName.trim() || !billing.email.trim() || !billing.phone.trim() || !billing.countryCode || !billing.city.trim() || !billing.state.trim() || !billing.postalCode.trim() || !billing.line1.trim()) {
      setMessage("Complete the billing details before reviewing your order.");
      return;
    }
    setMessage("");
    setStep(3);
  }

  if (!cart) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-400">Loading unified checkout…</div>;
  if (!cart.items.length) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-xl font-semibold text-white">Your cart is empty</h1><Link href="/cart" className="mt-5 inline-flex rounded-lg bg-violet-500 px-5 py-3 text-sm font-semibold text-white">Back to cart</Link></div>;

  return (
    <section className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><Link href="/cart" className="text-xs font-bold text-slate-500 hover:text-white">← Back to cart</Link><h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">One secure checkout</h1><p className="mt-1 text-sm text-slate-500">Verify each game account once, then pay for the full cart together.</p></div>
        <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-[11px] font-semibold text-emerald-200 sm:inline-flex">{cart.items.length} game {cart.items.length === 1 ? "item" : "items"}</span>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"><span className={step >= 1 ? "text-violet-300" : ""}>Accounts</span><span className={step >= 2 ? "text-violet-300" : ""}>Billing</span><span className={step >= 3 ? "text-violet-300" : ""}>Review & payment</span></div>
      {message ? <p role="alert" className="mb-5 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-xs font-bold text-rose-200">{message}</p> : null}

      {step === 1 ? <div className="grid gap-4">{cart.items.map((item) => { const identity = identities[item.id] ?? { playerId: "", zoneId: "", nickname: "" }; return <article key={item.id} className="rounded-lg border border-white/[0.08] bg-[#0d0f16] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">{gameLabel(item)}{item.marketCode ? ` · ${item.marketCode}` : ""}</p><h2 className="mt-1 text-base font-semibold text-white">{item.package.name}</h2><p className="mt-1 text-xs font-bold text-emerald-300">Delivers {deliveryLabel(item)}{item.quantity > 1 ? ` · ${item.quantity} packages` : ""}</p></div><div className="text-right"><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /><p className="text-[11px] text-slate-600">Line total</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-400">{identityLabel(item)}<input value={identity.playerId} onChange={(event) => updateIdentity(item.id, { playerId: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-400" placeholder={item.gameSlug === "valorant" ? "name#tag" : "Enter player ID"} /></label>{item.gameSlug !== "valorant" ? <label className="text-xs font-bold text-slate-400">Server / Zone ID<input value={identity.zoneId} onChange={(event) => updateIdentity(item.id, { zoneId: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Enter server or zone" /></label> : null}</div></article>; })}<button type="button" onClick={continueFromIdentity} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)]">Verify accounts & continue <StorefrontIcon name="arrow" className="h-4 w-4" /></button></div> : null}

      {step === 2 ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-lg border border-white/[0.08] bg-[#0d0f16] p-5"><h2 className="text-lg font-semibold tracking-tight text-white">Billing details</h2><p className="mt-1 text-sm text-slate-500">One billing address for the complete cart.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-400">Full name<input value={billing.fullName} onChange={(event) => setBilling({ ...billing, fullName: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400">Email<input type="email" value={billing.email} onChange={(event) => setBilling({ ...billing, email: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400">Phone<input value={billing.phone} onChange={(event) => setBilling({ ...billing, phone: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400">Country code<input value={billing.countryCode} onChange={(event) => setBilling({ ...billing, countryCode: event.target.value.toUpperCase() })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" maxLength={2} /></label><label className="text-xs font-bold text-slate-400">City<input value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400">State / province<input value={billing.state} onChange={(event) => setBilling({ ...billing, state: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400">Postal code<input value={billing.postalCode} onChange={(event) => setBilling({ ...billing, postalCode: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label><label className="text-xs font-bold text-slate-400 sm:col-span-2">Address<input value={billing.line1} onChange={(event) => setBilling({ ...billing, line1: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.1] bg-black/20 px-3 text-sm text-white" /></label></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-lg border border-white/[0.1] px-4 text-xs font-semibold text-slate-300">Back</button><button type="button" onClick={continueFromBilling} className="min-h-11 rounded-lg bg-violet-500 px-5 text-xs font-semibold text-white">Review order</button></div></div><Summary cart={cart} /></div> : null}

      {step === 3 ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-lg border border-white/[0.08] bg-[#0d0f16] p-5"><h2 className="text-lg font-semibold tracking-tight text-white">Review every delivery</h2><p className="mt-1 text-sm text-slate-500">Each package will be delivered to the verified account shown below.</p><div className="mt-5 grid gap-3">{cart.items.map((item) => <div key={item.id} className="rounded-lg border border-white/[0.08] bg-black/15 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-violet-300">{gameLabel(item)}</p><p className="mt-1 text-sm font-semibold text-white">{item.package.name} × {item.quantity}</p><p className="mt-1 text-xs text-emerald-300">{deliveryLabel(item)}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</p><p className="mt-1 text-xs text-slate-500">To: {identities[item.id]?.playerId}{identities[item.id]?.zoneId ? ` · ${identities[item.id].zoneId}` : ""}</p></div><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /></div></div>)}</div><div className="mt-5 rounded-lg border border-white/[0.08] bg-black/20 p-4 text-xs text-slate-400"><p className="font-semibold text-white">Billing</p><p className="mt-1">{billing.fullName} · {billing.email}</p><p>{billing.line1}, {billing.city}, {billing.countryCode}</p></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(2)} className="min-h-11 rounded-lg border border-white/[0.1] px-4 text-xs font-semibold text-slate-300">Back</button>{orderSession ? <RazorpayTestCheckout orderId={orderSession.orderId} orderStatus="CREATED" accessToken={orderSession.accessToken} amountInPaise={orderSession.totalInPaise} packageName={`Complete cart · ${cart.items.length} game items`} onVerified={() => setMessage("Payment verified. Every top-up is now processing for the verified accounts.")} /> : <button type="button" onClick={createUnifiedOrder} disabled={creating} className="min-h-11 flex-1 rounded-lg bg-violet-500 px-5 text-xs font-semibold text-white disabled:opacity-50">{creating ? "Preparing secure checkout…" : <>Continue to payment · <DisplayPrice amountInrMinor={total} /></>}</button>}</div></div><Summary cart={cart} /></div> : null}
    </section>
  );
}

function Summary({ cart }: { cart: CartSnapshot }) { return <aside className="h-fit rounded-lg border border-white/[0.08] bg-[#0d0f16] p-5 lg:sticky lg:top-28"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">Complete cart</p><h2 className="mt-1 text-base font-semibold text-white">Order total</h2><div className="mt-5 grid gap-3">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-xs"><span className="min-w-0 truncate text-slate-500">{gameLabel(item)} · {item.package.name} × {item.quantity}</span><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /></div>)}</div><div className="mt-4 flex justify-between border-t border-white/[0.08] pt-4 text-sm font-semibold text-white"><span>Total</span><DisplayPrice amountInrMinor={cart.totalInPaise} /></div></aside>; }

export default CartCheckoutPage;
