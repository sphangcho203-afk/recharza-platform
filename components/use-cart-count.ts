"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CART_CHANGED_EVENT,
  type CartSnapshot,
} from "@/lib/cart-snapshot";

export function publishCartChanged(itemCount: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CART_CHANGED_EVENT, { detail: { itemCount } }),
  );
}

export function useCartCount() {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as {
        ok?: boolean;
        cart?: CartSnapshot;
      };
      if (result.ok && result.cart) {
        setCount(result.cart.itemCount);
        setReady(true);
      }
    } catch {
      // The badge stays quiet when the cart service is unavailable.
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);

    function onCartChanged(event: Event) {
      const detail = (event as CustomEvent<{ itemCount?: number }>).detail;
      if (typeof detail?.itemCount === "number") {
        setCount(detail.itemCount);
        setReady(true);
      }
    }

    window.addEventListener(CART_CHANGED_EVENT, onCartChanged);
    return () => window.removeEventListener(CART_CHANGED_EVENT, onCartChanged);
  }, [refresh]);

  return { count, ready, refresh };
}