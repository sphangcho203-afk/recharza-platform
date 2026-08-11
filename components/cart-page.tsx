"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
import { formatInr } from "@/lib/mobile-legends";

type CartItem = {
  id: string;
  gameSlug: string;
  package: { id: string; name: string; amountInPaise: number; currency: string };
  quantity: number;
  player: { playerId: string | null; zoneId: string | null; nickname: string | null };
};

type Cart = {
  itemCount: number;
  totalInPaise: number;
  currency: string;
  items: CartItem[];
};

const emptyCart: Cart = { itemCount: 0, totalInPaise: 0, currency: "INR", items: [] };

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = (await response.json()) as { ok?: boolean; cart?: Cart; message?: string };
      if (!response.ok || !result.ok || !result.cart) {
        throw new Error(result.message ?? "The cart could not be loaded.");
      }
      setCart(result.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The cart could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
  }, []);

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    setError("");
    try {
      const response = await fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
      const result = (await response.json()) as { ok?: boolean; cart?: Cart; message?: string };
      if (!response.ok || !result.ok || !result.cart) throw new Error(result.message ?? "The item could not be removed.");
      setCart(result.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The item could not be removed.");
    } finally {
      setBusyId(null);
    }
  }

  async function clearCart() {
    setClearing(true);
    setError("");
    try {
      const response = await fetch("/api/cart", { method: "DELETE" });
      const result = (await response.json()) as { ok?: boolean; cart?: Cart; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message ?? "The cart could not be cleared.");
      setCart(result.cart ?? emptyCart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The cart could not be cleared.");
    } finally {
      setClearing(false);
    }
  }

  const items = cart?.items ?? [];

  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <section className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-white">
            <span aria-hidden="true">←</span> Continue shopping
          </Link>
          <Link href="/account" className="text-xs font-black text-slate-500 transition hover:text-white">Account</Link>
        </div>

        <div className="mt-9 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Your cart</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Cart</h1>
            <p className="mt-2 text-sm text-slate-500">
              {loading ? "Checking what you picked…" : `${cart?.itemCount ?? 0} ${cart?.itemCount === 1 ? "item" : "items"}`}
            </p>
          </div>
          {!loading && items.length > 0 ? (
            <button type="button" onClick={() => void clearCart()} disabled={clearing} className="text-xs font-black text-slate-600 transition hover:text-rose-300 disabled:opacity-50">
              {clearing ? "Clearing…" : "Clear cart"}
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100">
            {error}
            <button type="button" onClick={() => void loadCart()} className="ml-2 font-black underline underline-offset-2">Try again</button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-3">
            <div className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025]" />
            <div className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025]" />
          </div>
        ) : items.length === 0 ? (
          <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0d13] p-8 text-center sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-500">
              <StorefrontIcon name="cart" className="h-7 w-7" />
            </div>
            <p className="mt-6 text-xl font-black text-white">Nothing’s here. Add something. 😭</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your cart is currently living its peaceful, product-free life. Pick a game and give it a reason to exist.
            </p>
            <Link href="/#games" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400">
              Browse games <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="grid gap-3" aria-label="Cart items">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/[0.08] bg-[#0b0d13] p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                      <StorefrontIcon name="games" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                            {item.gameSlug === "mobile-legends" ? "Mobile Legends" : item.gameSlug}
                          </p>
                          <h2 className="mt-1 text-lg font-black text-white">{item.package.name}</h2>
                        </div>
                        <p className="text-lg font-black text-white">{formatInr(item.package.amountInPaise)}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                        <p className="text-xs text-slate-500">
                          {item.player.nickname ? <><span className="font-bold text-emerald-300">✓ {item.player.nickname}</span><span className="mx-1.5">·</span></> : null}
                          {item.player.playerId ? `ID ${item.player.playerId}` : "Account not added yet"}
                          {item.player.zoneId ? ` · Zone ${item.player.zoneId}` : ""}
                        </p>
                        <button type="button" onClick={() => void removeItem(item.id)} disabled={busyId === item.id} className="text-xs font-black text-slate-600 transition hover:text-rose-300 disabled:opacity-50">
                          {busyId === item.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#0b0d13] p-5 lg:sticky lg:top-24">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Summary</p>
              <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                <span>Items</span><span className="font-bold text-white">{cart?.itemCount}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <span className="text-sm font-black text-white">Total</span>
                <span className="text-xl font-black text-white">{formatInr(cart?.totalInPaise ?? 0)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-600">Final payment details are confirmed at checkout.</p>
              <Link href="/#games" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-black text-white transition hover:bg-violet-400">
                Continue shopping <StorefrontIcon name="arrow" className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
