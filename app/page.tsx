import Link from "next/link";

import { GameCard } from "@/components/game-card";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";
import { formatInr } from "@/lib/mobile-legends";
import { getStorefrontPricingSnapshot } from "@/lib/storefront-catalog";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    title: "Choose an approved offer",
    description: "Browse packages that passed supplier, region, availability, and publication checks.",
  },
  {
    number: "02",
    title: "Validate the destination",
    description: "Confirm the player and zone details before an order is allowed to move forward.",
  },
  {
    number: "03",
    title: "Lock the server total",
    description: "Recharza resolves the package and retail price again instead of trusting the browser.",
  },
  {
    number: "04",
    title: "Track every state",
    description: "A protected order timeline records payment, fulfilment, failures, and operator actions.",
  },
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
    const liveMinimum = pricing.minimumPrices[game.slug];

    return {
      ...game,
      startingPriceInPaise:
        typeof liveMinimum === "number" ? liveMinimum : game.startingPriceInPaise,
      pricingMode:
        typeof liveMinimum === "number" ? ("live" as const) : game.pricingMode,
    };
  });
  const mobileLegends = enrichedGames.find((game) => game.slug === "mobile-legends");

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#06060f] text-white">
      <SiteHeader />

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
          <div className="orb-drift-delayed absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-fuchsia-500/12 blur-[110px]" />
          <div className="hero-grid absolute inset-0 opacity-45" />
          <div className="scanline absolute inset-0 opacity-20" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div className="reveal-card">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <span
                className={`h-2 w-2 rounded-full shadow-[0_0_14px_currentColor] ${
                  pricing.mode === "live" ? "bg-emerald-400 text-emerald-400" : "bg-amber-300 text-amber-300"
                }`}
              />
              {pricing.mode === "live"
                ? `${pricing.publishedCount} approved supplier offers online`
                : "Protected supplier-price fallback active"}
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Game top-ups with
              <span className="text-shimmer block">profit built into the circuit.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Recharza connects supplier offers, protected pricing, player validation, durable orders,
              signed payment events, and operator controls into one mobile-first storefront.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games/mobile-legends"
                className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-3.5 text-center text-sm font-black text-white shadow-[0_14px_50px_rgba(139,92,246,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(139,92,246,0.4)]"
              >
                Explore Mobile Legends
              </Link>
              <a
                href="#pricing-engine"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                See how pricing works
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-black">6</p>
                <p className="mt-1 text-xs text-slate-400">Target game lines</p>
              </div>
              <div>
                <p className="text-2xl font-black">{pricing.publishedCount}</p>
                <p className="mt-1 text-xs text-slate-400">Live approved offers</p>
              </div>
              <div>
                <p className="text-2xl font-black">{pricing.offersSynced}</p>
                <p className="mt-1 text-xs text-slate-400">Last sync offers</p>
              </div>
              <div>
                <p className="text-2xl font-black">0</p>
                <p className="mt-1 text-xs text-slate-400">Real charges enabled</p>
              </div>
            </div>
          </div>

          <div className="reveal-card relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-8 rounded-[3rem] bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Pricing console</p>
                  <p className="mt-1 font-semibold">Mobile Legends launch line</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  pricing.mode === "live"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-amber-300/10 text-amber-200"
                }`}>
                  {pricing.mode === "live" ? "Live" : "Fallback"}
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-violet-700 to-fuchsia-700 p-6">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm text-blue-100">Starting from</p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {formatInr(mobileLegends?.startingPriceInPaise ?? 13_000)}
                    </p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-xl font-black backdrop-blur">
                    ML
                  </div>
                </div>
                <p className="mt-8 max-w-sm text-sm leading-6 text-blue-100">
                  Supplier cost is never shown directly to the customer and never trusted from client input.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Supplier catalogue", pricing.mode === "live" ? "Synced" : "Fallback"],
                  ["Profit policy", "Active"],
                  ["Server price check", "Enforced"],
                  ["Payment charging", "Disabled"],
                ].map(([label, status], index) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold text-violet-200">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-200">{label}</span>
                    <span className="ml-auto text-xs font-bold text-slate-500">{status}</span>
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
              Supplier-connected catalogue
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              One storefront, six economies, no price roulette.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Mobile Legends has the complete protected checkout. Other game lines are visible as the next
            supplier integrations, but remain unavailable until their region, validation, and fulfilment rules are complete.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrichedGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section id="pricing-engine" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Profit engine
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              A retail price is a stack, not a guess.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Recharza calculates upward from supplier cost and refuses to round below the protected result.
              Small packs receive a higher percentage margin, while larger packs can stay competitive with a lower rate.
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

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
          Customer flow
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
          Four checkpoints from catalogue to private tracking.
        </h2>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((step) => (
            <article key={step.number} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <span className="text-sm font-black text-violet-300">{step.number}</span>
              <h3 className="mt-8 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className="border-t border-white/10 bg-black/15">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Server-owned totals", "The browser submits an offer ID, not an authoritative amount."],
              ["Approved regions only", "Synced supplier products remain hidden until their category ID is allowlisted."],
              ["Auditable operations", "Pricing changes, supplier syncs, payment events, and manual order states leave records."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
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
          <p>Play more. Wait less.</p>
        </div>
      </footer>
    </main>
  );
}
