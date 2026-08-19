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
        description: `Integrated ${selectedMarket.label} Mobile Legends catalogue, player validation, billing, order creation, and payment.`,
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
      <main className="storefront-page min-h-screen overflow-x-clip text-white">
        <SiteHeader />
        <section className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/games/mobile-legends" className="text-xs font-semibold text-violet-300 hover:text-violet-200">← Mobile Legends markets</Link>
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-amber-300/20 bg-amber-300/[0.07] text-amber-200">
                <StorefrontIcon name="globe" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">{selectedMarket.flag} {selectedMarket.label}</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Checkout is not open for this market yet.</h1>
                <p className="mt-3 text-sm leading-6 text-amber-50/65">No approved fulfilment catalogue is published for this region. Recharza will not substitute another market or invent a price.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/games/mobile-legends" className="inline-flex min-h-10 items-center rounded-lg bg-white px-3.5 text-xs font-semibold text-slate-950">View markets</Link>
              <Link href="/support" className="inline-flex min-h-10 items-center rounded-lg border border-white/[0.1] px-3.5 text-xs font-semibold text-white">Ask support</Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="storefront-page min-h-screen overflow-x-clip text-white">
      <SiteHeader />

      <section className="border-b border-white/[0.08] bg-[#0a0c12] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <StorefrontBackButton />
          <div className="mb-4 mt-4 flex items-center gap-2 text-[11px] text-slate-600">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/games/mobile-legends" className="hover:text-white">Mobile Legends</Link>
            <span>/</span>
            <span className="text-slate-400">{selectedMarket.label}</span>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] sm:h-20 sm:w-20"
                style={{ background: `linear-gradient(135deg, ${regionalGame.accent}26, ${regionalGame.accent}08)` }}
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
                <h1 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">Mobile Legends: Bang Bang Top Up</h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{selectedMarket.flag} {selectedMarket.label}</span>
                  <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{packages.length} offers</span>
                  <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{selectedMarket.defaultCurrency}</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-300/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[11px] font-medium text-emerald-300/90">Fixed market pricing</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-cyan-300/90"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                </div>
                {regionalGame.deliveryCoverage && (
                  <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-2.5 py-1">
                    <StorefrontIcon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" />
                    <p className="truncate text-[11px] font-medium leading-snug text-white/70">{regionalGame.deliveryCoverage.headline}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="relative hidden h-20 w-44 overflow-hidden rounded-lg border border-white/[0.08] bg-[#12151d] md:block">
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
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-white/[0.08] bg-[#0d0f16] px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span><strong className="text-slate-300">{selectedMarket.flag} {selectedMarket.label}:</strong> {selectedMarket.note}</span>
          <span className="font-semibold text-emerald-300">Prices shown in {selectedMarket.defaultCurrency}</span>
        </div>

        <MobileLegendsCheckoutShell
          packages={packages}
          market={selectedMarket}
          savedAddresses={savedAddresses}
          isAuthenticated={isAuthenticated}
          initialCartItemId={cartItem?.trim() ? cartItem : null}
        />

        <GameEducationSection game={regionalGame} />
      </section>

      <SiteFooter />
    </main>
  );
}
