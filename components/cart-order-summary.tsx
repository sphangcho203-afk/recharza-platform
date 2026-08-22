"use client";

import Link from "next/link";

import { DisplayPrice } from "@/components/display-price";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { CartSnapshot } from "@/lib/cart-snapshot";

export function CartOrderSummary({
  cart,
  busy,
}: {
  cart: CartSnapshot;
  busy: boolean;
}) {
  return (
    <aside
      aria-label="Order summary"
      className="lg:sticky lg:top-28"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Secure checkout</p>
            <h2 className="mt-1 text-base font-bold tracking-tight text-slate-900">Order summary</h2>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Protected</span>
        </div>

        <dl className="mt-4 grid gap-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500 font-bold">Items ({cart.itemCount})</dt>
            <dd className="font-bold text-slate-900">
              <DisplayPrice amountInrMinor={cart.totalInPaise} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
            <dt className="font-bold text-slate-900">Subtotal</dt>
            <dd className="text-xl font-bold tracking-tight text-violet-600">
              <DisplayPrice amountInrMinor={cart.totalInPaise} />
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[10px] leading-4 text-slate-500 font-medium">
          Prices are confirmed server-side when you check out. No taxes or fees
          are applied at cart time.
        </p>

        <Link
          href="/cart/checkout"
          aria-disabled={busy}
          className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg ${
            busy ? "pointer-events-none opacity-45" : ""
          }`}
        >
          <StorefrontIcon name="shield" className="h-4 w-4" />
          Checkout all items
        </Link>

        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500 font-medium">
          We’ll verify every game account, then collect billing and payment once.
        </p>

        <Link
          href="/#games"
          className="mt-3 block min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-bold text-slate-900 transition duration-300 hover:bg-slate-50"
        >
          Continue shopping
        </Link>
      </div>
    </aside>
  );
}