import Link from "next/link";

import { GameCatalogue } from "@/components/game-catalogue";
import { GameLogo } from "@/components/game-logo";
import { RecharzaMark } from "@/components/recharza-mark";
import { SiteHeader } from "@/components/site-header";
import {
  games,
  mainGames,
  regionalMobileLegendsGames,
} from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    title: "Choose the game and market",
    description:
      "Browse official game brands, then select the correct MLBB region where regional routing applies.",
  },
  {
    number: "02",
    title: "Validate the destination",
    description:
      "Confirm player and zone details before Recharza allows the order to move forward.",
  },
  {
    number: "03",
    title: "Lock the server total",
    description:
      "The server resolves the selected supplier offer and protected retail price again at checkout.",
  },
  {
    number: "04",
    title: "Track every state",
    description:
      "A private order timeline records payment, fulfilment, failures and operator actions.",
  },
];

const featureCards = [
  ["⚡", "Instant-ready flow", "Fast package discovery, mobile-first forms and replay-safe order creation."],
  ["◈", "Real game branding", "Official game logos replace placeholder initials across the catalogue."],
  ["⌁", "Regional MLBB routing", "India, Indonesia, Philippines and Arabia are treated as markets, not fake games."],
  ["◎", "Protected pricing", "FX reserve, fees, overhead and profit floors are applied before publication."],
  ["✓", "Private tracking", "Customers receive a separate access token for the persisted order timeline."],
  ["▦", "Operator control", "Supplier syncs, price changes and fulfilment states remain auditable."],
];

const priceLayers = [
  ["Supplier cost", "Authenticated FazerCards offer price"],
  ["FX reserve", "Protects against USD/INR movement and conversion spread"],
  ["Gateway reserve", "Keeps payment processing from eating the sale"],
  ["Operating overhead", "Contributes to supplier plan and support costs"],
  ["Profit floor", "Uses both a minimum rupee profit and percentage target"],
  ["Clean rounding", "Produces customer-friendly prices without rounding downward"],
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
    <main id="top" className="min-h-screen overflow-hidden bg-[#06060f] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
          <div className="orb-drift-delayed absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-fuchsia-500/12 blur-[110px]" />
          <div className="hero-grid absolute inset-0 opacity-45" />
          <div className="scanline absolute inset-0 opacity-20" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="reveal-card">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <span
                className={`h-2 w-2 rounded-full shadow-[0_0_14px_currentColor] ${
                  pricing.mode === "live"
                    ? "bg-emerald-400 text-emerald-400"
                    : "bg-amber-300 text-amber-300"
                }`}
              />
              {pricing.mode === "live"
                ? `${pricing.publishedCount} approved supplier offers online`
                : "Protected supplier-price fallback active"}
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Find the real game.
              <span className="text-shimmer block">Choose the right market.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Recharza is becoming a supplier-aware multi-game marketplace with official game
              branding, regional MLBB routes, protected pricing, persistent orders and private
              tracking.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#games"
                className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-3.5 text-center text-sm font-black text-white shadow-[0_14px_50px_rgba(139,92,246,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(139,92,246,0.4)]"
              >
                Browse game catalogue
              </Link>
              <Link
                href="/games/mobile-legends"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Open MLBB checkout
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-black">{mainGames.length}</p>
                <p className="mt-1 text-xs text-slate-400">Real game brands</p>
              </div>
              <div>
                <p className="text-2xl font-black">{regionalMobileLegendsGames.length}</p>
                <p className="mt-1 text-xs text-slate-400">MLBB markets</p>
              </div>
              <div>
                <p className="text-2xl font-black">{pricing.publishedCount}</p>
                <p className="mt-1 text-xs text-slate-400">Live approved offers</p>
              </div>
              <div>
                <p className="text-2xl font-black">0</p>
                <p className="mt-1 text-xs text-slate-400">Real charges enabled</p>
              </div>
            </div>
          </div>

          <div className="reveal-card relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-10 rounded-[3rem] bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <RecharzaMark />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    pricing.mode === "live"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-300/10 text-amber-200"
                  }`}
                >
                  {pricing.mode === "live" ? "Live catalogue" : "Safe fallback"}
                </span>
              </div>

              <div
                className="relative mt-5 overflow-hidden rounded-3xl p-5"
                style={{ background: mobileLegends.gradient }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 h-52 w-52 rounded-full blur-3xl"
                  style={{ background: mobileLegends.glow }}
                />
                <div className="relative">
                  <GameLogo game={mobileLegends} priority />
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-blue-100">Mobile Legends starts from</p>
                      <p className="mt-1 text-4xl font-black tracking-tight">
                        {formatInr(mobileLegends.startingPriceInPaise ?? 13_000)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      Global + 4 markets
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Supplier catalogue", pricing.mode === "live" ? "Synced" : "Fallback"],
                  ["Profit policy", "Active"],
                  ["Server price check", "Enforced"],
                  ["Payment charging", "Disabled"],
                ].map(([label, status]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="games" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Real game-brand catalogue
            </p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Eight game brands and four MLBB regional routes, without invented logos.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Mobile Legends has the complete development checkout. Other brands remain visibly
            staged until supplier category, player validation, fulfilment and refund rules are
            implemented.
          </p>
        </div>

        <GameCatalogue games={enrichedGames} />
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Store capabilities
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
            The storefront now behaves like a marketplace, not a static demo page.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(([icon, title, description], index) => (
              <article
                key={title}
                className="glass-glow reveal-card rounded-3xl border border-white/10 bg-black/15 p-6"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-xl text-violet-200">
                  {icon}
                </span>
                <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing-engine" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Profit engine
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              A retail price is a stack, not a guess.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Recharza calculates upward from supplier cost and refuses to round below the protected
              result. Small packs receive a higher percentage margin, while larger packs can stay
              competitive with a lower rate.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {priceLayers.map(([title, description], index) => (
              <article
                key={title}
                className="glass-glow rounded-3xl border border-white/10 bg-black/15 p-6"
              >
                <span className="text-xs font-black tracking-[0.2em] text-violet-300">
                  0{index + 1}
                </span>
                <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Customer flow
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
            Four checkpoints from real game selection to private tracking.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-3xl border border-white/10 bg-black/15 p-6"
              >
                <span className="text-sm font-black text-violet-300">{step.number}</span>
                <h3 className="mt-8 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="border-b border-white/10 bg-black/15">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Server-owned totals", "The browser submits an offer ID, not an authoritative amount."],
              ["Approved regions only", "Supplier offers remain hidden until exact category IDs are reviewed."],
              ["Trademark clarity", "Game logos identify supported products and do not imply publisher endorsement."],
            ].map(([title, description]) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6"
              >
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Recharza. Development storefront.</p>
          <p>Game names and logos belong to their respective owners.</p>
        </div>
      </footer>
    </main>
  );
}
