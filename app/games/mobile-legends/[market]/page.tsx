import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MobileLegendsOrderForm } from "@/components/mobile-legends-order-form";
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
        description: `Locked ${selectedMarket.label} Mobile Legends catalogue, player validation, billing, and checkout.`,
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

  const mobileLegendsGame = games.find((game) => game.slug === "mobile-legends")!;
  const [packages, fxSnapshot] = await Promise.all([
    getMobileLegendsPackages(selectedMarket.code),
    getCurrencyRateSnapshot(),
  ]);
  const livePricing = packages.some((item) => item.source === "fazercards-live");

  return (
    <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/18 blur-[120px]" />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/16 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[1fr_19rem] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-blue-100">
              <span>{selectedMarket.flag}</span>
              {selectedMarket.label} version
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Mobile Legends top-up for {selectedMarket.label}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              This route is permanently tied to the {selectedMarket.label} supplier catalogue. Packages from another market cannot be submitted through this version.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Canonical route /{selectedMarket.code}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Default display {selectedMarket.defaultCurrency}
              </span>
            </div>
          </div>

          <div className="aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30">
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

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-5 grid gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-4 text-sm text-violet-100 sm:grid-cols-[1fr_auto] sm:items-center">
          <span><strong>{selectedMarket.flag} {selectedMarket.label}:</strong> {selectedMarket.note}</span>
          <div className="flex flex-wrap gap-2">
            <span className={livePricing ? "font-bold text-emerald-200" : "font-bold text-amber-100"}>
              {livePricing ? `${packages.length} approved live offers` : "Protected fallback pricing"}
            </span>
            <span className="text-violet-200/70">·</span>
            <span className={fxSnapshot.mode === "live" ? "font-bold text-cyan-100" : "font-bold text-amber-100"}>
              {fxSnapshot.mode === "live" ? "Live currency conversion" : "INR-only conversion fallback"}
            </span>
          </div>
        </div>

        <MobileLegendsOrderForm
          packages={packages}
          market={selectedMarket}
          fxSnapshot={fxSnapshot}
        />
      </section>
    </main>
  );
}
