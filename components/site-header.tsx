import { Suspense } from "react";
import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { CartBadge } from "@/components/cart-badge";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontIcon } from "@/components/storefront-icon";
import { CurrencySelector } from "@/components/currency-selector";
import { getPublicMediaPlacements } from "@/lib/media-assets";
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
  { href: "/#how-it-works", label: "How it works", icon: "shield" as const },
  { href: "/orders/lookup", label: "Track order", icon: "track" as const },
  { href: "/support", label: "Help center", icon: "support" as const },
];

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const [storefront, media, rates] = await Promise.all([
    content ? Promise.resolve(content) : getPublishedStorefrontContent(),
    getPublicMediaPlacements().catch(() => new Map()),
    getCurrencyRateSnapshot(),
  ]);
  const brandLogo = media.get("brand.primary.logo");

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080910]/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="hidden border-b border-white/[0.06] bg-white/[0.02] sm:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:px-6 lg:px-8">
          <span>Instant digital delivery · Verified account checkout</span>
          <span className="inline-flex items-center gap-2 text-emerald-300/80"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />Systems online</span>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[4.75rem] grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 sm:gap-5">
          <Link
            href="/"
            className="shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Recharza home"
          >
            <RecharzaMark compact logoUrl={brandLogo?.url} logoAlt={brandLogo?.altText} />
          </Link>

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

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-[20rem] xl:block 2xl:w-[25rem]">
              <StorefrontSearch />
            </div>
            <CurrencySelector ratesFromInrMicros={rates.ratesFromInrMicros} />
            <CartBadge />
            <Link
              href="/account"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-500 px-3.5 text-[12px] font-black text-white shadow-[0_12px_30px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-400 sm:px-4"
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
