import Link from "next/link";
import { Suspense } from "react";

import { GameCatalogue } from "@/components/game-catalogue";
import { GameCard } from "@/components/game-card";
import { SiteFooter } from "@/components/site-footer";
import { StorefrontAccountPrompt } from "@/components/storefront-account-prompt";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";
import { getPublishedStorefrontContent } from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const processItems = [
  { step: "01", icon: "games" as const, title: "Pick the right market", text: "Browse distinct game and regional cards so your account destination is clear from the start." },
  { step: "02", icon: "shield" as const, title: "Verify before payment", text: "Confirm the player name, Riot ID, UID, or Zone ID before you commit your order." },
  { step: "03", icon: "track" as const, title: "Pay, then track", text: "Keep the package, order reference, and support path visible from checkout to delivery." },
];

const popularSlugs = new Set(["mobile-legends-india", "free-fire", "pubg-mobile", "valorant", "genshin-impact"]);

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
  const popularGames = visibleGames.filter((game) => popularSlugs.has(game.slug));

  return (
    <main id="top" className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader content={storefront} />

      {storefront.announcement.enabled ? (
        <div className="storefront-alert border-b border-cyan-300/10 bg-cyan-300/[0.045] px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 text-center text-xs text-cyan-100/85">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" aria-hidden="true" />
            <strong>{storefront.announcement.title}</strong>
            <span className="hidden text-cyan-100/55 sm:inline">{storefront.announcement.message}</span>
            <Link href={storefront.announcement.href} className="font-black text-cyan-200 transition hover:text-white">{storefront.announcement.linkLabel}</Link>
          </div>
        </div>
      ) : null}

      <section className="storefront-hero-shell relative overflow-hidden border-b border-white/[0.07] px-4 pb-8 pt-7 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-16">
        <div className="storefront-hero-glow storefront-hero-glow-left" aria-hidden="true" />
        <div className="storefront-hero-glow storefront-hero-glow-right" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1240px] items-end gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
          <div className="max-w-3xl">
            <div className="storefront-kicker"><span className="storefront-kicker-dot" /> The player-first top-up store</div>
            <h1 className="mt-5 max-w-4xl font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">Your games.<br /><span className="storefront-gradient-text">Your market.</span><br />Your next move.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Buy game currency with the context that matters: the right region, the right package, and a verified player destination before payment.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#games" className="storefront-primary-cta"><StorefrontIcon name="games" className="h-4 w-4" /> Browse games <StorefrontIcon name="arrow" className="h-4 w-4" /></Link>
              <Link href="/orders/lookup" className="storefront-secondary-cta"><StorefrontIcon name="track" className="h-4 w-4" /> Track an order</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-semibold text-slate-400 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
              <span className="inline-flex items-center gap-2"><StorefrontIcon name="shield" className="h-4 w-4 text-emerald-300" /> Identity check before pay</span>
              <span className="inline-flex items-center gap-2"><StorefrontIcon name="receipt" className="h-4 w-4 text-cyan-300" /> Regional pricing</span>
              <span className="col-span-2 inline-flex items-center gap-2 sm:col-span-1"><StorefrontIcon name="support" className="h-4 w-4 text-violet-300" /> Human support</span>
            </div>
          </div>

          <div className="storefront-hero-console">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/75">Live storefront</p><p className="mt-1 text-sm font-semibold text-white">Checkout, without guesswork.</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><StorefrontIcon name="shield" className="h-4 w-4" /></span></div>
            <div className="grid gap-3 p-5">
              <div className="storefront-console-line"><span className="storefront-console-icon bg-violet-300/10 text-violet-200"><StorefrontIcon name="games" className="h-4 w-4" /></span><span><b>Choose a title</b><small>Game and market stay visible</small></span><strong>01</strong></div>
              <div className="storefront-console-line"><span className="storefront-console-icon bg-cyan-300/10 text-cyan-200"><StorefrontIcon name="shield" className="h-4 w-4" /></span><span><b>Verify the player</b><small>Nickname returned before payment</small></span><strong>02</strong></div>
              <div className="storefront-console-line"><span className="storefront-console-icon bg-amber-300/10 text-amber-200"><StorefrontIcon name="receipt" className="h-4 w-4" /></span><span><b>Review the package</b><small>Currency and total are clear</small></span><strong>03</strong></div>
            </div>
            <div className="mx-5 mb-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.055] px-4 py-3 text-xs text-emerald-100/80"><span className="font-bold text-emerald-200">Protected flow</span><span className="ml-2">No payment is submitted before verification.</span></div>
          </div>
        </div>
      </section>

      <section className="storefront-trust-section border-b border-white/[0.07] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
          <div className="storefront-trust-cell"><span className="storefront-trust-number">8+</span><span><b>Regional markets</b><small>MLBB paths built for the account region</small></span></div>
          <div className="storefront-trust-cell"><span className="storefront-trust-number">{visibleGames.length}</span><span><b>Game paths</b><small>Published titles and regional destinations</small></span></div>
          <div className="storefront-trust-cell"><span className="storefront-trust-number">4</span><span><b>Clear checkout stages</b><small>Package, player, billing, and payment</small></span></div>
        </div>
      </section>

      <section id="games" className="storefront-catalogue-section mx-auto max-w-[1240px] scroll-mt-32 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="storefront-section-label">The catalogue</div><h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">Top up what you play.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Every card takes you to the exact market and package flow for that game. No hidden regional guesswork.</p></div>
          <Link href="/support" className="storefront-inline-link">Need help choosing? <StorefrontIcon name="arrow" className="h-3.5 w-3.5" /></Link>
        </div>

        {popularGames.length > 0 ? <div className="mt-8"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Start here</p><h3 className="mt-1 text-lg font-semibold text-white">Popular right now</h3></div><Link href="#all-games" className="text-xs font-bold text-cyan-200 transition hover:text-white">See full catalogue</Link></div><div className="storefront-popular-rail">{popularGames.map((game, index) => <div key={game.slug} className="storefront-popular-item"><GameCard game={game} priority={index < 2} showDevelopmentBadges={storefront.privateFlags.showDevelopmentBadges} showPricingSnapshots={storefront.privateFlags.showPricingSnapshots} /></div>)}</div></div> : null}

        <div id="all-games" className="mt-12 scroll-mt-32"><Suspense fallback={<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"><div className="storefront-loading-card" /><div className="storefront-loading-card" /><div className="storefront-loading-card" /><div className="storefront-loading-card" /><div className="storefront-loading-card" /></div>}><GameCatalogue games={visibleGames} showRegionalMarkets={storefront.catalogue.showRegionalMarkets} showDevelopmentBadges={storefront.privateFlags.showDevelopmentBadges} showPricingSnapshots={storefront.privateFlags.showPricingSnapshots} /></Suspense></div>
      </section>

      <section id="how-it-works" className="storefront-process-section border-y border-white/[0.07] bg-[#090b12] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]"><div className="max-w-2xl"><div className="storefront-section-label">How Recharza works</div><h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">Clear steps. Fewer checkout surprises.</h2><p className="mt-3 text-sm leading-6 text-slate-400">The flow is designed around the player destination first, because a correct package is only useful when it reaches the right account.</p></div><div className="mt-8 grid gap-3 md:grid-cols-3">{processItems.map((item) => <article key={item.step} className="storefront-process-card"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.055] text-cyan-200 ring-1 ring-white/[0.08]"><StorefrontIcon name={item.icon} className="h-5 w-5" /></span><span className="font-mono text-xs font-bold text-slate-600">{item.step}</span></div><h3 className="mt-6 text-base font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p></article>)}</div></div>
      </section>

      <StorefrontAccountPrompt />

      <SiteFooter />
    </main>
  );
}
