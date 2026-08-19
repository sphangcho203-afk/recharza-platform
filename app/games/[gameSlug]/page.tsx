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
      <main className="storefront-page min-h-screen overflow-x-clip text-white">
        <SiteHeader />

        <section className="recharza-atmosphere-game border-b border-white/[0.08] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <StorefrontBackButton />
            <nav className="recharza-breadcrumb mb-4 mt-4" aria-label="Page path">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/#games">Top Up</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{definition.title}</span>
            </nav>

            <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] sm:h-20 sm:w-20"
                  style={{ background: `linear-gradient(135deg, ${game.accent}26, ${game.accent}08)` }}
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
                  <p className="recharza-eyebrow">Instant delivery</p>
                  <h1 className="recharza-section-head mt-1 text-white">{definition.title} Top Up</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{packages.length} offers</span>
                    <span className="inline-flex whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">{marketCount} {marketCount === 1 ? "market" : "markets"}</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-300/20 bg-amber-400/[0.06] px-2 py-0.5 text-[11px] font-medium text-amber-300/90">★ 4.9</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-300/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[11px] font-medium text-emerald-300/90"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Secure</span>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-cyan-300/90"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                  </div>
                  {game.deliveryCoverage && (
                    <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-2.5 py-1">
                      <StorefrontIcon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" />
                      <p className="truncate text-[11px] font-medium leading-snug text-white/70">{game.deliveryCoverage.headline}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative hidden h-20 w-44 overflow-hidden rounded-lg border border-white/[0.08] bg-[#12151d] md:block">
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
          <SupplierGameCheckoutShell
            gameSlug={gameSlug}
            packages={packages}
            savedAddresses={savedAddresses}
            isAuthenticated={isAuthenticated}
            initialCartItemId={cartItem?.trim() ? cartItem : null}
          />
          <GameEducationSection game={game} />
        </section>

        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="storefront-page min-h-screen text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <StorefrontBackButton />
        <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/[0.07] p-5 sm:p-7">
          <h1 className="text-2xl font-semibold sm:text-3xl">{definition.title}</h1>
          <p className="mt-3 leading-7 text-amber-100/75">{definition.readinessNote}</p>
          <p className="mt-4 text-sm leading-6 text-amber-100/60">No substitute market or unverified price will be used. Return to the catalogue or contact support for availability.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
