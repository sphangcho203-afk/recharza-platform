"use client";

import Link from "next/link";

import { StorefrontIcon } from "@/components/storefront-icon";
import {
  checkoutHref,
  type CartSnapshot,
} from "@/lib/cart-snapshot";
import { formatInr } from "@/lib/mobile-legends";

export function CartOrderSummary({
  cart,
  busy,
}: {
  cart: CartSnapshot;
  busy: boolean;
}) {
  const firstItem = cart.items[0];

  return (
    <aside
      aria-label="Order summary"
      className="lg:sticky lg:top-28"
    >
      <div className="rounded-xl border border-white/[0.09] bg-[#0d0f16] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-5">
        <h2 className="text-base font-black text-white">Order summary</h2>

        <dl className="mt-4 grid gap-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">Items ({cart.itemCount})</dt>
            <dd className="font-bold text-slate-200">
              {formatInr(cart.totalInPaise)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.08] pt-3">
            <dt className="font-black text-slate-300">Subtotal</dt>
            <dd className="text-xl font-black text-violet-300">
              {formatInr(cart.totalInPaise)}
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[10px] leading-4 text-slate-600">
          Prices are confirmed server-side when you check out. No taxes or fees
          are applied at cart time.
        </p>

        {firstItem ? (
          <Link
            href={checkoutHref(firstItem)}
            aria-disabled={busy}
            className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 ${
              busy ? "pointer-events-none opacity-45" : ""
            }`}
          >
            <StorefrontIcon name="shield" className="h-4 w-4" />
            Proceed to Checkout
          </Link>
        ) : null}

        {cart.items.length > 1 ? (
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
            Each item is checked out one at a time with its own secure order.
          </p>
        ) : null}

        <Link
          href="/#games"
          className="mt-3 block min-h-10 rounded-lg border border-white/[0.08] px-4 py-2.5 text-center text-xs font-black text-slate-300 transition hover:border-white/[0.16] hover:text-white"
        >
          Continue shopping
        </Link>
      </div>
    </aside>
  );
}