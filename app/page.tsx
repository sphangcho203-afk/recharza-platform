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
    title: "Sign in and enter the player ID",
    description: "Orders are available only to verified Recharza accounts.",
  },
  {
    icon: "games" as const,
    title: "Choose the correct package",
    description: "Select a published offer for the player account and market.",
  },
  {
    icon: "shield" as const,
    title: "Review the final amount",
    description: "Confirm the player, billing details and price before payment.",
  },
];

const productNotes = [
  {
    title: "Published prices",
    description: "The amount shown in checkout comes from the active catalogue and is confirmed before payment.",
  },
  {
    title: "Product bonuses",
    description: "A bonus is shown only when it is included in the package name or supplier catalogue.",
  },
  {
    title: "Account-required buying",
    description: "You must sign in before opening checkout, creating an order or paying for a top-up.",
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

  return (
    <main id="top" className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader content={storefront} />

      {storefront.announcement.enabled ? (
        <section className="px-4 pt-3 sm:px-6 lg:px-8">
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs sm:px-4 ${announcementClasses(
              storefront.announcement.tone,
            )}`}
          >
            <p className="min-w-0 truncate">
              <strong>{storefront.announcement.title}</strong>
              <span className="ml-2 opacity-80">
                {storefront.announcement.message}
              </span>
            </p>
            <Link
              href={storefront.announcement.href}
              className="shrink-0 font-black"
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
          className="storefront-feed-section mx-auto max-w-7xl scroll-mt-32 px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-black text-cyan-300">Game store</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.045em] text-white sm:text-4xl">
              Choose a game
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Open the game, select the correct market and review the published price.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/5] animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.025]"
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
        <section className="storefront-feed-section border-y border-white/[0.08] bg-white/[0.015] px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-xl">
              <p className="text-xs font-black text-violet-300">How checkout works</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                Three clear steps
              </h2>
            </div>

            <ol className="recharza-process-grid mt-5">
              {checkoutSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex min-w-0 gap-3 border-b border-white/[0.07] py-4 last:border-b-0 sm:rounded-2xl sm:border sm:border-white/[0.08] sm:bg-[#090b12] sm:p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-violet-300/20 bg-violet-300/[0.07] text-xs font-black text-violet-200">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StorefrontIcon
                        name={step.icon}
                        className="h-4 w-4 shrink-0 text-cyan-300"
                      />
                      <h3 className="text-sm font-black text-white sm:text-base">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section className="storefront-feed-section px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-black text-cyan-300">Products and bonuses</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
              What the labels mean
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Recharza does not invent discounts, bonus diamonds or availability.
            </p>
          </div>

          <dl className="divide-y divide-white/[0.07] border-y border-white/[0.08]">
            {productNotes.map((note) => (
              <div
                key={note.title}
                className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-5"
              >
                <dt className="text-sm font-black text-white">{note.title}</dt>
                <dd className="text-sm leading-6 text-slate-500">
                  {note.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-white/[0.015] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black text-violet-300">About Recharza</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">
              One account for buying, payment and order tracking
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose the market carefully, confirm the player details and keep every order attached to your account.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/account"
              className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-xs font-black text-slate-950"
            >
              Open account
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-10 items-center rounded-xl border border-white/[0.1] px-4 text-xs font-black text-slate-300"
            >
              Support
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
