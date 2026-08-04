import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { SiteHeader } from "@/components/site-header";
import { StorefrontHero } from "@/components/storefront-hero";
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
      className="min-h-screen overflow-x-clip bg-[#07070c] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
    >
      <SiteHeader content={storefront} />

      {storefront.announcement.enabled ? (
        <section
          className={`border-b px-4 py-3 ${announcementClasses(
            storefront.announcement.tone,
          )}`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-2">
            <p>
              <span className="font-black">{storefront.announcement.title}</span>
              <span className="ml-2 opacity-80">{storefront.announcement.message}</span>
            </p>
            <Link
              href={storefront.announcement.href}
              className="w-fit font-black underline decoration-current/30 underline-offset-4 hover:decoration-current"
            >
              {storefront.announcement.linkLabel}
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
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
              {storefront.catalogue.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              {storefront.catalogue.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {storefront.catalogue.description}
            </p>
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
        <section className="border-y border-white/10 bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              {storefront.process.eyebrow}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {storefront.process.steps.map((step) => (
                <article
                  key={`${step.number}-${step.title}`}
                  className="rounded-2xl border border-white/10 bg-[#0d0d15] p-4"
                >
                  <p className="font-mono text-xs font-black text-violet-300">
                    {step.number}
                  </p>
                  <h3 className="mt-3 text-base font-black text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {storefront.benefits.enabled ? (
        <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {storefront.benefits.items.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-[#0d0d15] p-4"
              >
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {storefront.footer.enabled ? (
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>{storefront.footer.copyright}</p>
            <div className="flex flex-wrap gap-4">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="transition hover:text-slate-300"
                >
                  {item.label}
                </Link>
              ))}
              {storefront.privateFlags.showPolicyLinks
                ? visiblePolicies.map(({ key, policy }) => (
                    <Link
                      key={key}
                      href={`/policies/${key}`}
                      className="transition hover:text-slate-300"
                    >
                      {policy.title}
                    </Link>
                  ))
                : null}
            </div>
          </div>
        </footer>
      ) : null}
    </main>
  );
}
