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
      <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-white">
        <SiteHeader />

        <section className="recharza-atmosphere-game border-b border-white/5 bg-white/2 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <StorefrontBackButton />
            <nav className="recharza-breadcrumb mb-4 mt-4 text-slate-400" aria-label="Page path">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/#games" className="hover:text-white transition-colors">Top Up</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-white">{definition.title}</span>
            </nav>

            <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-5 sm:gap-6">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 shadow-sm sm:h-20 sm:w-20"
                  style={{ background: `linear-gradient(135deg, ${game.accent}15, ${game.accent}05)` }}
                >
                  <ResilientImage
                    sources={gameLogo ? [gameLogo.url, game.icon, ...game.logoSources] : [game.icon, ...game.logoSources]}
                    alt={gameLogo?.altText ?? game.logoAlt}
                    fallbackLabel={game.title.slice(0, 2).toUpperCase()}
                    fill
                    priority
                    sizes="80px"
                    className="object-contain p-2"
                    fallbackClassName="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Instant delivery</p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl leading-tight">{definition.title} Top Up</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-300">{packages.length} offers</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[10px] font-bold text-slate-300">{marketCount} {marketCount === 1 ? "market" : "markets"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 shadow-sm">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        Verified
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/10" />
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        Support
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden h-20 w-44 overflow-hidden rounded-lg border border-white/10 bg-white/5 md:block shadow-2xl">
                <ResilientImage
                  sources={gameArtwork ? [gameArtwork.url, ...game.artworkSources] : game.artworkSources}
                  alt={gameArtwork?.altText ?? game.artworkAlt}
                  fallbackLabel={game.title}
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
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/2 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <StorefrontIcon name="globe" className="h-4 w-4 shrink-0 text-slate-500" />
                <p className="text-[11px] font-medium leading-relaxed text-slate-400">
                  <strong className="font-bold text-white">{game.title} Global Delivery:</strong> Secure account confirmation and immediate delivery to your profile.
                </p>
              </div>
              {game.deliveryCoverage && (
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:border-none sm:pt-0">
                  <p className="text-[11px] font-bold text-slate-300 underline decoration-emerald-500/50 decoration-2 underline-offset-4">{game.deliveryCoverage.headline}</p>
                  <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1">
                    <StorefrontIcon name="shield" className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400">Secure Checkout</span>
                  </div>
                </div>
              )}
            </div>
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
