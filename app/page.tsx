import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { GameLogo } from "@/components/game-logo";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const trustPoints = [
  {
    title: "Server-owned prices",
    description: "The final package and amount are resolved again before an order is created.",
  },
  {
    title: "Correct game market",
    description: "MLBB India, Indonesia, Philippines and Arabia stay under one game with clear market routing.",
  },
  {
    title: "Private order tracking",
    description: "Each persisted order has a separate private access token for its timeline.",
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
  const freeFire = enrichedGames.find((game) => game.slug === "free-fire")!;
  const pubg = enrichedGames.find((game) => game.slug === "pubg-mobile")!;

  return (
    <main id="top" className="min-h-screen bg-[#07070c] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/16 blur-[130px]" />
          <div className="absolute right-[-8rem] top-16 h-[28rem] w-[28rem] rounded-full bg-blue-600/12 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-25" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  pricing.mode === "live" ? "bg-emerald-400" : "bg-amber-300"
                }`}
              />
              {pricing.mode === "live"
                ? `${pricing.publishedCount} supplier offers live`
                : "Protected fallback catalogue"}
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Top up the right game,
              <span className="block text-violet-300">without the wrong-region headache.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Browse real game artwork, choose the correct market, and continue through a secure,
              server-priced checkout flow.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#games"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200"
              >
                Browse games
              </Link>
              <Link
                href="/games/mobile-legends"
                className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/[0.07]"
              >
                Open MLBB checkout
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-500">
              <span>8 game brands</span>
              <span>4 MLBB markets</span>
              <span>{pricing.publishedCount} approved live offers</span>
              <span>Real charging disabled</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
            <Link
              href="/games/mobile-legends"
              className="group relative min-h-[22rem] overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:row-span-2"
            >
              <ResilientImage
                sources={mobileLegends.artworkSources}
                alt={mobileLegends.artworkAlt}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                style={{ objectPosition: mobileLegends.artworkPosition ?? "center" }}
                fallbackClassName="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090910] via-[#090910]/20 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <GameLogo game={mobileLegends} priority />
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-300">Checkout ready</p>
                    <p className="mt-1 text-2xl font-black text-white">
                      From {formatInr(mobileLegends.startingPriceInPaise ?? 13_000)}
                    </p>
                  </div>
                  <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">
                    Top up →
                  </span>
                </div>
              </div>
            </Link>

            {[freeFire, pubg].map((game) => (
              <article
                key={game.slug}
                className="relative min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]"
              >
                <ResilientImage
                  sources={game.artworkSources}
                  alt={game.artworkAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: game.artworkPosition ?? "center" }}
                  fallbackClassName="absolute inset-0 h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a11] via-[#0a0a11]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <GameLogo game={game} compact />
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
                    Coming soon
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="games"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Game catalogue</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Real artwork. Clear markets. Compact shopping.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Mobile Legends is ready for the protected development checkout. Other games stay clearly
            marked until their supplier and fulfilment paths are complete.
          </p>
        </div>

        <GameCatalogue games={enrichedGames} />
      </section>

      <section className="border-y border-white/10 bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {trustPoints.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Recharza. Game names and artwork belong to their respective publishers.</p>
        <div className="flex gap-4">
          <Link href="/orders/lookup" className="transition hover:text-slate-300">
            Track order
          </Link>
          <Link href="/operator" className="transition hover:text-slate-300">
            Operator
          </Link>
        </div>
      </footer>
    </main>
  );
}
