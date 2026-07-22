import type { Metadata } from "next";
import Link from "next/link";

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

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description:
    "Choose a supported Mobile Legends fulfilment market before opening a locked regional checkout.",
};

export const dynamic = "force-dynamic";

export default async function MobileLegendsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const params = await searchParams;
  const selectedMarket = parseMobileLegendsMarket(params.region);
  const mobileLegendsGame = games.find((game) => game.slug === "mobile-legends")!;

  if (!selectedMarket) {
    return (
      <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <SiteHeader />
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10rem] top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/16 blur-[120px]" />
            <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/16 blur-[120px]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30 lg:order-2">
              <div className="aspect-square">
                <ResilientImage
                  sources={mobileLegendsGame.artworkSources}
                  alt={mobileLegendsGame.artworkAlt}
                  fallbackLabel="Mobile Legends"
                  loading="eager"
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full"
                />
              </div>
            </div>

            <div>
              <Link href="/#games" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
                ← Back to games
              </Link>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-violet-300">Mobile Legends</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Choose the game-account market.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                This selects the supplier fulfilment catalogue. Billing country and display currency are chosen separately during checkout.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mobileLegendsMarkets.map((market) => (
              <Link
                key={market.code}
                href={`/games/mobile-legends?region=${market.code}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.13),transparent_45%),#101018] transition hover:-translate-y-0.5 hover:border-violet-400/35"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <ResilientImage
                    sources={mobileLegendsGame.artworkSources}
                    alt={`${mobileLegendsGame.artworkAlt} for ${market.label}`}
                    fallbackLabel="ML"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                    fallbackClassName="h-full w-full"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xl font-black text-white">{market.flag} {market.label}</p>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                      {market.defaultCurrency}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{market.note}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950">
                    Open {market.label} checkout →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

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
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[1fr_19rem] lg:items-center lg:px-8">
          <div>
            <Link
              href="/games/mobile-legends"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Change fulfilment market
            </Link>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-blue-100">
              <span>{selectedMarket.flag}</span>
              {selectedMarket.label} market locked
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Mobile Legends top-up for {selectedMarket.label}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Choose from up to 30 approved regional offers, verify the player destination, then provide billing details and a preferred display currency.
            </p>
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
