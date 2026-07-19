import type { Metadata } from "next";
import Link from "next/link";

import { OperatorConsole } from "@/components/operator-console";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Operator Console",
  description: "Protected development console for reviewing and advancing Recharza orders.",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-18">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
          >
            <span aria-hidden="true">←</span>
            Back to storefront
          </Link>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Internal operations
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Review orders without granting anyone the power to invent a payment.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            This development console uses a temporary environment token. It can advance verified
            paid orders into fulfilment, complete fulfilment, or record failures and cancellations.
            It cannot mark an order paid. That state belongs exclusively to signed payment events.
          </p>

          <div className="mt-8 grid max-w-3xl gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100 sm:grid-cols-3">
            <p>Temporary bearer-token gate</p>
            <p>Every manual change is audited</p>
            <p>Customer and staff login comes next</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <OperatorConsole />
      </section>
    </main>
  );
}
