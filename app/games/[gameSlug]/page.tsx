import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontBackButton } from "@/components/storefront-back-button";
import { StorefrontIcon } from "@/components/storefront-icon";
import { SupplierGameCheckoutShell } from "@/components/supplier-game-checkout-shell";
import { GameEducationSection } from "@/components/game-education-section";
import { getGameCheckoutDefinition } from "@/lib/commerce/game-checkout";
import { listSavedAddresses } from "@/lib/commerce/saved-addresses";
import { mainGames } from "@/lib/games";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { getServerSession } from "@/lib/server-session";
import { getPublishedGamePackages, isSupplierCheckoutGameSlug } from "@/lib/storefront-game-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ gameSlug: string }> }): Promise<Metadata> {
  const { gameSlug } = await params;
  const definition = getGameCheckoutDefinition(gameSlug);
  return definition
    ? { title: `${definition.title} Top-Up`, description: definition.readinessNote }
    : { title: "Game checkout" };
}

export default async function GameCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameSlug: string }>;
  searchParams: Promise<{ cartItem?: string }>;
}) {
  const { gameSlug } = await params;
  const { cartItem } = await searchParams;
  const definition = getGameCheckoutDefinition(gameSlug);
  const game = mainGames.find((item) => item.slug === gameSlug);
  if (!definition || !game || gameSlug === "mobile-legends") notFound();

  if (isSupplierCheckoutGameSlug(gameSlug)) {
    let packages: Awaited<ReturnType<typeof getPublishedGamePackages>> = [];
    let media: Awaited<ReturnType<typeof getPublicMediaPlacements>>;
    let session: Awaited<ReturnType<typeof getServerSession>> = null;

    try {
      packages = await getPublishedGamePackages(gameSlug);
    } catch (error) {
      console.error(`Live ${gameSlug} catalogue unavailable during page render`, error);
    }


    try {
      media = await getPublicMediaPlacements();
    } catch (error) {
      console.error(`Public media unavailable during ${gameSlug} page render`, error);
      media = new Map();
    }

    try {
      session = await getServerSession();
    } catch (error) {
      console.error(`Customer session unavailable during ${gameSlug} page render`, error);
    }

    const gameLogo = media.get(`game.${gameSlug}.logo`);
    const gameArtwork = media.get(`game.${gameSlug}.artwork`);
    let savedAddresses: Awaited<ReturnType<typeof listSavedAddresses>> = [];
    if (session) {
      try {
        savedAddresses = await listSavedAddresses(session.customer.id);
      } catch (error) {
        console.error(`Saved addresses unavailable during ${gameSlug} page render`, error);
      }
    }
    const isAuthenticated = Boolean(session);
    const marketCount = new Set(packages.map((item) => item.marketCode)).size;

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
                    sources={gameLogo ? [gameLogo.url, game.icon, ...game.logoSources] : [game.icon, ...game.logoSources]}
                    alt={gameLogo?.altText ?? game.logoAlt}
                    fallbackLabel={game.title.slice(0, 2).toUpperCase()}
                    fill
                    priority
                    sizes="(max-width: 640px) 128px, 160px"
                    className="object-contain p-2"
                  />
                </div>
              </div>

	              {/* High-Impact Title & Badges */}
<h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white uppercase italic leading-[1.1]">
		                {definition.title}
		              </h1>

	              <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
	                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white/60">
	                  <StorefrontIcon name="globe" className="h-4 w-4 text-blue-400" />
	                  <span>Global</span>
	                </div>
	                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#f59e0b]">
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
                    <p className="text-sm font-bold leading-relaxed text-amber-100/90">
                      This top-up service is optimized for <span className="text-white">{game.title}</span> players. 
                      Instant Delivery enabled — ensure your <span className="text-white">Player ID</span> is correct to avoid any delays in fulfillment.
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
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Available Packs</h2>
          </div>

          <SupplierGameCheckoutShell
            gameSlug={gameSlug}
            packages={packages}
            savedAddresses={savedAddresses}
            isAuthenticated={isAuthenticated}
            initialCartItemId={cartItem?.trim() ? cartItem : null}
          />
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <GameEducationSection game={game} />
        </section>

        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen text-slate-900 bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <StorefrontBackButton />
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-5 sm:p-7 shadow-sm">
          <h1 className="text-2xl font-bold sm:text-3xl text-slate-900">{definition.title}</h1>
          <p className="mt-3 leading-7 text-amber-900/80 font-medium">{definition.readinessNote}</p>
          <p className="mt-4 text-sm leading-6 text-amber-800/60 font-medium">No substitute market or unverified price will be used. Return to the catalogue or contact support for availability.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
