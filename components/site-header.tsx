import Link from "next/link";

import { ModuleStateBadge } from "@/components/module-state-badge";
import { RecharzaMark } from "@/components/recharza-mark";
import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";
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

const navigationIcons: Record<string, StorefrontIconName> = {
  games: "games",
  track: "track",
  account: "account",
  support: "support",
};

function iconForNavigation(id: string): StorefrontIconName {
  return navigationIcons[id] ?? "arrow";
}

export async function SiteHeader({ content }: SiteHeaderProps = {}) {
  const storefront = content ?? (await getPublishedStorefrontContent());
  const visibleIds = new Set(storefront.navigation.visibleIds);
  const navigation = getVisibleModules(customerNavigation).filter(
    (item) => isInteractiveModule(item.state) && visibleIds.has(item.id),
  );
  const accountItem = navigation.find((item) => item.id === "account");
  const primaryNavigation = navigation.filter((item) => item.id !== "account");

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto max-w-[86rem] rounded-[1.35rem] border border-white/[0.09] bg-[#08080f]/90 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
          <Link
            href="/#top"
            className="shrink-0 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Recharza home"
          >
            <RecharzaMark compact />
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 lg:flex"
            aria-label="Customer navigation"
          >
            {primaryNavigation.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-[13px] font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <StorefrontIcon
                  name={iconForNavigation(item.id)}
                  className="h-4 w-4 text-slate-500 transition group-hover:text-violet-300"
                />
                {item.label}
                {item.state === "beta" ? <ModuleStateBadge state="beta" /> : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              aria-label="Open cart"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <StorefrontIcon name="receipt" className="h-[18px] w-[18px]" />
            </Link>

            {accountItem ? (
              <Link
                href={accountItem.href}
                aria-label="Open Recharza account"
                className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 text-xs font-black text-slate-200 transition hover:border-violet-300/25 hover:bg-violet-300/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:inline-flex"
              >
                <StorefrontIcon name="account" className="h-[18px] w-[18px] text-violet-300" />
                <span className="hidden xl:inline">My account</span>
              </Link>
            ) : null}

            {storefront.navigation.ctaEnabled ? (
              <Link
                href={storefront.navigation.ctaHref}
                className="hidden min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 lg:inline-flex"
              >
                {storefront.navigation.ctaLabel}
                <StorefrontIcon name="arrow" className="h-4 w-4" />
              </Link>
            ) : null}

            <details className="group relative lg:hidden">
              <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-white transition hover:bg-white/[0.075] marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Open customer navigation</span>
                <StorefrontIcon name="menu" className="h-5 w-5" />
              </summary>

              <nav
                aria-label="Mobile customer navigation"
                className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/98 p-2.5 shadow-[0_28px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
              >
                <div className="mb-2 flex items-center justify-between border-b border-white/[0.07] px-2 pb-3 pt-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                      Recharza menu
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Top up, track, manage, and get support.
                    </p>
                  </div>
                  <RecharzaMark compact wordmark={false} />
                </div>

                {navigation.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-violet-300 transition group-hover:border-violet-300/20 group-hover:bg-violet-300/[0.08]">
                      <StorefrontIcon name={iconForNavigation(item.id)} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block">{item.label}</span>
                      <span className="mt-0.5 block text-[11px] font-normal leading-4 text-slate-500">
                        {item.description}
                      </span>
                    </span>
                    {item.state === "beta" ? (
                      <ModuleStateBadge state="beta" />
                    ) : (
                      <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    )}
                  </Link>
                ))}

                <Link
                  href="/cart"
                  className="mt-1 grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-cyan-300">
                    <StorefrontIcon name="receipt" className="h-[18px] w-[18px]" />
                  </span>
                  <span>
                    <span className="block">Cart</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                      Review saved packs before checkout.
                    </span>
                  </span>
                  <StorefrontIcon name="arrow" className="h-4 w-4 text-slate-600" />
                </Link>

                {storefront.navigation.ctaEnabled ? (
                  <Link
                    href={storefront.navigation.ctaHref}
                    className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-center text-sm font-black text-slate-950 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    {storefront.navigation.ctaLabel}
                    <StorefrontIcon name="arrow" className="h-4 w-4" />
                  </Link>
                ) : null}
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
