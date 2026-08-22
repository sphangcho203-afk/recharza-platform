import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameEducationSection } from "@/components/game-education-section";
import { MobileLegendsCheckoutShell } from "@/components/mobile-legends-checkout-shell";
import { ResilientImage } from "@/components/resilient-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontBackButton } from "@/components/storefront-back-button";
import { StorefrontIcon } from "@/components/storefront-icon";
import { listSavedAddresses } from "@/lib/commerce/saved-addresses";
import { games } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { mobileLegendsMarkets, parseMobileLegendsMarket } from "@/lib/mobile-legends-market";
import { getServerSession } from "@/lib/server-session";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return mobileLegendsMarkets.map((market) => ({ market: market.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const selectedMarket = parseMobileLegendsMarket((await params).market);
  return selectedMarket
    ? {
        title: `Mobile Legends ${selectedMarket.label} Top-Up`,
        description: `Instant ${selectedMarket.label} Mobile Legends top-up. Secure account confirmation and immediate diamond delivery to your profile.`,
      }
    : { title: "Mobile Legends Top-Up" };
}

export default async function MobileLegendsMarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ cartItem?: string }>;
}) {
  const selectedMarket = parseMobileLegendsMarket((await params).market);
  if (!selectedMarket) notFound();

  const { cartItem } = await searchParams;

  const regionalGame =
    games.find((game) => game.slug === `mobile-legends-${selectedMarket.code}`) ??
    games.find((game) => game.slug === "mobile-legends")!;
  const [packages, media] = await Promise.all([
    getMobileLegendsPackages(selectedMarket.code),
    getPublicMediaPlacements(),
  ]);
  const session = await getServerSession();
  const savedAddresses = session ? await listSavedAddresses(session.customer.id) : [];
  const isAuthenticated = Boolean(session);
  const livePricing = packages.some((item) => item.source === "fazercards-live");
  const gameLogo = media.get("game.mobile-legends.logo");
  const gameArtwork = media.get("game.mobile-legends.artwork");

  if (packages.length === 0) {
    return (
      <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-slate-900">
        <SiteHeader />
        <section className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/games/mobile-legends" className="text-xs font-bold text-violet-600 hover:text-violet-900">← Mobile Legends markets</Link>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-200 bg-white text-amber-600 shadow-sm">
                <StorefrontIcon name="globe" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">{selectedMarket.flag} {selectedMarket.label}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Checkout is not open for this market yet.</h1>
                <p className="mt-3 text-sm leading-6 text-amber-800/80 font-medium">This region is currently unavailable for top-up. We only offer markets with verified delivery paths to ensure your diamonds arrive safely.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/games/mobile-legends" className="inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white transition hover:bg-black">View markets</Link>
              <Link href="/support" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-900 transition hover:bg-slate-50">Ask support</Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-slate-900 bg-white">
      <SiteHeader />

      <section className="recharza-atmosphere-game border-b border-slate-200/60 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <StorefrontBackButton />
          <nav className="recharza-breadcrumb mb-6 mt-6 text-slate-500 text-[11px] font-bold uppercase tracking-widest" aria-label="Page path">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/games/mobile-legends" className="hover:text-slate-900 transition-colors">Mobile Legends</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span aria-current="page" className="text-violet-600">{selectedMarket.label}</span>
          </nav>

          <div className="recharza-surface-floating relative overflow-hidden rounded-[2.5rem] p-6 sm:p-10 group bg-white shadow-xl ring-1 ring-slate-200/50">
            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
                <div className="relative h-28 w-28 flex-none overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm sm:h-36 sm:w-36 transition-transform duration-500 group-hover:scale-105">
                  <ResilientImage
                    sources={gameLogo ? [gameLogo.url, regionalGame.icon, ...regionalGame.logoSources] : [regionalGame.icon, ...regionalGame.logoSources]}
                    alt={gameLogo?.altText ?? regionalGame.logoAlt}
                    fallbackLabel="ML"
                    fill
                    priority
                    sizes="144px"
                    className="object-contain p-3"
                    fallbackClassName="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <span className="recharza-eyebrow text-violet-400 animate-pulse">Instant delivery</span>
                    <h1 className="recharza-display text-4xl sm:text-5xl lg:text-7xl text-slate-900">
                      Mobile Legends <span className="text-violet-600">Top Up</span>
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200 shadow-sm">
                      <span className="text-xl">{selectedMarket.flag}</span>
                      <span className="text-[0.95rem] font-extrabold text-slate-900">{selectedMarket.label}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      <span className="text-sm font-bold text-slate-600">{packages.length} offers</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{selectedMarket.defaultCurrency}</span>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-2.5 shadow-sm">
                      <span className="text-[0.7rem] font-black text-slate-500 uppercase tracking-[0.25em]">Verified</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-100" />
                      <span className="text-[0.7rem] font-black text-slate-500 uppercase tracking-[0.25em]">Support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Artwork */}
              <div className="hidden lg:block">
                <div className="relative h-40 w-72 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-lg transition-all duration-500 group-hover:border-violet-500/30 group-hover:shadow-xl">
                  <ResilientImage
                    sources={gameArtwork ? [gameArtwork.url, ...regionalGame.artworkSources] : regionalGame.artworkSources}
                    alt={gameArtwork?.altText ?? regionalGame.artworkAlt}
                    fallbackLabel="Mobile Legends"
                    fill
                    sizes="288px"
                    className="object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                    fallbackClassName="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 right-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-600/60">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 group/strip shadow-sm">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                <StorefrontIcon name="globe" className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[0.95rem] font-semibold text-slate-600 leading-relaxed">
                  <b className="text-slate-900 font-extrabold">{selectedMarket.flag} {selectedMarket.label}:</b> {selectedMarket.note}
                </p>
              </div>
            </div>
            {regionalGame.deliveryCoverage && (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 tracking-wide">{regionalGame.deliveryCoverage.headline}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-2 text-emerald-600 border border-emerald-100 shadow-sm">
                  <StorefrontIcon name="shield" className="h-4 w-4 text-emerald-600" />
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.2em]">Secure Checkout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <MobileLegendsCheckoutShell
          packages={packages}
          market={selectedMarket}
          savedAddresses={savedAddresses}
          isAuthenticated={isAuthenticated}
          initialCartItemId={cartItem?.trim() ? cartItem : null}
        />
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <GameEducationSection game={regionalGame} />
      </section>

      <SiteFooter />
    </main>
  );
}
