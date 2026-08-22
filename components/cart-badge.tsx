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
      className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 shadow-sm sm:h-10 sm:w-10 sm:rounded-xl"
    >
      <StorefrontIcon name="cart" className="h-[18px] w-[18px]" />
      {ready && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 grid min-h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full border-2 border-white bg-violet-600 px-1 text-[10px] font-bold leading-none text-white shadow-lg shadow-violet-200"
        >
          {formatBadgeCount(count)}
        </span>
      ) : null}
    </Link>
  );
}