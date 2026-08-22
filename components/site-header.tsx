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
    <header className="site-header sticky top-0 z-50 border-b border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-sm">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="site-header-main flex items-center justify-between h-16 sm:h-20">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
            <MobileNavMenu />
            <Link href="/" className="site-brand-link group flex items-center" aria-label="Recharza home">
              <RecharzaMark compact />
              <span className="site-brand-copy ml-1.5 sm:ml-3">
                <b className="text-sm sm:text-xl font-black tracking-tighter text-slate-900 transition-colors group-hover:text-violet-600">RECHARZA</b>
                <small className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500">Play more, wait less</small>
              </span>
            </Link>
          </div>

          <nav className="site-desktop-nav hidden lg:flex items-center gap-1.5" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-all duration-300">
                <StorefrontIcon name={link.icon} className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="site-header-actions flex items-center gap-1 sm:gap-3 ml-auto">
            <CurrencySelector compact />
            <CartBadge />
            <Link href="/account" className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-auto sm:px-4 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all duration-300 hover:bg-black hover:-translate-y-0.5 active:translate-y-0">
              <StorefrontIcon name="account" className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Account</span>
            </Link>
          </div>
        </div>

        {storefront.navigation.visibleIds.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className="h-10 border-t border-slate-200/40" />}>
            <StorefrontCategoryNav />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
}
