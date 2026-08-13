import { Suspense } from "react";
import Link from "next/link";

import { getRequestSession } from "@/lib/auth";
import { RecharzaMark } from "@/components/recharza-mark";
import { CartBadge } from "@/components/cart-badge";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
import { StorefrontIcon } from "@/components/storefront-icon";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

type SiteHeaderProps = {
  content?: Pick<StorefrontContent, "navigation">;
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#games", label: "Games" },
  { href: "/orders/lookup", label: "Orders" },
  { href: "/support", label: "Help Center" },
];

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const requestHeaders = await import("next/headers");
  const requestCookies = await requestHeaders.cookies();
  const requestHeaderStore = await requestHeaders.headers();

  const request = new Request("http://recharza.local/account", {
    headers: {
      cookie: requestCookies.toString(),
      "user-agent": requestHeaderStore.get("user-agent") ?? "",
    },
  });

  const [storefront, media, session] = await Promise.all([
    content ? Promise.resolve(content) : getPublishedStorefrontContent(),
    getPublicMediaPlacements().catch(() => new Map()),
    getRequestSession(request).catch(() => null),
  ]);
  const brandLogo = media.get("brand.primary.logo");

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090a0f]/96 shadow-[0_8px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[4.25rem] grid-cols-[auto_1fr_auto] items-center gap-4 py-2.5">
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
                className="rounded-lg px-3 py-2 text-[13px] font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-[20rem] xl:block 2xl:w-[25rem]">
              <StorefrontSearch />
            </div>
            <span className="hidden min-h-10 items-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-[11px] font-black text-slate-300 md:inline-flex">
              IN / INR
            </span>
            <CartBadge />
            <Link
              href="/account"
              aria-label={session ? "Open account" : "Log in or sign up"}
              className="inline-flex min-h-10 items-center rounded-lg bg-violet-500 px-3.5 text-[12px] font-black text-white shadow-[0_10px_28px_rgba(124,58,237,0.24)] transition hover:bg-violet-400 sm:px-4"
            >
              <span className="hidden sm:inline">
                {session
                  ? session.customer.displayName ||
                    session.customer.username ||
                    "Account"
                  : "Log in / Sign up"}
              </span>
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
