import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MobileLegendsCheckoutShell } from "@/components/mobile-legends-checkout-shell";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";
import { games } from "@/lib/games";
import {
  mobileLegendsMarkets,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return mobileLegendsMarkets.map((market) => ({ market: market.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const selectedMarket = parseMobileLegendsMarket((await params).market);

  return selectedMarket
    ? {
        title: `Mobile Legends ${selectedMarket.label} Top-Up`,
        description: `Integrated ${selectedMarket.label} Mobile Legends catalogue, player validation, billing, order creation, and payment handoff.`,
      }
    : { title: "Mobile Legends Top-Up" };
}

export default async function MobileLegendsMarketPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const selectedMarket = parseMobileLegendsMarket((await params).market);
  if (!selectedMarket) notFound();

  const mobileLegendsGame = games.find(
    (game) => game.slug === "mobile-legends",
  )!;
  const [packages, fxSnapshot] = await Promise.all([
    getMobileLegendsPackages(selectedMarket.code),
    getCurrencyRateSnapshot(),
  ]);
  const livePricing = packages.some(
    (item) => item.source === "fazercards-live",
  );

  return (
    <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/18 blur-[120px]" />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/16 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_12rem] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-blue-100">
              <span>{selectedMarket.flag}</span>
              {selectedMarket.label} checkout
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Mobile Legends top-up without checkout detours.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Choose the package, validate the player, enter billing, create the
              order, and open Razorpay Test Mode inside one controlled interface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                {packages.length} approved offers
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Guest recovery token
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Same-interface payment
              </span>
            </div>
          </div>

          <div className="hidden aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30 lg:block">
            <ResilientImage
              sources={mobileLegendsGame.artworkSources}
              alt={mobileLegendsGame.artworkAlt}
              fallbackLabel="ML"
              loading="eager"
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-4 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-100 sm:grid-cols-[1fr_auto] sm:items-center">
          <span>
            <strong>
              {selectedMarket.flag} {selectedMarket.label}:
            </strong>{" "}
            {selectedMarket.note}
          </span>
          <div className="flex flex-wrap gap-2">
            <span
              className={
                livePricing
                  ? "font-bold text-emerald-200"
                  : "font-bold text-amber-100"
              }
            >
              {livePricing
                ? `${packages.length} live offers`
                : "Protected preview pricing"}
            </span>
            <span className="text-violet-200/70">·</span>
            <span
              className={
                fxSnapshot.mode === "live"
                  ? "font-bold text-cyan-100"
                  : "font-bold text-amber-100"
              }
            >
              {fxSnapshot.mode === "live"
                ? "Live currency conversion"
                : "INR-only fallback"}
            </span>
          </div>
        </div>

        <MobileLegendsCheckoutShell
          packages={packages}
          market={selectedMarket}
          fxSnapshot={fxSnapshot}
        />
      </section>
    </main>
  );
}
