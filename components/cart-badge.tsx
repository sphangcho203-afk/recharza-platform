"use client";

import Link from "next/link";

import { StorefrontIcon } from "@/components/storefront-icon";
import { useCartCount } from "@/components/use-cart-count";

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function CartBadge() {
  const { count, ready } = useCartCount();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
      className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white shadow-2xl sm:h-10 sm:w-10 sm:rounded-xl"
    >
      <StorefrontIcon name="cart" className="h-[18px] w-[18px]" />
      {ready && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 grid min-h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full border-2 border-[#0d0f16] bg-violet-600 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]"
        >
          {formatBadgeCount(count)}
        </span>
      ) : null}
    </Link>
  );
}