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
      <main className="storefront-page recharza-atmo-v2 recharza-atmo-games min-h-screen overflow-x-clip text-slate-900 bg-white">
        <SiteHeader />

        <section className="recharza-atmosphere-game border-b border-slate-100 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <StorefrontBackButton />
            <nav className="recharza-breadcrumb mb-4 mt-4" aria-label="Page path">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/#games">Top Up</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{definition.title}</span>
            </nav>

            <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600/80">Instant delivery</p>
                  <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{definition.title} Top Up</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 shadow-sm">
                      <span className="text-[11px] font-bold text-slate-700">{packages.length} offers</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[11px] font-bold text-slate-700">{marketCount} {marketCount === 1 ? "market" : "markets"}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                        <StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Verified
                      </span>
                      <span className="h-1 w-1 rounded-full bg-emerald-200" />
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                        <StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden h-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 md:block shadow-sm">
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
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <StorefrontIcon name="shield" className="h-4 w-4" />
                </span>
                <p className="text-xs font-medium text-slate-600">
                  <strong className="font-bold text-slate-900">{game.title} Global Delivery:</strong> Secure account confirmation and immediate delivery.
                </p>
              </div>
              {game.deliveryCoverage && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-700">{game.deliveryCoverage.headline}</span>
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
