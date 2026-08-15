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
          className={`mb-4 rounded-lg border px-4 py-3 text-xs font-bold ${
            notice.tone === "error"
              ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
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
                className="h-40 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03] lg:sticky lg:top-28" />
        </div>
      ) : null}

      {loadState.status === "error" ? (
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-8 text-center"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-rose-400/20 bg-rose-400/[0.08] text-rose-200">
            <StorefrontIcon name="cart" className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-black text-white">
            The cart couldn&apos;t be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-100/65">
            {loadState.message} Your saved items are safe.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoadState({ status: "loading" });
                void load();
              }}
              className="min-h-10 rounded-lg bg-white px-4 text-xs font-black text-slate-950"
            >
              Try again
            </button>
            <Link
              href="/#games"
              className="inline-flex min-h-10 items-center rounded-lg border border-white/[0.1] px-4 text-xs font-black text-white"
            >
              Browse games
            </Link>
          </div>
        </div>
      ) : null}

      {loadState.status === "ready" && cart.items.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-[#0d0f16] px-6 py-14 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] text-violet-300">
            <StorefrontIcon name="cart" className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-white">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add something from the store to get started.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/#games"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-violet-500 px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(124,58,237,0.3)] transition hover:bg-violet-400"
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
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                  Ready to top up
                </p>
                <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">
                  Your items
                </h2>
              </div>
              <button
                type="button"
                disabled={busyClear}
                onClick={() => void clearCart()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-[11px] font-black text-slate-500 transition hover:border-rose-400/25 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
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