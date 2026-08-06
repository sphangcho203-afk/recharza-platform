import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { SupplierGameCheckoutShell } from "@/components/supplier-game-checkout-shell";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { getGameCheckoutDefinition } from "@/lib/commerce/game-checkout";
import { mainGames } from "@/lib/games";
import {
  getPublishedGamePackages,
  isSupplierCheckoutGameSlug,
} from "@/lib/storefront-game-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}): Promise<Metadata> {
  const { gameSlug } = await params;
  const definition = getGameCheckoutDefinition(gameSlug);
  return definition
    ? {
        title: `${definition.title} Top-Up`,
        description: definition.readinessNote,
      }
    : { title: "Game checkout" };
}

export default async function GameCheckoutPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = await params;
  const definition = getGameCheckoutDefinition(gameSlug);
  const game = mainGames.find((item) => item.slug === gameSlug);
  if (!definition || !game || gameSlug === "mobile-legends") notFound();

  if (isSupplierCheckoutGameSlug(gameSlug)) {
    const [packages, fxSnapshot] = await Promise.all([
      getPublishedGamePackages(gameSlug),
      getCurrencyRateSnapshot(),
    ]);
    const marketCount = new Set(packages.map((item) => item.marketCode)).size;

    return (
      <main className="min-h-screen overflow-x-clip bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <SiteHeader />

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-9rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/16 blur-[120px]" />
            <div className="absolute right-[-7rem] top-0 h-[25rem] w-[25rem] rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="hero-grid absolute inset-0 opacity-20" />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_18rem] lg:items-center lg:px-8">
            <div>
              <Link
                href="/#games"
                className="text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                ← Back to games
              </Link>
              <div className="mt-6 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-emerald-100">
                Curated supplier checkout
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                {definition.title} top-up.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Choose the exact account market, select a live supplier pack,
                confirm the destination, create a recoverable order, and finish
                payment without leaving the checkout flow.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {packages.length} curated offers
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {marketCount} supplier {marketCount === 1 ? "market" : "markets"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Razorpay protected payment
                </span>
              </div>
            </div>

            <div className="hidden aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30 lg:block">
              <ResilientImage
                sources={game.artworkSources}
                alt={game.artworkAlt}
                fallbackLabel={game.title.slice(0, 2).toUpperCase()}
                loading="eager"
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <SupplierGameCheckoutShell
            gameSlug={gameSlug}
            gameTitle={definition.title}
            packages={packages}
            fxSnapshot={fxSnapshot}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/#games"
          className="text-sm font-semibold text-violet-300 hover:text-violet-200"
        >
          ← Back to games
        </Link>
        <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">
            Checkout locked
          </p>
          <h1 className="mt-3 text-3xl font-black">{definition.title}</h1>
          <p className="mt-3 leading-7 text-amber-100/80">
            {definition.readinessNote}
          </p>
        </div>
      </section>
    </main>
  );
}
