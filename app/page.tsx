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
    title: "Choose the correct market",
    description: "Select India, Indonesia, or Philippines before entering your Mobile Legends player details.",
  },
  {
    title: "Review before checkout",
    description: "Confirm the package, player ID, server, and total before the order continues.",
  },
  {
    title: "Track every update",
    description: "Use private order tracking to follow review, payment, fulfilment, and completion.",
  },
];

const steps = [
  ["01", "Pick a game", "Choose the game and the regional market connected to your account."],
  ["02", "Enter player details", "Review the player ID, server, and package before continuing."],
  ["03", "Track the order", "Follow the order from review through fulfilment on one private page."],
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
    <main id="top" className="min-h-screen overflow-x-clip bg-[#07070c] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[4%] top-[-16rem] h-[30rem] w-[30rem] rounded-full bg-violet-700/14 blur-[130px]" />
          <div className="absolute right-[-10rem] top-10 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-18">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Mobile Legends available now
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Game top-ups,
              <span className="block text-violet-300">without the wrong-market mess.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              Find your game, choose the correct market, review your player details, and keep the order easy to track.
            </p>

            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
              <Link
                href="/games/mobile-legends"
                className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Top up Mobile Legends
              </Link>
              <Link
                href="#games"
                className="min-h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Browse all games
              </Link>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center sm:text-left">
              <div>
                <p className="text-xl font-black text-white">8</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Game brands</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">3</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">MLBB markets</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">24/7</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Order tracking</p>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-[1.2fr_0.8fr] gap-3">
            <Link
              href="/games/mobile-legends"
              className="group relative row-span-2 aspect-square min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-[0_24px_70px_rgba(0,0,0,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <ResilientImage
                sources={[...mobileLegends.artworkSources, ...mobileLegends.logoSources]}
                alt={mobileLegends.artworkAlt}
                fallbackLabel="ML"
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
                <span className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950">
                  Choose market →
                </span>
              </div>
            </Link>

            {[callOfDuty, pubg].map((game) => (
              <article
                key={game.slug}
                className="relative aspect-square min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#10101a]"
              >
                <ResilientImage
                  sources={[...game.artworkSources, ...game.logoSources]}
                  alt={game.artworkAlt}
                  fallbackLabel={game.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: game.artworkPosition ?? "center" }}
                  fallbackClassName="absolute inset-0 h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-2 text-sm font-black leading-tight text-white">{game.title}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">Coming soon</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Game store</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Find your game</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Mobile Legends is available through India, Indonesia, and Philippines. More games will unlock as their top-up routes are completed.
          </p>
        </div>

        <GameCatalogue games={enrichedGames} />
      </section>

      <section className="border-y border-white/10 bg-white/[0.018]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">How it works</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5">
                <p className="font-mono text-sm font-black text-violet-300">{number}</p>
                <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {customerBenefits.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5">
              <h3 className="text-sm font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-9 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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