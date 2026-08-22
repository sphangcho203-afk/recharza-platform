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
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-slate-900">
      <SiteHeader />

      <section className="recharza-atmosphere-game border-b border-slate-100 bg-slate-50/30 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <StorefrontBackButton />
          <nav className="recharza-breadcrumb mb-4 mt-4" aria-label="Page path">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/games/mobile-legends">Mobile Legends</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{selectedMarket.label}</span>
          </nav>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 sm:h-20 sm:w-20"
                style={{ background: `linear-gradient(135deg, ${regionalGame.accent}15, ${regionalGame.accent}05)` }}
              >
                <ResilientImage
                  sources={gameLogo ? [gameLogo.url, regionalGame.icon, ...regionalGame.logoSources] : [regionalGame.icon, ...regionalGame.logoSources]}
                  alt={gameLogo?.altText ?? regionalGame.logoAlt}
                  fallbackLabel="ML"
                  fill
                  priority
                  sizes="80px"
                  className="object-contain p-2"
                  fallbackClassName="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <p className="recharza-eyebrow">Instant delivery</p>
                <h1 className="recharza-section-head mt-1 text-slate-900">Mobile Legends: Bang Bang Top Up</h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{selectedMarket.flag} {selectedMarket.label}</span>
                  <span className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{packages.length} offers</span>
                  <span className="inline-flex whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">{selectedMarket.defaultCurrency}</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Fixed market pricing</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-700"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                </div>
                {regionalGame.deliveryCoverage && (
                  <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                    <StorefrontIcon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="truncate text-[11px] font-bold leading-snug text-emerald-800">{regionalGame.deliveryCoverage.headline}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="relative hidden h-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white md:block shadow-sm">
              <ResilientImage
                sources={gameArtwork ? [gameArtwork.url, ...regionalGame.artworkSources] : regionalGame.artworkSources}
                alt={gameArtwork?.altText ?? regionalGame.artworkAlt}
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

      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span><strong className="text-slate-900 font-bold">{selectedMarket.flag} {selectedMarket.label}:</strong> <span className="font-medium">{selectedMarket.note}</span></span>
          <span className="font-bold text-emerald-600">Prices shown in {selectedMarket.defaultCurrency}</span>
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
