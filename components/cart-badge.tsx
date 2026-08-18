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
      className="relative grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white sm:h-10 sm:w-10 sm:rounded-lg"
    >
      <StorefrontIcon name="cart" className="h-[17px] w-[17px]" />
      {ready && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full border border-[#050a14] bg-violet-500 px-1 text-[9px] font-semibold leading-none text-white shadow-[0_4px_14px_rgba(124,58,237,0.45)] sm:-right-1.5 sm:-top-1.5 sm:min-h-[1.125rem] sm:min-w-[1.125rem] sm:text-[10px]"
        >
          {formatBadgeCount(count)}
        </span>
      ) : null}
    </Link>
  );
}