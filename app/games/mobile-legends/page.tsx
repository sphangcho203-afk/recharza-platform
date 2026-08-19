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
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />

      <section className="recharza-atmosphere-game border-b border-white/[0.08] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <nav className="recharza-breadcrumb mb-4" aria-label="Page path">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/#games">Top Up</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mobile Legends</span>
          </nav>

          <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] sm:h-20 sm:w-20"
                style={{ background: `linear-gradient(135deg, ${mobileLegendsGame.accent}26, ${mobileLegendsGame.accent}08)` }}
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
                <h1 className="recharza-section-head mt-1 text-white">Mobile Legends: Bang Bang Top Up</h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{mobileLegendsMarkets.length} markets</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-300/20 bg-amber-400/[0.06] px-2 py-0.5 text-[11px] font-medium text-amber-300/90">★ 4.9</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-300/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[11px] font-medium text-emerald-300/90"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Secure</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-cyan-300/90"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                </div>
                {mobileLegendsGame.deliveryCoverage && (
                  <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-2.5 py-1">
                    <StorefrontIcon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" />
                    <p className="truncate text-[11px] font-medium leading-snug text-white/70">{mobileLegendsGame.deliveryCoverage.headline}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="relative hidden h-20 w-44 overflow-hidden rounded-lg border border-white/[0.08] bg-[#12151d] md:block">
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
            <h2 className="recharza-section-head mt-3 text-white">Choose your account market</h2>
            <p className="recharza-body mt-3">The selected market controls packages, currency, validation and fulfilment.</p>
          </div>
          <Link href="/support" className="hidden text-xs font-semibold text-violet-300 hover:text-violet-200 sm:block">Need help?</Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mobileLegendsMarkets.map((market) => (
            <Link
              key={market.code}
              href={`/games/mobile-legends/${market.code}`}
              className="group flex min-h-28 items-center gap-4 rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/35 hover:shadow-[0_14px_36px_rgba(0,0,0,0.24)]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-2xl" aria-hidden="true">{market.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="truncate text-sm font-semibold text-white">{market.label}</strong>
                  <span className="rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{market.defaultCurrency}</span>
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-500">{market.note}</span>
              </span>
              <StorefrontIcon name="arrow" className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-white" />
            </Link>
          ))}
        </div>

        <div className="mt-7 rounded-lg border border-white/[0.08] bg-[#0b0d13] p-4 text-xs leading-5 text-slate-500 sm:p-5">
          Choose a market only when it matches the Mobile Legends account. Recharza does not silently substitute a different region.
        </div>

        <GameEducationSection game={mobileLegendsGame} />
      </section>

      <SiteFooter />
    </main>
  );
}
