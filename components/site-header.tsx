import { Suspense } from "react";
import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontIcon } from "@/components/storefront-icon";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

type SiteHeaderProps = {
  content?: Pick<StorefrontContent, "navigation">;
};

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const storefront = content ?? (await getPublishedStorefrontContent());

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#05060b]/94 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="grid min-h-[4.25rem] grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
          <Link
            href="/#top"
            className="shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Recharza home"
          >
            <RecharzaMark compact />
          </Link>

          <div className="order-3 col-span-3 min-w-0 sm:order-none sm:col-span-1">
            <StorefrontSearch />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link
              href="/orders/lookup"
              className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-slate-400 transition hover:bg-white/[0.05] hover:text-white lg:inline-flex"
            >
              <StorefrontIcon name="track" className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/support"
              className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-slate-400 transition hover:bg-white/[0.05] hover:text-white xl:inline-flex"
            >
              <StorefrontIcon name="support" className="h-4 w-4" />
              Support
            </Link>
            <Link
              href="/cart"
              aria-label="Open cart"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-cyan-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <StorefrontIcon name="cart" className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/account"
              aria-label="Open Recharza account"
              className="grid h-10 w-10 place-items-center rounded-full border border-violet-300/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.26),rgba(34,211,238,0.1))] text-violet-100 transition hover:border-violet-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <StorefrontIcon name="account" className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {storefront.navigation.visibleIds.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className="h-14 border-t border-white/[0.06]" />}>
            <StorefrontCategoryNav />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
}
