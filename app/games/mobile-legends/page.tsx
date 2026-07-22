import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";
import {
  mobileLegendsMarkets,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description:
    "Choose a supported Mobile Legends fulfilment market before opening its separate regional checkout version.",
};

export default async function MobileLegendsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const legacyMarket = parseMobileLegendsMarket((await searchParams).region);
  if (legacyMarket) redirect(`/games/mobile-legends/${legacyMarket.code}`);

  const mobileLegendsGame = games.find((game) => game.slug === "mobile-legends")!;

  return (
    <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10rem] top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/16 blur-[120px]" />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/16 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30 lg:order-2">
            <div className="aspect-square">
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

          <div>
            <Link href="/#games" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              ← Back to games
            </Link>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-violet-300">Mobile Legends</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Choose the game-account market.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
              Every market opens a separate version with its own URL, supplier catalogue, package list, validation route and default currency.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mobileLegendsMarkets.map((market) => (
            <Link
              key={market.code}
              href={`/games/mobile-legends/${market.code}`}
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
                  Open {market.label} version →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
