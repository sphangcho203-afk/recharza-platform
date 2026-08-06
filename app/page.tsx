import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontHero } from "@/components/storefront-hero";
import {
  StorefrontIcon,
  type StorefrontIconName,
} from "@/components/storefront-icon";
import type { Game } from "@/lib/games";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";
import {
  getPublishedStorefrontContent,
  type StorefrontContent,
} from "@/lib/storefront-content";

export const dynamic = "force-dynamic";

const processIcons: StorefrontIconName[] = ["globe", "account", "receipt", "track"];

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
    <main
      id="top"
      className="storefront-page min-h-screen overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))] text-white"
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

      {storefront.hero.enabled ? <StorefrontHero content={storefront.hero} /> : null}

      {storefront.catalogue.enabled ? (
        <section
          id="games"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(24rem,1.28fr)] lg:items-end lg:gap-14">
            <div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.19em] text-cyan-300">
                <span className="h-px w-7 bg-cyan-300" />
                {storefront.catalogue.eyebrow}
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.055em] text-white sm:text-5xl">
                {storefront.catalogue.title}
              </h2>
            </div>
            <div className="lg:pb-1">
              <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Choose a game first. Regional markets and purchasable packs appear
                only where Recharza has an approved fulfilment path.
              </p>
              <Link
                href="/games/mobile-legends"
                className="group mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-black text-violet-300 transition hover:text-violet-200"
              >
                Open the complete MLBB market directory
                <StorefrontIcon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
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
        <section className="border-y border-white/[0.08] bg-white/[0.018] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.19em] text-violet-300">
                  {storefront.process.eyebrow}
                </p>
                <h2 className="mt-3 max-w-lg text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                  Clear steps. Recoverable orders. Human support.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Recharza keeps game selection, account destination, package review,
                payment and tracking in the order customers naturally need them.
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {storefront.process.steps.slice(0, 3).map((step, index) => (
                <article
                  key={`${step.number}-${step.title}`}
                  className="rounded-2xl border border-white/[0.08] bg-[#090b12] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-cyan-200">
                      <StorefrontIcon
                        name={processIcons[index] ?? "shield"}
                        className="h-[18px] w-[18px]"
                      />
                    </span>
                    <span className="font-mono text-[10px] font-black text-white/20">
                      {String(index + 1).padStart(2, "0")}
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

            <div className="mt-6 grid gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 sm:grid-cols-3 sm:p-5">
              {[
                { icon: "shield" as const, title: "Never share a PIN", text: "Support will not request passwords, OTPs, UPI PINs or card PINs." },
                { icon: "track" as const, title: "Keep the order private", text: "Use the protected tracking link or account history to review status." },
                { icon: "support" as const, title: "Escalate with context", text: "Send the order ID and a redacted screenshot when human help is needed." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <StorefrontIcon name={item.icon} className="mt-0.5 h-[18px] w-[18px] shrink-0 text-violet-300" />
                  <div>
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
