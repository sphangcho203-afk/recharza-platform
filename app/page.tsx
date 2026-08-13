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
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";
import { getPublishedStorefrontContent } from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const benefitItems = [
  { icon: "receipt" as const, title: "Clear prices", text: "Published package pricing before payment." },
  { icon: "shield" as const, title: "Secure checkout", text: "Account-based checkout and protected payment flow." },
  { icon: "track" as const, title: "Order tracking", text: "Every order gets a recoverable tracking path." },
  { icon: "support" as const, title: "Real support", text: "Telegram, email and support tickets in one system." },
];

export default async function Home() {
  const [pricing, storefront, mediaPlacements, fxSnapshot] = await Promise.all([
    getStorefrontPricingSnapshot(),
    getPublishedStorefrontContent(),
    getPublicMediaPlacements(),
    getCurrencyRateSnapshot(),
  ]);

  const enrichedGames: Game[] = games.map((game) => {
    const liveMinimum = pricing.minimumPrices[game.pricingKey ?? game.slug];
    const mediaSlug = game.slug.startsWith("mobile-legends") ? "mobile-legends" : game.slug;
    const logoPlacement = mediaPlacements.get(`game.${mediaSlug}.logo`);
    const artworkPlacement = mediaPlacements.get(`game.${mediaSlug}.artwork`);

    return {
      ...game,
      logoSources: logoPlacement ? [logoPlacement.url, ...game.logoSources] : game.logoSources,
      artworkSources: artworkPlacement ? [artworkPlacement.url, ...game.artworkSources] : game.artworkSources,
      logoAlt: logoPlacement?.altText ?? game.logoAlt,
      artworkAlt: artworkPlacement?.altText ?? game.artworkAlt,
      startingPriceInPaise: typeof liveMinimum === "number" ? liveMinimum : game.startingPriceInPaise,
      pricingMode: typeof liveMinimum === "number" ? "live" : game.pricingMode,
    };
  });

  const hiddenSlugs = new Set(storefront.hiddenGameSlugs);
  const visibleGames = enrichedGames.filter((game) =>
    game.kind === "mobile-legends-region"
      ? !hiddenSlugs.has("mobile-legends")
      : !hiddenSlugs.has(game.slug),
  );
  const heroPlacement = mediaPlacements.get("storefront.hero.background");

  return (
    <main id="top" className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader content={storefront} />

      {storefront.announcement.enabled ? (
        <section className="border-b border-amber-300/10 bg-[#16130a] px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 text-center text-xs text-amber-100/90">
            <strong>{storefront.announcement.title}</strong>
            <span className="hidden text-amber-100/60 sm:inline">{storefront.announcement.message}</span>
            <Link href={storefront.announcement.href} className="font-black text-amber-300 hover:text-amber-200">
              {storefront.announcement.linkLabel}
            </Link>
          </div>
        </section>
      ) : null}

      {storefront.hero.enabled ? (
        <StorefrontHero
          content={storefront.hero}
          imageUrl={heroPlacement?.url}
          imageAlt={heroPlacement?.altText}
        />
      ) : null}

      <section className="px-4 pb-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[linear-gradient(110deg,rgba(124,58,237,0.18),rgba(15,23,42,0.9)_42%,rgba(8,145,178,0.12))] shadow-[0_20px_70px_rgba(0,0,0,0.24)] sm:grid-cols-3">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-4 sm:border-b-0 sm:border-r sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.1] text-violet-200 ring-1 ring-white/[0.1]"><StorefrontIcon name="shield" className="h-4 w-4" /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-200/75">Verified checkout</p><p className="mt-0.5 text-xs font-bold text-white">Destination checked before order</p></div>
          </div>
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-4 sm:border-b-0 sm:border-r sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.1] text-cyan-200 ring-1 ring-white/[0.1]"><StorefrontIcon name="receipt" className="h-4 w-4" /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/75">Fast delivery</p><p className="mt-0.5 text-xs font-bold text-white">Packages prepared for your market</p></div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.1] text-emerald-200 ring-1 ring-white/[0.1]"><StorefrontIcon name="support" className="h-4 w-4" /></span>
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200/75">Human support</p><p className="mt-0.5 text-xs font-bold text-white">Real people when you need help</p></div>
          </div>
        </div>
      </section>

      <section id="offers" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 pb-3 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/#games" className="group rounded-2xl border border-amber-300/[0.16] bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(17,24,39,0.6))] p-4 transition hover:-translate-y-0.5 hover:border-amber-200/30">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/80">Featured market</p>
            <h3 className="mt-2 text-base font-black text-white">Golden Month · MLBB India</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">A region-first top-up path with local package context.</p>
          </Link>
          <Link href="/#games" className="group rounded-2xl border border-cyan-300/[0.16] bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(17,24,39,0.6))] p-4 transition hover:-translate-y-0.5 hover:border-cyan-200/30">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">Always visible</p>
            <h3 className="mt-2 text-base font-black text-white">Clear prices in your currency</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">Choose display currency from the header before you shop.</p>
          </Link>
          <Link href="/#how-it-works" className="group rounded-2xl border border-violet-300/[0.16] bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(17,24,39,0.6))] p-4 transition hover:-translate-y-0.5 hover:border-violet-200/30">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-200/80">Recharza standard</p>
            <h3 className="mt-2 text-base font-black text-white">Verify first. Pay with confidence.</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">The account check and order summary stay in one flow.</p>
          </Link>
        </div>
      </section>

      {storefront.catalogue.enabled ? (
        <section id="games" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-200">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Curated digital catalogue
              </div>
              <h2 className="text-3xl font-black tracking-[-0.055em] text-white sm:text-4xl">Top up the games you play.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Choose a title, verify your destination, and pay securely. Your package and account details stay visible at every step.</p>
            </div>
            <Link href="/orders/lookup" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white">
              Track an order <StorefrontIcon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Suspense fallback={<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 12 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.025]" />)}</div>}>
            <GameCatalogue
              games={visibleGames}
              showRegionalMarkets={storefront.catalogue.showRegionalMarkets}
              showDevelopmentBadges={storefront.privateFlags.showDevelopmentBadges}
              showPricingSnapshots={storefront.privateFlags.showPricingSnapshots}
              ratesFromInrMicros={fxSnapshot.ratesFromInrMicros}
            />
          </Suspense>
        </section>
      ) : null}

      <section id="how-it-works" className="scroll-mt-32 border-y border-white/[0.08] bg-[#0a0c12] px-4 py-9 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 flex max-w-[1240px] items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">Simple by design</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">From ID to delivery in three steps.</h2>
          </div>
          <span className="hidden text-xs font-bold text-slate-600 sm:block">Built for speed, clarity, and support.</span>
        </div>
        <div className="mx-auto grid max-w-[1240px] gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((item, index) => (
            <div key={item.title} className="group relative flex items-start gap-3 bg-[#0c0e15] p-4 transition hover:bg-[#10131d] sm:p-5">
              <span className="absolute right-4 top-4 text-[10px] font-black text-slate-700">0{index + 1}</span>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-300/10">
                <StorefrontIcon name={item.icon} className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-9 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 rounded-2xl border border-white/[0.08] bg-[#0d0f16] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">Buy, track and get support with one Recharza account.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">No noisy dashboards during checkout. Just the player details, package, final amount and secure payment.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/account" className="inline-flex min-h-11 items-center rounded-lg bg-violet-500 px-4 text-sm font-black text-white hover:bg-violet-400">Open account</Link>
            <Link href="/support" className="inline-flex min-h-11 items-center rounded-lg border border-white/[0.1] px-4 text-sm font-black text-slate-300 hover:bg-white/[0.04] hover:text-white">Support</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
