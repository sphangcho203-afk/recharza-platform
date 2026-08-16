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
      <div className="rounded-xl border border-white/[0.09] bg-[#0d0f16] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Secure checkout</p>
            <h2 className="mt-1 text-base font-black text-white">Order summary</h2>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2 py-1 text-[10px] font-black text-emerald-200">Protected</span>
        </div>

        <dl className="mt-4 grid gap-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">Items ({cart.itemCount})</dt>
            <dd className="font-bold text-slate-200">
              <DisplayPrice amountInrMinor={cart.totalInPaise} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.08] pt-3">
            <dt className="font-black text-slate-300">Subtotal</dt>
            <dd className="text-xl font-black text-violet-300">
              <DisplayPrice amountInrMinor={cart.totalInPaise} />
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[10px] leading-4 text-slate-600">
          Prices are confirmed server-side when you check out. No taxes or fees
          are applied at cart time.
        </p>

        <Link
          href="/cart/checkout"
          aria-disabled={busy}
          className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:bg-violet-400 ${
            busy ? "pointer-events-none opacity-45" : ""
          }`}
        >
          <StorefrontIcon name="shield" className="h-4 w-4" />
          Checkout all items
        </Link>

        <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
          We’ll verify every game account, then collect billing and payment once.
        </p>

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