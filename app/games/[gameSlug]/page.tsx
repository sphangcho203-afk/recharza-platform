import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { StorefrontIcon } from "@/components/storefront-icon";
import { SupplierGameCheckoutShell } from "@/components/supplier-game-checkout-shell";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { getGameCheckoutDefinition } from "@/lib/commerce/game-checkout";
import { mainGames } from "@/lib/games";
import {
  getPublishedGamePackages,
  isSupplierCheckoutGameSlug,
} from "@/lib/storefront-game-catalog";

export const dynamic = "force-dynamic";

const checkoutStages = [
  ["01", "Player ID"],
  ["02", "Package"],
  ["03", "Payment"],
] as const;

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
      <main className="storefront-page min-h-screen overflow-x-clip pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <SiteHeader />

        <section className="relative overflow-hidden border-b border-white/[0.08]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-9rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/14 blur-[120px]" />
            <div className="absolute right-[-7rem] top-0 h-[25rem] w-[25rem] rounded-full bg-cyan-500/9 blur-[120px]" />
            <div className="storefront-ambient-grid absolute inset-0 opacity-20" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center lg:px-8">
            <div>
              <Link
                href="/#games"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-black text-violet-300 transition hover:text-violet-200"
              >
                <span aria-hidden="true">←</span>
                Back to games
              </Link>

              <div className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
                Curated checkout
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-5xl">
                {definition.title} top-up
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Confirm the player destination, choose a published package, then review billing and payment in one recoverable order flow.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {packages.length} curated offers
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {marketCount} {marketCount === 1 ? "market" : "markets"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Private tracking
                </span>
              </div>
            </div>

            <div className="relative hidden aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#10101a] shadow-[0_24px_70px_rgba(0,0,0,0.42)] lg:block">
              <ResilientImage
                sources={game.artworkSources}
                alt={game.artworkAlt}
                fallbackLabel={game.title.slice(0, 2).toUpperCase()}
                fill
                priority
                sizes="224px"
                className="object-cover"
                fallbackClassName="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent p-4 pt-16">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  {game.publisher}
                </p>
                <p className="mt-1 text-sm font-black text-white">{game.title}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.08] bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 sm:px-6 lg:px-8">
            {checkoutStages.map(([number, label], index) => (
              <div
                key={number}
                className={`flex min-h-14 items-center justify-center gap-2 px-2 text-center sm:min-h-16 sm:justify-start sm:px-4 ${
                  index > 0 ? "border-l border-white/[0.08]" : ""
                }`}
              >
                <span className="hidden text-[10px] font-black text-violet-300 sm:inline">
                  {number}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
                <StorefrontIcon name="shield" className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Review before payment</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Player destination, market, package and final amount must all match.
                </p>
              </div>
            </div>
            <Link href="/support" className="text-xs font-black text-cyan-300 hover:text-cyan-200">
              Need checkout help?
            </Link>
          </div>

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
    <main className="storefront-page min-h-screen pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/#games" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
          ← Back to games
        </Link>
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
            Checkout unavailable
          </p>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">{definition.title}</h1>
          <p className="mt-3 leading-7 text-amber-100/80">{definition.readinessNote}</p>
          <p className="mt-4 text-sm leading-6 text-amber-100/65">
            No substitute market or unverified price will be used. Return to the catalogue or contact support for availability.
          </p>
        </div>
      </section>
    </main>
  );
}
