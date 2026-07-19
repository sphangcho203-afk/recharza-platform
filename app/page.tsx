import Link from "next/link";

import { GameCard } from "@/components/game-card";
import { SiteHeader } from "@/components/site-header";
import { games } from "@/lib/games";

const trustPoints = [
  {
    title: "Protected checkout",
    description: "Payment secrets stay server-side and never enter the public codebase.",
    icon: "01",
  },
  {
    title: "Clear order tracking",
    description: "Every purchase is designed around visible states from payment to fulfilment.",
    icon: "02",
  },
  {
    title: "Human support",
    description: "Customers get a direct path to help when an order needs attention.",
    icon: "03",
  },
];

const steps = [
  "Choose your game",
  "Select a package",
  "Enter player details",
  "Pay and track the order",
];

export default function Home() {
  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <SiteHeader />

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute right-[-10rem] top-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[110px]" />
          <div className="hero-grid absolute inset-0 opacity-40" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
              Playable Mobile Legends demo online
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Power up your games without the waiting room.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Recharza is being built as a secure multi-game top-up platform with clean pricing,
              visible order tracking, and support that does not vanish into the fog.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games/mobile-legends"
                className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-center text-sm font-bold text-white shadow-[0_14px_50px_rgba(139,92,246,0.28)] transition hover:-translate-y-0.5"
              >
                Open Mobile Legends demo
              </Link>
              <a
                href="#how-it-works"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                See the purchase flow
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="mt-1 text-xs text-slate-400">Launch games</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="mt-1 text-xs text-slate-400">Playable flow</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="mt-1 text-xs text-slate-400">Real charges</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-8 rounded-[3rem] bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Order console</p>
                  <p className="mt-1 font-semibold">Mobile Legends top-up</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Playable demo
                </span>
              </div>

              <div className="mt-5 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-700 p-6">
                <p className="text-sm text-blue-100">Featured package</p>
                <div className="mt-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-black">Weekly Pass</p>
                    <p className="mt-1 text-sm text-blue-100">Player validation before order creation</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-xl font-black backdrop-blur">
                    ML
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold text-violet-200">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-200">{step}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {index < 3 ? "Ready" : "Mocked"}
                    </span>
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
              Launch catalogue
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One platform, multiple game economies.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Mobile Legends now has a working development order flow. The other catalogue entries
            remain staged until their package, validation, and fulfilment rules are implemented.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Purchase flow
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps, zero mystery boxes.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-black/15 p-6">
                <span className="text-sm font-black text-violet-300">0{index + 1}</span>
                <h3 className="mt-8 text-lg font-semibold text-white">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {index === 0 && "Browse a focused catalogue instead of wrestling with clutter."}
                  {index === 1 && "Compare clearly labelled currency, pass, and membership options."}
                  {index === 2 && "Validate account details before an order enters payment."}
                  {index === 3 && "Receive an order record with visible fulfilment progress."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              Trust architecture
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Security is infrastructure, not a footer badge.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              The public repository contains placeholders only. Real payment keys, database
              credentials, and webhook secrets belong in protected deployment environments.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <article key={point.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <span className="text-xs font-black tracking-[0.2em] text-violet-300">{point.icon}</span>
                <h3 className="mt-8 text-lg font-semibold">{point.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{point.description}</p>
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
