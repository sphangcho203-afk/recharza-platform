import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { mobileLegendsMarkets } from "@/lib/mobile-legends-market";
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

function getFeaturedValue(
  game: Game,
  flags: StorefrontContent["privateFlags"],
) {
  if (flags.showPricingSnapshots && game.startingPriceInPaise) {
    return `From ${formatInr(game.startingPriceInPaise)}`;
  }
  if (game.status === "checkout") return "Checkout available";
  if (game.status === "catalogue") {
    return flags.showDevelopmentBadges
      ? game.badge ?? "Architecture preview"
      : "Preview";
  }
  return flags.showDevelopmentBadges ? "Coming soon" : "Not available";
}

function FeaturedArtwork({
  game,
  flags,
  primary = false,
}: {
  game: Game;
  flags: StorefrontContent["privateFlags"];
  primary?: boolean;
}) {
  const artwork = (
    <article
      className={`relative min-w-0 overflow-hidden border border-white/10 bg-[#10101a] ${
        primary
          ? "row-span-2 aspect-square rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
          : "aspect-square rounded-2xl"
      }`}
    >
      <ResilientImage
        sources={[...game.artworkSources, ...game.logoSources]}
        alt={game.artworkAlt}
        fallbackLabel={game.title}
        loading={primary ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        style={{ objectPosition: game.artworkPosition ?? "center" }}
        fallbackClassName="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
      <div className={`absolute inset-x-0 bottom-0 ${primary ? "p-4 sm:p-5" : "p-3"}`}>
        <p className={`${primary ? "text-xs" : "text-sm"} font-bold text-white/75`}>
          {game.title}
        </p>
        <p className={`${primary ? "mt-1 text-xl sm:text-2xl" : "mt-1 text-[10px] uppercase tracking-wider"} font-black text-white`}>
          {getFeaturedValue(game, flags)}
        </p>
        {primary && game.available && game.href ? (
          <span className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950">
            Open game →
          </span>
        ) : null}
      </div>
    </article>
  );

  return game.available && game.href ? (
    <Link
      href={game.href}
      className="group rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      {artwork}
    </Link>
  ) : (
    artwork
  );
}

export default async function Home() {
  const [pricing, storefront] = await Promise.all([
    getStorefrontPricingSnapshot(),
    getPublishedStorefrontContent(),
  ]);

  const enrichedGames: Game[] = games.map((game) => {
    const liveMinimum = pricing.minimumPrices[game.pricingKey ?? game.slug];
    return {
      ...game,
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
  const visibleMainGames = visibleGames.filter((game) => game.kind === "game");
  const featuredGames = storefront.featuredGameSlugs.flatMap((slug) => {
    const game = visibleMainGames.find((item) => item.slug === slug);
    return game ? [game] : [];
  });
  const resolvedFeaturedGames = featuredGames.length
    ? featuredGames
    : visibleMainGames.slice(0, 3);
  const primaryFeatured = resolvedFeaturedGames[0] ?? null;
  const secondaryFeatured = resolvedFeaturedGames.slice(1, 3);
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
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[4%] top-[-16rem] h-[30rem] w-[30rem] rounded-full bg-violet-700/14 blur-[130px]" />
            <div className="absolute right-[-10rem] top-10 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[120px]" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-18">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {storefront.hero.eyebrow}
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {storefront.hero.title}
                <span className="block text-violet-300">{storefront.hero.accent}</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                {storefront.hero.description}
              </p>
              <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
                <Link
                  href={storefront.hero.primaryCtaHref}
                  className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {storefront.hero.primaryCtaLabel}
                </Link>
                <Link
                  href={storefront.hero.secondaryCtaHref}
                  className="min-h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {storefront.hero.secondaryCtaLabel}
                </Link>
              </div>
              <div className="mt-7 grid max-w-lg grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center sm:text-left">
                <div>
                  <p className="text-xl font-black text-white">{visibleMainGames.length}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Game brands</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">{mobileLegendsMarkets.length}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">MLBB markets</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">15</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Currencies</p>
                </div>
              </div>
            </div>

            {primaryFeatured ? (
              <div className="grid min-w-0 grid-cols-[1.2fr_0.8fr] gap-3">
                <FeaturedArtwork
                  game={primaryFeatured}
                  flags={storefront.privateFlags}
                  primary
                />
                {secondaryFeatured.map((game) => (
                  <FeaturedArtwork
                    key={game.slug}
                    game={game}
                    flags={storefront.privateFlags}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {storefront.catalogue.enabled ? (
        <section
          id="games"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-18"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
              {storefront.catalogue.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {storefront.catalogue.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
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
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              {storefront.process.eyebrow}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {storefront.process.steps.map((step) => (
                <article
                  key={`${step.number}-${step.title}`}
                  className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5"
                >
                  <p className="font-mono text-sm font-black text-violet-300">{step.number}</p>
                  <h3 className="mt-4 text-lg font-black text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {storefront.benefits.enabled ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {storefront.benefits.items.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5"
              >
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {storefront.footer.enabled ? (
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-9 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>{storefront.footer.copyright}</p>
            <div className="flex flex-wrap gap-4">
              {visibleNavigation.map((item) => (
                <Link key={item.id} href={item.href} className="transition hover:text-slate-300">
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
