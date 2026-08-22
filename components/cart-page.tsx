"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CartItemRow } from "@/components/cart-item-row";
import { CartOrderSummary } from "@/components/cart-order-summary";
import { StorefrontIcon } from "@/components/storefront-icon";
import { publishCartChanged } from "@/components/use-cart-count";
import {
  CART_CHANGED_EVENT,
  emptyCartSnapshot,
  type CartSnapshot,
} from "@/lib/cart-snapshot";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

export function CartPage() {
  const [cart, setCart] = useState<CartSnapshot>(emptyCartSnapshot);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [busyItemId, setBusyItemId] = useState("");
  const [busyClear, setBusyClear] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setLoadState({
          status: "error",
          message: result.message ?? "The cart could not be loaded.",
        });
        return;
      }
      setCart(result.cart);
      setLoadState({ status: "ready" });
    } catch {
      setLoadState({
        status: "error",
        message: "The cart service could not be reached.",
      });
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);

    function onCartChanged() {
      void load();
    }

    window.addEventListener(CART_CHANGED_EVENT, onCartChanged);
    return () => window.removeEventListener(CART_CHANGED_EVENT, onCartChanged);
  }, [load]);

  async function applyMutation(
    request: () => Promise<Response>,
    fallbackMessage: string,
  ) {
    try {
      const response = await request();
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };
      if (!response.ok || !result.ok || !result.cart) {
        setNotice({
          tone: "error",
          text: result.message ?? fallbackMessage,
        });
        return false;
      }
      setCart(result.cart);
      publishCartChanged(result.cart.itemCount);
      setNotice({ tone: "info", text: result.message ?? "Cart updated." });
      return true;
    } catch {
      setNotice({ tone: "error", text: fallbackMessage });
      return false;
    }
  }

  async function changeQuantity(itemId: string, quantity: number) {
    setBusyItemId(itemId);
    await applyMutation(
      () =>
        fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        }),
      "The quantity could not be updated.",
    );
    setBusyItemId("");
  }

  async function removeItem(itemId: string) {
    setBusyItemId(itemId);
    await applyMutation(
      () => fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      }),
      "The item could not be removed.",
    );
    setBusyItemId("");
  }

  async function clearCart() {
    setBusyClear(true);
    await applyMutation(
      () => fetch("/api/cart", { method: "DELETE" }),
      "The cart could not be cleared.",
    );
    setBusyClear(false);
  }

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className={`mb-4 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md ${
            notice.tone === "error"
              ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {loadState.status === "loading" ? (
        <div
          role="status"
          aria-label="Loading your cart"
          aria-busy="true"
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
        >
          <div className="grid gap-4">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl border border-white/5 bg-white/5"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-white/5 bg-white/5 lg:sticky lg:top-28" />
        </div>
      ) : null}

      {loadState.status === "error" ? (
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center shadow-2xl backdrop-blur-md"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-rose-500/30 bg-white/5 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <StorefrontIcon name="cart" className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold tracking-tight text-white">
            The cart couldn&apos;t be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-400/70 font-medium">
            {loadState.message} Your saved items are safe.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoadState({ status: "loading" });
                void load();
              }}
              className="min-h-10 rounded-lg bg-white px-4 text-xs font-bold text-black transition hover:bg-slate-200"
            >
              Try again
            </button>
            <Link
              href="/#games"
              className="inline-flex min-h-10 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10"
            >
              Browse games
            </Link>
          </div>
        </div>
      ) : null}

      {loadState.status === "ready" && cart.items.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 px-6 py-14 text-center shadow-2xl backdrop-blur-md">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-500/30 bg-white/5 text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <StorefrontIcon name="cart" className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-white">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400 font-medium">
            Add something from the store to get started.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/#games"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
            >
              Browse Games
            </Link>
          </div>
        </div>
      ) : null}

      {loadState.status === "ready" && cart.items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="grid min-w-0 gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-400">
                  Ready to top up
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-white">
                  Your items
                </h2>
              </div>
              <button
                type="button"
                disabled={busyClear}
                onClick={() => void clearCart()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-bold text-slate-400 transition duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyClear ? "Clearing…" : "Clear cart"}
              </button>
            </div>

            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                busy={busyItemId === item.id}
                onQuantityChange={(itemId, quantity) =>
                  void changeQuantity(itemId, quantity)
                }
                onRemove={(itemId) => void removeItem(itemId)}
              />
            ))}
          </div>

          <CartOrderSummary cart={cart} busy={busyItemId !== "" || busyClear} />
        </div>
      ) : null}
    </section>
  );
}