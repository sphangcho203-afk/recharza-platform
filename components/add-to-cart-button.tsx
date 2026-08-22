"use client";

import { useEffect, useRef, useState } from "react";

import { publishCartChanged } from "@/components/use-cart-count";
import type { CartSnapshot } from "@/lib/cart-snapshot";

type AddToCartButtonProps = {
  gameSlug: string;
  marketCode: string;
  packageId: string;
  packageName: string;
  playerId?: string | null;
  zoneId?: string | null;
  disabled?: boolean;
};

type AddState =
  | { status: "idle" }
  | { status: "adding" }
  | { status: "added"; message: string }
  | { status: "error"; message: string };

export function AddToCartButton({
  gameSlug,
  marketCode,
  packageId,
  packageName,
  playerId,
  zoneId,
  disabled = false,
}: AddToCartButtonProps) {
  const [state, setState] = useState<AddState>({ status: "idle" });
  const addedReset = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedReset.current) clearTimeout(addedReset.current);
    };
  }, []);

  async function addToCart() {
    if (state.status === "adding") return;
    setState({ status: "adding" });

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug,
          marketCode,
          packageId,
          ...(playerId ? { playerId } : {}),
          ...(zoneId ? { zoneId } : {}),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        cart?: CartSnapshot;
      };

      if (!response.ok || !result.ok || !result.cart) {
        setState({
          status: "error",
          message: result.message ?? "The item could not be added to the cart.",
        });
        return;
      }

      publishCartChanged(result.cart.itemCount);
      setState({
        status: "added",
        message: result.message ?? `${packageName} added to cart.`,
      });
      addedReset.current = setTimeout(() => {
        setState({ status: "idle" });
      }, 2600);
    } catch {
      setState({
        status: "error",
        message: "The cart service could not be reached. Try again.",
      });
    }
  }

  return (
    <span>
      <button
        type="button"
        disabled={disabled || state.status === "adding"}
        onClick={() => void addToCart()}
        className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 text-[10px] font-bold uppercase tracking-widest text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-all duration-300 hover:bg-violet-600 hover:text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state.status === "adding" ? (
          <>
            <span
              aria-hidden="true"
              className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-violet-400/30 border-t-violet-400"
            />
            Adding…
          </>
        ) : state.status === "added" ? (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            Added
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 5h2l1.6 9.2a2 2 0 0 0 2 1.65h7.55a2 2 0 0 0 1.95-1.56L20 8H6" />
              <circle cx="9.3" cy="19" r="1.2" />
              <circle cx="17" cy="19" r="1.2" />
            </svg>
            Add to cart
          </>
        )}
      </button>

      {state.status === "added" || state.status === "error" ? (
        <span
          role="status"
          aria-live="polite"
          className={`mt-2 block text-[10px] font-bold uppercase tracking-widest leading-4 ${
            state.status === "added" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
          }`}
        >
          {state.message}
        </span>
      ) : null}
    </span>
  );
}