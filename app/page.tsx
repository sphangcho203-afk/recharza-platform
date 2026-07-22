import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const trustPoints = [
  {
    title: "Correct market first",
    description: "MLBB checkout stays locked to India, Indonesia or Philippines after selection.",
  },
  {
    title: "Server-owned prices",
    description: "The package and final amount are resolved again before an order is created.",
  },
  {
    title: "Private order tracking",
    description: "Each saved order has a separate private token for sensitive tracking details.",
  },
];

export default async function Home() {
  const pricing = await getStorefrontPricingSnapshot();
  const enrichedGames = games.map((game) => {
    const liveMinimum = pricing.minimumPrices[game.pricingKey ?? game.slug];

    return {
      ...game,
      startingPriceInPaise:
        typeof liveMinimum === "number" ? liveMinimum : game.startingPriceInPaise,
      pricingMode:
        typeof liveMinimum === "number" ? ("live" as const) : game.pricingMode,
    };
  });

  const mobileLegends = enrichedGames.find((game) => game.slug === "mobile-legends")!;
  const callOfDuty = enrichedGames.find((game) => game.slug === "call-of-duty-mobile")!;
  const pubg = enrichedGames.find((game) => game.slug === "pubg-mobile")!;

  return (
    <main id="top" className="min-h-screen bg-[#07070c] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[4%] top-[-16rem] h-[30rem] w-[30rem] rounded-full bg-violet-700/14 blur-[130px]" />
          <div className="absolute right-[-10rem] top-10 h-[26rem] w-[26rem] rounded-full bg-blue-600/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 sm:py-13 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
              <span className={`h-2 w-2 rounded-full ${pricing.mode === "live" ? "bg-emerald-400" : "bg-amber-300"}`} />
              {pricing.mode === "live" ? "Approved supplier catalogue" : "Protected development catalogue"}
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Game top-ups,
              <span className="block text-violet-300">without the wrong-market mess.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Choose the game, lock the correct market and continue with a secure server-priced order flow.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games/mobile-legends"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200"
              >
                Choose an MLBB market
              </Link>
              <Link
                href="#games"
                className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/[0.07]"
              >
                Browse all games
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center sm:max-w-lg sm:text-left">
              <div>
                <p className="text-xl font-black text-white">8</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Game brands</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">3</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">MLBB markets</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">{pricing.publishedCount}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Live offers</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
            <Link
              href="/games/mobile-legends"
              className="group relative row-span-2 aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
            >
              <ResilientImage
                sources={mobileLegends.artworkSources}
                alt={mobileLegends.artworkAlt}
                fallbackLabel={mobileLegends.title}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                style={{ objectPosition: mobileLegends.artworkPosition ?? "center" }}
                fallbackClassName="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-xs font-bold text-white/70">Mobile Legends</p>
                <p className="mt-1 text-xl font-black text-white sm:text-2xl">
                  From {formatInr(mobileLegends.startingPriceInPaise ?? 13_000)}
                </p>
                <span className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950">
                  Choose market →
                </span>
              </div>
            </Link>

            {[callOfDuty, pubg].map((game) => (
              <article
                key={game.slug}
                className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]"
              >
                <ResilientImage
                  sources={game.artworkSources}
                  alt={game.artworkAlt}
                  fallbackLabel={game.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: game.artworkPosition ?? "center" }}
                  fallbackClassName="absolute inset-0 h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-sm font-black leading-tight text-white">{game.title}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">Coming soon</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-11 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Game catalogue</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Pick the game. See the art. Keep the route clear.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Mobile Legends is available through three explicit markets. Other games remain visibly planned until their supplier paths are approved.
          </p>
        </div>

        <GameCatalogue games={enrichedGames} />
      </section>

      <section className="border-y border-white/10 bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-9 sm:grid-cols-3 sm:px-6 lg:px-8">
          {trustPoints.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-9 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Recharza. Game names and artwork belong to their respective publishers.</p>
        <div className="flex gap-4">
          <Link href="/orders/lookup" className="transition hover:text-slate-300">Track order</Link>
          <Link href="/operator" className="transition hover:text-slate-300">Operator</Link>
        </div>
      </footer>
    </main>
  );
}
