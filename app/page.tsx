import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { RecharzaMark } from "@/components/recharza-mark";
import { SiteHeader } from "@/components/site-header";
import { StorefrontHero } from "@/components/storefront-hero";
import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { customerNavigation } from "@/lib/product-system";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";
import {
  getPublishedPolicy,
  getPublishedStorefrontContent,
  STOREFRONT_POLICY_KEYS,
  type StorefrontContent,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const processIcons: StorefrontIconName[] = ["globe", "receipt", "track"];
const benefitIcons: StorefrontIconName[] = ["shield", "receipt", "support"];

function announcementClasses(tone: StorefrontContent["announcement"]["tone"]) {
  if (tone === "success") {
    return "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100";
  }
  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-300/[0.07] text-amber-100";
  }
  return "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100";
}

export default async function Home() {
  const [pricing, storefront, mediaPlacements] = await Promise.all([
    getStorefrontPricingSnapshot(),
    getPublishedStorefrontContent(),
    getPublicMediaPlacements(),
  ]);

  const enrichedGames: Game[] = games.map((game) => {
    const liveMinimum = pricing.minimumPrices[game.pricingKey ?? game.slug];
    const mediaSlug = game.slug.startsWith("mobile-legends")
      ? "mobile-legends"
      : game.slug;
    const logoPlacement = mediaPlacements.get(`game.${mediaSlug}.logo`);
    const artworkPlacement = mediaPlacements.get(`game.${mediaSlug}.artwork`);

    return {
      ...game,
      logoSources: logoPlacement
        ? [logoPlacement.url, ...game.logoSources]
        : game.logoSources,
      artworkSources: artworkPlacement
        ? [artworkPlacement.url, ...game.artworkSources]
        : game.artworkSources,
      logoAlt: logoPlacement?.altText ?? game.logoAlt,
      artworkAlt: artworkPlacement?.altText ?? game.artworkAlt,
      startingPriceInPaise:
        typeof liveMinimum === "number"
          ? liveMinimum
          : game.startingPriceInPaise,
      pricingMode:
        typeof liveMinimum === "number" ? "live" : game.pricingMode,
    };
  });

  const hiddenSlugs = new Set(storefront.hiddenGameSlugs);
  const visibleGames = enrichedGames.filter((game) =>
    game.kind === "mobile-legends-region"
      ? !hiddenSlugs.has("mobile-legends")
      : !hiddenSlugs.has(game.slug),
  );
  const visibleNavigation = customerNavigation.filter((item) =>
    storefront.navigation.visibleIds.includes(item.id),
  );
  const visiblePolicies = STOREFRONT_POLICY_KEYS.flatMap((key) => {
    const policy = getPublishedPolicy(storefront, key);
    return policy ? [{ key, policy }] : [];
  });

  return (
    <main
      id="top"
      className="storefront-page min-h-screen overflow-x-clip pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
    >
      <SiteHeader content={storefront} />

      {storefront.announcement.enabled ? (
        <section className="px-4 pt-4 sm:px-6 lg:px-8">
          <div
            className={`mx-auto flex max-w-7xl flex-col gap-2 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 ${announcementClasses(
              storefront.announcement.tone,
            )}`}
          >
            <p className="leading-6">
              <span className="font-black">{storefront.announcement.title}</span>
              <span className="ml-2 opacity-80">{storefront.announcement.message}</span>
            </p>
            <Link
              href={storefront.announcement.href}
              className="inline-flex w-fit items-center gap-2 font-black transition hover:text-white"
            >
              {storefront.announcement.linkLabel}
              <StorefrontIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {storefront.hero.enabled ? (
        <StorefrontHero content={storefront.hero} />
      ) : null}

      {storefront.catalogue.enabled ? (
        <section
          id="games"
          className="mx-auto max-w-7xl scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)] lg:items-end lg:gap-16">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">
                <span className="h-px w-8 bg-violet-400" />
                {storefront.catalogue.eyebrow}
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">
                {storefront.catalogue.title}
              </h2>
            </div>
            <div className="lg:pb-1">
              <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                {storefront.catalogue.description}
              </p>
              <Link
                href="/games/mobile-legends"
                className="group mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-black text-violet-300 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Explore every Mobile Legends market
                <StorefrontIcon
                  name="arrow"
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          <GameCatalogue
            games={visibleGames}
            showRegionalMarkets={storefront.catalogue.showRegionalMarkets}
            showDevelopmentBadges={storefront.privateFlags.showDevelopmentBadges}
            showPricingSnapshots={storefront.privateFlags.showPricingSnapshots}
          />
        </section>
      ) : null}

      {storefront.process.enabled ? (
        <section className="relative overflow-hidden border-y border-white/[0.08] bg-white/[0.018]">
          <div className="pointer-events-none absolute inset-0">
            <div className="storefront-ambient-grid absolute inset-0 opacity-35" />
            <div className="absolute -right-32 top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[130px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(16rem,0.65fr)_minmax(0,1.35fr)] lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                <span className="h-px w-8 bg-cyan-300" />
                {storefront.process.eyebrow}
              </div>
              <h2 className="mt-4 max-w-md text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                One flow from the correct game to a trackable order.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
                Recharza keeps market selection, price review, order creation, and private status access connected without burying the customer in system details.
              </p>
            </div>

            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {storefront.process.steps.map((step, index) => (
                <article
                  key={`${step.number}-${step.title}`}
                  className="group grid gap-4 py-6 sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5 sm:py-7"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-violet-200 transition group-hover:border-violet-300/20 group-hover:bg-violet-300/[0.08]">
                    <StorefrontIcon
                      name={processIcons[index] ?? "shield"}
                      className="h-5 w-5"
                    />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                      Step {step.number}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.025em] text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                      {step.description}
                    </p>
                  </div>
                  <span className="hidden pt-2 font-mono text-xs font-black text-white/20 sm:block">
                    0{index + 1}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {storefront.benefits.enabled ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">
                Built around customer control
              </p>
              <h2 className="mt-4 max-w-lg text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Less guesswork before payment. More clarity after it.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                The storefront is designed to surface the decisions that matter—market, package, price, destination, and order status—without turning checkout into a dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {storefront.benefits.items.map((item, index) => (
                <article
                  key={item.title}
                  className="storefront-card group min-h-56 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-violet-300/20 hover:bg-violet-300/[0.04]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.08] bg-black/20 text-cyan-200 transition group-hover:border-cyan-300/20 group-hover:bg-cyan-300/[0.07]">
                    <StorefrontIcon
                      name={benefitIcons[index] ?? "shield"}
                      className="h-5 w-5"
                    />
                  </span>
                  <h3 className="mt-7 text-base font-black leading-6 text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {storefront.footer.enabled ? (
        <footer className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl border-t border-white/[0.08] py-10">
            <div className="grid gap-8 md:grid-cols-[minmax(15rem,1fr)_auto] md:items-end">
              <div>
                <RecharzaMark />
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
                  Play More. Wait Less. Choose the correct game market, review the price, and keep the order trackable.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-slate-500 md:justify-end">
                {visibleNavigation.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                {storefront.privateFlags.showPolicyLinks
                  ? visiblePolicies.map(({ key, policy }) => (
                      <Link
                        key={key}
                        href={`/policies/${key}`}
                        className="transition hover:text-white"
                      >
                        {policy.title}
                      </Link>
                    ))
                  : null}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>{storefront.footer.copyright}</p>
              <p>Game names and artwork remain the property of their respective publishers.</p>
            </div>
          </div>
        </footer>
      ) : null}
    </main>
  );
}
