import { Suspense } from "react";
import Link from "next/link";

import { ModuleStateBadge } from "@/components/module-state-badge";
import { RecharzaMark } from "@/components/recharza-mark";
import { StorefrontCategoryNav } from "@/components/storefront-category-nav";
import { StorefrontSearch } from "@/components/storefront-search";
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
  const primaryNavigation = navigation.filter(
    (item) => item.id !== "account" && item.id !== "games",
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#06070d]/92 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        <div className="grid min-h-[4.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
          <Link
            href="/#top"
            className="shrink-0 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Recharza home"
          >
            <RecharzaMark compact />
          </Link>

          <div className="order-3 col-span-3 min-w-0 md:order-none md:col-span-1">
            <StorefrontSearch />
          </div>

          <div className="flex items-center justify-end gap-2">
            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Customer navigation"
            >
              {primaryNavigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <StorefrontIcon
                    name={iconForNavigation(item.id)}
                    className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-300"
                  />
                  {item.label}
                  {item.state === "beta" ? <ModuleStateBadge state="beta" /> : null}
                </Link>
              ))}
            </nav>

            <label className="relative hidden xl:block">
              <span className="sr-only">Display currency</span>
              <StorefrontIcon
                name="globe"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300"
              />
              <select
                defaultValue="INR"
                title="Display currency is confirmed during checkout"
                className="h-10 appearance-none rounded-xl border border-white/[0.09] bg-white/[0.035] pl-9 pr-7 text-xs font-black text-slate-200 outline-none transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06] focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <option value="INR">INR</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">
                ▾
              </span>
            </label>

            <Link
              href="/cart"
              aria-label="Open cart"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-cyan-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <StorefrontIcon name="cart" className="h-[18px] w-[18px]" />
            </Link>

            {accountItem ? (
              <Link
                href={accountItem.href}
                aria-label="Open Recharza account"
                className="grid h-10 w-10 place-items-center rounded-full border border-violet-300/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.28),rgba(34,211,238,0.12))] text-violet-100 transition hover:border-violet-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <StorefrontIcon name="account" className="h-[18px] w-[18px]" />
              </Link>
            ) : null}
          </div>
        </div>

        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="h-[3.65rem] border-t border-white/[0.06]"
            />
          }
        >
          <StorefrontCategoryNav />
        </Suspense>
      </div>
    </header>
  );
}
