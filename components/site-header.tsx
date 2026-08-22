import Link from "next/link";
import { Suspense } from "react";

import { RecharzaMark } from "@/components/recharza-mark";
import { CartBadge } from "@/components/cart-badge";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontIcon } from "@/components/storefront-icon";
import { CurrencySelector } from "@/components/currency-selector";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
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
  const storefront = content ?? await getPublishedStorefrontContent();

  return (
    <header className="site-header sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="site-header-main">
          <div className="flex min-w-0 items-center gap-2.5">
            <MobileNavMenu />
            <Link href="/" className="site-brand-link" aria-label="Recharza home">
              <RecharzaMark compact />
              <span className="site-brand-copy"><b>RECHARZA</b><small>play more, wait less</small></span>
            </Link>
          </div>

          <nav className="site-desktop-nav" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav-link">
                <StorefrontIcon name={link.icon} className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="site-header-actions">
            <div className="hidden sm:block"><CurrencySelector /></div>
            <div className="sm:hidden"><CurrencySelector compact /></div>
            <CartBadge />
            <Link href="/account" className="site-account-link"><StorefrontIcon name="account" className="h-4 w-4" /><span className="hidden md:inline">Account</span></Link>
          </div>
        </div>

        {storefront.navigation.visibleIds.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className="h-10 border-t border-slate-100" />}>
            <StorefrontCategoryNav />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
}
