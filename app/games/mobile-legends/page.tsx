import type { Metadata } from "next";
import Link from "next/link";

import { MobileLegendsOrderForm } from "@/components/mobile-legends-order-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description:
    "Select a Mobile Legends package, validate player details, and create a safe development order on Recharza.",
};

export default function MobileLegendsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <Link
            href="/#games"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
          >
            <span aria-hidden="true">←</span>
            Back to catalogue
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-blue-500 text-[10px] text-white">
                  ML
                </span>
                First playable storefront
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Mobile Legends top-up flow, built for verification before payment.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Choose a development package, validate the player and zone ID format, and create an
                order record without charging real money. Live nickname lookup, database storage,
                fulfilment, and payment processing remain safely disabled.
              </p>
            </div>

            <div className="grid min-w-56 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Checkout</span>
                <span className="font-bold text-amber-200">Development</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Real charge</span>
                <span className="font-bold text-emerald-300">Disabled</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Server pricing</span>
                <span className="font-bold text-emerald-300">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <MobileLegendsOrderForm />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:grid-cols-3">
          <article>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">01</p>
            <h2 className="mt-2 text-lg font-bold">No fake nickname claims</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The current verifier checks only ID format and tells the customer exactly that.
            </p>
          </article>
          <article>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">02</p>
            <h2 className="mt-2 text-lg font-bold">Server-owned totals</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The order API ignores browser pricing and retrieves the approved package amount itself.
            </p>
          </article>
          <article>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">03</p>
            <h2 className="mt-2 text-lg font-bold">Payments remain unplugged</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The provider abstraction creates a non-charging development session until verified
              credentials and webhooks are configured.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
