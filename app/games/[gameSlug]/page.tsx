import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StorefrontBackButton } from "@/components/storefront-back-button";
import { StorefrontIcon } from "@/components/storefront-icon";
import { SupplierGameCheckoutShell } from "@/components/supplier-game-checkout-shell";
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

        <section className="border-b border-white/[0.08] bg-[#0a0c12] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <StorefrontBackButton />
            <div className="mb-4 mt-4 flex items-center gap-2 text-[11px] text-slate-600">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/#games" className="hover:text-white">Top Up</Link>
              <span>/</span>
              <span className="text-slate-400">{definition.title}</span>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#0d0f16] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#151923] sm:h-20 sm:w-20">
                  <ResilientImage
                    sources={gameLogo ? [gameLogo.url, ...game.logoSources] : game.logoSources}
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
                  <h1 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">{definition.title} Top Up</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                    <span className="text-amber-300">★ 4.9</span>
                    <span>{packages.length} offers</span>
                    <span>{marketCount} {marketCount === 1 ? "market" : "markets"}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300"><StorefrontIcon name="shield" className="h-3.5 w-3.5" /> Secure</span>
                    <span className="inline-flex items-center gap-1 text-cyan-300"><StorefrontIcon name="support" className="h-3.5 w-3.5" /> Support</span>
                  </div>
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
