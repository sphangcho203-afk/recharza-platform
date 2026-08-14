import { Suspense } from "react";
import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { CartBadge } from "@/components/cart-badge";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontIcon } from "@/components/storefront-icon";
import { CurrencySelector } from "@/components/currency-selector";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

type SiteHeaderProps = {
  content?: Pick<StorefrontContent, "navigation">;
};

const navLinks = [
  { href: "/#games", label: "Browse games", icon: "games" as const },
  { href: "/#offers", label: "Featured offers", icon: "receipt" as const },
  { href: "/#how-it-works", label: "How it works", icon: "shield" as const },
  { href: "/orders/lookup", label: "Track order", icon: "track" as const },
  { href: "/support", label: "Help center", icon: "support" as const },
];

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const [storefront, rates] = await Promise.all([
    content ? Promise.resolve(content) : getPublishedStorefrontContent(),
    getCurrencyRateSnapshot(),
  ]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080910]/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[4.25rem] min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-2.5 sm:min-h-[4.75rem] sm:gap-5">
          <div className="flex items-center gap-2">
            <MobileNavMenu />
            <Link
              href="/"
              className="shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label="Recharza home"
            >
              <RecharzaMark compact />
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-extrabold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <StorefrontIcon name={link.icon} className="h-4 w-4 text-slate-600 transition group-hover:text-violet-300" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <div className="hidden w-[20rem] xl:block 2xl:w-[25rem]">
              <StorefrontSearch />
            </div>
            <div className="hidden sm:block"><CurrencySelector ratesFromInrMicros={rates.ratesFromInrMicros} /></div>
            <div className="sm:hidden"><CurrencySelector ratesFromInrMicros={rates.ratesFromInrMicros} compact /></div>
            <div className="shrink-0"><CartBadge /></div>
            <Link
              href="/account"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-3 text-[12px] font-black text-white shadow-[0_12px_30px_rgba(124,58,237,0.28)] transition duration-150 ease-out hover:bg-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 sm:px-4"
            >
              <span className="hidden sm:inline">Log in / Sign up</span>
              <StorefrontIcon name="account" className="h-[17px] w-[17px] sm:hidden" />
            </Link>
          </div>

          <div className="col-span-3 xl:hidden">
            <StorefrontSearch />
          </div>
        </div>

        {storefront.navigation.visibleIds.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className="h-11 border-t border-white/[0.06]" />}>
            <StorefrontCategoryNav />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
}
