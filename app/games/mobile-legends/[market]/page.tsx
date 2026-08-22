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
    <main className="storefront-page recharza-dark-atmosphere min-h-screen overflow-x-hidden">
      <SiteHeader />

      {/* Immersive Framed Hero Section */}
      <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
        {/* Vibrant Atmosphere Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-gradient-to-b from-violet-600/20 via-blue-600/10 to-transparent blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <StorefrontBackButton className="self-start mb-8 text-white/60 hover:text-white" />
            
            {/* Centered Framed Game Icon */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-blue-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-[2.5rem] border-4 border-white/10 bg-[#161722] p-4 shadow-2xl overflow-hidden">
                <ResilientImage
                  sources={gameLogo ? [gameLogo.url, regionalGame.icon, ...regionalGame.logoSources] : [regionalGame.icon, ...regionalGame.logoSources]}
                  alt={gameLogo?.altText ?? regionalGame.logoAlt}
                  fallbackLabel="ML"
                  fill
                  priority
                  sizes="(max-width: 640px) 128px, 160px"
                  className="object-contain p-2"
                />
              </div>
            </div>

            {/* High-Impact Title & Badges */}
            <h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white uppercase italic leading-[1.1]">
              Mobile Legends:<br />
              <span className="text-white/90 italic">Bang Bang</span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white/60">
                <StorefrontIcon name="globe" className="h-4 w-4 text-blue-400" />
                <span>{selectedMarket.label} Market</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-400">
                <StorefrontIcon name="track" className="h-4 w-4" />
                <span>Instant Delivery</span>
              </div>
            </div>

            {/* Service Alert Box */}
            <div className="mt-10 w-full max-w-2xl rounded-[2rem] border-2 border-amber-500/30 bg-[#1c1917] p-6 text-left shadow-2xl backdrop-blur-md">
              <div className="flex gap-4">
                <StorefrontIcon name="info" className="h-6 w-6 shrink-0 text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest text-amber-400">Important Service Notice</p>
                  <p className="text-sm font-bold leading-relaxed text-amber-100/80">
                    This top-up service is ONLY for MLBB <span className="text-white">{selectedMarket.label}</span> players. 
                    Instant Delivery enabled — enter the correct User ID and Zone ID to avoid delays. {selectedMarket.note}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/10">
            <StorefrontIcon name="coin" className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Diamond Packs</h2>
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
