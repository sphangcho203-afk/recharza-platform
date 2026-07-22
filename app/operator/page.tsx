import type { Metadata } from "next";
import Link from "next/link";

import { InternalHeader } from "@/components/internal-header";
import { OperatorConsole } from "@/components/operator-console";
import { OperatorHealthPanel } from "@/components/operator-health-panel";
import { SupplierPricingConsole } from "@/components/supplier-pricing-console";

export const metadata: Metadata = {
  title: "Operator Console | Recharza",
  description:
    "Protected compatibility console for operational health, supplier pricing, catalogue synchronization, fulfilment recovery, and order operations.",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#06060f] text-white">
      <InternalHeader workspace="Operator" />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-1/3 top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="scanline absolute inset-0 opacity-15" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
            Protected compatibility console
          </p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Operational tools stay inside the internal workspace.
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300">
            Verified staff sessions control access to operational data. Admins should use the dedicated admin centre, while staff should use the limited staff queue.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/admin" className="min-h-11 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 hover:bg-violet-200">
              Open admin centre
            </Link>
            <Link href="/staff" className="min-h-11 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-bold text-white hover:bg-white/[0.07]">
              Open staff workspace
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <OperatorHealthPanel />
        <SupplierPricingConsole />
        <OperatorConsole />
      </div>
    </main>
  );
}