import type { Metadata } from "next";
import Link from "next/link";

import { MobileLegendsOrderForm } from "@/components/mobile-legends-order-form";
import { SiteHeader } from "@/components/site-header";
import { getMobileLegendsPackages } from "@/lib/storefront-catalog";

export const metadata: Metadata = {
  title: "Mobile Legends Top-Up",
  description:
    "Choose an approved Mobile Legends package with server-owned pricing, player validation, and protected order tracking on Recharza.",
};

export const dynamic = "force-dynamic";

export default async function MobileLegendsPage() {
  const packages = await getMobileLegendsPackages();
  const livePricing = packages.some((item) => item.source === "fazercards-live");

  return (
    <main className="min-h-screen overflow-hidden bg-[#06060f] text-white">
      <SiteHeader />

      <section className="relative isolate border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="orb-drift absolute left-[-8rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="orb-drift-delayed absolute right-[-8rem] top-0 h-[26rem] w-[26rem] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-35" />
          <div className="scanline absolute inset-0 opacity-20" />
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
                {livePricing ? "Approved live supplier catalogue" : "Protected supplier-price fallback"}
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Top up with a price that survives reality.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Recharza resolves supplier cost, FX reserve, gateway fees, operating overhead, and
                profit before a package reaches checkout. The server verifies the selected offer
                again before creating the order.
              </p>
            </div>

            <div className="grid min-w-64 gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-sm shadow-2xl shadow-black/25 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Catalogue</span>
                <span className={livePricing ? "font-bold text-emerald-300" : "font-bold text-amber-200"}>
                  {livePricing ? "Live approved" : "Indicative fallback"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Packages</span>
                <span className="font-bold text-white">{packages.length}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Server pricing</span>
                <span className="font-bold text-emerald-300">Enforced</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-slate-500">Real charge</span>
                <span className="font-bold text-emerald-300">Disabled</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <MobileLegendsOrderForm packages={packages} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:grid-cols-4">
          {[
            ["01", "Supplier-aware pricing", "Offers pass through FX, fee, overhead, and margin rules before publication."],
            ["02", "Region-safe publication", "Live categories stay hidden until an operator approves their exact supplier category ID."],
            ["03", "Replay-safe creation", "Idempotency keys and database constraints prevent duplicate orders during retries."],
            ["04", "Private tracking", "A separate access token protects each order timeline after creation."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">{number}</p>
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
