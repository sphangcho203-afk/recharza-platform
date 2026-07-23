import Link from "next/link";

import { ModuleStateBadge } from "@/components/module-state-badge";
import { RecharzaMark } from "@/components/recharza-mark";
import {
  customerNavigation,
  getVisibleModules,
  isInteractiveModule,
} from "@/lib/product-system";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

type SiteHeaderProps = {
  content?: Pick<StorefrontContent, "navigation">;
};

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const storefront = content ?? (await getPublishedStorefrontContent());
  const visibleIds = new Set(storefront.navigation.visibleIds);
  const navigation = getVisibleModules(customerNavigation).filter(
    (item) => isInteractiveModule(item.state) && visibleIds.has(item.id),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface-0)]/94 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/#top"
          className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Recharza home"
        >
          <RecharzaMark compact />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex" aria-label="Customer navigation">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="inline-flex items-center gap-2 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {item.label}
              {item.state === "beta" ? <ModuleStateBadge state="beta" /> : null}
            </Link>
          ))}
        </nav>

        {storefront.navigation.ctaEnabled ? (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href={storefront.navigation.ctaHref}
              className="min-h-11 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {storefront.navigation.ctaLabel}
            </Link>
          </div>
        ) : null}

        <details className="group relative md:hidden">
          <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open customer navigation</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav
            aria-label="Mobile customer navigation"
            className="absolute right-0 top-13 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-2)] p-2 shadow-2xl shadow-black/50"
          >
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <span>
                  <span className="block">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] font-normal leading-4 text-slate-500">
                    {item.description}
                  </span>
                </span>
                {item.state === "beta" ? <ModuleStateBadge state="beta" /> : null}
              </Link>
            ))}
            {storefront.navigation.ctaEnabled ? (
              <Link
                href={storefront.navigation.ctaHref}
                className="mt-1 block min-h-12 rounded-xl bg-white px-3 py-3.5 text-center text-sm font-black text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {storefront.navigation.ctaLabel}
              </Link>
            ) : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
