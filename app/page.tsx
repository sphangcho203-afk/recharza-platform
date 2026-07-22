import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const customerBenefits = [
  {
    title: "Choose the right market",
    description: "Select India, Indonesia, or Philippines before you enter your player details.",
  },
  {
    title: "See your order status",
    description: "Use private order tracking to follow review, payment, and fulfilment progress.",
  },
  {
    title: "Get help when needed",
    description: "Your account keeps saved players, recent orders, notifications, and support in one place.",
  },
];

const steps = [
  ["01", "Choose a game", "Pick the game and the correct regional market."],
  ["02", "Enter player details", "Review your player ID, server, and package before continuing."],
  ["03", "Track the order", "Follow every status update from your private tracking page."],
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

  return (
    <main id="top" className="min-h-screen overflow-x-clip bg-[#07070c] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[5%] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-violet-700/16 blur-[130px]" />
          <div className="absolute right-[-10rem] top-10 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Mobile Legends top-up available
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Game top-ups,
              <span className="block text-violet-300">without the region confusion.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Choose your game, select the correct market, review the player details, and keep every order easy to track.
            </p>

            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
              <Link
                href="#games"
                className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Browse games
              </Link>
              <Link
                href="/orders/lookup"
                className="min-h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Track an order
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 border-t border-white/8 pt-5 text-center sm:text-left">
              <div>
                <p className="text-lg font-black text-white">8</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Game brands</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">3</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">MLBB markets</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">24/7</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Order tracking</p>
              </div>
            </div>
          </div>

          <Link
            href="/games/mobile-legends"
            className="group relative min-h-[24rem] overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-[0_26px_80px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <ResilientImage
              sources={mobileLegends.artworkSources}
              alt={mobileLegends.artworkAlt}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
              style={{ objectPosition: mobileLegends.artworkPosition ?? "center" }}
              fallbackClassName="absolute inset-0 h-full w-full"
              fallbackLabel="ML"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090910] via-[#090910]/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Featured game</p>
              <h2 className="mt-2 text-3xl font-black text-white">Mobile Legends</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                Diamonds, Weekly Pass, and Twilight Pass for supported markets.
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-md">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Starting from</p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatInr(mobileLegends.startingPriceInPaise ?? 13_000)}
                  </p>
                </div>
                <span className="rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950">Top up now →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Game store</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Find your game</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Mobile Legends is available now. More game top-ups will appear here as their checkout routes are completed.
          </p>
        </div>

        <GameCatalogue games={enrichedGames} />
      </section>

      <section className="border-y border-white/8 bg-white/[0.018]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">How it works</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-2xl border border-white/8 bg-[#0d0d15] p-5">
                <p className="font-mono text-sm font-black text-violet-300">{number}</p>
                <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {customerBenefits.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/8 bg-[#0d0d15] p-5">
              <h3 className="text-sm font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Recharza. Game names and artwork belong to their respective publishers.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/orders/lookup" className="transition hover:text-slate-300">Track order</Link>
            <Link href="/account" className="transition hover:text-slate-300">Account</Link>
            <Link href="/account#support" className="transition hover:text-slate-300">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}