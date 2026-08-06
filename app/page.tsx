import { Suspense } from "react";
import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontHero } from "@/components/storefront-hero";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const checkoutSteps = [
  {
    icon: "account" as const,
    number: "01",
    title: "Enter Player ID",
    description: "Confirm the exact account destination and required region or server.",
  },
  {
    icon: "games" as const,
    number: "02",
    title: "Select Package",
    description: "Choose a published diamond, UC, point, pass, or membership offer.",
  },
  {
    icon: "shield" as const,
    number: "03",
    title: "Review and Pay",
    description: "Check billing and final pricing, then continue through protected payment.",
  },
];

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
    const mediaSlug = game.slug.startsWith("mobile-legends") ? "mobile-legends" : game.slug;
    const logoPlacement = mediaPlacements.get(`game.${mediaSlug}.logo`);
    const artworkPlacement = mediaPlacements.get(`game.${mediaSlug}.artwork`);

    return {
      ...game,
      logoSources: logoPlacement ? [logoPlacement.url, ...game.logoSources] : game.logoSources,
      artworkSources: artworkPlacement
        ? [artworkPlacement.url, ...game.artworkSources]
        : game.artworkSources,
      logoAlt: logoPlacement?.altText ?? game.logoAlt,
      artworkAlt: artworkPlacement?.altText ?? game.artworkAlt,
      startingPriceInPaise:
        typeof liveMinimum === "number" ? liveMinimum : game.startingPriceInPaise,
      pricingMode: typeof liveMinimum === "number" ? "live" : game.pricingMode,
    };
  });

  const hiddenSlugs = new Set(storefront.hiddenGameSlugs);
  const visibleGames = enrichedGames.filter((game) =>
    game.kind === "mobile-legends-region"
      ? !hiddenSlugs.has("mobile-legends")
      : !hiddenSlugs.has(game.slug),
  );

  return (
    <main id="top" className="storefront-page min-h-screen overflow-x-clip text-white">
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

      {storefront.hero.enabled ? <StorefrontHero content={storefront.hero} /> : null}

      {storefront.catalogue.enabled ? (
        <section
          id="games"
          className="mx-auto max-w-7xl scroll-mt-36 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        >
          <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.19em] text-cyan-300">
                <span className="h-px w-7 bg-cyan-300" />
                {storefront.catalogue.eyebrow}
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                {storefront.catalogue.title}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-right">
              {storefront.catalogue.description}
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[3/4] animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025]"
                  />
                ))}
              </div>
            }
          >
            <GameCatalogue
              games={visibleGames}
              showRegionalMarkets={storefront.catalogue.showRegionalMarkets}
              showDevelopmentBadges={storefront.privateFlags.showDevelopmentBadges}
              showPricingSnapshots={storefront.privateFlags.showPricingSnapshots}
            />
          </Suspense>
        </section>
      ) : null}

      {storefront.process.enabled ? (
        <section className="border-y border-white/[0.08] bg-white/[0.018] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.19em] text-violet-300">
                  {storefront.process.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
                  Three clear steps to top up.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-right">
                Every order stays recoverable and payment begins only after player, package, and billing details pass validation.
              </p>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {checkoutSteps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-2xl border border-white/[0.08] bg-[#090b12] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-cyan-200">
                      <StorefrontIcon name={step.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-mono text-[10px] font-black text-white/25">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.025em] text-white">
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

      <SiteFooter />
    </main>
  );
}
