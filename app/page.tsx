import { Suspense } from "react";
import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontHero } from "@/components/storefront-hero";
import { StorefrontIcon } from "@/components/storefront-icon";
import { StorefrontPackShowcase } from "@/components/storefront-pack-showcase";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import {
  getMobileLegendsPackages,
  getStorefrontPricingSnapshot,
} from "@/lib/storefront-catalog";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const checkoutSteps = [
  {
    icon: "account" as const,
    number: "1",
    title: "Enter Player ID",
    description: "Use the exact player destination and select the matching region or server.",
  },
  {
    icon: "games" as const,
    number: "2",
    title: "Choose a package",
    description: "Pick from the published diamonds, UC, points, passes or memberships.",
  },
  {
    icon: "shield" as const,
    number: "3",
    title: "Review and pay",
    description: "Confirm the final price and billing details before protected payment.",
  },
];

const platformBenefits = [
  {
    icon: "globe" as const,
    title: "Correct market first",
    description: "Regional products stay attached to the market selected for the player account.",
  },
  {
    icon: "track" as const,
    title: "Recoverable orders",
    description: "Each created order receives a private tracking route for later updates.",
  },
  {
    icon: "support" as const,
    title: "Support with context",
    description: "Share the order ID when you need help instead of repeating the full checkout story.",
  },
];

function announcementClasses(tone: StorefrontContent["announcement"]["tone"]) {
  if (tone === "success") return "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100";
  if (tone === "warning") return "border-amber-300/20 bg-amber-300/[0.07] text-amber-100";
  return "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100";
}

export default async function Home() {
  const [pricing, storefront, mediaPlacements, mobileLegendsPackages] = await Promise.all([
    getStorefrontPricingSnapshot(),
    getPublishedStorefrontContent(),
    getPublicMediaPlacements(),
    getMobileLegendsPackages("india"),
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
            className={`mx-auto flex max-w-7xl flex-col gap-2 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${announcementClasses(
              storefront.announcement.tone,
            )}`}
          >
            <p className="leading-6">
              <strong>{storefront.announcement.title}</strong>
              <span className="ml-2 opacity-80">{storefront.announcement.message}</span>
            </p>
            <Link href={storefront.announcement.href} className="font-black">
              {storefront.announcement.linkLabel}
            </Link>
          </div>
        </section>
      ) : null}

      {storefront.hero.enabled ? <StorefrontHero content={storefront.hero} /> : null}

      {storefront.catalogue.enabled ? (
        <section
          id="games"
          className="storefront-feed-section mx-auto max-w-7xl scroll-mt-36 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-black text-cyan-300">Game store</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Find the game. Then keep scrolling.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Large artwork, one clear logo treatment and real catalogue data. No repeated regional poster wall.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mt-8 grid gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[16/10] animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.025]"
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

      <StorefrontPackShowcase packages={mobileLegendsPackages} />

      {storefront.process.enabled ? (
        <section className="storefront-feed-section px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-black text-violet-300">How top-up works</p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
                Three steps. Nothing fighting for attention.
              </h2>
            </div>

            <div className="recharza-process-grid mt-8">
              {checkoutSteps.map((step, index) => (
                <article key={step.number} className="relative flex gap-4 py-5 sm:block sm:py-0">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-violet-300/25 bg-violet-300/[0.08] text-lg font-black text-violet-200">
                    {step.number}
                  </span>
                  <div className="min-w-0 sm:mt-5">
                    <div className="flex items-center gap-2">
                      <StorefrontIcon name={step.icon} className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-lg font-black text-white">{step.title}</h3>
                    </div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{step.description}</p>
                  </div>
                  {index < checkoutSteps.length - 1 ? (
                    <span className="absolute bottom-[-1.25rem] left-6 h-10 w-px bg-white/[0.1] sm:left-auto sm:right-[-1.25rem] sm:top-6 sm:h-px sm:w-10" />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="storefront-feed-section border-y border-white/[0.08] bg-white/[0.015] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-black text-cyan-300">About Recharza</p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
                Built around the order, not decorative templates.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Recharza connects game selection, player details, published packages, billing, payment and private tracking in one customer flow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {platformBenefits.map((benefit) => (
                <article key={benefit.title} className="rounded-2xl border border-white/[0.08] bg-[#090b12] p-5">
                  <StorefrontIcon name={benefit.icon} className="h-5 w-5 text-violet-300" />
                  <h3 className="mt-4 font-black text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
