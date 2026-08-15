import Link from "next/link";
import { Suspense } from "react";

import { RecharzaMark } from "@/components/recharza-mark";
import { CartBadge } from "@/components/cart-badge";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontIcon } from "@/components/storefront-icon";
import { CurrencySelector } from "@/components/currency-selector";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { getPublishedStorefrontContent, type StorefrontContent } from "@/lib/storefront-content";

type SiteHeaderProps = { content?: Pick<StorefrontContent, "navigation"> };

const navLinks = [
  { href: "/#games", label: "Games", icon: "games" as const },
  { href: "/#offers", label: "Why Recharza", icon: "receipt" as const },
  { href: "/#how-it-works", label: "How it works", icon: "shield" as const },
  { href: "/orders/lookup", label: "Track order", icon: "track" as const },
  { href: "/support", label: "Support", icon: "support" as const },
];

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const [storefront, rates] = await Promise.all([
    content ? Promise.resolve(content) : getPublishedStorefrontContent(),
    getCurrencyRateSnapshot(),
  ]);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-white/[0.08] bg-[#07080e]/90 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="site-header-main">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" className="site-brand-link" aria-label="Recharza home">
              <RecharzaMark compact />
              <span className="site-brand-copy"><b>RECHARZA</b><small>play more, wait less</small></span>
            </Link>
          </div>

          <div className="site-header-actions">
            <div className="site-header-search"><StorefrontSearch /></div>
            <div className="hidden sm:block"><CurrencySelector ratesFromInrMicros={rates.ratesFromInrMicros} /></div>
            <CartBadge />
            <Link href="/account" className="site-account-link"><StorefrontIcon name="account" className="h-4 w-4" /><span className="hidden md:inline">Account</span></Link>
          </div>
        </div>

        <nav className="site-primary-nav" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="site-nav-link">
              <StorefrontIcon name={link.icon} className="h-3.5 w-3.5" />{link.label}
            </a>
          ))}
        </nav>

        <div className="site-mobile-search"><StorefrontSearch /></div>

        <section className="site-mobile-direct-menu" aria-label="Store menu">
          <div className="site-mobile-direct-currency"><span className="site-mobile-menu-label"><StorefrontIcon name="globe" className="h-5 w-5" /><span>Currency</span></span><CurrencySelector ratesFromInrMicros={rates.ratesFromInrMicros} compact /></div>
          <div className="site-mobile-direct-links">
            <a href="/?category=top-up#games" className="site-mobile-direct-link"><StorefrontIcon name="games" className="h-5 w-5" /><span>Game top-ups</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
            <a href="/?category=gift-cards#games" className="site-mobile-direct-link"><StorefrontIcon name="receipt" className="h-5 w-5" /><span>Gift cards</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
            <a href="/#games" className="site-mobile-direct-link"><StorefrontIcon name="games" className="h-5 w-5" /><span>All products</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
            <a href="/support" className="site-mobile-direct-link"><StorefrontIcon name="support" className="h-5 w-5" /><span>24/7 support</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
            <a href="/orders/lookup" className="site-mobile-direct-link"><StorefrontIcon name="track" className="h-5 w-5" /><span>Track an order</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
            <a href="/account" className="site-mobile-direct-link"><StorefrontIcon name="account" className="h-5 w-5" /><span>My account</span><StorefrontIcon name="arrow" className="ml-auto h-4 w-4" /></a>
          </div>
        </section>

        {storefront.navigation.visibleIds.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className="h-10 border-t border-white/[0.06]" />}>
            <StorefrontCategoryNav />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
}
