import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import { GameEducationSection } from "@/components/game-education-section";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { mobileLegendsMarkets, parseMobileLegendsMarket } from "@/lib/mobile-legends-market";

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description: "Choose a supported Mobile Legends fulfilment market before opening its regional checkout.",
};

export default async function MobileLegendsPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const legacyMarket = parseMobileLegendsMarket((await searchParams).region);
  if (legacyMarket) redirect(`/games/mobile-legends/${legacyMarket.code}`);

  const mobileLegendsGame = games.find((game) => game.slug === "mobile-legends")!;
  const media = await getPublicMediaPlacements();
  const gameLogo = media.get("game.mobile-legends.logo");
  const gameArtwork = media.get("game.mobile-legends.artwork");

  return (
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-slate-900">
      <SiteHeader />

      <section className="recharza-atmosphere-game border-b border-slate-100 bg-slate-50/30 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <nav className="recharza-breadcrumb mb-4" aria-label="Page path">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/#games">Top Up</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mobile Legends</span>
          </nav>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 sm:h-20 sm:w-20"
                style={{ background: `linear-gradient(135deg, ${mobileLegendsGame.accent}15, ${mobileLegendsGame.accent}05)` }}
              >
                <ResilientImage
                  sources={gameLogo ? [gameLogo.url, mobileLegendsGame.icon, ...mobileLegendsGame.logoSources] : [mobileLegendsGame.icon, ...mobileLegendsGame.logoSources]}
                  alt={gameLogo?.altText ?? mobileLegendsGame.logoAlt}
                  fallbackLabel="ML"
                  fill
                  priority
                  sizes="80px"
                  className="object-contain p-2"
                  fallbackClassName="absolute inset-0 h-full w-full"
                />
              </div>
              <div>
                <p className="recharza-eyebrow">Instant delivery</p>
                <h1 className="recharza-section-head mt-1 text-slate-900">Mobile Legends: Bang Bang Top Up</h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{mobileLegendsMarkets.length} markets</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">★ 4.9</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Secure</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                </div>
                {mobileLegendsGame.deliveryCoverage && (
                  <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                    <StorefrontIcon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="truncate text-[11px] font-bold leading-snug text-emerald-800">{mobileLegendsGame.deliveryCoverage.headline}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="relative hidden h-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white md:block shadow-sm">
              <ResilientImage
                sources={gameArtwork ? [gameArtwork.url, ...mobileLegendsGame.artworkSources] : mobileLegendsGame.artworkSources}
                alt={gameArtwork?.altText ?? mobileLegendsGame.artworkAlt}
                fallbackLabel="Mobile Legends"
                fill
                sizes="176px"
                className="object-cover"
                fallbackClassName="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="recharza-eyebrow">Step 1</p>
            <h2 className="recharza-section-head mt-3 text-slate-900">Choose your account market</h2>
            <p className="recharza-body mt-3 text-slate-600">The selected market controls packages, currency, validation and fulfilment.</p>
          </div>
          <Link href="/support" className="hidden text-xs font-bold text-violet-600 hover:text-violet-900 sm:block">Need help?</Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mobileLegendsMarkets.map((market) => (
            <Link
              key={market.code}
              href={`/games/mobile-legends/${market.code}`}
              className="group flex min-h-28 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-2xl shadow-sm" aria-hidden="true">{market.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-slate-900 break-words">{market.label}</strong>
                  <span className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">{market.defaultCurrency}</span>
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-500 font-medium">{market.note}</span>
              </span>
              <StorefrontIcon name="arrow" className="h-4 w-4 shrink-0 text-slate-300 transition-colors duration-300 group-hover:text-violet-600" />
            </Link>
          ))}
        </div>

        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs leading-5 text-slate-500 font-medium sm:p-5">
          Choose a market only when it matches the Mobile Legends account. Recharza does not silently substitute a different region.
        </div>

        <GameEducationSection game={mobileLegendsGame} />
      </section>

      <SiteFooter />
    </main>
  );
}
