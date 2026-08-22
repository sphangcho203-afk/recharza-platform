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
  if (!cart.items.length) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-xl font-bold text-slate-900">Your cart is empty</h1><Link href="/cart" className="mt-5 inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5">Back to cart</Link></div>;

  return (
    <section className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><Link href="/cart" className="text-xs font-bold text-slate-500 hover:text-slate-900">← Back to cart</Link><h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">One secure checkout</h1><p className="mt-1 text-sm font-medium text-slate-500">Verify each game account once, then pay for the full cart together.</p></div>
        <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 sm:inline-flex">{cart.items.length} game {cart.items.length === 1 ? "item" : "items"}</span>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400"><span className={step >= 1 ? "text-violet-600" : ""}>Accounts</span><span className={step >= 2 ? "text-violet-600" : ""}>Billing</span><span className={step >= 3 ? "text-violet-600" : ""}>Review & payment</span></div>
      {message ? <p role="alert" className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{message}</p> : null}

      {step === 1 ? <div className="grid gap-4">{cart.items.map((item) => { const identity = identities[item.id] ?? { playerId: "", zoneId: "", nickname: "" }; return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">{gameLabel(item)}{item.marketCode ? ` · ${item.marketCode}` : ""}</p><h2 className="mt-1 text-base font-bold text-slate-900">{item.package.name}</h2><p className="mt-1 text-xs font-bold text-emerald-600">Delivers {deliveryLabel(item)}{item.quantity > 1 ? ` · ${item.quantity} packages` : ""}</p></div><div className="text-right"><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Line total</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{identityLabel(item)}<input value={identity.playerId} onChange={(event) => updateIdentity(item.id, { playerId: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-violet-600 focus:bg-white transition-all" placeholder={item.gameSlug === "valorant" ? "name#tag" : "Enter player ID"} /></label>{item.gameSlug !== "valorant" ? <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Server / Zone ID<input value={identity.zoneId} onChange={(event) => updateIdentity(item.id, { zoneId: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-violet-600 focus:bg-white transition-all" placeholder="Enter server or zone" /></label> : null}</div></article>; })}<button type="button" onClick={continueFromIdentity} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5">Verify accounts & continue <StorefrontIcon name="arrow" className="h-4 w-4" /></button></div> : null}

      {step === 2 ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50"><h2 className="text-lg font-bold tracking-tight text-slate-900">Billing details</h2><p className="mt-1 text-sm font-medium text-slate-500">One billing address for the complete cart.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full name<input value={billing.fullName} onChange={(event) => setBilling({ ...billing, fullName: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email<input type="email" value={billing.email} onChange={(event) => setBilling({ ...billing, email: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone<input value={billing.phone} onChange={(event) => setBilling({ ...billing, phone: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country code<input value={billing.countryCode} onChange={(event) => setBilling({ ...billing, countryCode: event.target.value.toUpperCase() })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" maxLength={2} /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City<input value={billing.city} onChange={(event) => setBilling({ ...billing, city: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State / province<input value={billing.state} onChange={(event) => setBilling({ ...billing, state: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Postal code<input value={billing.postalCode} onChange={(event) => setBilling({ ...billing, postalCode: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label><label className="text-xs font-bold text-slate-500 uppercase tracking-wider sm:col-span-2">Address<input value={billing.line1} onChange={(event) => setBilling({ ...billing, line1: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900" /></label></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-xl border border-slate-200 px-6 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">Back</button><button type="button" onClick={continueFromBilling} className="min-h-11 rounded-xl bg-violet-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5">Review order</button></div></div><Summary cart={cart} /></div> : null}

      {step === 3 ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50"><h2 className="text-lg font-bold tracking-tight text-slate-900">Review every delivery</h2><p className="mt-1 text-sm font-medium text-slate-500">Each package will be delivered to the verified account shown below.</p><div className="mt-5 grid gap-3">{cart.items.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-violet-600 uppercase tracking-wider">{gameLabel(item)}</p><p className="mt-1 text-sm font-bold text-slate-900">{item.package.name} × {item.quantity}</p><p className="mt-1 text-xs font-bold text-emerald-600">{deliveryLabel(item)}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</p><p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">To: {identities[item.id]?.playerId}{identities[item.id]?.zoneId ? ` · ${identities[item.id].zoneId}` : ""}</p></div><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /></div></div>)}</div><div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs font-medium text-slate-500"><p className="font-bold text-slate-900 uppercase tracking-wider">Billing</p><p className="mt-1">{billing.fullName} · {billing.email}</p><p>{billing.line1}, {billing.city}, {billing.countryCode}</p></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setStep(2)} className="min-h-11 rounded-xl border border-slate-200 px-6 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">Back</button>{orderSession ? <RazorpayTestCheckout orderId={orderSession.orderId} orderStatus="CREATED" accessToken={orderSession.accessToken} amountInPaise={orderSession.totalInPaise} packageName={`Complete cart · ${cart.items.length} game items`} onVerified={() => setMessage("Payment verified. Every top-up is now processing for the verified accounts.")} /> : <button type="button" onClick={createUnifiedOrder} disabled={creating} className="min-h-11 flex-1 rounded-xl bg-violet-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 disabled:opacity-50">{creating ? "Preparing secure checkout…" : <>Continue to payment · <DisplayPrice amountInrMinor={total} /></>}</button>}</div></div><Summary cart={cart} /></div> : null}
    </section>
  );
}

function Summary({ cart }: { cart: CartSnapshot }) { return <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 lg:sticky lg:top-28"><p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Complete cart</p><h2 className="mt-1 text-base font-bold text-slate-900">Order total</h2><div className="mt-5 grid gap-3">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-xs font-medium"><span className="min-w-0 truncate text-slate-500">{gameLabel(item)} · {item.package.name} × {item.quantity}</span><DisplayPrice amountInrMinor={item.package.amountInPaise * item.quantity} /></div>)}</div><div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-900"><span>Total</span><DisplayPrice amountInrMinor={cart.totalInPaise} /></div></aside>; }

export default CartCheckoutPage;
