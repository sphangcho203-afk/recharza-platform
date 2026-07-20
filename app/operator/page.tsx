import type { Metadata } from "next";
import Link from "next/link";

import { OperatorConsole } from "@/components/operator-console";
import { OperatorHealthPanel } from "@/components/operator-health-panel";
import { SiteHeader } from "@/components/site-header";
import { SupplierPricingConsole } from "@/components/supplier-pricing-console";

export const metadata: Metadata = {
  title: "Operator Console",
  description:
    "Protected development console for operational health, supplier pricing, catalogue synchronization, and order operations.",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06060f] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-1/3 top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="scanline absolute inset-0 opacity-15" />
        </div>

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
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
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Check system health, protect the margin, and move orders without inventing payments.
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300">
            This development console reports payment and supplier readiness, manages catalogue
            synchronization and pricing policy, and permits narrow audited fulfilment transitions.
            The temporary token gate must be replaced by staff authentication before production launch.
          </p>

          <div className="mt-8 grid max-w-4xl gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100 sm:grid-cols-3">
            <p>Supplier and payment secrets remain server-side</p>
            <p>Every pricing and order change is audited</p>
            <p>Only signed payment events establish PAID</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:py-16">
        <OperatorHealthPanel />
        <SupplierPricingConsole />
        <OperatorConsole />
      </div>
    </main>
  );
}
