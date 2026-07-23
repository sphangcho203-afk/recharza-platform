import Link from "next/link";

import { GameCard } from "@/components/game-card";
import { GameCatalogue } from "@/components/game-catalogue";
import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import {
  catalogueGames,
  giftCardGames,
  mainGames,
} from "@/lib/games";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const steps = [
  ["01", "Choose a product", "Open a game, regional version, gift card, pass, or subscription."],
  ["02", "Verify delivery", "Provide only the fields required for that product, then confirm billing and currency."],
  ["03", "Track securely", "Follow payment and fulfilment through private account-owned order tracking."],
];

const trustItems = [
  ["Server-owned prices", "The browser cannot submit a supplier price or exchange rate."],
  ["Account-owned orders", "A verified customer session is required before an order is created."],
  ["Regional protection", "Regional products stay tied to their canonical catalogue and supplier mapping."],
  ["Private tracking", "Sensitive order details require an account session or private tracking token."],
];

export default async function Home() {
  const pricing = await getStorefrontPricingSnapshot();
  const enrichedGames = catalogueGames.map((game) => {
    const liveMinimum = pricing.minimumPrices[game.pricingKey] ?? pricing.minimumPrices[game.slug];
    return {
      ...game,
      startingPriceInPaise:
        typeof liveMinimum === "number" ? liveMinimum : game.startingPriceInPaise,
      pricingMode:
        typeof liveMinimum === "number" ? ("live" as const) : game.pricingMode,
    };
  });

  const trendingSlugs = [
    "mobile-legends-india",
    "pubg-mobile",
    "free-fire",
    "genshin-impact",
    "valorant",
    "roblox",
    "honkai-star-rail",
    "steam-wallet",
  ];
  const trending = trendingSlugs
    .map((slug) => enrichedGames.find((game) => game.slug === slug))
    .filter((game): game is (typeof enrichedGames)[number] => Boolean(game));
  const heroGames = [
    "pubg-mobile",
    "genshin-impact",
    "mobile-legends-indonesia",
    "steam-wallet",
  ]
    .map((slug) => enrichedGames.find((game) => game.slug === slug))
    .filter((game): game is (typeof enrichedGames)[number] => Boolean(game));

  return (
    <main id="top" className="min-h-screen overflow-x-clip bg-[#07070c] pb-28 text-white md:pb-8">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-12rem] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-violet-700/15 blur-[150px]" />
          <div className="absolute right-[-10rem] top-[-6rem] h-[34rem] w-[34rem] rounded-full bg-cyan-500/11 blur-[145px]" />
          <div className="hero-grid absolute inset-0 opacity-15" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-11 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Multi-game digital store
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.01] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
              Top-ups, gift cards,
              <span className="block bg-gradient-to-r from-violet-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                passes and codes.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Browse regional game catalogues, direct account top-ups, platform wallets, subscriptions, and redeem codes through one customer-first checkout system.
            </p>

            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
              <Link href="#games" className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                Browse games
              </Link>
              <Link href="/redeem-codes" className="min-h-12 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                Redeem codes
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 border-t border-white/10 pt-5">
              <div>
                <p className="text-xl font-black text-white">{mainGames.length}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500 sm:text-[10px]">Game catalogues</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">{giftCardGames.length}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500 sm:text-[10px]">Gift-card families</p>
              </div>
              <div>
                <p className="text-xl font-black text-white">15</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500 sm:text-[10px]">Display currencies</p>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            {heroGames.map((game, index) => (
              <Link
                key={game.slug}
                href={game.href}
                className={`group relative min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#10111a] shadow-[0_24px_70px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${index === 0 ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""}`}
              >
                <div className={index === 0 ? "aspect-[1.65/1] sm:aspect-auto sm:h-full sm:min-h-[28rem]" : "aspect-square"}>
                  <div className="absolute inset-0 opacity-20 blur-3xl" style={{ background: game.accent }} />
                  <ResilientImage
                    sources={[...game.logoSources, ...game.artworkSources]}
                    alt={game.logoAlt}
                    fallbackLabel={game.title}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="relative h-full w-full object-contain p-[15%] transition duration-700 group-hover:scale-[1.045]"
                    fallbackClassName="h-full w-full"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{game.category}</p>
                  <p className="mt-1 line-clamp-2 text-base font-black text-white sm:text-xl">{game.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Trending now</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Popular top-ups and codes</h2>
          </div>
          <Link href="#games" className="min-h-11 rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-slate-300 hover:bg-white/5 hover:text-white">
            View full catalogue
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {trending.map((game) => <GameCard key={game.slug} game={game} compact />)}
        </div>
      </section>

      <section id="games" className="scroll-mt-24 border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Complete store</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Find a game, regional version, or platform</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Mobile Legends regional versions appear as independent products. Every other game and platform opens its own product catalogue instead of displaying a dead coming-soon card.
            </p>
          </div>
          <GameCatalogue games={enrichedGames} />
        </div>
      </section>

      <section id="gift-cards" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Gift cards and codes</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Wallets and platform credit</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Region and denomination are server-verified. Codes remain tied to the customer order and delivery workflow.
            </p>
            <Link href="/redeem-codes" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-violet-200">
              Open redeem-code store
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 xl:grid-cols-3">
            {enrichedGames.filter((game) => game.kind === "gift-card").slice(0, 6).map((game) => (
              <GameCard key={game.slug} game={game} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">How it works</p>
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {trustItems.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-[#0d0d15] p-5">
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_48%),#10111a] p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Customer support</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Order trouble should not become a scavenger hunt.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Open your customer dashboard for account-owned orders, tracking, saved game accounts, billing addresses, support, and security.</p>
          </div>
          <Link href="/account" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-violet-200 lg:mt-0">
            Open customer dashboard
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-lg font-black">Recharza</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Multi-game top-ups, gift cards, passes, subscriptions, and redeem codes.</p>
          </div>
          {[
            ["Store", [["Games", "/#games"], ["Gift cards", "/redeem-codes#gift-cards"], ["Redeem codes", "/redeem-codes"]]],
            ["Orders", [["Track order", "/orders/lookup"], ["Customer account", "/account"], ["Support", "/account#support"]]],
            ["Company", [["How it works", "/#games"], ["Security", "/account#security"], ["Contact", "/account#support"]]],
          ].map(([heading, links]) => (
            <div key={heading as string}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{heading as string}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-500">
                {(links as string[][]).map(([label, href]) => <Link key={label} href={href} className="hover:text-white">{label}</Link>)}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Recharza. Game names and artwork belong to their respective publishers.</p>
          <p>Supplier rates and availability are verified server-side.</p>
        </div>
      </footer>
    </main>
  );
}
